"""Booking payment state is tested using an isolated in-memory database."""
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.main import app
from backend.app.core.database import Base, get_db
from backend.app.core.security import hash_password
from backend.app.api.v1.payments import _apply_capture_in_tx
from backend.app.models.user import User, UserRole, BookingStatus
from backend.app.models.catalog import Service, ProfessionalProfile
from backend.app.models.booking import Booking
from backend.app.models.payment import PaymentTransaction


def test_booking_is_pending_until_payment_capture():
    engine = create_engine('sqlite://', connect_args={'check_same_thread': False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, expire_on_commit=False)
    db = Session()
    try:
        user = User(email='isolated@example.com', full_name='Test Customer', phone='1234567890',
                    role=UserRole.CUSTOMER, hashed_password=hash_password('TestPassword123!'), is_active=True)
        service = Service(id='test-service', name='Test Facial', category='Skin', price=100,
                          duration='60 min', img='/test.webp', desc='Test', service_cities='Mumbai')
        db.add_all([user, service])
        db.commit()
        app.dependency_overrides[get_db] = lambda: db
        client = TestClient(app)
        login = client.post('/api/v1/auth/login', json={'email': user.email, 'password': 'TestPassword123!'})
        assert login.status_code == 200, login.text
        headers = {'Authorization': 'Bearer ' + login.json()['access_token']}
        response = client.post('/api/v1/bookings/', headers=headers, json={
            'type':'home', 'service_id':'test-service', 'professional':'Any available expert',
            'date':'2099-12-01', 'time':'10:00 AM', 'location':'Test location',
            'idempotency_key':'isolated-booking-test',
        })
        assert response.status_code == 200, response.text
        result = response.json()
        assert result['status'] == 'pending'
        assert result['payment_status'] == 'pending'
        assert result['arrival_otp'] is None
        booking = db.query(Booking).filter_by(id=result['id']).one()
        partner = User(email='partner@example.com', full_name='Test Professional', phone='1234567891',
                       role=UserRole.PROFESSIONAL, hashed_password=hash_password('TestPassword123!'), is_active=True)
        db.add(partner)
        db.flush()
        profile = ProfessionalProfile(user_id=partner.id, name=partner.full_name, city='Mumbai',
                                      experience='5 years', price=100, img='/test.webp', specialty='Skin')
        db.add(profile)
        db.flush()
        booking.professional_id = profile.id
        db.commit()
        partner_login = client.post('/api/v1/auth/login', json={'email': partner.email, 'password': 'TestPassword123!'})
        partner_headers = {'Authorization': 'Bearer ' + partner_login.json()['access_token']}
        rejected = client.patch(f'/api/v1/partners/professional/bookings/{booking.id}/status',
                                headers=partner_headers, json={'status': 'completed'})
        assert rejected.status_code == 400
        db.refresh(booking)
        assert booking.status == BookingStatus.PENDING
        transaction = PaymentTransaction(user_id=user.id, booking_id=booking.id, amount=booking.price,
                                         razorpay_order_id='isolated_order', status='created')
        db.add(transaction)
        db.commit()
        cancellation = client.patch(f'/api/v1/bookings/{booking.id}/status', headers=headers, json={'status': 'cancelled'})
        assert cancellation.status_code == 409
        db.refresh(booking)
        assert booking.status == BookingStatus.PENDING
        _apply_capture_in_tx(db, transaction, 'isolated_payment', 'isolated_signature')
        db.commit()
        db.refresh(booking)
        assert booking.status == BookingStatus.CONFIRMED
        assert booking.payment_status == 'completed'
        assert len(booking.arrival_otp) == 4 and booking.arrival_otp.isdigit()
        old_pin = booking.arrival_otp
        _apply_capture_in_tx(db, transaction, 'isolated_payment', 'isolated_signature')
        db.commit()
        db.refresh(booking)
        assert booking.arrival_otp == old_pin
    finally:
        app.dependency_overrides.pop(get_db, None)
        db.close()
        engine.dispose()



def test_expiry_releases_only_unpaid_holds_without_payment_attempts():
    from datetime import datetime, timedelta, timezone
    from backend.app.services.booking_expiry import expire_unpaid_bookings
    from backend.app.models.user import Notification

    engine = create_engine('sqlite://', connect_args={'check_same_thread': False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine, expire_on_commit=False)()
    try:
        user = User(email='expiry@example.com', full_name='Expiry Test', phone='1234567890',
                    role=UserRole.CUSTOMER, hashed_password='not-used', is_active=True)
        service = Service(id='expiry-service', name='Facial', category='Skin', price=100,
                          duration='60 min', img='/test.webp', desc='Test', service_cities='Mumbai')
        db.add_all([user, service]); db.flush()
        now = datetime.now(timezone.utc)
        def make_booking(identifier, age, status=BookingStatus.PENDING, payment='pending'):
            return Booking(id=identifier, customer_id=user.id, type='home', title='Facial',
                           service_id=service.id, professional='Any available expert',
                           date='2099-12-01', time='10:00 AM', location='Test', price=100,
                           status=status, payment_status=payment, created_at=now-timedelta(minutes=age))
        db.add_all([make_booking('expired', 30), make_booking('fresh', 1),
                    make_booking('gateway', 30), make_booking('paid', 30, BookingStatus.CONFIRMED, 'completed')])
        db.flush()
        db.add(PaymentTransaction(user_id=user.id, booking_id='gateway', amount=100,
                                  razorpay_order_id='init_test', status='initiating'))
        db.commit()
        assert expire_unpaid_bookings(db, now=now, dry_run=True) == 1
        assert db.query(Booking).filter_by(id='expired').one().status == BookingStatus.PENDING
        assert expire_unpaid_bookings(db, now=now) == 1
        assert db.query(Booking).filter_by(id='expired').one().payment_status == 'expired'
        assert db.query(Booking).filter_by(id='gateway').one().status == BookingStatus.PENDING
        assert db.query(Booking).filter_by(id='fresh').one().status == BookingStatus.PENDING
        assert db.query(Booking).filter_by(id='paid').one().status == BookingStatus.CONFIRMED
        assert expire_unpaid_bookings(db, now=now) == 0
        assert db.query(Notification).filter(Notification.text.contains('expired')).count() == 1
    finally:
        db.close(); engine.dispose()
