from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.models import User
import bcrypt
import logging

logger = logging.getLogger(__name__)

def get_user_by_username(db: Session, username: str):
    """Fetch a user by their username."""
    try:
        return db.query(User).filter(User.username == username).first()
    except SQLAlchemyError as e:
        logger.error(f"Database error while fetching user: {str(e)}")
        return None

def get_user_by_email(db: Session, email: str):
    """Fetch a user by their email."""
    try:
        return db.query(User).filter(User.email == email).first()
    except SQLAlchemyError as e:
        logger.error(f"Database error while fetching user: {str(e)}")
        return None

def create_user(db: Session, user_data):
    """Create a new user and store in the database."""
    try:
        hashed_password = bcrypt.hashpw(user_data.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        db_user = User(
            username=user_data.username,
            email=user_data.email,
            hashed_password=hashed_password,
            role=user_data.role,
            f_name=user_data.f_name,
            l_name=user_data.l_name,
            phone_number=user_data.phone_number,
            company_id=user_data.company_id
        )

        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        return db_user
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error creating user: {str(e)}")
        return None

def authenticate_user(db: Session, username: str, password: str):
    """Check if user credentials are valid."""
    user = get_user_by_username(db, username)
    if not user or not bcrypt.checkpw(password.encode('utf-8'), user.hashed_password.encode('utf-8')):
        return None
    return user
