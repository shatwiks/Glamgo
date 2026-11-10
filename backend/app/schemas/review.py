from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class ReviewCreate(BaseModel):
    item_id: str
    item_type: str  # "service", "salon", "product"
    rating: float = Field(..., ge=1.0, le=5.0)
    comment: str = Field(..., min_length=2)


class ReviewResponse(BaseModel):
    id: int
    user_id: int
    user_name: Optional[str] = None
    item_id: str
    item_type: str
    rating: float
    comment: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
