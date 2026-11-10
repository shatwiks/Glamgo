from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.catalog import Product, ProductVariant
from backend.app.schemas.catalog import ProductResponse, ProductCreate
from backend.app.api.deps import require_seller

router = APIRouter()


def format_product(p: Product) -> dict:
    return {
        "id": p.id,
        "brand": p.brand,
        "name": p.name,
        "category": p.category,
        "price": p.price,
        "old": p.old or 0.0,
        "rating": p.rating,
        "reviews": p.reviews,
        "img": p.img,
        "tag": p.tag or "",
        "description": p.description,
        "ingredients": p.ingredients or "",
        "variants": [v.name for v in p.variants] if p.variants else []
    }


@router.get("/", response_model=List[ProductResponse])
def get_products(
    category: Optional[str] = Query(None),
    sort: Optional[str] = Query("featured"),
    tag: Optional[str] = Query(None),
    query: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    q = db.query(Product).filter(Product.is_active == True)
    if category and category.lower() != "all":
        q = q.filter(Product.category.ilike(category))
    if tag:
        q = q.filter(Product.tag == tag)
    if query:
        q_term = f"%{query}%"
        q = q.filter((Product.name.ilike(q_term)) | (Product.brand.ilike(q_term)) | (Product.description.ilike(q_term)))

    if sort == "price":
        q = q.order_by(Product.price.asc())
    elif sort == "rating":
        q = q.order_by(Product.rating.desc())

    products = q.all()
    return [format_product(p) for p in products]


@router.get("/categories", response_model=List[str])
def get_product_categories(db: Session = Depends(get_db)):
    categories = db.query(Product.category).distinct().all()
    return ["All"] + [c[0] for c in categories if c[0]]


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: str, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return format_product(product)


@router.post("/", response_model=ProductResponse)
def create_product(
    prod_in: ProductCreate,
    db: Session = Depends(get_db),
    user=Depends(require_seller)
):
    import time
    pid = prod_in.id or f"b{int(time.time()*1000)}"
    product = Product(
        id=pid,
        seller_id=user.id,
        brand=prod_in.brand,
        name=prod_in.name,
        category=prod_in.category,
        price=prod_in.price,
        old=prod_in.old or 0.0,
        img=prod_in.img,
        tag=prod_in.tag or "",
        description=prod_in.description,
        ingredients=prod_in.ingredients,
        stock=100
    )
    db.add(product)
    db.commit()
    db.refresh(product)

    for v in prod_in.variants:
        variant = ProductVariant(product_id=product.id, name=v, stock=50)
        db.add(variant)
    db.commit()
    db.refresh(product)

    return format_product(product)
