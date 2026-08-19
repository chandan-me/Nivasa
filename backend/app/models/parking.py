import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, func, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class ParkingSlot(Base):
    __tablename__ = "parking_slots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slot_number = Column(String(50), unique=True, nullable=False, index=True)
    building_id = Column(UUID(as_uuid=True), ForeignKey("buildings.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(50), default="VACANT", nullable=False) # VACANT, OCCUPIED, RESERVED
    
    assigned_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    building = relationship("Building")
    assigned_user = relationship("User")
    vehicle = relationship("Vehicle", back_populates="parking_slots")

    def __repr__(self):
        return f"<ParkingSlot slot_number={self.slot_number} status={self.status}>"

class ParkingViolation(Base):
    __tablename__ = "parking_violations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=True)
    slot_id = Column(UUID(as_uuid=True), ForeignKey("parking_slots.id", ondelete="CASCADE"), nullable=True)
    description = Column(Text, nullable=False)
    
    reported_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    vehicle = relationship("Vehicle")
    slot = relationship("ParkingSlot")
    reported_by = relationship("User")

    def __repr__(self):
        return f"<ParkingViolation slot={self.slot_id} description={self.description[:30]}>"
