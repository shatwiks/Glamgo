from contextlib import asynccontextmanager
import io
import json
import urllib.error
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.main import app
from backend.app.core.database import Base, get_db, ensure_phase13_schema_columns
from backend.app.core.security import create_access_token
from backend.app.models.booking import Booking, BookingStatus
from backend.app.models.catalog import Product, Salon, Service
from backend.app.models.user import User, UserRole
from backend.app.services import ai_concierge_service


@pytest.fixture
def client(monkeypatch):
    engine = create_engine('sqlite://', connect_args={'check_same_thread': False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    ensure_phase13_schema_columns(engine)
    factory = sessionmaker(bind=engine, expire_on_commit=False)
    db = factory()
    db.add_all([
        User(id=1, email='cust@test.invalid', full_name='Aanya Mehta', hashed_password='x', role=UserRole.CUSTOMER, is_active=True),
        Service(
            id='s1',
            audience='women',
            name='The Signature Facial',
            category='Skin',
            price=1499,
            duration='75 min',
            rating=4.9,
            img='test',
            desc='Botanical cleanse and vitamin infusion.',
            is_active=True,
        ),
        Service(
            id='s2',
            audience='women',
            name='Express Hair Styling',
            category='Hair',
            price=899,
            duration='45 min',
            rating=4.8,
            img='test',
            desc='Salon blowout and polished curls at home.',
            is_active=True,
        ),
        Service(
            id='ms1',
            audience='men',
            name='Precision Haircut & Beard',
            category='Hair',
            price=699,
            duration='45 min',
            rating=4.9,
            img='test',
            desc='Tailored haircut and beard sculpting at home.',
            is_active=True,
        ),
        Salon(
            id='l1',
            audience='unisex',
            name='Atelier Bandra Studio',
            city='Mumbai',
            area='Bandra West, Mumbai',
            distance='1.2 km',
            rating=4.9,
            price=950,
            img='test',
            services_list='Hair,Skin',
            hours='9:00 AM - 9:00 PM',
            about='Luxury unisex studio.',
        ),
        Service(
            id='sl-l1-k1',
            audience='unisex',
            name='Silk Keratin Blowout',
            category='Hair',
            price=2350,
            duration='75 min',
            rating=4.9,
            img='test',
            desc='Smoothening blowout at Atelier.',
            salon_id='l1',
            is_active=True,
        ),
        Product(
            id='b1',
            audience='unisex',
            brand='LUMIERE',
            name='Daily Renewal Vitamin C Serum',
            category='Skincare',
            price=1299,
            old=1599,
            img='test',
            description='Brightening serum for radiant glass skin.',
            stock=25,
            is_active=True,
        ),
        Booking(
            id='BK-TEST1',
            customer_id=1,
            type='home',
            title='The Signature Facial',
            service_id='s1',
            professional='Nisha Kapoor',
            date='2026-12-01',
            time='10:30 AM',
            location='Mumbai',
            price=1499,
            status=BookingStatus.CONFIRMED,
            payment_status='completed',
            arrival_otp='4829',
        ),
    ])
    db.commit()

    monkeypatch.setattr(ai_concierge_service.settings, 'GEMINI_API_KEY', '')

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


def test_concierge_config(client):
    res = client.get('/api/v1/concierge/config')
    assert res.status_code == 200
    body = res.json()
    assert body['whatsapp_number']
    assert 'https://wa.me/' in body['whatsapp_url']


def test_concierge_fallback_facial_hair_products_and_bookings(client):
    facial = client.post('/api/v1/concierge/chat', json={
        'message': 'Recommend a facial for glowing skin',
        'location': 'Bandra West, Mumbai',
        'audience': 'women',
    })
    assert facial.status_code == 200
    facial_body = facial.json()
    assert facial_body['source'] == 'fallback'
    assert 'The Signature Facial' in facial_body['reply']
    assert any(a['action'] == 'book-home' and a['id'] == 's1' for a in facial_body['actions'])

    men_hair = client.post('/api/v1/concierge/chat', json={
        'message': 'Need a beard trim and haircut',
        'audience': 'men',
    })
    assert men_hair.status_code == 200
    assert 'Precision Haircut & Beard' in men_hair.json()['reply']

    shop = client.post('/api/v1/concierge/chat', json={
        'message': 'Recommend a serum from the store',
        'audience': 'women',
        'experience': 'shop',
    })
    assert shop.status_code == 200
    assert any(a['action'] == 'product-detail' and a['id'] == 'b1' for a in shop.json()['actions'])

    token = create_access_token(1, 'customer')
    bookings_res = client.post(
        '/api/v1/concierge/chat',
        headers={'Authorization': f'Bearer {token}'},
        json={'message': 'Check my latest booking and arrival PIN'},
    )
    assert bookings_res.status_code == 200
    assert '4829' in bookings_res.json()['reply']
    assert any(a['action'] == 'account-bookings' for a in bookings_res.json()['actions'])


def test_concierge_gemini_endpoint_routing_and_hallucination_guard(client, monkeypatch):
    assert ai_concierge_service.resolve_gemini_endpoint('AQ.abc123', 'gemini-3.1-flash-lite').startswith(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent'
    )
    assert ai_concierge_service.resolve_gemini_endpoint('AIzaSy123', 'gemini-3.1-flash-lite').startswith(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent'
    )

    monkeypatch.setattr(ai_concierge_service.settings, 'GEMINI_API_KEY', 'AQ.fake_test_key')

    captured = {'urls': []}

    class FakeHttpResp:
        def __init__(self, payload: dict):
            self._bytes = json.dumps(payload).encode('utf-8')
        def read(self):
            return self._bytes
        def __enter__(self):
            return self
        def __exit__(self, *args):
            return False

    def fake_urlopen(req, timeout=12):
        captured['urls'].append(req.full_url)
        captured['url'] = req.full_url
        captured['api_key'] = req.get_header('X-goog-api-key')
        captured['body'] = json.loads(req.data.decode('utf-8'))
        if len(captured['urls']) == 1:
            raise urllib.error.HTTPError(req.full_url, 503, 'Busy', {}, None)
        model_json = {
            'reply': 'Try **Silk Keratin Blowout** (₹2,350) at Atelier Bandra Studio or **Daily Renewal Vitamin C Serum** (₹1,299).',
            'actions': [
                {'label': 'Book Silk Keratin', 'action': 'book-salon', 'id': 'l1', 'service_id': 'sl-l1-k1'},
                {'label': 'Fake Service', 'action': 'book-home', 'id': 'hallucinated-id'},
                {'label': 'View Serum', 'action': 'product-detail', 'id': 'b1'},
                {'label': 'Bad Link', 'url': 'https://evil.invalid/phish'},
            ],
        }
        return FakeHttpResp({
            'candidates': [{'content': {'parts': [{'text': json.dumps(model_json)}]}}]
        })

    monkeypatch.setattr(ai_concierge_service.urllib.request, 'urlopen', fake_urlopen)

    res = client.post('/api/v1/concierge/chat', json={
        'message': 'What smoothing salon service and serum do you suggest?',
        'city': 'Mumbai',
        'audience': 'women',
        'experience': 'salon',
        'history': [{'role': 'user', 'text': 'Hi'}, {'role': 'ai', 'text': 'Welcome!'}],
    })
    assert res.status_code == 200
    body = res.json()
    assert body['source'] == 'gemini'
    assert len(captured['urls']) == 2
    assert 'gemini-3.1-flash-lite' in captured['urls'][0]
    assert 'gemini-3.5-flash-lite' in captured['urls'][1]
    assert captured['url'].startswith('https://generativelanguage.googleapis.com/')
    assert captured['api_key'] == 'AQ.fake_test_key'
    assert len(captured['body']['contents']) == 3

    action_ids = [(a.get('action'), a.get('id'), a.get('service_id')) for a in body['actions']]
    assert ('book-salon', 'l1', 'sl-l1-k1') in action_ids
    assert ('product-detail', 'b1', None) in action_ids
    assert not any(a.get('id') == 'hallucinated-id' for a in body['actions'])
    bad_link = next((a for a in body['actions'] if a.get('label') == 'Bad Link'), None)
    assert bad_link and bad_link['url'].startswith('https://wa.me/')


def test_concierge_graceful_fallback_on_gemini_failure_and_validation(client, monkeypatch):
    monkeypatch.setattr(ai_concierge_service.settings, 'GEMINI_API_KEY', 'AQ.broken')

    def boom(*args, **kwargs):
        raise RuntimeError('Network timeout')

    monkeypatch.setattr(ai_concierge_service.urllib.request, 'urlopen', boom)
    res = client.post('/api/v1/concierge/chat', json={'message': 'How do at-home appointments work?'})
    assert res.status_code == 200
    assert res.json()['source'] == 'fallback'
    assert '60 seconds' in res.json()['reply']

    empty = client.post('/api/v1/concierge/chat', json={'message': ''})
    assert empty.status_code == 422
