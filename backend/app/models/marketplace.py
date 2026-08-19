import uuid
from sqlalchemy import Column, String, Text, Numeric, ForeignKey, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class MarketplaceListing(Base):
    __tablename__ = "marketplace_listings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    price = Column(Numeric(10, 2), nullable=True) # Null for GIVE_AWAY or FREE_BORROW
    condition = Column(String(50), nullable=False) # NEW, LIKE_NEW, GOOD, FAIR, POOR
    
    listing_type = Column(String(50), nullable=False) # BUY_SELL, BORROW, RENT, GIVE_AWAY
    status = Column(String(50), default="ACTIVE", nullable=False) # ACTIVE, SOLD, RENTED, INACTIVE
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    community_id = Column(UUID(as_uuid=True), ForeignKey("communities.id", ondelete="CASCADE"), nullable=False)
    
    image_url = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User")
    community = relationship("Community")
    rentals = relationship("Rental", back_populates="listing", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<MarketplaceListing title={self.title} type={self.listing_type} status={self.status}>"
