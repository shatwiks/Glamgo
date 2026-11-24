from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator
from backend.app.models.user import UserRole


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=72)
    name: str = Field(..., min_length=1, max_length=120)
    phone: Optional[str] = Field(default=None, max_length=32)
    role: Optional[UserRole] = UserRole.CUSTOMER

    @field_validator("password")
    @classmethod
    def validate_password_utf8_bytes(cls, v: str) -> str:
        if len(v.encode("utf-8")) > 72:
            raise ValueError("Password must not exceed 72 UTF-8 bytes.")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    name: str
    email: str
    phone: Optional[str] = None


class RefreshTokenRequest(BaseModel):
    refresh_token: str
