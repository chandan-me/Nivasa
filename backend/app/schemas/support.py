from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime

# Support Schemas
class SupportTicketCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: str = Field(...)
    priority: str = "MEDIUM" # LOW, MEDIUM, HIGH

class SupportTicketUpdate(BaseModel):
    status: Optional[str] = None # OPEN, ASSIGNED, RESOLVED, CLOSED
    priority: Optional[str] = None
    assigned_admin_id: Optional[UUID] = None

class SupportMessageCreate(BaseModel):
    message: str = Field(...)
    file_url: Optional[str] = None

class SupportMessageOut(BaseModel):
    id: UUID
    ticket_id: UUID
    sender_id: Optional[UUID] = None
    message: str
    file_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class SupportTicketOut(SupportTicketCreate):
    id: UUID
    status: str
    user_id: UUID
    assigned_admin_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    messages: List[SupportMessageOut] = []

    class Config:
        from_attributes = True

# Moderation Schemas
class ReportCreate(BaseModel):
    reported_item_type: str # marketplace_listing, support_ticket, user
    reported_item_id: UUID
    reason: str = Field(..., min_length=2, max_length=255)
    details: Optional[str] = None

class ReportUpdate(BaseModel):
    status: str # PENDING, RESOLVED, REJECTED
    details: Optional[str] = None

class ReportOut(ReportCreate):
    id: UUID
    reporter_id: UUID
    status: str
    resolver_id: Optional[UUID] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Chat Schemas
class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1)

class MessageOut(BaseModel):
    id: UUID
    conversation_id: UUID
    sender_id: Optional[UUID] = None
    content: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationOut(BaseModel):
    id: UUID
    user1_id: UUID
    user2_id: UUID
    created_at: datetime
    messages: List[MessageOut] = []

    class Config:
        from_attributes = True
