import time

def test_register_and_login_flow(client):
    unique_email = f"user_{int(time.time() * 1000)}@testglamgo.com"
    
    # 1. Register new customer
    reg_resp = client.post("/api/v1/auth/register", json={
        "email": unique_email,
        "password": "SecretPassword@123",
        "name": "Pooja Sharma",
        "phone": "98123 45678"
    })
    assert reg_resp.status_code == 200, reg_resp.text
    data = reg_resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["role"] == "customer"
    assert data["name"] == "Pooja Sharma"

    # 2. Duplicate registration should fail
    dup_resp = client.post("/api/v1/auth/register", json={
        "email": unique_email,
        "password": "SecretPassword@123",
        "name": "Pooja Duplicate"
    })
    assert dup_resp.status_code == 400

    # 3. Login with correct password
    login_resp = client.post("/api/v1/auth/login", json={
        "email": unique_email,
        "password": "SecretPassword@123"
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    refresh = login_resp.json()["refresh_token"]

    # 4. Login with incorrect password
    bad_login = client.post("/api/v1/auth/login", json={
        "email": unique_email,
        "password": "WrongPassword"
    })
    assert bad_login.status_code == 401

    # 5. Token refresh
    refresh_resp = client.post("/api/v1/auth/refresh", json={
        "refresh_token": refresh
    })
    assert refresh_resp.status_code == 200
    assert "access_token" in refresh_resp.json()

    # 6. Access protected profile
    headers = {"Authorization": f"Bearer {token}"}
    me_resp = client.get("/api/v1/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == unique_email
    assert me_resp.json()["name"] == "Pooja Sharma"


def test_admin_self_registration_forbidden(client):
    # CRIT-01 verification: Attempting to register with admin role must be rejected with 403 Forbidden
    resp = client.post("/api/v1/auth/register", json={
        "email": f"hacker_{int(time.time() * 1000)}@test.com",
        "password": "Password@123",
        "name": "Malicious User",
        "role": "admin"
    })
    assert resp.status_code == 403

