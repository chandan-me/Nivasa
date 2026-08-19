from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.core.security import create_access_token
from app.schemas.user import UserRegister, UserLogin, UserOut, Token
from app.services.user_service import UserService
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    """
    Registers a new resident, dependent, or provider in the community.
    """
    service = UserService(db)
    return service.register_user(user_in)

@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticates a user and issues a JWT access token.
    """
    service = UserService(db)
    user = service.authenticate_user(login_in)
    
    # Generate Access Token
    roles = [r.name for r in user.roles]
    access_token = create_access_token(data={"sub": user.email, "roles": roles})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "roles": roles,
        "user": user
    }

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_active_user)):
    """
    Returns the profile details of the current authenticated user.
    """
    return current_user
