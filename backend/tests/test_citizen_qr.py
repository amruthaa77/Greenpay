import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.user import User
from app.models.waste import WasteEntry
from app.models.reward import RewardTransaction
from app.core.security import create_access_token

client = TestClient(app)

@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture
def admin_token(db):
    admin = db.query(User).filter(User.role == "ADMIN", User.is_active == True).first()
    assert admin is not None, "Admin user must exist"
    token = create_access_token(subject=admin.id, role="ADMIN")
    return token, admin

@pytest.fixture
def citizen_token(db):
    user = db.query(User).filter(User.role == "USER", User.is_active == True).first()
    assert user is not None, "Citizen user must exist"
    token = create_access_token(subject=user.id, role="USER")
    return token, user

# =========================================================================
# CITIZEN QR & COLLECTION ATTRIBUTION TESTS
# =========================================================================

def test_citizen_lookup_by_greenpay_id(admin_token, db):
    token, _ = admin_token
    citizen = db.query(User).filter(User.role == "USER", User.is_active == True).first()
    assert citizen.greenpay_id is not None

    # Test raw greenpay_id
    response = client.get(
        f"/api/v1/admin/citizens/by-greenpay-id/{citizen.greenpay_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["greenpay_id"] == citizen.greenpay_id
    assert data["meter_number"] == citizen.meter_number
    assert data["name"] == citizen.profile.name
    assert "green_points" in data

    # Test with GREENPAY: URI prefix (as scanned by QR scanner)
    qr_scanned = f"GREENPAY:{citizen.greenpay_id}"
    response2 = client.get(
        f"/api/v1/admin/citizens/by-greenpay-id/{qr_scanned}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response2.status_code == 200
    assert response2.json()["greenpay_id"] == citizen.greenpay_id

def test_citizen_lookup_invalid_format_returns_422(admin_token):
    token, _ = admin_token
    response = client.get(
        "/api/v1/admin/citizens/by-greenpay-id/INVALID-ID",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 422

def test_citizen_lookup_unknown_id_returns_404(admin_token):
    token, _ = admin_token
    response = client.get(
        "/api/v1/admin/citizens/by-greenpay-id/GP-999999",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Citizen not found."

def test_manual_waste_collection_and_points_isolation(admin_token, db):
    """
    Test the complete manual waste collection flow:
    1. Scan/Lookup Citizen A by GreenPay ID
    2. Admin manually selects 'Paper & Cardboard' (25 GP/kg)
    3. Records 2.0 kg -> +50 GP
    4. Scan/Lookup Citizen B by Meter Number
    5. Admin manually selects 'Clean Plastic Packaging' (100 GP/kg)
    6. Records 2.0 kg -> +200 GP
    7. Verifies strict wallet points isolation between both citizens.
    """
    token, admin = admin_token

    # Retrieve two distinct citizens
    citizens = db.query(User).filter(User.role == "USER", User.is_active == True).limit(2).all()
    assert len(citizens) >= 2, "Must have at least 2 test citizens"
    user_a, user_b = citizens[0], citizens[1]

    def get_balance(u_id):
        return sum(
            t.amount for t in db.query(RewardTransaction).filter(RewardTransaction.user_id == u_id).all()
        )

    initial_a = get_balance(user_a.id)
    initial_b = get_balance(user_b.id)

    # 1. Record 2.0 kg Paper & Cardboard for User A using GreenPay ID
    # Rate: 2.0 kg * 25 GP/kg = +50 GP
    resp_waste_a = client.post(
        "/api/v1/admin/waste",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "meter_number": user_a.greenpay_id,
            "waste_type": "Paper & Cardboard",
            "weight_kg": 2.0,
            "admin_feedback": "Manual collection verified by supervisor"
        }
    )
    assert resp_waste_a.status_code == 201, resp_waste_a.text
    waste_data_a = resp_waste_a.json()
    assert waste_data_a["reward_amount"] == 50.0
    assert waste_data_a["user_id"] == user_a.id

    # 2. Record 2.0 kg Clean Plastic Packaging for User B using meter_number
    # Rate: 2.0 kg * 100 GP/kg = +200 GP
    resp_waste_b = client.post(
        "/api/v1/admin/waste",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "meter_number": user_b.meter_number,
            "waste_type": "Clean Plastic Packaging",
            "weight_kg": 2.0,
            "admin_feedback": "Manual collection verified by supervisor"
        }
    )
    assert resp_waste_b.status_code == 201, resp_waste_b.text
    waste_data_b = resp_waste_b.json()
    assert waste_data_b["reward_amount"] == 200.0
    assert waste_data_b["user_id"] == user_b.id

    # 3. Verify Points Isolation:
    new_a = get_balance(user_a.id)
    new_b = get_balance(user_b.id)

    assert round(new_a - initial_a, 1) == 50.0, f"User A points mismatch: expected +50, got {new_a - initial_a}"
    assert round(new_b - initial_b, 1) == 200.0, f"User B points mismatch: expected +200, got {new_b - initial_b}"

def test_manual_waste_collection_metals_and_cans(admin_token, db):
    """
    Test manual collection of Recyclable Metals & Cans (+50 GP/kg Individual)
    """
    token, _ = admin_token
    citizen = db.query(User).filter(User.role == "USER", User.is_active == True).first()

    response = client.post(
        "/api/v1/admin/waste",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "meter_number": citizen.greenpay_id,
            "waste_type": "Recyclable Metals & Cans",
            "weight_kg": 3.0,
            "admin_feedback": "Manual metal tins collection"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["reward_amount"] == 150.0  # 3.0 kg * 50 GP/kg

def test_manual_waste_collection_contaminated_waste_penalty(admin_token, db):
    """
    Test manual collection of Contaminated Waste (-15 GP flat penalty Individual)
    """
    token, _ = admin_token
    citizen = db.query(User).filter(User.role == "USER", User.is_active == True).first()

    response = client.post(
        "/api/v1/admin/waste",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "meter_number": citizen.greenpay_id,
            "waste_type": "Contaminated Waste",
            "weight_kg": 1.5,
            "admin_feedback": "Contaminated batch rejected with penalty"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["reward_amount"] == -15.0  # -15 GP flat penalty
