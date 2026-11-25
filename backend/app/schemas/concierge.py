from typing import List, Optional
from pydantic import BaseModel, Field


class ConciergeChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=600)
    location: Optional[str] = None
    audience: Optional[str] = None


class ConciergeAction(BaseModel):
    label: str
    action: Optional[str] = None
    id: Optional[str] = None
    target: Optional[str] = None
    prompt: Optional[str] = None
    url: Optional[str] = None


class ConciergeChatResponse(BaseModel):
    reply: str
    actions: List[ConciergeAction]
    whatsapp_url: str
