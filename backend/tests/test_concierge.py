from contextlib import asynccontextmanager
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.main import app
from backend.app.core.database import Base, get_db
from backend.app.models.catalog import Salon, Service


@pytest.fixture
def client(monkeypatch):
    engine = create_engine('sqlite://', connect_args={'check_same_thread': False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, expire_on_commit=False)
    db = factory()
    db.add_all([
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
    ])
    db.commit()

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


def test_concierge_facial_and_audience_hair(client):
    facial = client.post('/api/v1/concierge/chat', json={
        'message': 'Recommend a facial for glowing skin',
        'location': 'Bandra West, Mumbai',
        'audience': 'women',
    })
    assert facial.status_code == 200
    facial_body = facial.json()
    assert 'The Signature Facial' in facial_body['reply']
    assert any(a['action'] == 'book-home' and a['id'] == 's1' for a in facial_body['actions'])

    women_hair = client.post('/api/v1/concierge/chat', json={
        'message': 'Tell me about at-home hair styling',
        'audience': 'women',
    })
    assert women_hair.status_code == 200
    assert 'Express Hair Styling' in women_hair.json()['reply']

    men_hair = client.post('/api/v1/concierge/chat', json={
        'message': 'Need a beard trim and haircut',
        'audience': 'men',
    })
    assert men_hair.status_code == 200
    men_body = men_hair.json()
    assert 'Precision Haircut & Beard' in men_body['reply']
    assert any(a['action'] == 'book-home' and a['id'] == 'ms1' for a in men_body['actions'])


def test_concierge_hygiene_whatsapp_and_validation(client):
    hygiene = client.post('/api/v1/concierge/chat', json={
        'message': 'How do at-home appointments work?',
    })
    assert hygiene.status_code == 200
    hygiene_body = hygiene.json()
    assert '60 seconds' in hygiene_body['reply']
    assert any(a['action'] == 'scroll' and a['target'] == 'popular' for a in hygiene_body['actions'])

    wa = client.post('/api/v1/concierge/chat', json={
        'message': 'Can I talk to support on whatsapp?',
    })
    assert wa.status_code == 200
    assert any((a.get('url') or '').startswith('https://wa.me/') for a in wa.json()['actions'])

    empty = client.post('/api/v1/concierge/chat', json={'message': ''})
    assert empty.status_code == 422
