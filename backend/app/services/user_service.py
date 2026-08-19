from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserRegister, UserLogin
from app.core.security import get_password_hash, verify_password
from app.models.user import User

class UserService:
    def __init__(self, db: Session):
        self.repo = UserRepository(db)

    def register_user(self, user_in: UserRegister) -> User:
        # Check if user already exists
        existing_user = self.repo.get_by_email(user_in.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A user with this email address already exists"
            )
        
        # Verify role exists
        role = self.repo.get_role_by_name(user_in.role_name)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Specified role '{user_in.role_name}' does not exist"
            )
            
        # Hash password and create user
        password_hash = get_password_hash(user_in.password)
        return self.repo.create(user_in, password_hash)

    def authenticate_user(self, login_in: UserLogin) -> User:
        user = self.repo.get_by_email(login_in.email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
            
        if not verify_password(login_in.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
            
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive"
            )
            
        return user
