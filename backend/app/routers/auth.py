from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel
import logging

from app.database import get_db
from app.models import User, UserRole
from app.crud.crud_auth import get_user_by_username, get_user_by_email, create_user, authenticate_user

router = APIRouter()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Secret Key and Algorithm for JWT
SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    user_id: Optional[int] = None
    company_id: Optional[int] = None

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: UserRole
    f_name: str
    l_name: str
    phone_number: Optional[str] = None
    company_id: int

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Generate a JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    try:
        return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    except JWTError as e:
        logger.error(f"Error creating access token: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not create access token")

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Retrieve the current user from the token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        user_id: int = payload.get("user_id")
        company_id: int = payload.get("company_id")
        if not all([username, user_id, company_id]):
            raise credentials_exception
        token_data = TokenData(username=username, user_id=user_id, company_id=company_id)
    except JWTError as e:
        logger.error(f"JWT decode error: {str(e)}")
        raise credentials_exception

    user = get_user_by_username(db, token_data.username)
    if user is None:
        raise credentials_exception
    return user

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Authenticate user and return an access token."""
    try:
        user = authenticate_user(db, form_data.username, form_data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username, "user_id": user.id, "company_id": user.company_id},
            expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException as e:
        logger.error(f"HTTP exception during login: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error during login: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")

@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    try:
        if get_user_by_username(db, user.username):
            raise HTTPException(status_code=400, detail="Username already registered")
        if get_user_by_email(db, user.email):
            raise HTTPException(status_code=400, detail="Email already registered")

        new_user = create_user(db, user)
        if not new_user:
            raise HTTPException(status_code=500, detail="Error creating user")

        return {"message": "User created successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during signup: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")

@router.get("/users/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    """Retrieve the currently logged-in user's details."""
    return current_user
