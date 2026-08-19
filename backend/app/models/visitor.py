import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Date, Time, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class Visitor(Base):
    __tablename__ = "visitors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    purpose = Column(String(255), nullable=True)
    date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)
    vehicle_details = Column(String(100), nullable=True)
    
    # Resident who invited/sponsored the visitor
    resident_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    unit_id = Column(UUID(as_uuid=True), ForeignKey("units.id", ondelete="CASCADE"), nullable=False)
    
    status = Column(String(50), default="EXPECTED", nullable=False) # EXPECTED, AT_GATE, ENTERED, EXITED, REJECTED, EXPIRED
    
    entry_time = Column(DateTime(timezone=True), nullable=True)
    exit_time = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    resident = relationship("User", back_populates="sponsored_visitors")
    unit = relationship("Unit", back_populates="visitors")
    gate_events = relationship("GateEvent", back_populates="visitor", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Visitor name={self.name} status={self.status}>"
