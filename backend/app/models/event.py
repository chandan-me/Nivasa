import uuid
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey, func, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class Event(Base):
    __tablename__ = "events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String(255), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    capacity = Column(Integer, nullable=True) # None = unlimited
    
    community_id = Column(UUID(as_uuid=True), ForeignKey("communities.id", ondelete="CASCADE"), nullable=False)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(50), default="UPCOMING", nullable=False) # UPCOMING, ONGOING, COMPLETED, CANCELLED
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    rsvps = relationship("EventRSVP", back_populates="event", cascade="all, delete-orphan")
    author = relationship("User")

    def __repr__(self):
        return f"<Event title={self.title} status={self.status}>"

class EventRSVP(Base):
    __tablename__ = "event_rsvps"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), nullable=False) # YES, NO, MAYBE
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Unique constraint so user can only RSVP once per event
    __table_args__ = (
        UniqueConstraint("event_id", "user_id", name="uq_event_user_rsvp"),
    )

    # Relationships
    event = relationship("Event", back_populates="rsvps")
    user = relationship("User")

    def __repr__(self):
        return f"<EventRSVP event={self.event_id} user={self.user_id} status={self.status}>"
