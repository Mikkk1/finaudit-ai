from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.document import DocumentCreate, Document
from app.models import Document as DocumentModel
from datetime import datetime
import os
import json
import shutil
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
import logging
import traceback
from app.routers.auth import get_current_user  # Import the get_current_user function
from app.models import User  # Import the User model
import uuid

router = APIRouter()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

UPLOAD_DIR = "uploads"
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

def save_upload_file(file: UploadFile, destination: str):
    try:
        with open(destination, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    finally:
        file.file.close()

def delete_file(path: str):
    try:
        os.remove(path)
    except OSError as e:
        logger.error(f"Error deleting file {path}: {e}")
def format_filename(pattern: str, user_id: int, company_id: int, original_filename: str) -> str:
    """
    Formats the filename based on the provided pattern.
    """
    # Extract file extension
    file_extension = os.path.splitext(original_filename)[1]

    # Replace placeholders with actual values
    formatted_name = pattern.format(
        timestamp=datetime.now().strftime("%Y%m%d_%H%M%S"),  # YYYYMMDD_HHMMSS
        user_id=user_id,
        company_id=company_id,
        original_name=os.path.splitext(original_filename)[0],  # Remove extension
        unique_id=str(uuid.uuid4())[:8],  # Short UUID
        extension=file_extension,
    )

    return formatted_name
@router.post("/documents", response_model=Document)
async def create_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    metadata: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        # Validate file type
        if file.content_type not in ["application/pdf", "image/jpeg", "image/png"]:
            raise HTTPException(status_code=400, detail="Invalid file type. Only PDF, JPEG, and PNG are allowed.")

        # Validate file size
        file_size = len(await file.read())
        await file.seek(0)
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"File size exceeds the limit of {MAX_FILE_SIZE / 1024 / 1024} MB")

        # Parse metadata
        metadata_dict = json.loads(metadata)

        # Format the filename
        filename_pattern = "{timestamp}_{user_id}_{company_id}_{original_name}_{unique_id}{extension}"
        formatted_filename = format_filename(
            pattern=filename_pattern,
            user_id=current_user.id,
            company_id=current_user.company_id,
            original_filename=file.filename,
        )

        # Define the upload directory and file path
        upload_dir = os.path.join(UPLOAD_DIR, "documents")
        os.makedirs(upload_dir, exist_ok=True)  # Create the directory if it doesn't exist
        file_location = os.path.join(upload_dir, formatted_filename)

        # Save the uploaded file
        save_upload_file(file, file_location)

        # Create document in database
        db_document = DocumentModel(
            title=metadata_dict.get('title', file.filename),  # Use original filename as fallback title
            file_path=file_location,
            file_type=file.content_type,
            file_size=file_size,
            owner_id=current_user.id,  # Use the current user's ID
            company_id=int(current_user.company_id),  # Use the current user's company ID
            content=metadata_dict.get('description', ''),
        )
        db.add(db_document)
        db.commit()
        db.refresh(db_document)

        return db_document
    except json.JSONDecodeError as e:
        logger.error(f"JSON Decode Error: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid JSON in metadata")
    except SQLAlchemyError as e:
        logger.error(f"Database Error: {str(e)}")
        background_tasks.add_task(delete_file, file_location)
        db.rollback()
        raise HTTPException(status_code=500, detail="An error occurred while saving the document")
    except Exception as e:
        logger.error(f"Unexpected Error: {str(e)}")
        logger.error(traceback.format_exc())
        if 'file_location' in locals():
            background_tasks.add_task(delete_file, file_location)
        raise HTTPException(status_code=500, detail="An unexpected error occurred")

@router.get("/documents", response_model=List[Document])
def list_documents(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    try:
        documents = db.query(DocumentModel).filter(
            DocumentModel.is_deleted == False
        ).offset(skip).limit(limit).all()
        return documents
    except SQLAlchemyError as e:
        logger.error(f"Database Error: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred while fetching documents")

@router.get("/documents/{document_id}", response_model=Document)
def get_document(document_id: int, db: Session = Depends(get_db)):
    try:
        document = db.query(DocumentModel).filter(
            DocumentModel.id == document_id,
            DocumentModel.is_deleted == False
        ).first()
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        return document
    except SQLAlchemyError as e:
        logger.error(f"Database Error: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred while fetching the document")

@router.put("/documents/{document_id}", response_model=Document)
def update_document(document_id: int, document: DocumentCreate, db: Session = Depends(get_db)):
    try:
        db_document = db.query(DocumentModel).filter(
            DocumentModel.id == document_id,
            DocumentModel.is_deleted == False
        ).first()
        if not db_document:
            raise HTTPException(status_code=404, detail="Document not found")

        for key, value in document.dict().items():
            setattr(db_document, key, value)

        db_document.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_document)
        return db_document
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database Error: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred while updating the document")

@router.delete("/documents/{document_id}", response_model=Document)
def delete_document(document_id: int, db: Session = Depends(get_db)):
    try:
        document = db.query(DocumentModel).filter(
            DocumentModel.id == document_id,
            DocumentModel.is_deleted == False
        ).first()
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")

        document.is_deleted = True
        document.updated_at = datetime.utcnow()
        db.commit()
        return document
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database Error: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred while deleting the document")

