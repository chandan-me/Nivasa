import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    file_url = Column(String(255), nullable=False) # Local or storage URL
    category = Column(String(100), nullable=False) # e.g. Rules, Policies, Receipts
    
    community_id = Column(UUID(as_uuid=True), ForeignKey("communities.id", ondelete="CASCADE"), nullable=True)
    building_id = Column(UUID(as_uuid=True), ForeignKey("buildings.id", ondelete="CASCADE"), nullable=True)
    
    uploaded_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    access_level = Column(String(50), default="RESIDENT", nullable=False) # e.g. RESIDENT, PUBLIC, ADMIN, GUARD

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    community = relationship("Community")
    building = relationship("Building")
    uploaded_by = relationship("User")

    def __repr__(self):
        return f"<Document title={self.title} category={self.category}>"
