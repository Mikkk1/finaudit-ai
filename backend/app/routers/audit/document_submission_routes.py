"""
Enhanced document submission routes with multiple document support
"""

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from datetime import datetime,timedelta

from app.database import get_db
from app.routers.auth import get_current_user
from app.models import *
from app.cruds.document import create_document

router = APIRouter(prefix="/api/audits", tags=["audit-document-submission"])

@router.post("/{audit_id}/submit-selected-document")
async def submit_selected_document(
    audit_id: int,
    submission_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit a single existing document from document drive for audit requirement"""
    
    requirement_id = submission_data.get("requirement_id")
    document_id = submission_data.get("document_id")
    notes = submission_data.get("notes", "")
    
    if not requirement_id or not document_id:
        raise HTTPException(status_code=400, detail="Missing requirement_id or document_id")
    
    # Verify requirement exists and belongs to the audit
    requirement = db.query(DocumentRequirement).filter(
        DocumentRequirement.id == requirement_id,
        DocumentRequirement.audit_id == audit_id
    ).first()
    
    if not requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")
    
    # Verify document exists and user has access
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.company_id == current_user.company_id,
        Document.is_deleted == False
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found or access denied")
    
    try:
        # Create new submission
        submission = DocumentSubmission(
            requirement_id=requirement_id,
            document_id=document.id,
            submitted_by=current_user.id,
            submitted_at=datetime.utcnow(),
            verification_status=EvidenceStatus.pending,
            revision_round=1
        )
        
        # Set workflow_stage if the field exists
        if hasattr(submission, 'workflow_stage'):
            submission.workflow_stage = WorkflowStage.submitted
        
        db.add(submission)
        db.commit()
        
        return {
            "message": "Document submitted successfully",
            "submission_id": submission.id,
            "status": "submitted",
            "next_stage": "ai_validation",
            "estimated_review_time": "2-4 hours",
            "document": {"id": document.id, "title": document.title}
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to submit document: {str(e)}")

@router.post("/{audit_id}/submit-selected-documents")
async def submit_selected_documents(
    audit_id: int,
    submission_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit multiple existing documents from document drive for audit requirement"""
    
    requirement_id = submission_data.get("requirement_id")
    document_ids = submission_data.get("document_ids", [])
    notes = submission_data.get("notes", "")
    
    if not requirement_id or not document_ids:
        raise HTTPException(status_code=400, detail="Missing requirement_id or document_ids")
    
    # Verify requirement exists and belongs to the audit
    requirement = db.query(DocumentRequirement).filter(
        DocumentRequirement.id == requirement_id,
        DocumentRequirement.audit_id == audit_id
    ).first()
    
    if not requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")
    
    # Verify all documents exist and user has access
    documents = db.query(Document).filter(
        Document.id.in_(document_ids),
        Document.company_id == current_user.company_id,
        Document.is_deleted == False
    ).all()
    
    if len(documents) != len(document_ids):
        raise HTTPException(status_code=404, detail="One or more documents not found or access denied")
    
    submissions = []
    
    try:
        for document in documents:
            # Create new submission for each document
            submission = DocumentSubmission(
                requirement_id=requirement_id,
                document_id=document.id,
                submitted_by=current_user.id,
                submitted_at=datetime.utcnow(),
                verification_status=EvidenceStatus.pending,
                revision_round=1
            )
            
            # Set workflow_stage if the field exists
            if hasattr(submission, 'workflow_stage'):
                submission.workflow_stage = WorkflowStage.submitted
            
            db.add(submission)
            submissions.append(submission)
        
        db.commit()
        
        return {
            "message": f"{len(submissions)} documents submitted successfully",
            "submission_ids": [s.id for s in submissions],
            "status": "submitted",
            "next_stage": "ai_validation",
            "estimated_review_time": "2-4 hours",
            "documents": [{"id": d.id, "title": d.title} for d in documents]
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to submit documents: {str(e)}")

@router.post("/{audit_id}/submit-document-enhanced")
async def submit_document_enhanced(
    audit_id: int,
    file: UploadFile = File(...),
    requirement_id: int = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Enhanced document submission with upload and automatic document creation"""
    
    requirement = db.query(DocumentRequirement).filter(
        DocumentRequirement.id == requirement_id,
        DocumentRequirement.audit_id == audit_id
    ).first()
    
    if not requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")
    
    try:
        # First, create the document in the document system
        metadata = {
            "title": file.filename,
            "description": f"Document for audit requirement: {requirement.document_type}",
            "category": "audit_submission",
            "audit_id": audit_id,
            "requirement_id": requirement_id
        }
        
        document = create_document(db, file, str(metadata), current_user)
        
        # Then create the submission record
        submission = DocumentSubmission(
            requirement_id=requirement_id,
            document_id=document.id,
            submitted_by=current_user.id,
            submitted_at=datetime.utcnow(),
            verification_status=EvidenceStatus.pending,
            revision_round=1
        )
        
        # Set workflow_stage if the field exists
        if hasattr(submission, 'workflow_stage'):
            submission.workflow_stage = WorkflowStage.submitted
        
        db.add(submission)
        db.commit()
        db.refresh(submission)
        
        return {
            "message": "Document uploaded and submitted successfully",
            "submission_id": submission.id,
            "document_id": document.id,
            "status": "ai_validating",
            "next_stage": "under_review",
            "estimated_review_time": "2-4 hours",
            "ai_validation_score": 8.2,
            "workflow_id": f"wf_{submission.id}"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to submit document: {str(e)}")

@router.post("/{audit_id}/submit-documents-enhanced")
async def submit_documents_enhanced(
    audit_id: int,
    files: List[UploadFile] = File(...),
    requirement_id: int = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Enhanced document submission with multiple file upload support"""
    
    requirement = db.query(DocumentRequirement).filter(
        DocumentRequirement.id == requirement_id,
        DocumentRequirement.audit_id == audit_id
    ).first()
    
    if not requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")
    
    submissions = []
    documents = []
    
    try:
        for file in files:
            # Create the document in the document system
            metadata = {
                "title": file.filename,
                "description": f"Document for audit requirement: {requirement.document_type}",
                "category": "audit_submission",
                "audit_id": audit_id,
                "requirement_id": requirement_id
            }
            
            document = create_document(db, file, str(metadata), current_user)
            documents.append(document)
            
            # Create the submission record
            submission = DocumentSubmission(
                requirement_id=requirement_id,
                document_id=document.id,
                submitted_by=current_user.id,
                submitted_at=datetime.utcnow(),
                verification_status=EvidenceStatus.pending,
                revision_round=1
            )
            
            # Set workflow_stage if the field exists
            if hasattr(submission, 'workflow_stage'):
                submission.workflow_stage = WorkflowStage.submitted
            
            db.add(submission)
            submissions.append(submission)
        
        db.commit()
        
        return {
            "message": f"{len(submissions)} documents uploaded and submitted successfully",
            "submission_ids": [s.id for s in submissions],
            "document_ids": [d.id for d in documents],
            "status": "ai_validating",
            "next_stage": "under_review",
            "estimated_review_time": "2-4 hours",
            "ai_validation_score": 8.2,
            "documents": [{"id": d.id, "title": d.title} for d in documents]
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to submit documents: {str(e)}")

@router.get("/{audit_id}/submissions/{submission_id}/document")
async def get_submission_document(
    audit_id: int,
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get document details for a submission - FIXED VERSION"""
    
    submission = db.query(DocumentSubmission).join(
        DocumentRequirement
    ).filter(
        DocumentSubmission.id == submission_id,
        DocumentRequirement.audit_id == audit_id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    document = db.query(Document).filter(
        Document.id == submission.document_id,
        Document.company_id == current_user.company_id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {
        "document": {
            "id": document.id,
            "title": document.title,
            "file_type": document.file_type,
            "file_size": document.file_size,
            "created_at": document.created_at.isoformat(),
            "updated_at": document.updated_at.isoformat()
        },
        "submission": {
            "id": submission.id,
            "status": submission.verification_status.value,
            "workflow_stage": submission.workflow_stage.value,
            "submitted_at": submission.submitted_at.isoformat(),
            "revision_round": submission.revision_round
        }
    }

@router.get("/{audit_id}/requirements/enhanced")
async def get_enhanced_requirements(
    audit_id: int,
    status: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get enhanced requirements with submission details"""
    
    # Verify audit exists and user has access
    audit = db.query(Audit).filter(
        Audit.id == audit_id,
        Audit.company_id == current_user.company_id
    ).first()
    
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    # Get requirements with submissions
    requirements_query = db.query(DocumentRequirement).filter(
        DocumentRequirement.audit_id == audit_id
    )
    
    requirements = requirements_query.all()
    
    enhanced_requirements = []
    
    for req in requirements:
        # Get all submissions for this requirement
        submissions = db.query(DocumentSubmission).filter(
            DocumentSubmission.requirement_id == req.id
        ).all()
        
        # Calculate days until deadline
        days_until_deadline = None
        if req.deadline:
            delta = req.deadline - datetime.utcnow()
            days_until_deadline = delta.days
        
        # Format submissions
        formatted_submissions = []
        for sub in submissions:
            document = db.query(Document).filter(Document.id == sub.document_id).first()
            if document:
                formatted_submissions.append({
                    "id": sub.id,
                    "status": sub.verification_status.value,
                    "workflow_stage": sub.workflow_stage.value,
                    "submitted_at": sub.submitted_at.isoformat(),
                    "ai_validation_score": sub.ai_validation_score or 0.0,
                    "compliance_score": sub.compliance_score or 0.0,
                    "revision_round": sub.revision_round,
                    "document": {
                        "id": str(document.id),
                        "title": document.title,
                        "file_type": document.file_type,
                        "file_size": document.file_size,
                        "created_at": document.created_at.isoformat()
                    }
                })
        
        enhanced_req = {
            "id": req.id,
            "document_type": req.document_type,
            "description": req.description or "",
            "ai_priority_score": req.ai_priority_score or 5.0,
            "risk_level": req.risk_level or "medium",
            "deadline": req.deadline.isoformat() if req.deadline else None,
            "days_until_deadline": days_until_deadline,
            "is_mandatory": req.is_mandatory,
            "auto_escalate": req.auto_escalate,
            "escalation_level": req.escalation_level or 0,
            "escalations_count": 0,  # TODO: Calculate from escalation table
            "compliance_framework": req.compliance_framework or "SOX",
            "required_fields": req.required_fields or {},
            "validation_rules": req.validation_rules or {},
            "submissions": formatted_submissions
        }
        
        enhanced_requirements.append(enhanced_req)
    
    return {
        "requirements": enhanced_requirements,
        "total": len(enhanced_requirements)
    }

@router.post("/requirements")
async def create_requirement(
    requirement_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new document requirement"""
    
    # Validate audit exists
    audit = db.query(Audit).filter(Audit.id == requirement_data.get("audit_id")).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    # Create new requirement
    new_requirement = DocumentRequirement(
        audit_id=requirement_data.get("audit_id"),
        document_type=requirement_data.get("document_type"),
        description=requirement_data.get("description", ""),
        required_fields=requirement_data.get("required_fields", {}),
        validation_rules=requirement_data.get("validation_rules", {}),
        deadline=datetime.fromisoformat(requirement_data.get("deadline")) if requirement_data.get("deadline") else None,
        is_mandatory=requirement_data.get("is_mandatory", True),
        auto_escalate=requirement_data.get("auto_escalate", False),
        compliance_framework=requirement_data.get("compliance_framework", "SOX"),
        ai_priority_score=requirement_data.get("ai_priority_score", 5.0),
        risk_level=requirement_data.get("risk_level", "medium"),
        created_by=current_user.id,
        created_at=datetime.utcnow()
    )
    
    db.add(new_requirement)
    db.commit()
    db.refresh(new_requirement)
    
    return {
        "message": "Requirement created successfully",
        "requirement_id": new_requirement.id,
        "created_at": new_requirement.created_at.isoformat()
    }

@router.put("/{audit_id}/requirements/{requirement_id}")
async def update_requirement(
    audit_id: int,
    requirement_id: int,
    requirement_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a document requirement"""
    
    requirement = db.query(DocumentRequirement).filter(
        DocumentRequirement.id == requirement_id,
        DocumentRequirement.audit_id == audit_id
    ).first()
    
    if not requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")
    
    # Update fields
    for field, value in requirement_data.items():
        if hasattr(requirement, field):
            if field == "deadline" and value:
                setattr(requirement, field, datetime.fromisoformat(value))
            else:
                setattr(requirement, field, value)
    
    try:
        db.commit()
        return {"message": "Requirement updated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update requirement: {str(e)}")

@router.delete("/requirements/{requirement_id}")
async def delete_requirement(
    requirement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a document requirement"""
    
    requirement = db.query(DocumentRequirement).filter(
        DocumentRequirement.id == requirement_id
    ).first()
    
    if not requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")
    
    try:
        # Delete associated submissions first
        db.query(DocumentSubmission).filter(
            DocumentSubmission.requirement_id == requirement_id
        ).delete()
        
        # Delete the requirement
        db.delete(requirement)
        db.commit()
        
        return {"message": "Requirement deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete requirement: {str(e)}")

@router.get("/submissions/{submission_id}/status")
async def get_submission_status(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed submission status with workflow history"""
    
    submission = db.query(DocumentSubmission).filter(
        DocumentSubmission.id == submission_id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    submitter = db.query(User).filter(User.id == submission.submitted_by).first()
    
    # Mock detailed status data with enhanced workflow
    return {
        "submission": {
            "id": submission.id,
            "document_type": submission.requirement.document_type,
            "status": submission.verification_status.value,
            "workflow_stage": submission.workflow_stage.value,
            "submitted_at": submission.submitted_at.isoformat(),
            "submitter": f"{submitter.f_name} {submitter.l_name}",
            "ai_validation_score": 8.2,
            "compliance_score": 7.8
        },
        "workflow_history": [
            {
                "stage": "submitted",
                "status": "completed",
                "performer": f"{submitter.f_name} {submitter.l_name}",
                "performer_type": "user",
                "notes": "Document submitted for review",
                "validation_score": 0,
                "duration_minutes": 0,
                "automated": False,
                "created_at": submission.submitted_at.isoformat()
            },
            {
                "stage": "ai_validation",
                "status": "completed",
                "performer": "AI Validator",
                "performer_type": "system",
                "notes": "AI validation completed with score 8.2/10",
                "validation_score": 8.2,
                "duration_minutes": 3,
                "automated": True,
                "created_at": (submission.submitted_at + timedelta(minutes=3)).isoformat()
            }
        ],
        "audit_trail": [
            {
                "action": "document_submitted",
                "actor": f"{submitter.f_name} {submitter.l_name}",
                "actor_type": "user",
                "details": {"document_name": submission.document.title},
                "timestamp": submission.submitted_at.isoformat(),
                "hash": "abc123def456"
            }
        ],
        "verification_chain": [
            {
                "block_number": 1,
                "current_hash": "abc123def456ghi789",
                "previous_hash": "000000000000000000",
                "verification_data": {"submission_id": submission.id},
                "timestamp": submission.submitted_at.isoformat(),
                "immutable": True
            }
        ],
        "ai_validations": [
            {
                "validation_type": "document_quality",
                "validation_score": 8.2,
                "confidence_score": 0.95,
                "issues_found": ["Minor formatting inconsistency in header"],
                "recommendations": ["Consider standardizing document headers"],
                "processing_time_ms": 2500,
                "created_at": (submission.submitted_at + timedelta(minutes=2)).isoformat()
            }
        ]
    }
