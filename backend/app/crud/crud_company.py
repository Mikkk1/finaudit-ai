from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.models import Company
import logging

logger = logging.getLogger(__name__)

def create_company(db: Session, company_data):
    """Create a new company."""
    try:
        db_company = Company(**company_data.dict())
        db.add(db_company)
        db.commit()
        db.refresh(db_company)
        return db_company
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error creating company: {str(e)}")
        return None

def get_all_companies(db: Session, skip: int = 0, limit: int = 100):
    """Retrieve all companies with pagination."""
    try:
        return db.query(Company).offset(skip).limit(limit).all()
    except SQLAlchemyError as e:
        logger.error(f"Error retrieving companies: {str(e)}")
        return []

def get_company_by_id(db: Session, company_id: int):
    """Retrieve a single company by ID."""
    try:
        return db.query(Company).filter(Company.id == company_id).first()
    except SQLAlchemyError as e:
        logger.error(f"Error retrieving company: {str(e)}")
        return None

def update_company(db: Session, company_id: int, company_data):
    """Update an existing company."""
    try:
        db_company = db.query(Company).filter(Company.id == company_id).first()
        if not db_company:
            return None

        for key, value in company_data.dict().items():
            setattr(db_company, key, value)

        db.commit()
        db.refresh(db_company)
        return db_company
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error updating company: {str(e)}")
        return None
