from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import date, datetime

class MarketplaceListingCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: str = Field(...)
    price: Optional[float] = Field(None, ge=0)
    condition: str # NEW, LIKE_NEW, GOOD, FAIR, POOR
    listing_type: str # BUY_SELL, BORROW, RENT, GIVE_AWAY
    image_url: Optional[str] = None

class MarketplaceListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    condition: Optional[str] = None
    status: Optional[str] = None # ACTIVE, SOLD, RENTED, INACTIVE
    image_url: Optional[str] = None

class MarketplaceListingOut(MarketplaceListingCreate):
    id: UUID
    status: str
    user_id: UUID
    community_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RentalCreate(BaseModel):
    listing_id: UUID
    start_date: date
    end_date: date

class RentalUpdate(BaseModel):
    status: str # REQUESTED, ACCEPTED, PAYMENT_PENDING, CONFIRMED, ACTIVE, RETURN_PENDING, COMPLETED, CANCELLED

class RentalOut(BaseModel):
    id: UUID
    listing_id: UUID
    owner_id: UUID
    renter_id: UUID
    price: Optional[float] = None
    deposit: Optional[float] = None
    start_date: date
    end_date: date
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class LostFoundItemCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: str = Field(...)
    item_type: str # LOST, FOUND
    location: str = Field(..., min_length=2, max_length=255)
    date_reported: date
    image_url: Optional[str] = None

class LostFoundItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None # OPEN, CLAIMED, RESOLVED, EXPIRED
    image_url: Optional[str] = None

class LostFoundItemOut(LostFoundItemCreate):
    id: UUID
    status: str
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
