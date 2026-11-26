from contextlib import asynccontextmanager
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.main import app
from backend.app.core.database import Base, get_db, ensure_phase13_schema_columns
from backend.app.core.security import create_access_token
from backend.app.models.catalog import ProfessionalProfile, Salon, Service
from backend.app.models.user import User, UserRole
from backend.app.services.cache_service import cache_service


@pytest.fixture
def client(monkeypatch):
    engine = create_engine('sqlite://', connect_args={'check_same_thread': False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    ensure_phase13_schema_columns(engine)
    factory = sessionmaker(bind=engine, expire_on_commit=False)
    db = factory()
    db.add_all([
        User(id=1, email='cust@test.invalid', full_name='Customer', hashed_password='x', role=UserRole.CUSTOMER, is_active=True),
        User(id=2, email='salon1@test.invalid', full_name='Salon One', hashed_password='x', role=UserRole.SALON_OWNER, is_active=True),
        User(id=3, email='salon2@test.invalid', full_name='Salon Two', hashed_password='x', role=UserRole.SALON_OWNER, is_active=True),
        User(id=4, email='pro1@test.invalid', full_name='Pro One', hashed_password='x', role=UserRole.PROFESSIONAL, is_active=True),
        User(id=5, email='pro2@test.invalid', full_name='Pro Two', hashed_password='x', role=UserRole.PROFESSIONAL, is_active=True),
        Service(id='s1', audience='women', name='Platform Facial', category='Skin', price=1499, duration='75 min', img='test', desc='Global facial'),
        Salon(id='l1', owner_id=2, audience='unisex', name='Atelier Bandra', city='Mumbai', area='Bandra', distance='1 km', price=800, img='test', services_list='Hair', hours='9-8', about='Test'),
        Salon(id='l2', owner_id=3, audience='women', name='Other Salon', city='Mumbai', area='Juhu', distance='2 km', price=900, img='test', services_list='Skin', hours='9-8', about='Other'),
        ProfessionalProfile(id=10, user_id=4, audience='women', name='Pro One', city='Mumbai', experience='5 yrs', price=799, img='test', specialty='Skin & Hair', is_verified=True),
        ProfessionalProfile(id=11, user_id=5, audience='men', name='Pro Two', city='Mumbai', experience='4 yrs', price=699, img='test', specialty='Beard', is_verified=True),
    ])
    db.commit()
    monkeypatch.setattr(cache_service, 'get', lambda *a, **k: None)
    monkeypatch.setattr(cache_service, 'set', lambda *a, **k: None)
    monkeypatch.setattr(cache_service, 'invalidate_catalog', lambda *a, **k: None)

    def override():
        yield db

    app.dependency_overrides[get_db] = override

    @asynccontextmanager
    async def no_lifespan(app):
        yield

    monkeypatch.setattr(app.router, 'lifespan_context', no_lifespan)
    with TestClient(app, raise_server_exceptions=True) as c:
        yield c
    app.dependency_overrides.clear()
    db.close()
    engine.dispose()


def headers(uid, role):
    return {'Authorization': 'Bearer ' + create_access_token(uid, role)}


def test_salon_owner_custom_service_crud_and_customer_booking(client):
    c = client

    # Create custom salon service
    res = c.post('/api/v1/partners/salon/services', headers=headers(2, 'salon_owner'), json={
        'name': 'Keratin Silk Smooth',
        'category': 'Hair',
        'price': 2850,
        'duration': '90 min',
        'audience': 'unisex',
        'desc': 'Formaldehyde-free smoothing ritual',
    })
    assert res.status_code == 200
    created = res.json()
    svc_id = created['id']
    assert created['salon_id'] == 'l1'
    assert created['price'] == 2850

    # Exposed in salon menu, NOT in public at-home services
    salon_res = c.get('/api/v1/salons/l1')
    assert salon_res.status_code == 200
    assert any(m['id'] == svc_id and m['price'] == 2850 for m in salon_res.json()['menu_services'])

    at_home_res = c.get('/api/v1/services/')
    assert at_home_res.status_code == 200
    assert not any(s['id'] == svc_id for s in at_home_res.json())

    # Ownership check blocks other salon owner from updating
    assert c.put(f'/api/v1/partners/salon/services/{svc_id}', headers=headers(3, 'salon_owner'), json={'price': 100}).status_code == 403

    # Update custom salon service
    upd = c.put(f'/api/v1/partners/salon/services/{svc_id}', headers=headers(2, 'salon_owner'), json={
        'name': 'Keratin Gold Smooth',
        'category': 'Spa',
        'price': 3100,
    })
    assert upd.status_code == 200
    assert upd.json()['price'] == 3100

    # Customer cannot book l1's custom service under l2
    bad_booking = c.post('/api/v1/bookings/', headers=headers(1, 'customer'), json={
        'type': 'salon',
        'service_id': svc_id,
        'salon_id': 'l2',
        'professional': 'Any available expert',
        'date': '2026-12-10',
        'time': '11:00 AM',
        'location': 'Mumbai',
    })
    assert bad_booking.status_code == 400

    # Customer can book custom service at l1 at custom price
    ok_booking = c.post('/api/v1/bookings/', headers=headers(1, 'customer'), json={
        'type': 'salon',
        'service_id': svc_id,
        'salon_id': 'l1',
        'professional': 'Any available expert',
        'date': '2026-12-10',
        'time': '11:00 AM',
        'location': 'Atelier Bandra',
    })
    assert ok_booking.status_code == 200
    assert ok_booking.json()['price'] == 3100
    assert ok_booking.json()['title'] == 'Keratin Gold Smooth'

    # Delete custom salon service hides it from menu
    assert c.delete(f'/api/v1/partners/salon/services/{svc_id}', headers=headers(2, 'salon_owner')).status_code == 200
    assert c.get('/api/v1/partners/salon/services', headers=headers(2, 'salon_owner')).json() == []
    assert c.get('/api/v1/salons/l1').json()['menu_services'] == []


def test_professional_custom_service_crud_and_catalog(client):
    c = client

    res = c.post('/api/v1/partners/professional/services/custom', headers=headers(4, 'professional'), json={
        'name': 'Bridal Airbrush HD',
        'category': 'Makeup',
        'price': 5500,
        'duration': '120 min',
        'audience': 'women',
        'cities': 'Mumbai, Bengaluru',
        'desc': 'Long-wear luxury bridal finish.',
    })
    assert res.status_code == 200
    svc = res.json()
    svc_id = svc['id']
    assert svc['is_custom'] is True
    assert svc['professional_id'] == 10

    # Included in partner's offered services & public at-home services with specialist attribution
    my_list = c.get('/api/v1/partners/professional/services', headers=headers(4, 'professional')).json()
    assert any(s['id'] == svc_id and s['is_custom'] is True for s in my_list)

    public_list = c.get('/api/v1/catalog/services?city=Bengaluru&audience=women').json()
    matched = next((s for s in public_list if s['id'] == svc_id), None)
    assert matched is not None
    assert matched['price'] == 5500
    assert matched['professional_name'] == 'Pro One'

    # Other professional cannot modify it
    assert c.put(f'/api/v1/partners/professional/services/custom/{svc_id}', headers=headers(5, 'professional'), json={'price': 999}).status_code == 403

    # Owner professional can edit price
    upd = c.put(f'/api/v1/partners/professional/services/custom/{svc_id}', headers=headers(4, 'professional'), json={'price': 5900})
    assert upd.status_code == 200
    assert upd.json()['price'] == 5900

    # Delete custom service removes it from both partner menu and public at-home catalog
    assert c.delete(f'/api/v1/partners/professional/services/{svc_id}', headers=headers(4, 'professional')).status_code == 200
    assert c.get('/api/v1/partners/professional/services', headers=headers(4, 'professional')).json() == []
    assert not any(s['id'] == svc_id for s in c.get('/api/v1/services/').json())
