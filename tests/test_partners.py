def test_partner_portal_features(client, pro_auth_headers):
    # 1. Partner overview for professional
    overview_resp = client.get("/api/v1/partners/overview?role=Professional", headers=pro_auth_headers)
    assert overview_resp.status_code == 200
    data = overview_resp.json()
    assert "metrics" in data
    assert any(m["label"] == "Upcoming appointments" for m in data["metrics"])

    # 2. Availability toggle
    avail_resp = client.get("/api/v1/partners/availability", headers=pro_auth_headers)
    assert avail_resp.status_code == 200
    days_before = avail_resp.json()

    # Toggle 'Sun'
    toggle_resp = client.post("/api/v1/partners/availability/toggle?day=Sun", headers=pro_auth_headers)
    assert toggle_resp.status_code == 200
    days_after = toggle_resp.json()

    # The status of 'Sun' must have flipped
    assert ("Sun" in days_after) != ("Sun" in days_before)

    # 3. Create draft listing
    draft_resp = client.post("/api/v1/partners/drafts", json={
        "role": "Professional",
        "name": "Luxury Gold Facial",
        "price": 2499.0,
        "description": "24k gold infused facial for deep radiance and luxury."
    }, headers=pro_auth_headers)
    assert draft_resp.status_code == 200
    draft = draft_resp.json()
    assert draft["name"] == "Luxury Gold Facial"

    # 4. Fetch drafts
    get_drafts_resp = client.get("/api/v1/partners/drafts?role=Professional", headers=pro_auth_headers)
    assert get_drafts_resp.status_code == 200
    assert any(d["id"] == draft["id"] for d in get_drafts_resp.json())
