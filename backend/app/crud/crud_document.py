from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from fastapi import HTTPException, UploadFile
from typing import Dict, Any, List, Optional
import os
import shutil
import json
from datetime import datetime, timedelta
import logging
from app.models import Document as DocumentModel, DocumentMetadata, DocumentWorkflow, Workflow
from app.schemas.document import DocumentCreate, Document, DocumentResponse

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def create_document(
    db: Session,
    file: UploadFile,
    file_location: str,
    file_size: int,
    metadata_dict: Dict[str, Any],
    current_user_id: int,
    company_id: int
) -> DocumentModel:
    """Create a new document with metadata and workflow"""
    
    # Create document in database
    db_document = DocumentModel(
        title=metadata_dict.get('title', file.filename),
        file_path=file_location,
        file_type=file.content_type,
        file_size=file_size,
        owner_id=current_user_id,
        company_id=company_id,
        content=metadata_dict.get('description', ''),
    )
    db.add(db_document)
    db.flush()  # Get the ID without committing
    
    # Add additional metadata
    for key, value in metadata_dict.items():
        if key not in ['title', 'description']:
            db_metadata = DocumentMetadata(
                document_id=db_document.id,
                key=key,
                value=str(value)
            )
            db.add(db_metadata)
    
    # Create workflow
    workflow = db.query(Workflow).filter(
        Workflow.name == "Document Approval Workflow",
        Workflow.company_id == company_id
    ).first()
    
    if workflow:
        document_workflow = DocumentWorkflow(
            document_id=db_document.id,
            workflow_id=workflow.id,
            current_step=1,
            status="in_progress",
            started_at=datetime.utcnow(),
            timeout_at=datetime.utcnow() + timedelta(hours=24)
        )
        db.add(document_workflow)
    
    db.commit()
    db.refresh(db_document)
    return db_document

def get_documents(
    db: Session,
    company_id: int,
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    type: Optional[str] = None,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    sort_by: str = "uploadDate"
) -> Dict[str, Any]:
    """Get list of documents with filters and pagination"""
    
    query = db.query(DocumentModel).filter(
        DocumentModel.company_id == company_id,
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

    # Apply sorting
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

def get_document_by_id(db: Session, document_id: int, company_id: int) -> Optional[DocumentModel]:
    """Get a specific document by ID"""
    return db.query(DocumentModel).filter(
        DocumentModel.id == document_id,
        DocumentModel.company_id == company_id,
        DocumentModel.is_deleted == False
    ).first()

def get_document_with_metadata(db: Session, document_id: int, company_id: int) -> Dict[str, Any]:
    """Get document with its metadata"""
    document = get_document_by_id(db, document_id, company_id)
    if not document:
        return None
        
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

def update_document_metadata(
    db: Session,
    document_id: int,
    metadata: Dict[str, Any],
    company_id: int
) -> bool:
    """Update document metadata"""
    document = get_document_by_id(db, document_id, company_id)
    if not document:
        return False

    for key, value in metadata.items():
        existing_metadata = db.query(DocumentMetadata).filter(
            DocumentMetadata.document_id == document_id,
            DocumentMetadata.key == key
        ).first()

        if existing_metadata:
            existing_metadata.value = str(value)
        else:
            new_metadata = DocumentMetadata(
                document_id=document_id,
                key=key,
                value=str(value)
            )
            db.add(new_metadata)

    document.updated_at = datetime.utcnow()
    db.commit()
    return True

def soft_delete_document(db: Session, document_id: int, company_id: int) -> bool:
    """Soft delete a document"""
    document = get_document_by_id(db, document_id, company_id)
    if not document:
        return False

    document.is_deleted = True
    document.updated_at = datetime.utcnow()
    db.commit()
    return True

def batch_operation_documents(
    db: Session,
    operation: str,
    document_ids: List[int],
    company_id: int
) -> bool:
    """Perform batch operations on documents"""
    documents = db.query(DocumentModel).filter(
        DocumentModel.id.in_(document_ids),
        DocumentModel.company_id == company_id
    ).all()

    if len(documents) != len(document_ids):
        return False

    if operation == "delete":
        for doc in documents:
            doc.is_deleted = True
            doc.updated_at = datetime.utcnow()
    elif operation == "archive":
        # Implement archive logic here
        pass
    elif operation == "share":
        # Implement share logic here
        pass

    db.commit()
    return True

def cleanup_deleted_documents(db: Session, company_id: int) -> Dict[str, Any]:
    """Clean up permanently deleted documents"""
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    deleted_documents = db.query(DocumentModel).filter(
        DocumentModel.is_deleted == True,
        DocumentModel.updated_at < thirty_days_ago,
        DocumentModel.company_id == company_id
    ).all()

    deleted_count = 0
    for document in deleted_documents:
        db.query(DocumentMetadata).filter(
            DocumentMetadata.document_id == document.id
        ).delete()

        if os.path.exists(document.file_path):
            try:
                os.remove(document.file_path)
            except OSError as e:
                logger.error(f"Error deleting file {document.file_path}: {e}")

        db.delete(document)
        deleted_count += 1

    db.commit()
    return {
        "message": f"Successfully cleaned up {deleted_count} documents",
        "details": f"Removed documents deleted before {thirty_days_ago}"
    }