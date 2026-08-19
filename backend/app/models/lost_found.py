import uuid
from sqlalchemy import Column, String, Text, ForeignKey, Date, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class LostFoundItem(Base):
    __tablename__ = "lost_found_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    item_type = Column(String(50), nullable=False) # LOST, FOUND
    location = Column(String(255), nullable=False) # e.g. "Clubhouse Lobby"
    date_reported = Column(Date, nullable=False)
    status = Column(String(50), default="OPEN", nullable=False) # OPEN, CLAIMED, RESOLVED, EXPIRED
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    image_url = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User")

    def __repr__(self):
        return f"<LostFoundItem title={self.title} type={self.item_type} status={self.status}>"
