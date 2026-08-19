import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class Delivery(Base):
    __tablename__ = "deliveries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    resident_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    unit_id = Column(UUID(as_uuid=True), ForeignKey("units.id", ondelete="CASCADE"), nullable=False)
    guard_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    company = Column(String(100), nullable=False) # e.g. Amazon, FedEx, DHL, Local Courier
    tracking_number = Column(String(100), nullable=True)
    
    status = Column(String(50), default="ARRIVED", nullable=False) # EXPECTED, ARRIVED, WAITING, APPROVED, COLLECTED, REJECTED
    
    entry_time = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    exit_time = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    resident = relationship("User", foreign_keys=[resident_id])
    unit = relationship("Unit")
    guard = relationship("User", foreign_keys=[guard_id])

    def __repr__(self):
        return f"<Delivery company={self.company} status={self.status}>"
