from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import logging

from app.database import get_db
from app.schemas.employee import EmployeeCreate, Employee
from app.crud.crud_employee import create_employee, get_all_employees, get_employee_by_id, update_employee

router = APIRouter(
    prefix='/employees',
    tags=['employees']
)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@router.post("/", response_model=Employee)
def create_employee_route(employee: EmployeeCreate, db: Session = Depends(get_db)):
    """API endpoint to create an employee."""
    try:
        db_employee = create_employee(db, employee)
        if not db_employee:
            raise HTTPException(status_code=500, detail="Error creating employee")
        return db_employee
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during employee creation: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")

@router.get("/", response_model=List[Employee])
def list_employees_route(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """API endpoint to retrieve a list of employees."""
    try:
        return get_all_employees(db, skip, limit)
    except Exception as e:
        logger.error(f"Unexpected error retrieving employees: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")

@router.get("/{employee_id}", response_model=Employee)
def get_employee_route(employee_id: int, db: Session = Depends(get_db)):
    """API endpoint to retrieve a single employee by ID."""
    employee = get_employee_by_id(db, employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee

@router.put("/{employee_id}", response_model=Employee)
def update_employee_route(employee_id: int, employee: EmployeeCreate, db: Session = Depends(get_db)):
    """API endpoint to update an existing employee."""
    try:
        updated_employee = update_employee(db, employee_id, employee)
        if not updated_employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        return updated_employee
    except Exception as e:
        logger.error(f"Unexpected error updating employee: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")
