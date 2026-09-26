import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.user import User
from app.models.ai import AIClassification
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
# FEATURE A: AI VISION CLASSIFICATION TESTS
# =========================================================================

def test_ai_vision_clean_plastic_packaging(admin_token):
    token, _ = admin_token
    response = client.post(
        "/api/v1/admin/vision/classify",
        headers={"Authorization": f"Bearer {token}"},
        json={"preset": "clean_pet_bottles_chips_wrappers"}
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["classification"] == "Clean Plastic Packaging"
    assert data["confidence"] == 0.94
    assert data["action"] == "ACCEPT"
    assert data["rate_individual"] == 100.0
    assert data["rate_commercial"] == 80.0
    assert "classification_id" in data
    assert data["is_assistance_only"] is True

def test_ai_vision_paper_and_cardboard(admin_token):
    token, _ = admin_token
    response = client.post(
        "/api/v1/admin/vision/classify",
        headers={"Authorization": f"Bearer {token}"},
        json={"preset": "clean_cardboard"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["classification"] == "Paper & Cardboard"
    assert data["confidence"] == 0.92
    assert data["action"] == "ACCEPT"
    assert data["rate_individual"] == 25.0
    assert data["rate_commercial"] == 20.0

def test_ai_vision_metals_and_cans(admin_token):
    token, _ = admin_token
    response = client.post(
        "/api/v1/admin/vision/classify",
        headers={"Authorization": f"Bearer {token}"},
        json={"preset": "clean_aluminum_can"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["classification"] == "Recyclable Metals & Cans"
    assert data["confidence"] == 0.95
    assert data["action"] == "ACCEPT"
    assert data["rate_individual"] == 50.0
    assert data["rate_commercial"] == 40.0

def test_ai_vision_contaminated_waste_reject(admin_token):
    token, _ = admin_token
    response = client.post(
        "/api/v1/admin/vision/classify",
        headers={"Authorization": f"Bearer {token}"},
        json={"preset": "wet_food_scraps"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["classification"] == "Contaminated Waste"
    assert data["confidence"] == 0.97
    assert data["action"] == "REJECT"
    assert data["penalty_individual"] == -15.0
    assert data["penalty_commercial"] == -30.0

def test_ai_vision_invalid_preset_returns_422(admin_token):
    token, _ = admin_token
    response = client.post(
        "/api/v1/admin/vision/classify",
        headers={"Authorization": f"Bearer {token}"},
        json={"preset": "unknown_junk"}
    )
    assert response.status_code == 422
    assert "Unknown vision sample preset" in response.json()["detail"]

def test_ai_vision_unauthenticated_returns_401():
    response = client.post(
        "/api/v1/admin/vision/classify",
        json={"preset": "clean_pet_bottles_chips_wrappers"}
    )
    assert response.status_code == 401

def test_ai_vision_backward_compatibility(admin_token):
    token, _ = admin_token
    response = client.post(
        "/api/v1/admin/ai/classify",
        headers={"Authorization": f"Bearer {token}"},
        json={"image_name_or_keyword": "plastic_bottle"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["classification"] == "Clean Plastic Packaging"
    assert data["predicted_category"] == "Clean Plastic Packaging"
    assert data["action"] == "ACCEPT"

def test_ai_vision_persists_to_db(admin_token, db):
    token, admin = admin_token
    response = client.post(
        "/api/v1/admin/vision/classify",
        headers={"Authorization": f"Bearer {token}"},
        json={"preset": "clean_newspaper"}
    )
    assert response.status_code == 200
    class_id = response.json()["classification_id"]

    record = db.query(AIClassification).filter(AIClassification.id == class_id).first()
    assert record is not None
    assert record.admin_id == admin.id
    assert record.predicted_category == "Paper & Cardboard"
    assert record.confidence == 0.93

# =========================================================================
# FEATURE B: CITIZEN QR & COLLECTION ATTRIBUTION TESTS
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

    # Test with GREENPAY: URI prefix (as scanned by camera)
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

def test_two_user_attribution_and_points_isolation(admin_token, db):
    token, admin = admin_token
    
    # Retrieve two distinct citizens
    citizens = db.query(User).filter(User.role == "USER", User.is_active == True).limit(2).all()
    assert len(citizens) >= 2, "Must have at least 2 test citizens"
    user_a, user_b = citizens[0], citizens[1]

    # Calculate initial balances
    def get_balance(u_id):
        return sum(
            t.amount for t in db.query(RewardTransaction).filter(RewardTransaction.user_id == u_id).all()
        )

    initial_a = get_balance(user_a.id)
    initial_b = get_balance(user_b.id)

    # 1. Run AI Vision for User A (Paper & Cardboard)
    ai_resp_a = client.post(
        "/api/v1/admin/vision/classify",
        headers={"Authorization": f"Bearer {token}"},
        json={"preset": "clean_cardboard"}
    )
    assert ai_resp_a.status_code == 200
    class_id_a = ai_resp_a.json()["classification_id"]

    # Record 2.0 kg Paper & Cardboard for User A using greenpay_id
    # Rate: 2.0 kg * 25 GP/kg = +50 GP
    resp_waste_a = client.post(
        "/api/v1/admin/waste",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "meter_number": user_a.greenpay_id,
            "waste_type": "Paper & Cardboard",
            "weight_kg": 2.0,
            "ai_classification_id": class_id_a,
            "admin_feedback": "Verified with AI vision assistance"
        }
    )
    assert resp_waste_a.status_code == 201, resp_waste_a.text
    waste_data_a = resp_waste_a.json()
    assert waste_data_a["reward_amount"] == 50.0
    assert waste_data_a["ai_classification_id"] == class_id_a
    assert waste_data_a["user_id"] == user_a.id

    # Verify AIClassification in DB links to waste entry
    ai_record_a = db.query(AIClassification).filter(AIClassification.id == class_id_a).first()
    assert ai_record_a.waste_entry_id == waste_data_a["id"]

    # 2. Run AI Vision for User B (Clean Plastic Packaging)
    ai_resp_b = client.post(
        "/api/v1/admin/vision/classify",
        headers={"Authorization": f"Bearer {token}"},
        json={"preset": "clean_pet_bottles_chips_wrappers"}
    )
    assert ai_resp_b.status_code == 200
    class_id_b = ai_resp_b.json()["classification_id"]

    # Record 2.0 kg Clean Plastic Packaging for User B using meter_number
    # Rate: 2.0 kg * 100 GP/kg = +200 GP
    resp_waste_b = client.post(
        "/api/v1/admin/waste",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "meter_number": user_b.meter_number,
            "waste_type": "Clean Plastic Packaging",
            "weight_kg": 2.0,
            "ai_classification_id": class_id_b,
        }
    )
    assert resp_waste_b.status_code == 201
    waste_data_b = resp_waste_b.json()
    assert waste_data_b["reward_amount"] == 200.0
    assert waste_data_b["user_id"] == user_b.id

    # 3. Verify Points Isolation:
    # User A balance must have increased by exactly 50.0
    # User B balance must have increased by exactly 200.0
    # No crossover!
    new_a = get_balance(user_a.id)
    new_b = get_balance(user_b.id)

    assert round(new_a - initial_a, 1) == 50.0, f"User A points mismatch: expected +50, got {new_a - initial_a}"
    assert round(new_b - initial_b, 1) == 200.0, f"User B points mismatch: expected +200, got {new_b - initial_b}"
