from sqlalchemy.orm import Session
from app.models.user import User
from app.models.role import Role
from app.schemas.user import UserRegister
from uuid import UUID

class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: UUID) -> User:
        return self.db.query(User).filter(User.id == user_id).first()

    def get_by_email(self, email: str) -> User:
        return self.db.query(User).filter(User.email == email).first()

    def get_role_by_name(self, name: str) -> Role:
        return self.db.query(Role).filter(Role.name == name).first()

    def create(self, user_in: UserRegister, password_hash: str) -> User:
        # Create a new user record
        user = User(
            email=user_in.email,
            password_hash=password_hash,
            first_name=user_in.first_name,
            last_name=user_in.last_name,
            phone=user_in.phone,
            unit_id=user_in.unit_id,
            is_active=True,
            is_verified=False # Requires admin verification/activation later
        )
        
        # Assign role
        role = self.get_role_by_name(user_in.role_name)
        if role:
            user.roles.append(role)
            
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
