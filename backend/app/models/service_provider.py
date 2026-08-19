import uuid
from sqlalchemy import Column, String, Text, Boolean, Float, ForeignKey, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class ServiceProvider(Base):
    __tablename__ = "service_providers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    business_name = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False) # PLUMBER, ELECTRICIAN, CLEANING, LAUNDRY, CAR_WASH, etc.
    bio = Column(Text, nullable=True)
    rating = Column(Float, default=0.0, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    status = Column(String(50), default="PENDING", nullable=False) # PENDING, VERIFIED, SUSPENDED, REJECTED
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User")
    requests = relationship("ServiceRequest", back_populates="provider", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ServiceProvider business_name={self.business_name} category={self.category}>"
