from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class MaintenanceTicketCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: str = Field(...)
    category: str # PLUMBING, ELECTRICAL, CLEANING, LIFT, SECURITY, WATER, COMMON_AREA, OTHER
    priority: str = "MEDIUM" # LOW, MEDIUM, HIGH, EMERGENCY
    photo_url: Optional[str] = None
    video_url: Optional[str] = None

class MaintenanceTicketUpdate(BaseModel):
    status: Optional[str] = None # OPEN, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED, REOPENED, OVERDUE
    assigned_technician_id: Optional[UUID] = None
    priority: Optional[str] = None
    sla_deadline: Optional[datetime] = None
    notes: Optional[str] = None # Will add to timeline

class MaintenanceTimelineOut(BaseModel):
    id: UUID
    ticket_id: UUID
    status: str
    notes: Optional[str] = None
    changed_by_id: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True

class MaintenanceTicketOut(BaseModel):
    id: UUID
    title: str
    description: str
    category: str
    priority: str
    status: str
    resident_id: UUID
    unit_id: UUID
    assigned_technician_id: Optional[UUID] = None
    sla_deadline: Optional[datetime] = None
    photo_url: Optional[str] = None
    video_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    timeline: List[MaintenanceTimelineOut] = []

    class Config:
        from_attributes = True
