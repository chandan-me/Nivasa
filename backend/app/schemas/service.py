from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class ServiceProviderCreate(BaseModel):
    business_name: str = Field(..., min_length=2, max_length=255)
    category: str # PLUMBER, ELECTRICIAN, CLEANING, LAUNDRY, CAR_WASH, APPLIANCE_REPAIR, etc.
    bio: Optional[str] = None

class ServiceProviderUpdate(BaseModel):
    business_name: Optional[str] = None
    category: Optional[str] = None
    bio: Optional[str] = None
    status: Optional[str] = None # PENDING, VERIFIED, SUSPENDED, REJECTED
    is_verified: Optional[bool] = None

class ServiceProviderOut(BaseModel):
    id: UUID
    user_id: UUID
    business_name: str
    category: str
    bio: Optional[str] = None
    rating: float
    is_verified: bool
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class ServiceRequestCreate(BaseModel):
    provider_id: UUID
    description: str = Field(...)
    scheduled_time: datetime

class ServiceRequestUpdate(BaseModel):
    status: Optional[str] = None # REQUESTED, ACCEPTED, SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
    rating: Optional[int] = Field(None, ge=1, le=5)
    review: Optional[str] = None

class ServiceRequestOut(BaseModel):
    id: UUID
    provider_id: UUID
    resident_id: UUID
    unit_id: UUID
    description: str
    scheduled_time: datetime
    status: str
    rating: Optional[int] = None
    review: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
