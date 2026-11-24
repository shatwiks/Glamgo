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
    {"id": "s1", "name": "The Signature Facial", "category": "Skin", "price": 1499.0, "duration": "75 min", "rating": 4.9, "reviews": 126, "service_cities": "Mumbai,Bengaluru,Delhi", "img": photo("photo-1570172619644-dfd03ed5d881"), "desc": "A restorative cleanse, massage and glow treatment tailored to your skin.", "audience": "women"},
    {"id": "s2", "name": "Express Hair Styling", "category": "Hair", "price": 899.0, "duration": "45 min", "rating": 4.8, "reviews": 98, "service_cities": "Mumbai,Bengaluru,Delhi", "img": photo("photo-1562322140-8baeececf3df"), "desc": "A polished blowout and styling session for every occasion.", "audience": "women"},
    {"id": "s3", "name": "Classic Manicure", "category": "Nails", "price": 699.0, "duration": "50 min", "rating": 4.9, "reviews": 84, "service_cities": "Mumbai,Bengaluru,Delhi", "img": photo("photo-1604654894610-df63bc536371"), "desc": "Nail shaping, cuticle care, hand massage and a flawless finish.", "audience": "women"},
    {"id": "s4", "name": "Occasion Makeup", "category": "Makeup", "price": 2499.0, "duration": "90 min", "rating": 4.9, "reviews": 112, "service_cities": "Mumbai,Bengaluru,Delhi", "img": photo("photo-1522335789203-aabd1fc54bc9"), "desc": "A look made for you, from soft radiance to evening glamour.", "audience": "women"},
    {"id": "s5", "name": "Relax & Restore Massage", "category": "Spa", "price": 1799.0, "duration": "60 min", "rating": 4.8, "reviews": 71, "service_cities": "Mumbai,Bengaluru", "img": photo("photo-1540555700478-4be289fbecef"), "desc": "A calm, deeply relaxing ritual in the comfort of your home.", "audience": "unisex"},
    {"id": "s6", "name": "Smooth Finish Waxing", "category": "Waxing", "price": 599.0, "duration": "40 min", "rating": 4.8, "reviews": 63, "service_cities": "Mumbai,Bengaluru,Delhi", "img": photo("photo-1570172619644-dfd03ed5d881"), "desc": "Gentle, professional waxing with quality products and careful technique.", "audience": "women"},
    {"id": "s7", "name": "Brow & Threading Edit", "category": "Threading", "price": 299.0, "duration": "25 min", "rating": 4.9, "reviews": 103, "service_cities": "Mumbai,Delhi", "img": photo("photo-1522335789203-aabd1fc54bc9"), "desc": "Precise brow shaping and threading for a beautifully defined finish.", "audience": "women"},
    {"id": "s8", "name": "The Complete Glow", "category": "Packages", "price": 3299.0, "duration": "150 min", "rating": 4.9, "reviews": 56, "service_cities": "Mumbai,Bengaluru,Delhi", "img": photo("photo-1540555700478-4be289fbecef"), "desc": "Facial, manicure and hair styling in one considered package.", "audience": "women"},
    {"id": "s9", "name": "Botanical De-Tan & Glass Skin", "category": "Skin", "price": 1699.0, "duration": "65 min", "rating": 4.9, "reviews": 88, "service_cities": "Bengaluru", "img": photo("photo-1552693673-1bf958298935"), "desc": "Bengaluru-exclusive niacinamide enzyme peel, cryo roller lymphatic drainage, and peptide sheet mask.", "audience": "women"},
    {"id": "ms1", "name": "Swedish Full Body Massage for Men", "category": "Spa", "price": 1899.0, "duration": "60 min", "rating": 4.9, "reviews": 142, "service_cities": "Mumbai,Bengaluru,Delhi", "img": "./assets/men-service-massage.webp", "desc": "Beat fatigue before it beats you. Deep pressure rhythmic strokes and warm aromatherapy oil to release severe tension and revive tired muscles.", "audience": "men"},
    {"id": "ms2", "name": "Signature Beard Sculpt & Hot Towel", "category": "Hair", "price": 699.0, "duration": "40 min", "rating": 4.9, "reviews": 118, "service_cities": "Mumbai,Bengaluru,Delhi", "img": "./assets/men-service-beard.webp", "desc": "Precision razor fade line-up, steam conditioning, hot towel treatment, and botanical beard serum.", "audience": "men"},
    {"id": "ms3", "name": "Men's Precision Cut & Matte Finish", "category": "Hair", "price": 799.0, "duration": "45 min", "rating": 4.8, "reviews": 96, "service_cities": "Mumbai,Bengaluru,Delhi", "img": "./assets/men-service-hair.webp", "desc": "Scissor-over-comb precision haircut, scalp wash, and natural clay styling.", "audience": "men"},
    {"id": "ms4", "name": "Men's HydraGlo Detox Facial", "category": "Skin", "price": 1699.0, "duration": "60 min", "rating": 4.9, "reviews": 104, "service_cities": "Mumbai,Bengaluru,Delhi", "img": "./assets/men-service-facial.webp", "desc": "Triple active salicylic peel, blackhead extraction, cold-hammer pore tightening, and antioxidant infusion.", "audience": "men"},
    {"id": "ms5", "name": "Laser De-Tan & Skin Defense", "category": "Skin", "price": 1999.0, "duration": "50 min", "rating": 4.9, "reviews": 78, "service_cities": "Mumbai,Bengaluru,Delhi", "img": "./assets/men-skin.webp", "desc": "Targeted sun-damage reversal, hyperpigmentation correction, and clinical hydration for men's skin.", "audience": "men"},
    {"id": "ms6", "name": "Body Toning & Deep Tissue Recovery", "category": "Spa", "price": 2299.0, "duration": "75 min", "rating": 4.8, "reviews": 65, "service_cities": "Mumbai,Bengaluru,Delhi", "img": "./assets/men-massage.webp", "desc": "Focused muscular restoration with percussion therapy, herbal compression, and active cooling balms.", "audience": "men"},
    {"id": "ms7", "name": "Executive Grooming Ritual", "category": "Packages", "price": 3499.0, "duration": "120 min", "rating": 5.0, "reviews": 52, "service_cities": "Mumbai,Bengaluru,Delhi", "img": "./assets/men-home-editorial.webp", "desc": "Full haircut, beard sculpt, HydraGlo facial, and neck-shoulder de-stress massage in one comprehensive session.", "audience": "men"},
    {"id": "ms8", "name": "Active Charcoal Pedicure & Foot Reflexology", "category": "Spa", "price": 1199.0, "duration": "50 min", "rating": 4.8, "reviews": 41, "service_cities": "Mumbai,Bengaluru,Delhi", "img": "./assets/men-category-body.webp", "desc": "Charcoal soak, dead skin exfoliation, cuticle care, deep paraffin wrap, and acupressure foot massage.", "audience": "men"},
]

PROFESSIONALS_DATA = [
    {"id": 1, "name": "Nisha Kapoor", "city": "Mumbai", "area": "Bandra West, Mumbai", "lat": 19.0596, "lng": 72.8295, "experience": "8 years of experience", "rating": 4.9, "reviews": 212, "price": 699.0, "img": photo("photo-1559839734-2b71ea197ec2", 500), "specialty": "Skin & makeup", "audience": "women"},
    {"id": 2, "name": "Riya Malhotra", "city": "Mumbai", "area": "Juhu, Mumbai", "lat": 19.1075, "lng": 72.8263, "experience": "6 years of experience", "rating": 4.9, "reviews": 186, "price": 599.0, "img": photo("photo-1534528741775-53994a69daeb", 500), "specialty": "Hair & styling", "audience": "women"},
    {"id": 3, "name": "Meera Shah", "city": "Mumbai", "area": "Khar West, Mumbai", "lat": 19.0708, "lng": 72.8339, "experience": "10 years of experience", "rating": 4.8, "reviews": 241, "price": 799.0, "img": photo("photo-1580489944761-15a19d654956", 500), "specialty": "Spa & wellness", "audience": "unisex"},
    {"id": 101, "name": "Ananya Rao", "city": "Bengaluru", "area": "Indiranagar, Bengaluru", "lat": 12.9784, "lng": 77.6408, "experience": "7 years of experience", "rating": 4.9, "reviews": 194, "price": 749.0, "img": photo("photo-1573496359142-b8d87734a5a2", 500), "specialty": "Glass skin & bridal", "audience": "women"},
    {"id": 102, "name": "Kavya Menon", "city": "Bengaluru", "area": "Koramangala, Bengaluru", "lat": 12.9352, "lng": 77.6245, "experience": "6 years of experience", "rating": 4.9, "reviews": 167, "price": 649.0, "img": photo("photo-1544005313-94ddf0286df2", 500), "specialty": "Hair & editorial blowout", "audience": "women"},
    {"id": 103, "name": "Divya Nair", "city": "Bengaluru", "area": "HSR Layout, Bengaluru", "lat": 12.9121, "lng": 77.6446, "experience": "9 years of experience", "rating": 4.8, "reviews": 152, "price": 799.0, "img": photo("photo-1531746020798-e6953c6e8e04", 500), "specialty": "Botanical spa & nails", "audience": "unisex"},
    {"id": 104, "name": "Tara Verma", "city": "Delhi", "area": "Hauz Khas, South Delhi", "lat": 28.5494, "lng": 77.2001, "experience": "8 years of experience", "rating": 4.9, "reviews": 175, "price": 799.0, "img": photo("photo-1508214751196-bcfd4ca60f91", 500), "specialty": "Bridal & skin curation", "audience": "women"},
    {"id": 201, "name": "Arjun Mehta", "city": "Mumbai", "area": "Bandra West, Mumbai", "lat": 19.0600, "lng": 72.8300, "experience": "9 years of experience", "rating": 4.9, "reviews": 184, "price": 799.0, "img": "./assets/men-hair.webp", "specialty": "Men's precision cuts & beard styling", "audience": "men"},
    {"id": 202, "name": "Kabir Khan", "city": "Bengaluru", "area": "Indiranagar, Bengaluru", "lat": 12.9780, "lng": 77.6410, "experience": "8 years of experience", "rating": 4.9, "reviews": 156, "price": 849.0, "img": "./assets/men-massage.webp", "specialty": "Swedish deep tissue & sports recovery", "audience": "men"},
    {"id": 203, "name": "Dev Sharma", "city": "Delhi", "area": "Hauz Khas, South Delhi", "lat": 28.5490, "lng": 77.2005, "experience": "10 years of experience", "rating": 5.0, "reviews": 205, "price": 899.0, "img": "./assets/men-beard.webp", "specialty": "Master barber & facial therapist", "audience": "men"},
]

SALONS_DATA = [
    {
        "id": "l1", "name": "The Ivory Room", "city": "Mumbai", "area": "Bandra West, Mumbai", "lat": 19.0596, "lng": 72.8295, "distance": "1.8 km away",
        "rating": 4.9, "reviews": 312, "price": 800.0, "img": SALON_IMG, "tag": "Most loved",
        "services_list": "Hair,Skin,Nails", "hours": "10:00 AM – 8:00 PM",
        "about": "A quiet, contemporary salon where considered care meets effortless style.",
        "audience": "unisex",
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
        "audience": "women",
        "staff": [
            {"name": "Meera Shah", "specialty": "Spa & wellness", "img": photo("photo-1580489944761-15a19d654956", 500)}
        ]
    },
    {
        "id": "l3", "name": "Maison de Glow", "city": "Mumbai", "area": "Khar West, Mumbai", "lat": 19.0708, "lng": 72.8339, "distance": "2.4 km away",
        "rating": 4.9, "reviews": 178, "price": 900.0, "img": photo("photo-1521590832167-7bcbfaa6381f"), "tag": "New to GlamGo",
        "services_list": "Skin,Nails,Spa", "hours": "10:00 AM – 7:30 PM",
        "about": "Skin and wellness treatments in a calming neighbourhood retreat.",
        "audience": "women",
        "staff": [
            {"name": "Nisha Kapoor", "specialty": "Skin & makeup", "img": photo("photo-1559839734-2b71ea197ec2", 500)}
        ]
    },
    {
        "id": "l4", "name": "Velvet Lounge Studio", "city": "Mumbai", "area": "Powai, Mumbai", "lat": 19.1176, "lng": 72.9060, "distance": "11.6 km away",
        "rating": 4.8, "reviews": 146, "price": 850.0, "img": photo("photo-1522337360788-8b13dee7a37e"), "tag": "Lakeview Studio",
        "services_list": "Hair,Skin,Makeup,Spa", "hours": "10:00 AM – 8:30 PM",
        "about": "Powai flagship studio offering keratin rituals, bridal prep, and clinical facials.",
        "audience": "unisex",
        "staff": [
            {"name": "Riya Malhotra", "specialty": "Hair & styling", "img": photo("photo-1534528741775-53994a69daeb", 500)}
        ]
    },
    {
        "id": "l5", "name": "Saffron & Silk Atelier", "city": "Bengaluru", "area": "Indiranagar, Bengaluru", "lat": 12.9784, "lng": 77.6408, "distance": "1.6 km away",
        "rating": 4.9, "reviews": 268, "price": 850.0, "img": SALON_IMG, "tag": "Most loved",
        "services_list": "Hair,Skin,Nails,Makeup", "hours": "10:00 AM – 8:30 PM",
        "about": "A quiet luxury parlour on 100 Feet Road known for glass-skin facials and precision colour.",
        "audience": "women",
        "staff": [
            {"name": "Ananya Rao", "specialty": "Skin & glow facials", "img": photo("photo-1573496359142-b8d87734a5a2", 500)}
        ]
    },
    {
        "id": "l6", "name": "Kora Botanical Salon", "city": "Bengaluru", "area": "Koramangala, Bengaluru", "lat": 12.9352, "lng": 77.6245, "distance": "4.9 km away",
        "rating": 4.8, "reviews": 195, "price": 750.0, "img": photo("photo-1560066984-138dadb4c035"), "tag": "Popular",
        "services_list": "Hair,Nails,Spa", "hours": "9:30 AM – 8:00 PM",
        "about": "Plant-active botanical hair spas and gel nail suites in Koramangala 4th Block.",
        "audience": "women",
        "staff": [
            {"name": "Kavya Menon", "specialty": "Hair & blowout bar", "img": photo("photo-1544005313-94ddf0286df2", 500)}
        ]
    },
    {
        "id": "l7", "name": "The Whitefield Sanctuary", "city": "Bengaluru", "area": "Whitefield, Bengaluru", "lat": 12.9698, "lng": 77.7499, "distance": "11.8 km away",
        "rating": 4.9, "reviews": 154, "price": 950.0, "img": photo("photo-1521590832167-7bcbfaa6381f"), "tag": "Signature Spa",
        "services_list": "Skin,Spa,Makeup", "hours": "10:00 AM – 9:00 PM",
        "about": "Destination Ayurvedic & clinical spa suite serving East Bengaluru.",
        "audience": "unisex",
        "staff": [
            {"name": "Divya Nair", "specialty": "Spa & bridal styling", "img": photo("photo-1531746020798-e6953c6e8e04", 500)}
        ]
    },
    {
        "id": "l8", "name": "Lumen Hair & Beauty Loft", "city": "Bengaluru", "area": "Yelahanka, Bengaluru", "lat": 13.1007, "lng": 77.5963, "distance": "14.2 km away",
        "rating": 4.7, "reviews": 112, "price": 699.0, "img": photo("photo-1522337360788-8b13dee7a37e"), "tag": "North Bengaluru",
        "services_list": "Hair,Skin,Nails", "hours": "10:00 AM – 8:00 PM",
        "about": "Sunlit neighbourhood salon in North Bengaluru for express styling and dermal peels.",
        "audience": "women",
        "staff": [
            {"name": "Ananya Rao", "specialty": "Skin & glow facials", "img": photo("photo-1573496359142-b8d87734a5a2", 500)}
        ]
    },
    {
        "id": "l9", "name": "Haus of Radiance", "city": "Delhi", "area": "Hauz Khas, South Delhi", "lat": 28.5494, "lng": 77.2001, "distance": "2.1 km away",
        "rating": 4.9, "reviews": 229, "price": 999.0, "img": SALON_IMG, "tag": "South Delhi",
        "services_list": "Hair,Skin,Makeup,Spa", "hours": "10:00 AM – 8:30 PM",
        "about": "Editorial hair & bridal studio overlooking Hauz Khas enclave.",
        "audience": "women",
        "staff": [
            {"name": "Tara Verma", "specialty": "Editorial makeup & hair", "img": photo("photo-1508214751196-bcfd4ca60f91", 500)}
        ]
    },
    {
        "id": "ml1", "name": "The Grooming Room", "city": "Mumbai", "area": "Bandra West, Mumbai", "lat": 19.0585, "lng": 72.8310, "distance": "1.4 km away",
        "rating": 4.9, "reviews": 284, "price": 850.0, "img": "./assets/men-demo-salon-one.webp", "tag": "Top Rated Barber",
        "services_list": "Hair,Beard,Skin,Spa", "hours": "9:00 AM – 9:00 PM",
        "about": "Bespoke barbershop and men's wellness lounge featuring handcrafted leather chairs, hot towel shaves, and craft coffee.",
        "audience": "men",
        "staff": [
            {"name": "Arjun Mehta", "specialty": "Master Barber & Beard Architect", "img": "./assets/men-hair.webp"},
            {"name": "Rohan Seth", "specialty": "Scalp Therapy & Fade Specialist", "img": "./assets/men-beard.webp"}
        ]
    },
    {
        "id": "ml2", "name": "Apex Barber & Spa", "city": "Bengaluru", "area": "Indiranagar, Bengaluru", "lat": 12.9790, "lng": 77.6415, "distance": "1.9 km away",
        "rating": 4.9, "reviews": 196, "price": 900.0, "img": "./assets/men-demo-salon-two.webp", "tag": "Luxury Lounge",
        "services_list": "Hair,Beard,Skin,Spa", "hours": "9:30 AM – 9:00 PM",
        "about": "Contemporary grooming atelier offering Swedish full body therapy, cryo detox facials, and scissor haircuts.",
        "audience": "men",
        "staff": [
            {"name": "Kabir Khan", "specialty": "Deep Tissue & Sports Recovery", "img": "./assets/men-massage.webp"},
            {"name": "Vikram Sen", "specialty": "Executive Styling & Beard Sculpt", "img": "./assets/men-hair.webp"}
        ]
    },
    {
        "id": "ml3", "name": "Kingsman Men's Atelier", "city": "Delhi", "area": "Hauz Khas, South Delhi", "lat": 28.5480, "lng": 77.2010, "distance": "2.3 km away",
        "rating": 4.9, "reviews": 220, "price": 1100.0, "img": "./assets/men-demo-salon-three.webp", "tag": "Heritage Barbershop",
        "services_list": "Hair,Beard,Skin,Packages", "hours": "10:00 AM – 9:30 PM",
        "about": "Classic British-inspired barbershop and restorative spa suite serving discerning gentlemen in South Delhi.",
        "audience": "men",
        "staff": [
            {"name": "Dev Sharma", "specialty": "Traditional Razor & Dermal Grooming", "img": "./assets/men-beard.webp"}
        ]
    },
    {
        "id": "ml4", "name": "TrueGroom Flagship Studio", "city": "Mumbai", "area": "Juhu, Mumbai", "lat": 19.1060, "lng": 72.8270, "distance": "3.5 km away",
        "rating": 4.8, "reviews": 164, "price": 950.0, "img": "./assets/men-demo-salon-four.webp", "tag": "Executive Care",
        "services_list": "Hair,Beard,Spa", "hours": "10:00 AM – 8:30 PM",
        "about": "Premium men's grooming studio overlooking Juhu Tara Road, offering signature beard sculpting and anti-fatigue scalp rituals.",
        "audience": "men",
        "staff": [
            {"name": "Arjun Mehta", "specialty": "Precision Cut & Beard Care", "img": "./assets/men-hair.webp"}
        ]
    }
]

PRODUCTS_DATA = [
    {
        "id": "b1", "brand": "LUMIÈRE", "name": "The Daily Renewal Serum", "category": "Skincare",
        "price": 1890.0, "old": 2290.0, "rating": 4.9, "reviews": 86, "img": "./assets/serum.webp",
        "tag": "BESTSELLER", "description": "A lightweight daily serum for skin that feels hydrated and quietly radiant.",
        "ingredients": "Niacinamide, hyaluronic acid, glycerin", "variants": ["30 ml", "50 ml"],
        "audience": "unisex"
    },
    {
        "id": "b2", "brand": "THE BOTANIST", "name": "Barrier Repair Moisturiser", "category": "Skincare",
        "price": 1490.0, "old": 0.0, "rating": 4.8, "reviews": 67, "img": "./assets/moisturiser.webp",
        "tag": "NEW", "description": "Comforting everyday moisture with a soft, non-greasy finish.",
        "ingredients": "Ceramides, squalane, oat extract", "variants": ["50 ml", "100 ml"],
        "audience": "unisex"
    },
    {
        "id": "b3", "brand": "VELVET FORM", "name": "Satin Colour Lipstick", "category": "Makeup",
        "price": 990.0, "old": 1290.0, "rating": 4.8, "reviews": 124, "img": "./assets/lipstick.webp",
        "tag": "TRENDING", "description": "Rich colour and a smooth satin feel that lasts beautifully.",
        "ingredients": "Jojoba oil, vitamin E, colour pigments", "variants": ["Rosewood", "Soft Nude", "Deep Berry"],
        "audience": "women"
    },
    {
        "id": "b4", "brand": "NOURISH & CO.", "name": "Restorative Hair Oil", "category": "Haircare",
        "price": 1190.0, "old": 0.0, "rating": 4.7, "reviews": 42, "img": "./assets/hair-oil.webp",
        "tag": "", "description": "A pre-wash ritual to nourish lengths and leave hair feeling softer.",
        "ingredients": "Argan oil, almond oil, rosemary", "variants": ["100 ml", "200 ml"],
        "audience": "unisex"
    },
    {
        "id": "b5", "brand": "MAISON CALME", "name": "Linen & Neroli Eau de Parfum", "category": "Fragrance",
        "price": 3490.0, "old": 0.0, "rating": 4.9, "reviews": 31, "img": "./assets/fragrance.webp",
        "tag": "NEW", "description": "A delicate, airy fragrance with a warm, lasting trail.",
        "ingredients": "Neroli, white musk, cedarwood", "variants": ["30 ml", "75 ml"],
        "audience": "unisex"
    },
    {
        "id": "b6", "brand": "STUDIO EDIT", "name": "The Everyday Brush Set", "category": "Beauty Tools",
        "price": 1790.0, "old": 2190.0, "rating": 4.8, "reviews": 59, "img": "./assets/brushes.webp",
        "tag": "", "description": "Five thoughtfully chosen brushes for an easy, polished routine.",
        "ingredients": "Soft synthetic bristles, wooden handles", "variants": ["5 piece set"],
        "audience": "women"
    },
    {
        "id": "b7", "brand": "THE BOTANIST", "name": "Soft Skin Body Cream", "category": "Body Care",
        "price": 1290.0, "old": 0.0, "rating": 4.8, "reviews": 38, "img": "./assets/moisturiser.webp",
        "tag": "", "description": "A rich daily body cream that leaves skin comfortable and softly scented.",
        "ingredients": "Shea butter, oat extract, glycerin", "variants": ["200 ml", "400 ml"],
        "audience": "unisex"
    },
    {
        "id": "mb1", "brand": "ROYAL OAK", "name": "Cedarwood & Argan Beard Oil", "category": "Beard",
        "price": 799.0, "old": 999.0, "rating": 4.9, "reviews": 114, "img": "./assets/men-product-beard.webp",
        "tag": "BESTSELLER", "description": "Non-greasy cold-pressed argan, golden jojoba, and Virginia cedarwood to soften coarse whiskers and eliminate beard itch.",
        "ingredients": "Organic argan oil, jojoba seed oil, cedarwood essential oil, vitamin E", "variants": ["30 ml", "60 ml"],
        "audience": "men"
    },
    {
        "id": "mb2", "brand": "CARBON FORGE", "name": "Charcoal Detox Deep Cleanser", "category": "Skincare",
        "price": 649.0, "old": 799.0, "rating": 4.8, "reviews": 92, "img": "./assets/men-product-cleanser.webp",
        "tag": "TRENDING", "description": "Activated bamboo charcoal and tea tree oil to unclog congested pores, remove urban grime, and control excess shine without over-drying.",
        "ingredients": "Bamboo activated charcoal, tea tree leaf extract, salicylic acid, aloe vera", "variants": ["100 ml", "200 ml"],
        "audience": "men"
    },
    {
        "id": "mb3", "brand": "APEX GROOM", "name": "Matte Clay High Hold Hair Styler", "category": "Haircare",
        "price": 849.0, "old": 1050.0, "rating": 4.9, "reviews": 136, "img": "./assets/men-product-hair.webp",
        "tag": "TOP RATED", "description": "Natural bentonite clay providing ultra-matte texture, reworkable all-day hold, and zero greasy residue. Rinses cleanly with water.",
        "ingredients": "Bentonite clay, beeswax, kaolin, rosemary extract", "variants": ["75 g", "150 g"],
        "audience": "men"
    },
    {
        "id": "mb4", "brand": "NOBLE GENT", "name": "Invigorating Eucalyptus & Mint Body Wash", "category": "Body Care",
        "price": 699.0, "old": 899.0, "rating": 4.8, "reviews": 88, "img": "./assets/men-product-body.webp",
        "tag": "NEW", "description": "Sulfate-free cooling wash infused with real peppermint oil, eucalyptus leaf extract, and aloe vera for post-workout revival.",
        "ingredients": "Eucalyptus globulus oil, peppermint oil, aloe barbadensis leaf juice, decyl glucoside", "variants": ["250 ml", "500 ml"],
        "audience": "men"
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
        else:
            if "audience" in s_data:
                service.audience = s_data["audience"]
            if "name" in s_data:
                service.name = s_data["name"]
            if "img" in s_data:
                service.img = s_data["img"]
            if "desc" in s_data:
                service.desc = s_data["desc"]
            if "price" in s_data:
                service.price = s_data["price"]
            if not service.service_cities or (
                service.service_cities == "Mumbai,Bengaluru,Delhi"
                and s_data.get("service_cities") != "Mumbai,Bengaluru,Delhi"
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
                audience=p_data.get("audience", "unisex"),
                is_verified=True
            )
            db.add(pro)
        else:
            if "audience" in p_data:
                pro.audience = p_data["audience"]
            if "img" in p_data:
                pro.img = p_data["img"]
            if "specialty" in p_data:
                pro.specialty = p_data["specialty"]
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
                about=s_data["about"],
                audience=s_data.get("audience", "unisex")
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
            if "audience" in s_data:
                salon.audience = s_data["audience"]
                changed = True
            if "img" in s_data:
                salon.img = s_data["img"]
                changed = True
            if "services_list" in s_data:
                salon.services_list = s_data["services_list"]
                changed = True
            if "about" in s_data:
                salon.about = s_data["about"]
                changed = True
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
            if s_data.get("staff") and not salon.staff:
                for st in s_data["staff"]:
                    db.add(SalonStaff(salon_id=salon.id, name=st["name"], specialty=st["specialty"], img=st.get("img")))
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
                audience=p_data.get("audience", "unisex"),
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
        else:
            changed = False
            if "audience" in p_data:
                product.audience = p_data["audience"]
                changed = True
            if "img" in p_data:
                product.img = p_data["img"]
                changed = True
            if "description" in p_data:
                product.description = p_data["description"]
                changed = True
            if changed:
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
