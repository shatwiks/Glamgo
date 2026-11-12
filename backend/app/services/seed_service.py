from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.app.core.security import hash_password
from backend.app.models.user import User, UserRole, Address, Notification
from backend.app.models.catalog import (
    Service, ProfessionalProfile, Salon, SalonStaff, Product, ProductVariant,
    Availability
)
from backend.app.models.order import Coupon

HOME_IMG = './assets/home-editorial.webp'
SALON_IMG = './assets/salon-editorial.webp'
SHOP_IMG = './assets/shop-editorial.webp'

photo = lambda pid, w=900: f"https://images.unsplash.com/{pid}?auto=format&fit=crop&w={w}&q=85"

SERVICES_DATA = [
    {"id": "s1", "name": "The Signature Facial", "category": "Skin", "price": 1499.0, "duration": "75 min", "rating": 4.9, "reviews": 126, "img": photo("photo-1570172619644-dfd03ed5d881"), "desc": "A restorative cleanse, massage and glow treatment tailored to your skin."},
    {"id": "s2", "name": "Express Hair Styling", "category": "Hair", "price": 899.0, "duration": "45 min", "rating": 4.8, "reviews": 98, "img": photo("photo-1562322140-8baeececf3df"), "desc": "A polished blowout and styling session for every occasion."},
    {"id": "s3", "name": "Classic Manicure", "category": "Nails", "price": 699.0, "duration": "50 min", "rating": 4.9, "reviews": 84, "img": photo("photo-1604654894610-df63bc536371"), "desc": "Nail shaping, cuticle care, hand massage and a flawless finish."},
    {"id": "s4", "name": "Occasion Makeup", "category": "Makeup", "price": 2499.0, "duration": "90 min", "rating": 4.9, "reviews": 112, "img": photo("photo-1522335789203-aabd1fc54bc9"), "desc": "A look made for you, from soft radiance to evening glamour."},
    {"id": "s5", "name": "Relax & Restore Massage", "category": "Spa", "price": 1799.0, "duration": "60 min", "rating": 4.8, "reviews": 71, "img": photo("photo-1540555700478-4be289fbecef"), "desc": "A calm, deeply relaxing ritual in the comfort of your home."},
    {"id": "s6", "name": "Smooth Finish Waxing", "category": "Waxing", "price": 599.0, "duration": "40 min", "rating": 4.8, "reviews": 63, "img": photo("photo-1570172619644-dfd03ed5d881"), "desc": "Gentle, professional waxing with quality products and careful technique."},
    {"id": "s7", "name": "Brow & Threading Edit", "category": "Threading", "price": 299.0, "duration": "25 min", "rating": 4.9, "reviews": 103, "img": photo("photo-1522335789203-aabd1fc54bc9"), "desc": "Precise brow shaping and threading for a beautifully defined finish."},
    {"id": "s8", "name": "The Complete Glow", "category": "Packages", "price": 3299.0, "duration": "150 min", "rating": 4.9, "reviews": 56, "img": photo("photo-1540555700478-4be289fbecef"), "desc": "Facial, manicure and hair styling in one considered package."}
]

PROFESSIONALS_DATA = [
    {"id": 1, "name": "Nisha Kapoor", "experience": "8 years of experience", "rating": 4.9, "reviews": 212, "price": 699.0, "img": photo("photo-1559839734-2b71ea197ec2", 500), "specialty": "Skin & makeup"},
    {"id": 2, "name": "Riya Malhotra", "experience": "6 years of experience", "rating": 4.9, "reviews": 186, "price": 599.0, "img": photo("photo-1534528741775-53994a69daeb", 500), "specialty": "Hair & styling"},
    {"id": 3, "name": "Meera Shah", "experience": "10 years of experience", "rating": 4.8, "reviews": 241, "price": 799.0, "img": photo("photo-1580489944761-15a19d654956", 500), "specialty": "Spa & wellness"}
]

SALONS_DATA = [
    {
        "id": "l1", "name": "The Ivory Room", "area": "Bandra West, Mumbai", "distance": "1.8 km away",
        "rating": 4.9, "reviews": 312, "price": 800.0, "img": SALON_IMG, "tag": "Most loved",
        "services_list": "Hair,Skin,Nails", "hours": "10:00 AM – 8:00 PM",
        "about": "A quiet, contemporary salon where considered care meets effortless style.",
        "staff": [
            {"name": "Nisha Kapoor", "specialty": "Skin & makeup", "img": photo("photo-1559839734-2b71ea197ec2", 500)},
            {"name": "Riya Malhotra", "specialty": "Hair & styling", "img": photo("photo-1534528741775-53994a69daeb", 500)}
        ]
    },
    {
        "id": "l2", "name": "Atelier Beauty House", "area": "Juhu, Mumbai", "distance": "3.2 km away",
        "rating": 4.8, "reviews": 204, "price": 650.0, "img": photo("photo-1560066984-138dadb4c035"), "tag": "Popular",
        "services_list": "Hair,Makeup,Spa", "hours": "9:30 AM – 8:30 PM",
        "about": "A warm, creative space for personal beauty rituals and expert styling.",
        "staff": [
            {"name": "Meera Shah", "specialty": "Spa & wellness", "img": photo("photo-1580489944761-15a19d654956", 500)}
        ]
    },
    {
        "id": "l3", "name": "Maison de Glow", "area": "Khar West, Mumbai", "distance": "2.4 km away",
        "rating": 4.9, "reviews": 178, "price": 900.0, "img": photo("photo-1521590832167-7bcbfaa6381f"), "tag": "New to GlamGo",
        "services_list": "Skin,Nails,Spa", "hours": "10:00 AM – 7:30 PM",
        "about": "Skin and wellness treatments in a calming neighbourhood retreat.",
        "staff": [
            {"name": "Nisha Kapoor", "specialty": "Skin & makeup", "img": photo("photo-1559839734-2b71ea197ec2", 500)}
        ]
    }
]

PRODUCTS_DATA = [
    {
        "id": "b1", "brand": "LUMIÈRE", "name": "The Daily Renewal Serum", "category": "Skincare",
        "price": 1890.0, "old": 2290.0, "rating": 4.9, "reviews": 86, "img": "./assets/serum.webp",
        "tag": "BESTSELLER", "description": "A lightweight daily serum for skin that feels hydrated and quietly radiant.",
        "ingredients": "Niacinamide, hyaluronic acid, glycerin", "variants": ["30 ml", "50 ml"]
    },
    {
        "id": "b2", "brand": "THE BOTANIST", "name": "Barrier Repair Moisturiser", "category": "Skincare",
        "price": 1490.0, "old": 0.0, "rating": 4.8, "reviews": 67, "img": "./assets/moisturiser.webp",
        "tag": "NEW", "description": "Comforting everyday moisture with a soft, non-greasy finish.",
        "ingredients": "Ceramides, squalane, oat extract", "variants": ["50 ml", "100 ml"]
    },
    {
        "id": "b3", "brand": "VELVET FORM", "name": "Satin Colour Lipstick", "category": "Makeup",
        "price": 990.0, "old": 1290.0, "rating": 4.8, "reviews": 124, "img": "./assets/lipstick.webp",
        "tag": "TRENDING", "description": "Rich colour and a smooth satin feel that lasts beautifully.",
        "ingredients": "Jojoba oil, vitamin E, colour pigments", "variants": ["Rosewood", "Soft Nude", "Deep Berry"]
    },
    {
        "id": "b4", "brand": "NOURISH & CO.", "name": "Restorative Hair Oil", "category": "Haircare",
        "price": 1190.0, "old": 0.0, "rating": 4.7, "reviews": 42, "img": "./assets/hair-oil.webp",
        "tag": "", "description": "A pre-wash ritual to nourish lengths and leave hair feeling softer.",
        "ingredients": "Argan oil, almond oil, rosemary", "variants": ["100 ml", "200 ml"]
    },
    {
        "id": "b5", "brand": "MAISON CALME", "name": "Linen & Neroli Eau de Parfum", "category": "Fragrance",
        "price": 3490.0, "old": 0.0, "rating": 4.9, "reviews": 31, "img": "./assets/fragrance.webp",
        "tag": "NEW", "description": "A delicate, airy fragrance with a warm, lasting trail.",
        "ingredients": "Neroli, white musk, cedarwood", "variants": ["30 ml", "75 ml"]
    },
    {
        "id": "b6", "brand": "STUDIO EDIT", "name": "The Everyday Brush Set", "category": "Beauty Tools",
        "price": 1790.0, "old": 2190.0, "rating": 4.8, "reviews": 59, "img": "./assets/brushes.webp",
        "tag": "", "description": "Five thoughtfully chosen brushes for an easy, polished routine.",
        "ingredients": "Soft synthetic bristles, wooden handles", "variants": ["5 piece set"]
    },
    {
        "id": "b7", "brand": "THE BOTANIST", "name": "Soft Skin Body Cream", "category": "Body Care",
        "price": 1290.0, "old": 0.0, "rating": 4.8, "reviews": 38, "img": "./assets/moisturiser.webp",
        "tag": "", "description": "A rich daily body cream that leaves skin comfortable and softly scented.",
        "ingredients": "Shea butter, oat extract, glycerin", "variants": ["200 ml", "400 ml"]
    }
]


def seed_database(db: Session):
    # 1. Seed Users
    users_to_seed = [
        {"email": "admin@glamgo.com", "name": "GlamGo Admin", "phone": "99999 00000", "role": UserRole.ADMIN, "pwd": "Admin@123456"},
        {"email": "aanya@example.com", "name": "Aanya Mehta", "phone": "98765 43210", "role": UserRole.CUSTOMER, "pwd": "Password@123"},
        {"email": "nisha@glamgo.com", "name": "Nisha Kapoor", "phone": "98765 11111", "role": UserRole.PROFESSIONAL, "pwd": "Pro@123456"},
        {"email": "salon@glamgo.com", "name": "The Ivory Room Owner", "phone": "98765 22222", "role": UserRole.SALON_OWNER, "pwd": "Salon@123456"},
        {"email": "seller@glamgo.com", "name": "Lumière Brand Manager", "phone": "98765 33333", "role": UserRole.SELLER, "pwd": "Seller@123456"},
    ]

    created_users = {}
    for u in users_to_seed:
        user = db.query(User).filter(User.email == u["email"]).first()
        if not user:
            user = User(
                email=u["email"],
                full_name=u["name"],
                phone=u["phone"],
                role=u["role"],
                hashed_password=hash_password(u["pwd"]),
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        created_users[u["email"]] = user

    # Seed Address for Aanya Mehta
    aanya = created_users.get("aanya@example.com")
    if aanya:
        addr = db.query(Address).filter(Address.user_id == aanya.id).first()
        if not addr:
            addr = Address(
                user_id=aanya.id,
                label="Home",
                text="24 Sea View Road, Bandra West, Mumbai 400050",
                city="Mumbai",
                is_default=True
            )
            db.add(addr)
            db.commit()

    # 2. Seed Services
    for s_data in SERVICES_DATA:
        service = db.query(Service).filter(Service.id == s_data["id"]).first()
        if not service:
            service = Service(**s_data)
            db.add(service)
    db.commit()

    # 3. Seed Professionals
    pro_user = created_users.get("nisha@glamgo.com")
    for p_data in PROFESSIONALS_DATA:
        pro = db.query(ProfessionalProfile).filter(ProfessionalProfile.id == p_data["id"]).first()
        if not pro:
            pro = ProfessionalProfile(
                id=p_data["id"],
                user_id=pro_user.id if p_data["id"] == 1 and pro_user else None,
                name=p_data["name"],
                experience=p_data["experience"],
                rating=p_data["rating"],
                reviews=p_data["reviews"],
                price=p_data["price"],
                img=p_data["img"],
                specialty=p_data["specialty"],
                is_verified=True
            )
            db.add(pro)
    db.commit()

    # 4. Seed Salons
    salon_owner = created_users.get("salon@glamgo.com")
    for s_data in SALONS_DATA:
        salon = db.query(Salon).filter(Salon.id == s_data["id"]).first()
        if not salon:
            salon = Salon(
                id=s_data["id"],
                owner_id=salon_owner.id if s_data["id"] == "l1" and salon_owner else None,
                name=s_data["name"],
                area=s_data["area"],
                distance=s_data["distance"],
                rating=s_data["rating"],
                reviews=s_data["reviews"],
                price=s_data["price"],
                img=s_data["img"],
                tag=s_data["tag"],
                services_list=s_data["services_list"],
                hours=s_data["hours"],
                about=s_data["about"]
            )
            db.add(salon)
            db.commit()
            
            for st in s_data.get("staff", []):
                staff_member = SalonStaff(
                    salon_id=salon.id,
                    name=st["name"],
                    specialty=st["specialty"],
                    img=st.get("img")
                )
                db.add(staff_member)
            db.commit()

    # 5. Seed Products & Variants
    seller_user = created_users.get("seller@glamgo.com")
    for p_data in PRODUCTS_DATA:
        product = db.query(Product).filter(Product.id == p_data["id"]).first()
        if not product:
            product = Product(
                id=p_data["id"],
                seller_id=seller_user.id if seller_user else None,
                brand=p_data["brand"],
                name=p_data["name"],
                category=p_data["category"],
                price=p_data["price"],
                old=p_data["old"],
                rating=p_data["rating"],
                reviews=p_data["reviews"],
                img=p_data["img"],
                tag=p_data["tag"],
                description=p_data["description"],
                ingredients=p_data["ingredients"],
                stock=100,
                is_active=True
            )
            db.add(product)
            db.commit()

            for v in p_data.get("variants", []):
                var = ProductVariant(
                    product_id=product.id,
                    name=v,
                    stock=50
                )
                db.add(var)
            db.commit()

    # 6. Seed Default Coupon
    coupon = db.query(Coupon).filter(Coupon.code == "GLAM10").first()
    if not coupon:
        coupon = Coupon(
            code="GLAM10",
            discount_percent=10.0,
            max_discount=300.0,
            is_active=True
        )
        db.add(coupon)
        db.commit()

    # 7. Seed Default Availabilities for Professional & Salon
    if pro_user:
        for day in ["Mon", "Tue", "Wed", "Thu", "Fri"]:
            exists = db.query(Availability).filter(Availability.user_id == pro_user.id, Availability.day == day).first()
            if not exists:
                db.add(Availability(user_id=pro_user.id, day=day, is_available=True))
        db.commit()

    # 8. Reset PostgreSQL sequences for tables seeded with explicit IDs
    if db.bind and db.bind.dialect.name == "postgresql":
        for table in ["users", "professional_profiles", "salon_staff", "product_variants", "availabilities"]:
            try:
                db.execute(text(f"SELECT setval('{table}_id_seq', (SELECT COALESCE(MAX(id), 1) FROM {table}));"))
            except Exception:
                pass
        db.commit()


if __name__ == "__main__":
    from backend.app.core.database import SessionLocal
    db = SessionLocal()
    try:
        seed_database(db)
        print("GlamGo database seeded successfully!")
    finally:
        db.close()
