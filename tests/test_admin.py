def test_admin_rbac_and_management(client, customer_auth_headers, admin_auth_headers):
    # 1. Non-admin customer should be rejected with 403 Forbidden
    forbidden_resp = client.get("/api/v1/admin/stats", headers=customer_auth_headers)
    assert forbidden_resp.status_code == 403

    # 2. Admin should get platform stats
    admin_resp = client.get("/api/v1/admin/stats", headers=admin_auth_headers)
    assert admin_resp.status_code == 200
    stats = admin_resp.json()
    assert "customers_count" in stats
    assert "total_bookings" in stats
    assert "total_orders" in stats
    assert "gross_merchandise_value" in stats
    assert "platform_commission" in stats

    # 3. Admin can list users
    users_resp = client.get("/api/v1/admin/users", headers=admin_auth_headers)
    assert users_resp.status_code == 200
    users = users_resp.json()
    assert len(users) >= 5

    # 4. Admin can list all platform bookings and orders
    all_bookings_resp = client.get("/api/v1/admin/bookings", headers=admin_auth_headers)
    assert all_bookings_resp.status_code == 200

    all_orders_resp = client.get("/api/v1/admin/orders", headers=admin_auth_headers)
    assert all_orders_resp.status_code == 200

    # 5. Admin can toggle customer status
    cust_user = next((u for u in users if u["role"] == "customer"), None)
    if cust_user:
        toggle_resp = client.patch(f"/api/v1/admin/users/{cust_user['id']}/toggle-status", headers=admin_auth_headers)
        assert toggle_resp.status_code == 200
        # Revert back
        revert_resp = client.patch(f"/api/v1/admin/users/{cust_user['id']}/toggle-status", headers=admin_auth_headers)
        assert revert_resp.status_code == 200

    # 6. Admin cannot deactivate their own account (MIN-05)
    admin_user = next((u for u in users if u["role"] == "admin"), None)
    if admin_user:
        self_toggle = client.patch(f"/api/v1/admin/users/{admin_user['id']}/toggle-status", headers=admin_auth_headers)
        assert self_toggle.status_code == 400
