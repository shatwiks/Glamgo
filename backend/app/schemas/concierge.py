from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class ConciergeHistoryTurn(BaseModel):
    role: Literal["user", "ai"]
    text: str = Field(..., min_length=1, max_length=600)


class ConciergeChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=600)
    location: Optional[str] = None
    city: Optional[str] = None
    audience: Optional[str] = None
    experience: Optional[Literal["home", "salon", "shop"]] = None
    history: List[ConciergeHistoryTurn] = Field(default_factory=list, max_length=10)


class ConciergeAction(BaseModel):
    label: str
    action: Optional[str] = None
    id: Optional[str] = None
    service_id: Optional[str] = None
    target: Optional[str] = None
    prompt: Optional[str] = None
    url: Optional[str] = None


class ConciergeChatResponse(BaseModel):
    reply: str
    actions: List[ConciergeAction]
    whatsapp_url: str
    source: Literal["gemini", "fallback"] = "fallback"
