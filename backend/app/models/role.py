import uuid
from sqlalchemy import Column, String, Text, Table, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base

# Association table for many-to-many mapping between Users and Roles
user_roles = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", UUID(as_uuid=True), ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)
)

class Role(Base):
    __tablename__ = "roles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)

    def __repr__(self):
        return f"<Role name={self.name}>"
