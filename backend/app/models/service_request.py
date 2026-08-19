import uuid
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class ServiceRequest(Base):
    __tablename__ = "service_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider_id = Column(UUID(as_uuid=True), ForeignKey("service_providers.id", ondelete="CASCADE"), nullable=False)
    resident_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    unit_id = Column(UUID(as_uuid=True), ForeignKey("units.id", ondelete="CASCADE"), nullable=False)
    
    description = Column(Text, nullable=False)
    scheduled_time = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(50), default="REQUESTED", nullable=False) # REQUESTED, ACCEPTED, SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
    
    rating = Column(Integer, nullable=True) # 1-5 rating left by resident
    review = Column(Text, nullable=True) # Text review left by resident
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    provider = relationship("ServiceProvider", back_populates="requests")
    resident = relationship("User")
    unit = relationship("Unit")

    def __repr__(self):
        return f"<ServiceRequest resident={self.resident_id} status={self.status}>"
