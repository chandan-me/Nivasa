import uuid
from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, Date, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class Payment(Base):
    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    due_date = Column(Date, nullable=False)
    
    charge_type = Column(String(50), nullable=False) # MAINTENANCE, PENALTY, EVENT_FEE, PARKING, OTHER
    status = Column(String(50), default="PENDING", nullable=False) # PENDING, PROCESSING, SUCCESSFUL, FAILED, REFUNDED, OVERDUE
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    unit_id = Column(UUID(as_uuid=True), ForeignKey("units.id", ondelete="CASCADE"), nullable=False)
    
    transaction_reference = Column(String(255), nullable=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="payments", foreign_keys=[user_id])
    unit = relationship("Unit", back_populates="payments")

    def __repr__(self):
        return f"<Payment title={self.title} amount={self.amount} status={self.status}>"
