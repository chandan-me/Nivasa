import uuid
from sqlalchemy import Column, String, Numeric, ForeignKey, Date, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class Rental(Base):
    __tablename__ = "rentals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    listing_id = Column(UUID(as_uuid=True), ForeignKey("marketplace_listings.id", ondelete="CASCADE"), nullable=False)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    renter_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    price = Column(Numeric(10, 2), nullable=True) # Rental rate
    deposit = Column(Numeric(10, 2), nullable=True) # Security deposit
    
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    
    status = Column(String(50), default="REQUESTED", nullable=False) 
    # REQUESTED, ACCEPTED, PAYMENT_PENDING, CONFIRMED, ACTIVE, RETURN_PENDING, COMPLETED, CANCELLED

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    listing = relationship("MarketplaceListing", back_populates="rentals")
    owner = relationship("User", foreign_keys=[owner_id])
    renter = relationship("User", foreign_keys=[renter_id])

    def __repr__(self):
        return f"<Rental listing={self.listing_id} renter={self.renter_id} status={self.status}>"
