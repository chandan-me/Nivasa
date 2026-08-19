import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class MaintenanceTicket(Base):
    __tablename__ = "maintenance_tickets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False) # PLUMBING, ELECTRICAL, CLEANING, LIFT, SECURITY, WATER, COMMON_AREA, OTHER
    priority = Column(String(50), default="MEDIUM", nullable=False) # LOW, MEDIUM, HIGH, EMERGENCY
    status = Column(String(50), default="OPEN", nullable=False) # OPEN, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED, REOPENED, OVERDUE
    
    resident_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    unit_id = Column(UUID(as_uuid=True), ForeignKey("units.id", ondelete="CASCADE"), nullable=False)
    # Reference to provider/technician user
    assigned_technician_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    sla_deadline = Column(DateTime(timezone=True), nullable=True)
    photo_url = Column(String(255), nullable=True)
    video_url = Column(String(255), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    resident = relationship("User", foreign_keys=[resident_id]) # using standard user mapping
    unit = relationship("Unit", back_populates="maintenance_tickets")
    technician = relationship("User", foreign_keys=[assigned_technician_id])
    timeline = relationship("MaintenanceTimeline", back_populates="ticket", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<MaintenanceTicket title={self.title} status={self.status}>"

class MaintenanceTimeline(Base):
    __tablename__ = "maintenance_timelines"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id = Column(UUID(as_uuid=True), ForeignKey("maintenance_tickets.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), nullable=False)
    notes = Column(Text, nullable=True)
    changed_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    ticket = relationship("MaintenanceTicket", back_populates="timeline")
    changed_by = relationship("User")

    def __repr__(self):
        return f"<MaintenanceTimeline status={self.status}>"
