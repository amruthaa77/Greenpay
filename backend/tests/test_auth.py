import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["platform"] == "GreenPay"
    assert "jurisdiction" in data

def test_login_success_citizen():
    response = client.post(
        "/api/v1/auth/login",
        json={"meter_number": "BESCOM-IND-104928", "password": "Password123!"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["role"] == "USER"
    assert data["name"] == "Aarav Sharma"

def test_login_success_admin():
    response = client.post(
        "/api/v1/auth/login",
        json={"meter_number": "ADM-BLR-001", "password": "AdminSecret123!"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "ADMIN"
    assert "BBMP" in data["name"]

def test_login_invalid_credentials():
    response = client.post(
        "/api/v1/auth/login",
        json={"meter_number": "BESCOM-IND-104928", "password": "WrongPassword!"}
    )
    assert response.status_code == 401
    assert "Meter number or password is incorrect" in response.json()["detail"]

def test_duplicate_meter_registration():
    # Attempt to re-register Aarav's meter
    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Duplicate Test",
            "meter_number": "BESCOM-IND-104928",
            "address": "123 Test Road",
            "ward_id": "dummy-ward",
            "user_type": "Individual",
            "password": "Password123!",
            "confirm_password": "Password123!",
        }
    )
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]

def test_admin_registration_invalid_invite_code():
    response = client.post(
        "/api/v1/auth/register-admin",
        json={
            "name": "Fake Admin",
            "meter_number": "ADM-FAKE-001",
            "password": "AdminSecret123!",
            "confirm_password": "AdminSecret123!",
            "access_code": "WRONG_SECRET_CODE"
        }
    )
    assert response.status_code == 403
    assert "Invalid municipal administrator" in response.json()["detail"]

def test_register_with_numeric_ward_42():
    import uuid
    meter = f"BESCOM-IND-{uuid.uuid4().hex[:6].upper()}"
    pwd = "Password123!"
    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Kavitha Reddy",
            "meter_number": meter,
            "address": "42, 14th Main, Lakshmidevi Nagar",
            "ward_number": 42,
            "user_type": "Individual",
            "password": pwd,
            "confirm_password": pwd,
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["meter_number"] == meter
    assert data["ward_number"] == 42
    assert "Lakshmidevi Nagar" in data["ward_name"] or "42" in data["ward_name"]

    # Verify user can log in with new credentials
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"meter_number": meter, "password": pwd}
    )
    assert login_resp.status_code == 200
    login_data = login_resp.json()
    assert login_data["meter_number"] == meter
    assert login_data["ward_number"] == 42
    token = login_data["access_token"]

    # Verify /auth/me returns ward_number 42
    me_resp = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["profile"]["ward_number"] == 42
