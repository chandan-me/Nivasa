import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class GateEvent(Base):
    __tablename__ = "gate_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    visitor_id = Column(UUID(as_uuid=True), ForeignKey("visitors.id", ondelete="CASCADE"), nullable=False)
    guard_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(50), nullable=False) # ENTRY, EXIT, REJECT
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    notes = Column(String(255), nullable=True)

    # Relationships
    visitor = relationship("Visitor", back_populates="gate_events")
    guard = relationship("User")

    def __repr__(self):
        return f"<GateEvent action={self.action} visitor={self.visitor_id}>"
