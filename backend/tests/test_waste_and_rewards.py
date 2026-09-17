import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_waste_recording_reward_calculation_and_anomaly():
    # Admin logs in
    admin_res = client.post("/api/v1/auth/login", json={"meter_number": "ADM-BLR-001", "password": "AdminSecret123!"})
    admin_token = admin_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Citizen logs in to check initial balance
    user_res = client.post("/api/v1/auth/login", json={"meter_number": "BESCOM-IND-208491", "password": "Password123!"})
    user_token = user_res.json()["access_token"]
    user_headers = {"Authorization": f"Bearer {user_token}"}

    dash_before = client.get("/api/v1/users/me/dashboard", headers=user_headers).json()
    initial_balance = dash_before["wallet"]["current_balance"]

    # Admin records 5.0 kg Recyclable waste for Priya
    create_res = client.post(
        "/api/v1/admin/waste",
        json={
            "meter_number": "BESCOM-IND-208491",
            "waste_type": "Recyclable",
            "weight_kg": 5.0,
            "admin_feedback": "Clean rinsed milk packets and aluminum cans.",
        },
        headers=admin_headers,
    )
    assert create_res.status_code == 201
    waste_data = create_res.json()
    assert waste_data["reward_amount"] == 50.0 # 5.0 kg * 10.0/kg
    assert "10 GP/kg = +50 GP" in waste_data["reward_breakdown"]

    # User dashboard reflects new balance
    dash_after = client.get("/api/v1/users/me/dashboard", headers=user_headers).json()
    assert dash_after["wallet"]["current_balance"] == round(initial_balance + 50.0, 1)

    # Admin records an anomalous high spike (e.g. 75 kg) for an individual user
    spike_res = client.post(
        "/api/v1/admin/waste",
        json={
            "meter_number": "BESCOM-IND-208491",
            "waste_type": "Dry Waste",
            "weight_kg": 75.0,
            "admin_feedback": "Large cleanup load.",
        },
        headers=admin_headers,
    )
    assert spike_res.status_code == 201

    # Check anomalies endpoint
    anomalies_res = client.get("/api/v1/admin/anomalies", headers=admin_headers)
    assert anomalies_res.status_code == 200
    anomalies = anomalies_res.json()
    assert any(a["anomaly_type"] == "UNUSUAL_WEIGHT_SPIKE" for a in anomalies)

def test_rewards_catalogue_and_redemption_flow():
    # Admin logs in
    admin_res = client.post("/api/v1/auth/login", json={"meter_number": "ADM-BLR-001", "password": "AdminSecret123!"})
    admin_token = admin_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Citizen logs in
    user_res = client.post("/api/v1/auth/login", json={"meter_number": "BESCOM-IND-104928", "password": "Password123!"})
    user_token = user_res.json()["access_token"]
    user_headers = {"Authorization": f"Bearer {user_token}"}

    # 1. Fetch public catalogue
    cat_res = client.get("/api/v1/rewards/catalogue")
    assert cat_res.status_code == 200
    items = cat_res.json()
    assert len(items) >= 5
    assert any(i["points_cost"] == 100.0 for i in items) # Salt 100 GP

    # 2. Check citizen wallet
    wallet_res = client.get("/api/v1/users/me/rewards", headers=user_headers)
    assert wallet_res.status_code == 200
    wallet = wallet_res.json()
    assert wallet["currency_symbol"] == "GP"
    assert wallet["available_points"] >= 0

    # 3. Check admin redemptions list
    admin_red_res = client.get("/api/v1/rewards/admin/redemptions", headers=admin_headers)
    assert admin_red_res.status_code == 200
