import pytest
from fastapi.testclient import TestClient
from backend.app.models.user import UserRole
from backend.app.models.catalog import PartnerDraft


def test_admin_enhanced_stats_and_verticals(client: TestClient, admin_auth_headers):
    res = client.get("/api/v1/admin/stats", headers=admin_auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "services_gmv" in data
    assert "salons_gmv" in data
    assert "ecommerce_gmv" in data
    assert "average_booking_value" in data
    assert "average_order_value" in data
    assert data["average_booking_value"] >= 1000.0
    assert data["average_order_value"] >= 2000.0
    assert data["gross_merchandise_value"] >= 0.0


def test_admin_user_role_update_and_self_protection(client: TestClient, admin_auth_headers, customer_auth_headers):
    # Fetch users to pick a customer
    res = client.get("/api/v1/admin/users?role=customer", headers=admin_auth_headers)
    assert res.status_code == 200
    users = res.json()
    assert len(users) > 0
    target_user = users[0]
    target_id = target_user["id"]

    # Promote to professional
    update_res = client.patch(
        f"/api/v1/admin/users/{target_id}/role",
        headers=admin_auth_headers,
        json={"role": "professional"}
    )
    assert update_res.status_code == 200
    assert update_res.json()["role"] == "professional"

    # Revert back to customer
    revert_res = client.patch(
        f"/api/v1/admin/users/{target_id}/role",
        headers=admin_auth_headers,
        json={"role": "customer"}
    )
    assert revert_res.status_code == 200
    assert revert_res.json()["role"] == "customer"

    # Admin cannot demote self
    me_res = client.get("/api/v1/auth/me", headers=admin_auth_headers)
    admin_id = me_res.json()["id"]
    self_demote = client.patch(
        f"/api/v1/admin/users/{admin_id}/role",
        headers=admin_auth_headers,
        json={"role": "customer"}
    )
    assert self_demote.status_code == 400


def test_admin_partner_draft_moderation(client: TestClient, admin_auth_headers):
    import secrets
    # Register a unique applicant
    rand_hex = secrets.token_hex(4)
    applicant_email = f"applicant_{rand_hex}@example.com"
    reg = client.post("/api/v1/auth/register", json={
        "email": applicant_email,
        "password": "Password123!",
        "name": f"Specialist {rand_hex}",
        "phone": f"91{secrets.token_hex(4)[:8]}"
    })
    assert reg.status_code == 200
    login_res = client.post("/api/v1/auth/login", json={"email": applicant_email, "password": "Password123!"})
    assert login_res.status_code == 200
    applicant_token = login_res.json()["access_token"]
    applicant_headers = {"Authorization": f"Bearer {applicant_token}"}

    # Applicant submits a partner draft
    draft_res = client.post(
        "/api/v1/partners/drafts",
        headers=applicant_headers,
        json={
            "role": "Professional",
            "name": "Luxe Bridal Specialist",
            "price": 4500.0,
            "description": "Master bridal hairstylist and skin esthetician with 8 years experience."
        }
    )
    assert draft_res.status_code == 200
    draft_id = draft_res.json()["id"]

    # Admin lists pending drafts
    list_res = client.get("/api/v1/admin/partners/drafts?status=PENDING", headers=admin_auth_headers)
    assert list_res.status_code == 200
    pending_drafts = list_res.json()
    assert any(d["id"] == draft_id for d in pending_drafts)

    # Admin approves the draft
    approve_res = client.patch(
        f"/api/v1/admin/partners/drafts/{draft_id}/approve",
        headers=admin_auth_headers
    )
    assert approve_res.status_code == 200
    approved_data = approve_res.json()
    assert approved_data["status"] == "APPROVED"
    assert approved_data["reviewed_by"] is not None

    # Test reject on another draft
    draft2_res = client.post(
        "/api/v1/partners/drafts",
        headers=applicant_headers,
        json={
            "role": "Salon Owner",
            "name": "Invalid Venue Submission",
            "price": 1000.0,
            "description": "Incomplete documentation"
        }
    )
    draft2_id = draft2_res.json()["id"]

    reject_res = client.patch(
        f"/api/v1/admin/partners/drafts/{draft2_id}/reject",
        headers=admin_auth_headers,
        json={"rejection_reason": "Missing commercial salon license and tax registration documents."}
    )
    assert reject_res.status_code == 200
    rejected_data = reject_res.json()
    assert rejected_data["status"] == "REJECTED"
    assert "Missing commercial salon license" in rejected_data["rejection_reason"]


def test_admin_audit_logs_engine(client: TestClient, admin_auth_headers, customer_auth_headers):
    # Query audit logs as admin
    res = client.get("/api/v1/admin/audit-logs", headers=admin_auth_headers)
    assert res.status_code == 200
    logs = res.json()
    assert isinstance(logs, list)
    assert len(logs) > 0
    # Verify latest audit log properties
    latest = logs[0]
    assert "action" in latest
    assert "target_type" in latest
    assert "target_id" in latest
    assert "admin_name" in latest
    assert "created_at" in latest

    # Customer cannot access audit logs
    unauth_res = client.get("/api/v1/admin/audit-logs", headers=customer_auth_headers)
    assert unauth_res.status_code == 403


def test_admin_partner_moderation_state_machine(client: TestClient, admin_auth_headers):
    import secrets
    rand_hex = secrets.token_hex(4)
    applicant_email = f"statemachine_{rand_hex}@example.com"
    client.post("/api/v1/auth/register", json={
        "email": applicant_email,
        "password": "Password123!",
        "name": f"Applicant {rand_hex}",
        "phone": f"91{secrets.token_hex(4)[:8]}"
    })
    login_res = client.post("/api/v1/auth/login", json={"email": applicant_email, "password": "Password123!"})
    applicant_headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}

    # Draft 1: To approve and test re-approve & reject post-approval
    d1 = client.post(
        "/api/v1/partners/drafts",
        headers=applicant_headers,
        json={"role": "Professional", "name": "Pro 1", "price": 2000.0, "description": "Expert"}
    ).json()

    # 1. Approve once -> 200
    res_app = client.patch(f"/api/v1/admin/partners/drafts/{d1['id']}/approve", headers=admin_auth_headers)
    assert res_app.status_code == 200

    # 2. Re-approve -> 400
    res_reapp = client.patch(f"/api/v1/admin/partners/drafts/{d1['id']}/approve", headers=admin_auth_headers)
    assert res_reapp.status_code == 400
    assert "already approved" in res_reapp.json()["detail"].lower()

    # 3. Reject post-approval -> 400
    res_rej_app = client.patch(
        f"/api/v1/admin/partners/drafts/{d1['id']}/reject",
        headers=admin_auth_headers,
        json={"rejection_reason": "Trying to reject approved"}
    )
    assert res_rej_app.status_code == 400
    assert "already been approved" in res_rej_app.json()["detail"].lower()

    # Draft 2: To reject and test re-reject & approve post-rejection
    d2 = client.post(
        "/api/v1/partners/drafts",
        headers=applicant_headers,
        json={"role": "Salon Owner", "name": "Salon 2", "price": 1000.0, "description": "Venue"}
    ).json()

    # 4. Reject once -> 200
    res_rej = client.patch(
        f"/api/v1/admin/partners/drafts/{d2['id']}/reject",
        headers=admin_auth_headers,
        json={"rejection_reason": "Incomplete business profile documentation"}
    )
    assert res_rej.status_code == 200

    # 5. Re-reject -> 400
    res_rerej = client.patch(
        f"/api/v1/admin/partners/drafts/{d2['id']}/reject",
        headers=admin_auth_headers,
        json={"rejection_reason": "Duplicate rejection"}
    )
    assert res_rerej.status_code == 400
    assert "already rejected" in res_rerej.json()["detail"].lower()

    # 6. Approve post-rejection -> 400
    res_app_rej = client.patch(f"/api/v1/admin/partners/drafts/{d2['id']}/approve", headers=admin_auth_headers)
    assert res_app_rej.status_code == 400
    assert "cannot approve" in res_app_rej.json()["detail"].lower()


def test_admin_partner_rejection_reason_validation(client: TestClient, admin_auth_headers):
    import secrets
    rand_hex = secrets.token_hex(4)
    applicant_email = f"val_{rand_hex}@example.com"
    client.post("/api/v1/auth/register", json={
        "email": applicant_email,
        "password": "Password123!",
        "name": f"Val Applicant {rand_hex}",
        "phone": f"91{secrets.token_hex(4)[:8]}"
    })
    login_res = client.post("/api/v1/auth/login", json={"email": applicant_email, "password": "Password123!"})
    applicant_headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}

    draft = client.post(
        "/api/v1/partners/drafts",
        headers=applicant_headers,
        json={"role": "Professional", "name": "Val Pro", "price": 2000.0, "description": "Expert"}
    ).json()

    # Whitespace only rejection note
    res_ws = client.patch(
        f"/api/v1/admin/partners/drafts/{draft['id']}/reject",
        headers=admin_auth_headers,
        json={"rejection_reason": "     "}
    )
    assert res_ws.status_code == 422

    # Under 3 characters
    res_short = client.patch(
        f"/api/v1/admin/partners/drafts/{draft['id']}/reject",
        headers=admin_auth_headers,
        json={"rejection_reason": "no"}
    )
    assert res_short.status_code == 422


def test_admin_audit_logs_immutability_trigger(client: TestClient, admin_auth_headers):
    from backend.app.core.database import SessionLocal
    from backend.app.models.admin import AdminAuditLog
    from sqlalchemy.exc import DBAPIError

    db = SessionLocal()
    try:
        log = db.query(AdminAuditLog).first()
        assert log is not None

        # Attempt UPDATE -> trigger must raise DBAPIError
        tamper_failed = False
        try:
            log.action = "TAMPERED_ACTION"
            db.commit()
        except DBAPIError:
            db.rollback()
            tamper_failed = True
        assert tamper_failed, "PostgreSQL trigger should have prevented UPDATE on admin_audit_logs"

        # Attempt DELETE -> trigger must raise DBAPIError
        delete_failed = False
        try:
            db.delete(log)
            db.commit()
        except DBAPIError:
            db.rollback()
            delete_failed = True
        assert delete_failed, "PostgreSQL trigger should have prevented DELETE on admin_audit_logs"
    finally:
        db.close()

