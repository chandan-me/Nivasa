from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime

# Announcement Schemas
class AnnouncementCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    content: str = Field(...)
    building_id: Optional[UUID] = None
    is_pinned: bool = False
    expires_at: Optional[datetime] = None

class AnnouncementOut(BaseModel):
    id: UUID
    title: str
    content: str
    community_id: UUID
    building_id: Optional[UUID] = None
    is_pinned: bool
    expires_at: Optional[datetime] = None
    created_by_id: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Poll Schemas
class PollOptionCreate(BaseModel):
    option_text: str = Field(..., min_length=1, max_length=255)

class PollCreate(BaseModel):
    question: str = Field(..., min_length=2, max_length=255)
    expires_at: datetime
    options: List[PollOptionCreate] = Field(..., min_items=2)

class PollOptionOut(BaseModel):
    id: UUID
    option_text: str
    vote_count: Optional[int] = 0

    class Config:
        from_attributes = True

class PollVoteCreate(BaseModel):
    option_id: UUID

class PollOut(BaseModel):
    id: UUID
    question: str
    community_id: UUID
    expires_at: datetime
    created_by_id: Optional[UUID] = None
    created_at: datetime
    options: List[PollOptionOut] = []
    user_voted_option_id: Optional[UUID] = None

    class Config:
        from_attributes = True

# Event Schemas
class EventCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    location: str = Field(...)
    start_time: datetime
    end_time: datetime
    capacity: Optional[int] = Field(None, ge=1)

class EventRSVPCreate(BaseModel):
    status: str # YES, NO, MAYBE

class EventRSVPOut(BaseModel):
    id: UUID
    event_id: UUID
    user_id: UUID
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class EventOut(BaseModel):
    id: UUID
    title: str
    description: Optional[str] = None
    location: str
    start_time: datetime
    end_time: datetime
    capacity: Optional[int] = None
    community_id: UUID
    created_by_id: Optional[UUID] = None
    status: str
    created_at: datetime
    rsvps: List[EventRSVPOut] = []
    user_rsvp_status: Optional[str] = None

    class Config:
        from_attributes = True

# Document Schemas
class DocumentCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    file_url: str = Field(...)
    category: str # Rules, Policies, Notices, Receipts, Other
    building_id: Optional[UUID] = None
    access_level: str = "RESIDENT" # RESIDENT, PUBLIC, ADMIN, GUARD

class DocumentOut(BaseModel):
    id: UUID
    title: str
    file_url: str
    category: str
    community_id: Optional[UUID] = None
    building_id: Optional[UUID] = None
    uploaded_by_id: Optional[UUID] = None
    access_level: str
    created_at: datetime

    class Config:
        from_attributes = True
