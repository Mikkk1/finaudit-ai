from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Optional, Dict, Any
import os
import json
import shutil
import uuid
import logging
from datetime import datetime
from fastapi.responses import StreamingResponse

from app.database import get_db
from app.schemas.document import Document, DocumentResponse
from app.models import User
from app.routers.auth import get_current_user
from app.crud import crud_document as crud_document  # Import the CRUD operations

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

router = APIRouter()

# Configuration Constants
UPLOAD_DIR = "uploads"
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"]

def validate_file(file: UploadFile):
    """Validate uploaded file for type and size."""
    if file.content_type not in ALLOWED_FILE_TYPES:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Allowed types are: {', '.join(ALLOWED_FILE_TYPES)}"
        )

def save_upload_file(file: UploadFile, destination: str):
    """Save uploaded file to specified destination."""
    try:
        with open(destination, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        logger.error(f"Error saving file {destination}: {e}")
        raise HTTPException(status_code=500, detail="File upload failed")
    finally:
        file.file.close()

def delete_file(path: str):
    """Delete a file safely."""
    try:
        if os.path.exists(path):
            os.remove(path)
    except OSError as e:
        logger.error(f"Error deleting file {path}: {e}")

def format_filename(pattern: str, user_id: int, company_id: int, original_filename: str) -> str:
    """Format filename with specified pattern."""
    file_extension = os.path.splitext(original_filename)[1]
    formatted_name = pattern.format(
        timestamp=datetime.now().strftime("%Y%m%d_%H%M%S"),
        user_id=user_id,
        company_id=company_id,
        original_name=os.path.splitext(original_filename)[0],
        unique_id=str(uuid.uuid4())[:8],
        extension=file_extension,
    )
    return formatted_name

def parse_metadata(metadata: str) -> Dict[str, Any]:
    """Parse and validate metadata JSON."""
    try:
        return json.loads(metadata)
    except json.JSONDecodeError as e:
        logger.error(f"Invalid metadata JSON: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid metadata format")

@router.post("/documents", response_model=Document)
async def create_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    metadata: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    file_location = None
    try:
        # Validate file
        validate_file(file)
        
        # Read file size
        file_size = len(await file.read())
        await file.seek(0)
        
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400, 
                detail=f"File size exceeds limit of {MAX_FILE_SIZE / 1024 / 1024} MB"
            )
        
        metadata_dict = parse_metadata(metadata)
        
        # Create upload directory
        upload_dir = os.path.join(UPLOAD_DIR, "documents")
        os.makedirs(upload_dir, exist_ok=True)
        
        # Format filename
        filename_pattern = "{timestamp}_{user_id}_{company_id}_{original_name}_{unique_id}{extension}"
        formatted_filename = format_filename(
            pattern=filename_pattern,
            user_id=current_user.id,
            company_id=current_user.company_id,
            original_filename=file.filename,
        )
        
        file_location = os.path.join(upload_dir, formatted_filename)
        save_upload_file(file, file_location)
        
        return crud_document.create_document(
            db=db,
            file=file,
            file_location=file_location,
            file_size=file_size,
            metadata_dict=metadata_dict,
            current_user_id=current_user.id,
            company_id=current_user.company_id
        )
    except Exception as e:
        if file_location:
            background_tasks.add_task(delete_file, file_location)
        logger.error(f"Error in create_document: {str(e)}")
        raise HTTPException(status_code=500, detail="Document creation failed")

@router.get("/documents")
async def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    type: Optional[str] = None,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    sort_by: str = "uploadDate"
):
    try:
        return crud_document.get_documents(
            db=db,
            company_id=current_user.company_id,
            page=page,
            limit=limit,
            search=search,
            type=type,
            status=status,
            date_from=date_from,
            date_to=date_to,
            sort_by=sort_by
        )
    except Exception as e:
        logger.error(f"Error in list_documents: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving documents")

@router.get("/documents/{document_id}")
async def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    document = crud_document.get_document_with_metadata(db, document_id, current_user.company_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document

@router.get("/documents/{document_id}/content")
async def get_document_content(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    document = crud_document.get_document_by_id(db, document_id, current_user.company_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    def iterfile():
        with open(document.file_path, "rb") as file:
            yield from file

    return StreamingResponse(iterfile(), media_type=document.file_type)

@router.post("/documents/{document_id}/metadata")
async def update_document_metadata(
    document_id: int,
    metadata: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        success = crud_document.update_document_metadata(
            db, document_id, metadata, current_user.company_id
        )
        if not success:
            raise HTTPException(status_code=404, detail="Document not found")
        return {"message": "Metadata updated successfully", "metadata": metadata}
    except SQLAlchemyError as e:
        logger.error(f"Database Error in update_document_metadata: {str(e)}")
        raise HTTPException(status_code=500, detail="Error updating metadata")

@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    success = crud_document.soft_delete_document(db, document_id, current_user.company_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"message": "Document deleted successfully"}

@router.post("/documents/batch")
async def batch_operation(
    operation: str,
    document_ids: List[int],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if operation not in ["delete", "archive", "share"]:
        raise HTTPException(status_code=400, detail="Invalid operation")

    success = crud_document.batch_operation_documents(
        db, operation, document_ids, current_user.company_id
    )
    if not success:
        raise HTTPException(status_code=404, detail="One or more documents not found")
    return {"message": f"Batch {operation} operation completed successfully"}

@router.post("/documents/cleanup")
async def cleanup_deleted_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        return crud_document.cleanup_deleted_documents(db, current_user.company_id)
    except SQLAlchemyError as e:
        logger.error(f"Database Error in cleanup_documents: {str(e)}")
        raise HTTPException(status_code=500, detail="Error cleaning up documents")