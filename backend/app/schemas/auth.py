from typing import Optional
from pydantic import BaseModel, EmailStr
from backend.app.models.user import UserRole


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None
    role: Optional[UserRole] = UserRole.CUSTOMER


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    name: str
    email: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str
