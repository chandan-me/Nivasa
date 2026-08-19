from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import date, time, datetime

class VisitorBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., max_length=20)
    purpose: Optional[str] = Field(None, max_length=255)
    date: date
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    vehicle_details: Optional[str] = Field(None, max_length=100)

class VisitorCreate(VisitorBase):
    unit_id: UUID

class VisitorUpdate(BaseModel):
    status: Optional[str] = None # EXPECTED, AT_GATE, ENTERED, EXITED, REJECTED, EXPIRED
    entry_time: Optional[datetime] = None
    exit_time: Optional[datetime] = None

class VisitorOut(VisitorBase):
    id: UUID
    resident_id: UUID
    unit_id: UUID
    status: str
    entry_time: Optional[datetime] = None
    exit_time: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class GateEventCreate(BaseModel):
    visitor_id: UUID
    action: str # ENTRY, EXIT, REJECT
    notes: Optional[str] = None

class GateEventOut(BaseModel):
    id: UUID
    visitor_id: UUID
    guard_id: Optional[UUID] = None
    action: str
    timestamp: datetime
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class DeliveryBase(BaseModel):
    company: str = Field(..., min_length=2, max_length=100)
    tracking_number: Optional[str] = Field(None, max_length=100)

class DeliveryCreate(DeliveryBase):
    resident_email: str # To search for resident
    unit_number: str # To match unit

class DeliveryUpdate(BaseModel):
    status: str # EXPECTED, ARRIVED, WAITING, APPROVED, COLLECTED, REJECTED
    exit_time: Optional[datetime] = None

class DeliveryOut(DeliveryBase):
    id: UUID
    resident_id: UUID
    unit_id: UUID
    guard_id: Optional[UUID] = None
    status: str
    entry_time: datetime
    exit_time: Optional[datetime] = None

    class Config:
        from_attributes = True

class NotificationOut(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    message: str
    notification_type: str
    is_read: bool
    reference_id: Optional[UUID] = None
    reference_type: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
