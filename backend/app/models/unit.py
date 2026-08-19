import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class Unit(Base):
    __tablename__ = "units"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    building_id = Column(UUID(as_uuid=True), ForeignKey("buildings.id", ondelete="CASCADE"), nullable=False)
    number = Column(String(50), nullable=False, index=True)
    floor = Column(Integer, nullable=False)
    status = Column(String(50), default="VACANT", nullable=False) # e.g. VACANT, OCCUPIED

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    building = relationship("Building", back_populates="units")
    residents = relationship("User", back_populates="unit", foreign_keys="[User.unit_id]")
    maintenance_tickets = relationship("MaintenanceTicket", back_populates="unit", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="unit", cascade="all, delete-orphan")
    visitors = relationship("Visitor", back_populates="unit", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Unit number={self.number}>"
