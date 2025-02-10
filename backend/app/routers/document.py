from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Optional, Dict, Any
import os
import json
import shutil
import uuid
import logging
import traceback
from datetime import datetime, timedelta
from fastapi.responses import StreamingResponse

from app.database import get_db
from app.schemas.document import DocumentCreate, Document, DocumentMetadata,DocumentResponse
from app.models import Document as DocumentModel, DocumentMetadata,Workflow, DocumentWorkflow
from app.routers.auth import get_current_user
from app.models import User
from pydantic import ValidationError, BaseModel
from sqlalchemy import or_, desc

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

class ErrorResponse(BaseModel):
    """
    Standard error response model
    """
    error: str
    details: Optional[str] = None

def validate_file(file: UploadFile):
    """
    Validate uploaded file for type and size.
    
    Args:
        file (UploadFile): Uploaded file to validate
    
    Raises:
        HTTPException: If file is invalid
    """
    if file.content_type not in ALLOWED_FILE_TYPES:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Allowed types are: {', '.join(ALLOWED_FILE_TYPES)}"
        )

def save_upload_file(file: UploadFile, destination: str):
    """
    Save uploaded file to specified destination.
    
    Args:
        file (UploadFile): File to save
        destination (str): File path to save
    
    Raises:
        HTTPException: If file saving fails
    """
    try:
        with open(destination, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        logger.error(f"Error saving file {destination}: {e}")
        raise HTTPException(status_code=500, detail="File upload failed")
    finally:
        file.file.close()

def delete_file(path: str):
    """
    Delete a file safely.
    
    Args:
        path (str): Path to file to delete
    """
    try:
        if os.path.exists(path):
            os.remove(path)
    except OSError as e:
        logger.error(f"Error deleting file {path}: {e}")

def format_filename(pattern: str, user_id: int, company_id: int, original_filename: str) -> str:
    """
    Format filename with specified pattern.
    
    Args:
        pattern (str): Filename pattern
        user_id (int): User ID
        company_id (int): Company ID
        original_filename (str): Original filename
    
    Returns:
        str: Formatted filename
    """
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
    """
    Parse and validate metadata JSON.
    
    Args:
        metadata (str): Metadata JSON string
    
    Returns:
        Dict[str, Any]: Parsed metadata
    
    Raises:
        HTTPException: If metadata is invalid
    """
    try:
        return json.loads(metadata)
    except json.JSONDecodeError as e:
        logger.error(f"Invalid metadata JSON: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid metadata format")

@router.post("/documents", response_model=Document, responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
async def create_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    metadata: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new document with file upload and metadata.
    
    Args:
        background_tasks (BackgroundTasks): Background task manager
        file (UploadFile): File to upload
        metadata (str): Metadata JSON string
        db (Session): Database session
        current_user (User): Authenticated user
    
    Returns:
        Document: Created document details
    """
    file_location = None
    try:
        # Validate file
        validate_file(file)
        
        # Read file size
        file_size = len(await file.read())
        await file.seek(0)
        
        # Check file size
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400, 
                detail=f"File size exceeds limit of {MAX_FILE_SIZE / 1024 / 1024} MB"
            )
        
        # Parse metadata
        metadata_dict = parse_metadata(metadata)
        
        # Create upload directory if not exists
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
        
        # Full file path
        file_location = os.path.join(upload_dir, formatted_filename)
        
        # Save file
        save_upload_file(file, file_location)
        
        # Create document in database
        db_document = DocumentModel(
            title=metadata_dict.get('title', file.filename),
            file_path=file_location,
            file_type=file.content_type,
            file_size=file_size,
            owner_id=current_user.id,
            company_id=int(current_user.company_id),
            content=metadata_dict.get('description', ''),
        )
        db.add(db_document)
        db.commit()
        db.refresh(db_document)
        
        # Add additional metadata
        for key, value in metadata_dict.items():
            if key not in ['title', 'description']:
                db_metadata = DocumentMetadata(
                    document_id=db_document.id,
                    key=key,
                    value=str(value)
                )
                db.add(db_metadata)
        
        # Fetch the "Document Approval Workflow"
        workflow = db.query(Workflow).filter(
            Workflow.name == "Document Approval Workflow",
            Workflow.company_id == current_user.company_id
        ).first()

        if not workflow:
            raise HTTPException(
                status_code=404,
                detail="Document Approval Workflow not found"
            )

        # Create a DocumentWorkflow entry
        document_workflow = DocumentWorkflow(
            document_id=db_document.id,
            workflow_id=workflow.id,
            current_step=1,  # Start at step 1
            status="in_progress",  # Initial status
            started_at=datetime.utcnow(),
            timeout_at=datetime.utcnow() + timedelta(hours=24)  # Timeout for the first step
        )
        db.add(document_workflow)
        db.commit()

        return db_document
    
    except ValidationError as e:
        logger.error(f"Validation Error: {e}")
        if file_location:
            background_tasks.add_task(delete_file, file_location)
        raise HTTPException(status_code=422, detail=str(e))
    
    except SQLAlchemyError as e:
        logger.error(f"Database Error: {str(e)}")
        logger.error(traceback.format_exc())
        if file_location:
            background_tasks.add_task(delete_file, file_location)
        db.rollback()
        raise HTTPException(status_code=500, detail="Database operation failed")
    
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        if file_location:
            background_tasks.add_task(delete_file, file_location)
        raise
    
    except Exception as e:
        logger.error(f"Unexpected Error: {str(e)}")
        logger.error(traceback.format_exc())
        if file_location:
            background_tasks.add_task(delete_file, file_location)
        raise HTTPException(status_code=500, detail="An unexpected error occurred")

@router.get("/documents", response_model=Dict[str, Any])
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
        query = db.query(DocumentModel).filter(
            DocumentModel.company_id == current_user.company_id,
            DocumentModel.is_deleted == False
        )

        if search:
            query = query.filter(or_(
                DocumentModel.title.ilike(f"%{search}%"),
                DocumentModel.content.ilike(f"%{search}%"),
                DocumentMetadata.value.ilike(f"%{search}%")
            )).join(DocumentMetadata, isouter=True)

        if type:
            query = query.filter(DocumentModel.file_type == type)

        if status:
            query = query.join(DocumentWorkflow).filter(DocumentWorkflow.status == status)

        if date_from:
            query = query.filter(DocumentModel.created_at >= date_from)

        if date_to:
            query = query.filter(DocumentModel.created_at <= date_to)

        # Sorting
        if sort_by == "name":
            query = query.order_by(DocumentModel.title)
        elif sort_by == "size":
            query = query.order_by(DocumentModel.file_size)
        elif sort_by == "type":
            query = query.order_by(DocumentModel.file_type)
        else:  # Default to uploadDate
            query = query.order_by(desc(DocumentModel.created_at))

        total = query.count()
        documents = query.offset((page - 1) * limit).limit(limit).all()

        # Fetch workflow status for each document
        document_responses = []
        for doc in documents:
            workflow = db.query(DocumentWorkflow).filter(
                DocumentWorkflow.document_id == doc.id
            ).order_by(DocumentWorkflow.id.desc()).first()
            
            workflow_status = workflow.status if workflow else "Not Started"
            
            doc_response = DocumentResponse.from_orm(doc)
            doc_response.workflow_status = workflow_status
            document_responses.append(doc_response)

        return {
            "documents": document_responses,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit
        }
    except Exception as e:
        logger.error(f"Error in list_documents: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred while retrieving documents")



@router.post("/documents/batch", responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
async def batch_operation(
    operation: str,
    document_ids: List[int],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Perform batch operations on documents.
    
    Args:
        operation (str): Type of operation (delete, archive, share)
        document_ids (List[int]): List of document IDs
        db (Session): Database session
        current_user (User): Authenticated user
    
    Returns:
        Dict[str, str]: Operation result message
    """
    try:
        if operation not in ["delete", "archive", "share"]:
            raise HTTPException(status_code=400, detail="Invalid operation")

        documents = db.query(DocumentModel).filter(
            DocumentModel.id.in_(document_ids),
            DocumentModel.company_id == current_user.company_id
        ).all()

        if len(documents) != len(document_ids):
            raise HTTPException(status_code=404, detail="One or more documents not found")

        if operation == "delete":
            for doc in documents:
                doc.is_deleted = True
                doc.updated_at = datetime.utcnow()
        elif operation == "archive":
            # Implement archive logic
            logger.info(f"Archiving documents: {document_ids}")
            # Add your archive-specific logic here
        elif operation == "share":
            # Implement share logic
            logger.info(f"Sharing documents: {document_ids}")
            # Add your share-specific logic here

        db.commit()
        return {"message": f"Batch {operation} operation completed successfully"}
    
    except SQLAlchemyError as e:
        logger.error(f"Database Error in batch_operation: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Error performing batch operation")

@router.get("/documents/{document_id}", response_model=Document, responses={404: {"model": ErrorResponse}})
async def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    document = db.query(DocumentModel).filter(
        DocumentModel.id == document_id,
        DocumentModel.company_id == current_user.company_id,
        DocumentModel.is_deleted == False
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    return document

@router.get("/documents/{document_id}", response_model=Dict[str, Any])
async def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    document = db.query(DocumentModel).filter(
        DocumentModel.id == document_id,
        DocumentModel.company_id == current_user.company_id,
        DocumentModel.is_deleted == False
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Fetch metadata
    metadata = db.query(DocumentMetadata).filter(
        DocumentMetadata.document_id == document_id
    ).all()

    metadata_dict = {m.key: m.value for m in metadata}

    return {
        "id": document.id,
        "title": document.title,
        "file_type": document.file_type,
        "file_size": document.file_size,
        "name": document.title,
        "metadata": metadata_dict
    }

@router.get("/documents/{document_id}/content", responses={404: {"model": ErrorResponse}})
async def get_document_content(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    document = db.query(DocumentModel).filter(
        DocumentModel.id == document_id,
        DocumentModel.company_id == current_user.company_id,
        DocumentModel.is_deleted == False
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Stream the document content
    def iterfile():
        with open(document.file_path, "rb") as file:
            yield from file
    print('iterfile',iterfile())
    return StreamingResponse(iterfile(), media_type=document.file_type)

@router.post("/documents/{document_id}/metadata", response_model=Dict[str, Any])
async def update_document_metadata(
    document_id: int,
    metadata: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Verify document exists and belongs to user's company
        document = db.query(DocumentModel).filter(
            DocumentModel.id == document_id,
            DocumentModel.company_id == current_user.company_id,
            DocumentModel.is_deleted == False
        ).first()

        if not document:
            raise HTTPException(status_code=404, detail="Document not found")

        # Update or add metadata
        for key, value in metadata.items():
            existing_metadata = db.query(DocumentMetadata).filter(
                DocumentMetadata.document_id == document_id,
                DocumentMetadata.key == key
            ).first()

            if existing_metadata:
                # Update existing metadata
                existing_metadata.value = str(value)
            else:
                # Create new metadata
                new_metadata = DocumentMetadata(
                    document_id=document_id,
                    key=key,
                    value=str(value)
                )
                db.add(new_metadata)

        document.updated_at = datetime.utcnow()
        db.commit()

        return {"message": "Metadata updated successfully", "metadata": metadata}
    
    except SQLAlchemyError as e:
        logger.error(f"Database Error in update_document_metadata: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Error updating metadata")
@router.delete("/documents/{document_id}", response_model=Dict[str, str], responses={404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
async def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Soft delete a specific document.
    
    Args:
        document_id (int): ID of the document to delete
        db (Session): Database session
        current_user (User): Authenticated user
    
    Returns:
        Dict[str, str]: Deletion confirmation message
    """
    try:
        document = db.query(DocumentModel).filter(
            DocumentModel.id == document_id,
            DocumentModel.company_id == current_user.company_id,
            DocumentModel.is_deleted == False
        ).first()

        if not document:
            raise HTTPException(status_code=404, detail="Document not found")

        document.is_deleted = True
        document.updated_at = datetime.utcnow()
        db.commit()


        return {"message": "Document deleted successfully"}
    except SQLAlchemyError as e:
            logger.error(f"Database Error in delete_document: {str(e)}")
            db.rollback()
            raise HTTPException(status_code=500, detail="Error deleting document")

# Optional: File Cleanup Background Task
@router.post("/documents/cleanup", response_model=Dict[str, str])
async def cleanup_deleted_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cleanup permanently deleted documents and their associated files.
    
    Args:
        db (Session): Database session
        current_user (User): Authenticated user
    
    Returns:
        Dict[str, str]: Cleanup operation result
    """
    try:
        # Find documents marked as deleted older than 30 days
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        deleted_documents = db.query(DocumentModel).filter(
            DocumentModel.is_deleted == True,
            DocumentModel.updated_at < thirty_days_ago,
            DocumentModel.company_id == current_user.company_id
        ).all()

        deleted_count = 0
        for document in deleted_documents:
            # Delete associated metadata
            db.query(DocumentMetadata).filter(
                DocumentMetadata.document_id == document.id
            ).delete()

            # Delete file from filesystem
            if os.path.exists(document.file_path):
                try:
                    os.remove(document.file_path)
                except OSError as e:
                    logger.error(f"Error deleting file {document.file_path}: {e}")

            # Remove document from database
            db.delete(document)
            deleted_count += 1

        db.commit()
        return {
            "message": f"Successfully cleaned up {deleted_count} documents",
            "details": f"Removed documents deleted before {thirty_days_ago}"
        }
    
    except SQLAlchemyError as e:
        logger.error(f"Database Error in cleanup_documents: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Error cleaning up documents")

# Optional: Document Metadata Management Routes
@router.post("/documents/{document_id}/metadata", response_model=Dict[str, Any])
async def add_document_metadata(
    document_id: int,
    metadata: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add or update metadata for a specific document.
    
    Args:
        document_id (int): ID of the document
        metadata (Dict[str, Any]): Metadata to add
        db (Session): Database session
        current_user (User): Authenticated user
    
    Returns:
        Dict[str, Any]: Added metadata
    """
    try:
        # Verify document exists and belongs to user's company
        document = db.query(DocumentModel).filter(
            DocumentModel.id == document_id,
            DocumentModel.company_id == current_user.company_id,
            DocumentModel.is_deleted == False
        ).first()

        if not document:
            raise HTTPException(status_code=404, detail="Document not found")

        # Add or update metadata
        for key, value in metadata.items():
            existing_metadata = db.query(DocumentMetadata).filter(
                DocumentMetadata.document_id == document_id,
                DocumentMetadata.key == key
            ).first()

            if existing_metadata:
                # Update existing metadata
                existing_metadata.value = str(value)
            else:
                # Create new metadata
                new_metadata = DocumentMetadata(
                    document_id=document_id,
                    key=key,
                    value=str(value)
                )
                db.add(new_metadata)

        db.commit()
        return {"message": "Metadata added successfully", "metadata": metadata}
    
    except SQLAlchemyError as e:
        logger.error(f"Database Error in add_document_metadata: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Error adding metadata")

