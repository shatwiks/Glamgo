import time


def test_booking_workflow_and_conflict_prevention(client, customer_auth_headers):
    # Unique future date and time slot for idempotent test runs
    unique_date = f"203{(int(time.time() * 1000) % 8) + 1}-{(int(time.time() * 10) % 11) + 1:02d}-{(int(time.time() * 7) % 27) + 1:02d}"
    unique_time = f"{(int(time.time() * 13) % 11) + 1:02d}:45 AM"

    # 1. Create a home service booking
    booking_payload = {
        "type": "home",
        "service_id": "s1",  # The Signature Facial
        "professional": "Nisha Kapoor",
        "date": unique_date,
        "time": unique_time,
        "location": "24 Sea View Road, Bandra West, Mumbai"
    }

    create_resp = client.post("/api/v1/bookings/", json=booking_payload, headers=customer_auth_headers)
    assert create_resp.status_code == 200, create_resp.text
    booking = create_resp.json()
    assert booking["id"].startswith("BK")
    assert booking["title"] == "The Signature Facial"
    assert booking["professional"] == "Nisha Kapoor"
    assert booking["status"] == "confirmed"

    # 2. Duplicate booking for the same professional, date and time should be blocked with 409 Conflict
    conflict_resp = client.post("/api/v1/bookings/", json=booking_payload, headers=customer_auth_headers)
    assert conflict_resp.status_code == 409
    assert "already booked" in conflict_resp.json()["detail"]

    # 3. Retrieve user's bookings
    my_bookings_resp = client.get("/api/v1/bookings/my", headers=customer_auth_headers)
    assert my_bookings_resp.status_code == 200
    my_list = my_bookings_resp.json()
    assert any(b["id"] == booking["id"] for b in my_list)

    # 4. Create salon appointment with 'Any available expert' (no blocking conflict)
    salon_booking = {
        "type": "salon",
        "service_id": "s2",
        "salon_id": "l1",
        "professional": "Any available expert",
        "date": unique_date,
        "time": "10:30 AM",
        "location": "The Ivory Room, Bandra West"
    }
    salon_resp = client.post("/api/v1/bookings/", json=salon_booking, headers=customer_auth_headers)
    assert salon_resp.status_code == 200
    assert salon_resp.json()["status"] == "confirmed"
    b_id = salon_resp.json()["id"]

    # 4. MAJ-01 verification: Customer cannot complete their own booking (403 Forbidden)
    complete_resp = client.patch(f"/api/v1/bookings/{b_id}/status", json={
        "status": "completed"
    }, headers=customer_auth_headers)
    assert complete_resp.status_code == 403

    # 5. Customer can cancel their booking
    cancel_resp = client.patch(f"/api/v1/bookings/{b_id}/status", json={
        "status": "cancelled"
    }, headers=customer_auth_headers)
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["status"] == "cancelled"
