from contextlib import asynccontextmanager
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.main import app
from backend.app.core.database import Base, get_db, ensure_phase13_schema_columns
from backend.app.core.security import create_access_token
from backend.app.models.catalog import Service, Salon, Product
from backend.app.models.user import User, UserRole
from backend.app.services.cache_service import cache_service

@pytest.fixture
def client(monkeypatch):
    engine = create_engine('sqlite://', connect_args={'check_same_thread': False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, expire_on_commit=False)
    db = factory()
    db.add_all([
        User(id=1,email='admin@test.invalid',full_name='Admin',hashed_password='x',role=UserRole.ADMIN,is_active=True),
        User(id=2,email='seller@test.invalid',full_name='Seller',hashed_password='x',role=UserRole.SELLER,is_active=True),
        User(id=3,email='other@test.invalid',full_name='Other',hashed_password='x',role=UserRole.SELLER,is_active=True),
        User(id=4,email='salon@test.invalid',full_name='Owner',hashed_password='x',role=UserRole.SALON_OWNER,is_active=True),
        User(id=5,email='pro@test.invalid',full_name='Professional',hashed_password='x',role=UserRole.PROFESSIONAL,is_active=True),
        Service(id='s1',name='Test service',category='Skin',price=100,duration='30 min',img='test',desc='test'),
        Salon(id='l1',owner_id=4,name='Test salon',city='Mumbai',area='Mumbai',distance='',price=100,img='test',services_list='Skin',hours='9-5',about='test'),
        Product(id='p1',seller_id=2,brand='Test',name='Test product',category='Skin',price=100,img='test',description='test'),
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
        yield c, db
    app.dependency_overrides.clear()
    db.close()
    engine.dispose()


def headers(uid, role):
    return {'Authorization': 'Bearer ' + create_access_token(uid, role)}


def test_admin_classification_validation_and_catalogue_response(client):
    c, _ = client
    url = '/api/v1/admin/catalog/service/s1/audience'
    assert c.put(url, json={'audience':'men'}).status_code == 401
    assert c.put(url, headers=headers(2,'seller'), json={'audience':'men'}).status_code == 403
    assert c.put(url, headers=headers(1,'admin'), json={'audience':'bogus'}).status_code == 422
    assert c.put(url, headers=headers(1,'admin'), json={'audience':'men'}).status_code == 200
    items = c.get('/api/v1/catalog/services?city=Mumbai').json()
    assert items[0]['audience'] == 'men'


def test_seller_can_classify_only_owned_product(client):
    c, _ = client
    url = '/api/v1/partners/seller/products/p1'
    assert c.put(url, headers=headers(3,'seller'), json={'audience':'men'}).status_code == 403
    assert c.put(url, headers=headers(2,'seller'), json={'audience':'unisex'}).status_code == 200
    assert c.get('/api/v1/products/p1').json()['audience'] == 'unisex'


def test_salon_owner_updates_audience_and_catalogue(client):
    c, _ = client
    url = '/api/v1/partners/salon/profile'
    assert c.put(url, headers=headers(2,'seller'), json={'audience':'men'}).status_code == 403
    assert c.put(url, headers=headers(4,'salon_owner'), json={'audience':'men'}).status_code == 200
    rows = c.get('/api/v1/catalog/salons?city=Mumbai').json()
    assert rows[0]['audience'] == 'men'


def test_professional_can_set_profile_audience(client):
    c, _ = client
    r = c.put('/api/v1/partners/professional/profile', headers=headers(5,'professional'), json={'audience':'unisex'})
    assert r.status_code == 200
    assert r.json()['audience'] == 'unisex'
    assert c.get('/api/v1/catalog/professionals?city=Mumbai').json()[0]['audience'] == 'unisex'

def test_existing_catalogue_rows_migrate_without_guessing():
    from sqlalchemy import text
    engine = create_engine('sqlite://')
    with engine.begin() as conn:
        for table in ('services', 'salons', 'products', 'professional_profiles'):
            conn.execute(text(f'CREATE TABLE {table} (id INTEGER PRIMARY KEY)'))
            conn.execute(text(f'INSERT INTO {table} (id) VALUES (1)'))
    ensure_phase13_schema_columns(engine)
    with engine.connect() as conn:
        for table in ('services', 'salons', 'products', 'professional_profiles'):
            assert conn.execute(text(f'SELECT audience FROM {table}')).scalar() == 'unspecified'
    assert ensure_phase13_schema_columns(engine) == []
    engine.dispose()
