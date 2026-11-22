from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.app.core.database import ensure_phase13_schema_columns
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
    {"id": "s1", "name": "The Signature Facial", "category": "Skin", "price": 1499.0, "duration": "75 min", "rating": 4.9, "reviews": 126, "service_cities": "Mumbai,Bengaluru,Delhi", "img": photo("photo-1570172619644-dfd03ed5d881"), "desc": "A restorative cleanse, massage and glow treatment tailored to your skin."},
    {"id": "s2", "name": "Express Hair Styling", "category": "Hair", "price": 899.0, "duration": "45 min", "rating": 4.8, "reviews": 98, "service_cities": "Mumbai,Bengaluru,Delhi", "img": photo("photo-1562322140-8baeececf3df"), "desc": "A polished blowout and styling session for every occasion."},
    {"id": "s3", "name": "Classic Manicure", "category": "Nails", "price": 699.0, "duration": "50 min", "rating": 4.9, "reviews": 84, "service_cities": "Mumbai,Bengaluru,Delhi", "img": photo("photo-1604654894610-df63bc536371"), "desc": "Nail shaping, cuticle care, hand massage and a flawless finish."},
    {"id": "s4", "name": "Occasion Makeup", "category": "Makeup", "price": 2499.0, "duration": "90 min", "rating": 4.9, "reviews": 112, "service_cities": "Mumbai,Bengaluru,Delhi", "img": photo("photo-1522335789203-aabd1fc54bc9"), "desc": "A look made for you, from soft radiance to evening glamour."},
    {"id": "s5", "name": "Relax & Restore Massage", "category": "Spa", "price": 1799.0, "duration": "60 min", "rating": 4.8, "reviews": 71, "service_cities": "Mumbai,Bengaluru", "img": photo("photo-1540555700478-4be289fbecef"), "desc": "A calm, deeply relaxing ritual in the comfort of your home."},
    {"id": "s6", "name": "Smooth Finish Waxing", "category": "Waxing", "price": 599.0, "duration": "40 min", "rating": 4.8, "reviews": 63, "service_cities": "Mumbai,Bengaluru,Delhi", "img": photo("photo-1570172619644-dfd03ed5d881"), "desc": "Gentle, professional waxing with quality products and careful technique."},
    {"id": "s7", "name": "Brow & Threading Edit", "category": "Threading", "price": 299.0, "duration": "25 min", "rating": 4.9, "reviews": 103, "service_cities": "Mumbai,Delhi", "img": photo("photo-1522335789203-aabd1fc54bc9"), "desc": "Precise brow shaping and threading for a beautifully defined finish."},
    {"id": "s8", "name": "The Complete Glow", "category": "Packages", "price": 3299.0, "duration": "150 min", "rating": 4.9, "reviews": 56, "service_cities": "Mumbai,Bengaluru,Delhi", "img": photo("photo-1540555700478-4be289fbecef"), "desc": "Facial, manicure and hair styling in one considered package."},
    {"id": "s9", "name": "Botanical De-Tan & Glass Skin", "category": "Skin", "price": 1699.0, "duration": "65 min", "rating": 4.9, "reviews": 88, "service_cities": "Bengaluru", "img": photo("photo-1552693673-1bf958298935"), "desc": "Bengaluru-exclusive niacinamide enzyme peel, cryo roller lymphatic drainage, and peptide sheet mask."}
]

PROFESSIONALS_DATA = [
    {"id": 1, "name": "Nisha Kapoor", "city": "Mumbai", "area": "Bandra West, Mumbai", "lat": 19.0596, "lng": 72.8295, "experience": "8 years of experience", "rating": 4.9, "reviews": 212, "price": 699.0, "img": photo("photo-1559839734-2b71ea197ec2", 500), "specialty": "Skin & makeup"},
    {"id": 2, "name": "Riya Malhotra", "city": "Mumbai", "area": "Juhu, Mumbai", "lat": 19.1075, "lng": 72.8263, "experience": "6 years of experience", "rating": 4.9, "reviews": 186, "price": 599.0, "img": photo("photo-1534528741775-53994a69daeb", 500), "specialty": "Hair & styling"},
    {"id": 3, "name": "Meera Shah", "city": "Mumbai", "area": "Khar West, Mumbai", "lat": 19.0708, "lng": 72.8339, "experience": "10 years of experience", "rating": 4.8, "reviews": 241, "price": 799.0, "img": photo("photo-1580489944761-15a19d654956", 500), "specialty": "Spa & wellness"},
    {"id": 101, "name": "Ananya Rao", "city": "Bengaluru", "area": "Indiranagar, Bengaluru", "lat": 12.9784, "lng": 77.6408, "experience": "7 years of experience", "rating": 4.9, "reviews": 194, "price": 749.0, "img": photo("photo-1573496359142-b8d87734a5a2", 500), "specialty": "Glass skin & bridal"},
    {"id": 102, "name": "Kavya Menon", "city": "Bengaluru", "area": "Koramangala, Bengaluru", "lat": 12.9352, "lng": 77.6245, "experience": "6 years of experience", "rating": 4.9, "reviews": 167, "price": 649.0, "img": photo("photo-1544005313-94ddf0286df2", 500), "specialty": "Hair & editorial blowout"},
    {"id": 103, "name": "Divya Nair", "city": "Bengaluru", "area": "HSR Layout, Bengaluru", "lat": 12.9121, "lng": 77.6446, "experience": "9 years of experience", "rating": 4.8, "reviews": 152, "price": 799.0, "img": photo("photo-1531746020798-e6953c6e8e04", 500), "specialty": "Botanical spa & nails"},
    {"id": 104, "name": "Tara Verma", "city": "Delhi", "area": "Hauz Khas, South Delhi", "lat": 28.5494, "lng": 77.2001, "experience": "8 years of experience", "rating": 4.9, "reviews": 175, "price": 799.0, "img": photo("photo-1508214751196-bcfd4ca60f91", 500), "specialty": "Bridal & skin curation"}
]

SALONS_DATA = [
    {
        "id": "l1", "name": "The Ivory Room", "city": "Mumbai", "area": "Bandra West, Mumbai", "lat": 19.0596, "lng": 72.8295, "distance": "1.8 km away",
        "rating": 4.9, "reviews": 312, "price": 800.0, "img": SALON_IMG, "tag": "Most loved",
        "services_list": "Hair,Skin,Nails", "hours": "10:00 AM – 8:00 PM",
        "about": "A quiet, contemporary salon where considered care meets effortless style.",
        "staff": [
            {"name": "Nisha Kapoor", "specialty": "Skin & makeup", "img": photo("photo-1559839734-2b71ea197ec2", 500)},
            {"name": "Riya Malhotra", "specialty": "Hair & styling", "img": photo("photo-1534528741775-53994a69daeb", 500)}
        ]
    },
    {
        "id": "l2", "name": "Atelier Beauty House", "city": "Mumbai", "area": "Juhu, Mumbai", "lat": 19.1075, "lng": 72.8263, "distance": "3.2 km away",
        "rating": 4.8, "reviews": 204, "price": 650.0, "img": photo("photo-1560066984-138dadb4c035"), "tag": "Popular",
        "services_list": "Hair,Makeup,Spa", "hours": "9:30 AM – 8:30 PM",
        "about": "A warm, creative space for personal beauty rituals and expert styling.",
        "staff": [
            {"name": "Meera Shah", "specialty": "Spa & wellness", "img": photo("photo-1580489944761-15a19d654956", 500)}
        ]
    },
    {
        "id": "l3", "name": "Maison de Glow", "city": "Mumbai", "area": "Khar West, Mumbai", "lat": 19.0708, "lng": 72.8339, "distance": "2.4 km away",
        "rating": 4.9, "reviews": 178, "price": 900.0, "img": photo("photo-1521590832167-7bcbfaa6381f"), "tag": "New to GlamGo",
        "services_list": "Skin,Nails,Spa", "hours": "10:00 AM – 7:30 PM",
        "about": "Skin and wellness treatments in a calming neighbourhood retreat.",
        "staff": [
            {"name": "Nisha Kapoor", "specialty": "Skin & makeup", "img": photo("photo-1559839734-2b71ea197ec2", 500)}
        ]
    },
    {
        "id": "l4", "name": "Velvet Lounge Studio", "city": "Mumbai", "area": "Powai, Mumbai", "lat": 19.1176, "lng": 72.9060, "distance": "11.6 km away",
        "rating": 4.8, "reviews": 146, "price": 850.0, "img": photo("photo-1522337360788-8b13dee7a37e"), "tag": "Lakeview Studio",
        "services_list": "Hair,Skin,Makeup,Spa", "hours": "10:00 AM – 8:30 PM",
        "about": "Powai flagship studio offering keratin rituals, bridal prep, and clinical facials.",
        "staff": [
            {"name": "Riya Malhotra", "specialty": "Hair & styling", "img": photo("photo-1534528741775-53994a69daeb", 500)}
        ]
    },
    {
        "id": "l5", "name": "Saffron & Silk Atelier", "city": "Bengaluru", "area": "Indiranagar, Bengaluru", "lat": 12.9784, "lng": 77.6408, "distance": "1.6 km away",
        "rating": 4.9, "reviews": 268, "price": 850.0, "img": SALON_IMG, "tag": "Most loved",
        "services_list": "Hair,Skin,Nails,Makeup", "hours": "10:00 AM – 8:30 PM",
        "about": "A quiet luxury parlour on 100 Feet Road known for glass-skin facials and precision colour.",
        "staff": [
            {"name": "Ananya Rao", "specialty": "Skin & glow facials", "img": photo("photo-1573496359142-b8d87734a5a2", 500)}
        ]
    },
    {
        "id": "l6", "name": "Kora Botanical Salon", "city": "Bengaluru", "area": "Koramangala, Bengaluru", "lat": 12.9352, "lng": 77.6245, "distance": "4.9 km away",
        "rating": 4.8, "reviews": 195, "price": 750.0, "img": photo("photo-1560066984-138dadb4c035"), "tag": "Popular",
        "services_list": "Hair,Nails,Spa", "hours": "9:30 AM – 8:00 PM",
        "about": "Plant-active botanical hair spas and gel nail suites in Koramangala 4th Block.",
        "staff": [
            {"name": "Kavya Menon", "specialty": "Hair & blowout bar", "img": photo("photo-1544005313-94ddf0286df2", 500)}
        ]
    },
    {
        "id": "l7", "name": "The Whitefield Sanctuary", "city": "Bengaluru", "area": "Whitefield, Bengaluru", "lat": 12.9698, "lng": 77.7499, "distance": "11.8 km away",
        "rating": 4.9, "reviews": 154, "price": 950.0, "img": photo("photo-1521590832167-7bcbfaa6381f"), "tag": "Signature Spa",
        "services_list": "Skin,Spa,Makeup", "hours": "10:00 AM – 9:00 PM",
        "about": "Destination Ayurvedic & clinical spa suite serving East Bengaluru.",
        "staff": [
            {"name": "Divya Nair", "specialty": "Spa & bridal styling", "img": photo("photo-1531746020798-e6953c6e8e04", 500)}
        ]
    },
    {
        "id": "l8", "name": "Lumen Hair & Beauty Loft", "city": "Bengaluru", "area": "Yelahanka, Bengaluru", "lat": 13.1007, "lng": 77.5963, "distance": "14.2 km away",
        "rating": 4.7, "reviews": 112, "price": 699.0, "img": photo("photo-1522337360788-8b13dee7a37e"), "tag": "North Bengaluru",
        "services_list": "Hair,Skin,Nails", "hours": "10:00 AM – 8:00 PM",
        "about": "Sunlit neighbourhood salon in North Bengaluru for express styling and dermal peels.",
        "staff": [
            {"name": "Ananya Rao", "specialty": "Skin & glow facials", "img": photo("photo-1573496359142-b8d87734a5a2", 500)}
        ]
    },
    {
        "id": "l9", "name": "Haus of Radiance", "city": "Delhi", "area": "Hauz Khas, South Delhi", "lat": 28.5494, "lng": 77.2001, "distance": "2.1 km away",
        "rating": 4.9, "reviews": 229, "price": 999.0, "img": SALON_IMG, "tag": "South Delhi",
        "services_list": "Hair,Skin,Makeup,Spa", "hours": "10:00 AM – 8:30 PM",
        "about": "Editorial hair & bridal studio overlooking Hauz Khas enclave.",
        "staff": [
            {"name": "Tara Verma", "specialty": "Editorial makeup & hair", "img": photo("photo-1508214751196-bcfd4ca60f91", 500)}
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
    ensure_phase13_schema_columns(db.get_bind())

    # 1. Seed Users
    users_to_seed = [
        {"email": "admin@glamgo.com", "name": "GlamGo Admin", "phone": "99999 00000", "role": UserRole.ADMIN, "pwd": "Admin@123456"},
        {"email": "aanya@example.com", "name": "Aanya Mehta", "phone": "98765 43210", "role": UserRole.CUSTOMER, "pwd": "Password@123"},
        {"email": "nisha@glamgo.com", "name": "Nisha Kapoor", "phone": "98765 11111", "role": UserRole.PROFESSIONAL, "pwd": "Pro@123456"},
        {"email": "salon@glamgo.com", "name": "The Ivory Room Owner", "phone": "98765 22222", "role": UserRole.SALON_OWNER, "pwd": "Salon@123456"},
        {"email": "atelier@glamgo.com", "name": "Atelier Beauty House Owner", "phone": "98765 22223", "role": UserRole.SALON_OWNER, "pwd": "Atelier@123456"},
        {"email": "maison@glamgo.com", "name": "Maison de Glow Owner", "phone": "98765 22224", "role": UserRole.SALON_OWNER, "pwd": "Maison@123456"},
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
        elif not service.service_cities or (
            service.service_cities == "Mumbai,Bengaluru,Delhi"
            and s_data["service_cities"] != "Mumbai,Bengaluru,Delhi"
        ):
            service.service_cities = s_data["service_cities"]
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
                city=p_data["city"],
                area=p_data["area"],
                lat=p_data["lat"],
                lng=p_data["lng"],
                experience=p_data["experience"],
                rating=p_data["rating"],
                reviews=p_data["reviews"],
                price=p_data["price"],
                img=p_data["img"],
                specialty=p_data["specialty"],
                is_verified=True
            )
            db.add(pro)
        else:
            if not pro.city or (pro.city == "Mumbai" and p_data["city"] != "Mumbai"):
                pro.city = p_data["city"]
            if not pro.area:
                pro.area = p_data["area"]
            if pro.lat is None:
                pro.lat = p_data["lat"]
            if pro.lng is None:
                pro.lng = p_data["lng"]
    db.commit()

    # 4. Seed Salons
    salon_owners = {
        "l1": created_users.get("salon@glamgo.com"),
        "l2": created_users.get("atelier@glamgo.com"),
        "l3": created_users.get("maison@glamgo.com"),
    }
    for s_data in SALONS_DATA:
        salon = db.query(Salon).filter(Salon.id == s_data["id"]).first()
        owner = salon_owners.get(s_data["id"])
        owner_id = owner.id if owner else None
        if not salon:
            salon = Salon(
                id=s_data["id"],
                owner_id=owner_id,
                name=s_data["name"],
                city=s_data["city"],
                area=s_data["area"],
                lat=s_data["lat"],
                lng=s_data["lng"],
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
        else:
            changed = False
            if not salon.owner_id and owner_id:
                salon.owner_id = owner_id
                changed = True
            if not salon.city or (salon.city == "Mumbai" and s_data["city"] != "Mumbai"):
                salon.city = s_data["city"]
                changed = True
            if salon.lat is None:
                salon.lat = s_data["lat"]
                changed = True
            if salon.lng is None:
                salon.lng = s_data["lng"]
                changed = True
            if changed:
                db.commit()

    # 5. Seed Products & Variants
    seller_user = created_users.get("seller@glamgo.com")
    for p_data in PRODUCTS_DATA:
        product = db.query(Product).filter(Product.id == p_data["id"]).first()
        if not product:
            v_names = p_data.get("variants", [])
            initial_prod_stock = (50 * len(v_names)) if v_names else 100
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
                stock=initial_prod_stock,
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
            db.refresh(product)
            from backend.app.services.commerce_service import CommerceService
            CommerceService.ensure_product_listings(db, product)
            CommerceService.sync_product_stock(db, product.id)
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

    try:
        from backend.app.services.cache_service import cache_service
        cache_service.invalidate_catalog()
    except Exception:
        pass


if __name__ == "__main__":
    from backend.app.core.database import SessionLocal
    db = SessionLocal()
    try:
        seed_database(db)
        print("GlamGo database seeded successfully!")
    finally:
        db.close()
