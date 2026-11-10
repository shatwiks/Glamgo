def test_reviews_workflow(client, customer_auth_headers):
    # 1. Create a review for a service
    resp = client.post("/api/v1/reviews", json={
        "item_id": "s1",
        "item_type": "service",
        "rating": 5.0,
        "comment": "Exceptional service! Skin felt revitalized and glowing all day."
    }, headers=customer_auth_headers)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["item_id"] == "s1"
    assert data["rating"] == 5.0
    assert "user_name" in data

    # 2. Validation: invalid rating > 5.0 should fail
    bad_resp = client.post("/api/v1/reviews", json={
        "item_id": "s1",
        "item_type": "service",
        "rating": 6.5,
        "comment": "Too high rating"
    }, headers=customer_auth_headers)
    assert bad_resp.status_code == 422

    # 3. Validation: invalid item_type should fail
    bad_type = client.post("/api/v1/reviews", json={
        "item_id": "s1",
        "item_type": "invalid_type",
        "rating": 4.0,
        "comment": "Invalid type"
    }, headers=customer_auth_headers)
    assert bad_type.status_code == 400

    # 4. Get reviews for service s1
    list_resp = client.get("/api/v1/reviews?item_id=s1")
    assert list_resp.status_code == 200
    reviews = list_resp.json()
    assert any(r["id"] == data["id"] for r in reviews)

    # 5. Get my reviews
    my_resp = client.get("/api/v1/reviews/my", headers=customer_auth_headers)
    assert my_resp.status_code == 200
    my_reviews = my_resp.json()
    assert any(r["id"] == data["id"] for r in my_reviews)
