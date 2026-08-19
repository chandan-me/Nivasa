from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import date, datetime

class PaymentCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    amount: float = Field(..., gt=0)
    due_date: date
    charge_type: str # MAINTENANCE, PENALTY, EVENT_FEE, PARKING, OTHER
    user_id: UUID
    unit_id: UUID

class PaymentUpdate(BaseModel):
    status: str # PENDING, PROCESSING, SUCCESSFUL, FAILED, REFUNDED, OVERDUE
    transaction_reference: Optional[str] = None
    paid_at: Optional[datetime] = None

class PaymentOut(BaseModel):
    id: UUID
    title: str
    amount: float
    due_date: date
    charge_type: str
    status: str
    user_id: UUID
    unit_id: UUID
    transaction_reference: Optional[str] = None
    paid_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class PaymentSummaryOut(BaseModel):
    total_due: float
    total_paid: float
    total_overdue: float
    upcoming_due_date: Optional[date] = None
