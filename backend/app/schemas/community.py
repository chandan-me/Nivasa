from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class CommunityBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    address: str = Field(...)
    description: Optional[str] = None

class CommunityCreate(CommunityBase):
    pass

class CommunityOut(CommunityBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class BuildingBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None

class BuildingCreate(BuildingBase):
    community_id: UUID

class BuildingOut(BuildingBase):
    id: UUID
    community_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class UnitBase(BaseModel):
    number: str = Field(..., min_length=1, max_length=50)
    floor: int = Field(..., ge=0)
    status: str = "VACANT"

class UnitCreate(UnitBase):
    building_id: UUID

class UnitOut(UnitBase):
    id: UUID
    building_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class DirectoryMemberOut(BaseModel):
    id: UUID
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    role_name: str
    building_name: str
    unit_number: str

    class Config:
        from_attributes = True
