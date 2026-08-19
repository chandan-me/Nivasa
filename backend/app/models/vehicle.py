import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    registration_number = Column(String(50), unique=True, nullable=False, index=True)
    vehicle_type = Column(String(50), nullable=False) # CAR, MOTORCYCLE, BICYCLE, OTHER
    model = Column(String(100), nullable=False)
    color = Column(String(50), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    owner = relationship("User", back_populates="vehicles")
    parking_slots = relationship("ParkingSlot", back_populates="vehicle")

    def __repr__(self):
        return f"<Vehicle registration_number={self.registration_number}>"
