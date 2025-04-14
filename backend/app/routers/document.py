# app/routers/document_routes.py

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from fastapi import BackgroundTasks
from app.database import get_db
from app.models import User
from app.cruds.document import (
    create_document, list_documents, batch_operation, get_document, get_document_content,
    update_document_metadata, delete_document, cleanup_deleted_documents,download_document
)
from app.routers.auth import get_current_user
from app.schemas.document import Document
from app.schemas.error import ErrorResponse  # Import the ErrorResponse class
from app.tasks import process_pdf, process_excel, process_csv, process_image  # Import your task functions
from fastapi.responses import JSONResponse

router = APIRouter()

router = APIRouter()

@router.post("/documents")
async def create_document_route(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    file: UploadFile = File(...),
    metadata: str = Form(...),
):
    document = create_document(db, file, metadata, current_user)
    
    # Add the appropriate background task based on file type
    if document.file_type == "application/pdf":
        background_tasks.add_task(process_pdf, document.file_path, document.id)
    elif document.file_type in ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"]:
        background_tasks.add_task(process_excel, document.file_path, document.id)
    elif document.file_type == "text/csv":
        background_tasks.add_task(process_csv, document.file_path, document.id)
    elif document.file_type in ["image/jpeg", "image/png"]:
        background_tasks.add_task(process_image, document.file_path, document.id)
    print('Background task added', document.file_type)
    return {"message": "Document created successfully"}


@router.get("/documents", response_model=Dict[str, Any])
async def list_documents_route(
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
    return list_documents(db, current_user, page, limit, search, type, status, date_from, date_to, sort_by)

@router.post("/documents/batch", responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
async def batch_operation_route(
    operation: str,
    document_ids: List[int],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return batch_operation(db, operation, document_ids, current_user)

@router.get("/documents/{document_id}", response_model=Dict[str, Any])
async def get_document_route(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_document(db, document_id, current_user)

@router.get("/documents/{document_id}/content", responses={404: {"model": ErrorResponse}})
async def get_document_content_route(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_document_content(db, document_id, current_user)

@router.get("/documents/{document_id}/download", responses={404: {"model": ErrorResponse}})
async def download_document_route(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return download_document(db, document_id, current_user)
@router.post("/documents/{document_id}/metadata", response_model=Dict[str, Any])
async def update_document_metadata_route(
    document_id: int,
    metadata: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return update_document_metadata(db, document_id, metadata, current_user)

@router.delete("/documents/{document_id}", response_model=Dict[str, str], responses={404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
async def delete_document_route(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return delete_document(db, document_id, current_user)

@router.post("/documents/cleanup", response_model=Dict[str, str])
async def cleanup_deleted_documents_route(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return cleanup_deleted_documents(db, current_user)