import uuid
from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), nullable=False) # e.g. VISITOR, MAINTENANCE, PAYMENT, ANNOUNCEMENT, etc.
    is_read = Column(Boolean, default=False, nullable=False)
    
    reference_id = Column(UUID(as_uuid=True), nullable=True) # Optional reference to entities (e.g. Visitor ID)
    reference_type = Column(String(50), nullable=True) # Type of reference entities (e.g. "visitor")

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User")

    def __repr__(self):
        return f"<Notification user={self.user_id} title={self.title} is_read={self.is_read}>"
