from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import logging

from app.database import get_db
from app.schemas.company import CompanyCreate, Company
from app.crud.crud_company import create_company, get_all_companies, get_company_by_id, update_company

router = APIRouter(
    prefix='/companies',
    tags=['companies']
)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@router.post("/", response_model=Company)
def create_company_route(company: CompanyCreate, db: Session = Depends(get_db)):
    """API endpoint to create a company."""
    try:
        db_company = create_company(db, company)
        if not db_company:
            raise HTTPException(status_code=500, detail="Error creating company")
        return db_company
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during company creation: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")

@router.get("/", response_model=List[Company])
def list_companies_route(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """API endpoint to retrieve a list of companies."""
    try:
        return get_all_companies(db, skip, limit)
    except Exception as e:
        logger.error(f"Unexpected error retrieving companies: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")

@router.get("/{company_id}", response_model=Company)
def get_company_route(company_id: int, db: Session = Depends(get_db)):
    """API endpoint to retrieve a single company by ID."""
    company = get_company_by_id(db, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company

@router.put("/{company_id}", response_model=Company)
def update_company_route(company_id: int, company: CompanyCreate, db: Session = Depends(get_db)):
    """API endpoint to update an existing company."""
    try:
        updated_company = update_company(db, company_id, company)
        if not updated_company:
            raise HTTPException(status_code=404, detail="Company not found")
        return updated_company
    except Exception as e:
        logger.error(f"Unexpected error updating company: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")
