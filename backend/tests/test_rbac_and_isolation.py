import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_tokens():
    # Login citizen
    user_res = client.post("/api/v1/auth/login", json={"meter_number": "BESCOM-IND-104928", "password": "Password123!"})
    user_token = user_res.json()["access_token"]
    user_id = user_res.json()["user_id"]

    # Login Priya (another citizen)
    priya_res = client.post("/api/v1/auth/login", json={"meter_number": "BESCOM-IND-208491", "password": "Password123!"})
    priya_token = priya_res.json()["access_token"]

    # Login admin
    admin_res = client.post("/api/v1/auth/login", json={"meter_number": "ADM-BLR-001", "password": "AdminSecret123!"})
    admin_token = admin_res.json()["access_token"]

    return user_token, user_id, priya_token, admin_token

def test_citizen_cannot_access_admin_endpoints():
    user_token, _, _, _ = get_tokens()
    headers = {"Authorization": f"Bearer {user_token}"}

    # Attempt to access admin dashboard KPIs
    response = client.get("/api/v1/admin/dashboard-kpis", headers=headers)
    assert response.status_code == 403
    assert "administrator privileges required" in response.json()["detail"]

    # Attempt to access admin audit logs
    response = client.get("/api/v1/admin/audit-logs", headers=headers)
    assert response.status_code == 403

def test_tenant_data_isolation_between_citizens():
    user_token, _, priya_token, _ = get_tokens()

    # Aarav fetches his own waste list
    aarav_waste_res = client.get("/api/v1/users/me/waste", headers={"Authorization": f"Bearer {user_token}"})
    assert aarav_waste_res.status_code == 200
    aarav_items = aarav_waste_res.json()["items"]
    assert len(aarav_items) > 0
    aarav_waste_id = aarav_items[0]["id"]

    # Priya attempts to access Aarav's waste record by ID
    intruder_res = client.get(f"/api/v1/users/me/waste/{aarav_waste_id}", headers={"Authorization": f"Bearer {priya_token}"})
    assert intruder_res.status_code == 403
    assert "Access Denied" in intruder_res.json()["detail"]
