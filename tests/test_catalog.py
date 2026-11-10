def test_services_catalog(client):
    # Get all services
    resp = client.get("/api/v1/services/")
    assert resp.status_code == 200
    services = resp.json()
    assert len(services) >= 8
    first = services[0]
    assert "id" in first
    assert "name" in first
    assert "price" in first
    assert "duration" in first

    # Filter by category
    resp_cat = client.get("/api/v1/services/?category=Skin")
    assert resp_cat.status_code == 200
    skin_services = resp_cat.json()
    assert all(s["category"] == "Skin" for s in skin_services)

    # Categories list
    resp_cats = client.get("/api/v1/services/categories")
    assert resp_cats.status_code == 200
    cats = resp_cats.json()
    assert "Skin" in cats
    assert "Hair" in cats
    assert "All" in cats


def test_professionals_catalog(client):
    resp = client.get("/api/v1/professionals/")
    assert resp.status_code == 200
    pros = resp.json()
    assert len(pros) >= 3
    nisha = next((p for p in pros if "Nisha" in p["name"]), None)
    assert nisha is not None
    assert nisha["is_verified"] is True

    # Check availability
    avail_resp = client.get(f"/api/v1/professionals/{nisha['id']}/availability")
    assert avail_resp.status_code == 200
    days = avail_resp.json()
    assert isinstance(days, list)
    assert "Mon" in days


def test_salons_catalog(client):
    resp = client.get("/api/v1/salons/")
    assert resp.status_code == 200
    salons = resp.json()
    assert len(salons) >= 3
    ivory = next((s for s in salons if "Ivory Room" in s["name"]), None)
    assert ivory is not None
    assert "services" in ivory
    assert len(ivory["services"]) > 0

    # Sort by price
    sorted_resp = client.get("/api/v1/salons/?sort=price")
    assert sorted_resp.status_code == 200
    sorted_salons = sorted_resp.json()
    prices = [s["price"] for s in sorted_salons]
    assert prices == sorted(prices)


def test_products_catalog(client):
    resp = client.get("/api/v1/products/")
    assert resp.status_code == 200
    products = resp.json()
    assert len(products) >= 7
    serum = next((p for p in products if "Serum" in p["name"]), None)
    assert serum is not None
    assert serum["brand"] == "LUMIÈRE"
    assert "30 ml" in serum["variants"]

    # Filter by category
    skincare_resp = client.get("/api/v1/products/?category=Skincare")
    assert skincare_resp.status_code == 200
    for p in skincare_resp.json():
        assert p["category"] == "Skincare"
