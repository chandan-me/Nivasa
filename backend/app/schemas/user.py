from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Any
from uuid import UUID
from datetime import datetime

class RoleBase(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    email: EmailStr
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)

class UserRegister(UserBase):
    password: str = Field(..., min_length=6, max_length=100)
    role_name: str = "RESIDENT" # Default role
    unit_id: Optional[UUID] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(UserBase):
    id: UUID
    avatar_url: Optional[str] = None
    is_active: bool
    is_verified: bool
    unit_id: Optional[UUID] = None
    roles: List[RoleBase] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    roles: List[str]
    user: UserOut

class TokenData(BaseModel):
    email: Optional[str] = None
    roles: List[str] = []
