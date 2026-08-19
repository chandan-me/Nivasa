import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, func, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship as orm_relationship
from app.core.database import Base

class FamilyMember(Base):
    __tablename__ = "family_members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # The user account associated with this family member (nullable if they don't have login credentials)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    # The primary resident who added this family member
    resident_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    relationship = Column(String(50), nullable=False) # e.g. Spouse, Child, Parent
    
    # Store permission flags for this dependent (e.g. {"can_approve_visitors": true})
    permissions = Column(JSON, nullable=True, default=dict)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = orm_relationship("User", foreign_keys=[user_id], back_populates="family_members")
    resident = orm_relationship("User", foreign_keys=[resident_id])

    def __repr__(self):
        return f"<FamilyMember relationship={self.relationship}>"
