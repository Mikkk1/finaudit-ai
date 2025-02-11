from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.models import Employee
import logging

logger = logging.getLogger(__name__)

def create_employee(db: Session, employee_data):
    """Create a new employee."""
    try:
        db_employee = Employee(**employee_data.dict())
        db.add(db_employee)
        db.commit()
        db.refresh(db_employee)
        return db_employee
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error creating employee: {str(e)}")
        return None

def get_all_employees(db: Session, skip: int = 0, limit: int = 100):
    """Retrieve all employees with pagination."""
    try:
        return db.query(Employee).offset(skip).limit(limit).all()
    except SQLAlchemyError as e:
        logger.error(f"Error retrieving employees: {str(e)}")
        return []

def get_employee_by_id(db: Session, employee_id: int):
    """Retrieve a single employee by ID."""
    try:
        return db.query(Employee).filter(Employee.id == employee_id).first()
    except SQLAlchemyError as e:
        logger.error(f"Error retrieving employee: {str(e)}")
        return None

def update_employee(db: Session, employee_id: int, employee_data):
    """Update an existing employee."""
    try:
        db_employee = db.query(Employee).filter(Employee.id == employee_id).first()
        if not db_employee:
            return None

        for key, value in employee_data.dict().items():
            setattr(db_employee, key, value)

        db.commit()
        db.refresh(db_employee)
        return db_employee
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error updating employee: {str(e)}")
        return None
