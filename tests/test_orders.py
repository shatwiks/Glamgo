def test_order_checkout_and_coupon_discount(client, customer_auth_headers):
    # 1. Validate Coupon GLAM10
    coupon_resp = client.post("/api/v1/orders/coupon/validate", json={
        "code": "GLAM10",
        "subtotal": 2000.0
    })
    assert coupon_resp.status_code == 200
    coupon_data = coupon_resp.json()
    assert coupon_data["valid"] is True
    assert coupon_data["discount"] == 200.0  # 10% of 2000

    # 2. Check coupon cap at max ₹300
    cap_resp = client.post("/api/v1/orders/coupon/validate", json={
        "code": "GLAM10",
        "subtotal": 5000.0
    })
    assert cap_resp.status_code == 200
    assert cap_resp.json()["discount"] == 300.0  # capped at 300

    # 3. Invalid coupon
    invalid_resp = client.post("/api/v1/orders/coupon/validate", json={
        "code": "INVALID_CODE",
        "subtotal": 1000.0
    })
    assert invalid_resp.status_code == 200
    assert invalid_resp.json()["valid"] is False

    # 4. Place order with coupon
    order_payload = {
        "items": [
            {"id": "b1", "qty": 1},  # The Daily Renewal Serum (₹1890)
            {"id": "b3", "qty": 2}   # Satin Colour Lipstick (2 * ₹990 = ₹1980)
        ],
        "coupon": "GLAM10",
        "payment_method": "UPI",
        "address_label": "Home",
        "address_text": "24 Sea View Road, Bandra West, Mumbai"
    }

    create_resp = client.post("/api/v1/orders/", json=order_payload, headers=customer_auth_headers)
    assert create_resp.status_code == 200, create_resp.text
    order = create_resp.json()
    assert order["id"].startswith("GG")
    expected_subtotal = 1890.0 + 1980.0  # 3870.0
    expected_discount = 300.0  # 10% is 387, but capped at 300
    expected_total = expected_subtotal - expected_discount  # 3570.0

    assert order["subtotal"] == expected_subtotal
    assert order["discount"] == expected_discount
    assert order["total"] == expected_total
    assert len(order["items"]) == 2

    # 5. Retrieve customer orders
    orders_resp = client.get("/api/v1/orders/my", headers=customer_auth_headers)
    assert orders_resp.status_code == 200
    my_orders = orders_resp.json()
    assert any(o["id"] == order["id"] for o in my_orders)
