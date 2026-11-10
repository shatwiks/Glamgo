from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.api.deps import get_current_user, get_optional_current_user
from backend.app.models.user import User
from backend.app.models.review import Review
from backend.app.schemas.review import ReviewCreate, ReviewResponse

router = APIRouter()


@router.post("", response_model=ReviewResponse)
def create_review(
    r_in: ReviewCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    valid_types = {"service", "salon", "product"}
    if r_in.item_type.lower() not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid item_type '{r_in.item_type}'. Must be one of: {list(valid_types)}"
        )

    review = Review(
        user_id=user.id,
        item_id=r_in.item_id,
        item_type=r_in.item_type.lower(),
        rating=r_in.rating,
        comment=r_in.comment
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    return ReviewResponse(
        id=review.id,
        user_id=review.user_id,
        user_name=user.full_name,
        item_id=review.item_id,
        item_type=review.item_type,
        rating=review.rating,
        comment=review.comment,
        created_at=review.created_at
    )


@router.get("", response_model=List[ReviewResponse])
def get_reviews(
    item_id: Optional[str] = Query(None),
    item_type: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    q = db.query(Review)
    if item_id:
        q = q.filter(Review.item_id == item_id)
    if item_type:
        q = q.filter(Review.item_type == item_type.lower())

    reviews = q.order_by(Review.created_at.desc()).all()
    results = []
    for r in reviews:
        results.append(ReviewResponse(
            id=r.id,
            user_id=r.user_id,
            user_name=r.user.full_name if r.user else "Anonymous Customer",
            item_id=r.item_id,
            item_type=r.item_type,
            rating=r.rating,
            comment=r.comment,
            created_at=r.created_at
        ))
    return results


@router.get("/my", response_model=List[ReviewResponse])
def get_my_reviews(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reviews = db.query(Review).filter(Review.user_id == user.id).order_by(Review.created_at.desc()).all()
    return [
        ReviewResponse(
            id=r.id,
            user_id=r.user_id,
            user_name=user.full_name,
            item_id=r.item_id,
            item_type=r.item_type,
            rating=r.rating,
            comment=r.comment,
            created_at=r.created_at
        )
        for r in reviews
    ]
