"""
Comprehensive Audit Finding Module Routes
Handles all finding and meeting management functionality
"""

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime

from app.database import get_db
from app.routers.auth import get_current_user
from app.models import User # Only import User model directly
from .findings_services import FindingService # Import the new service
from app.models import AuditFinding, ActionItem
from sqlalchemy.orm import joinedload

findings_router = APIRouter(prefix="/api/findings", tags=["audit-findings"])

# Dependency to get FindingService instance
def get_finding_service(db: Session = Depends(get_db)) -> FindingService:
    return FindingService(db)

# ==================== DASHBOARD ENDPOINTS ====================

@findings_router.get("/dashboard/stats")
async def get_dashboard_stats(
    finding_service: FindingService = Depends(get_finding_service),
    current_user: User = Depends(get_current_user)
):
    """Get dashboard statistics for audit findings"""
    try:
        return finding_service.get_dashboard_stats(current_user)
    except ValueError as e:
        print(f"Error in routes.get_dashboard_stats (ValueError): {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        print(f"Error in routes.get_dashboard_stats: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error fetching dashboard stats: {str(e)}")

# ==================== FINDINGS MANAGEMENT ====================

@findings_router.get("/")
async def get_findings(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    finding_type: Optional[str] = Query(None),
    assigned_to: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    audit_id: Optional[int] = Query(None),
    finding_service: FindingService = Depends(get_finding_service),
    current_user: User = Depends(get_current_user)
):
    """Get all audit findings with filtering and pagination"""
    try:
        return finding_service.get_findings(
            current_user, page, per_page, status, severity, finding_type, assigned_to, search, audit_id
        )
    except ValueError as e:
        print(f"Error in routes.get_findings (ValueError): {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        print(f"Error in routes.get_findings: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error fetching findings: {str(e)}")

@findings_router.post("/")
async def create_finding(
    finding_data: Dict[str, Any],
    finding_service: FindingService = Depends(get_finding_service),
    current_user: User = Depends(get_current_user)
):
    """Create a new audit finding"""
    try:
        return finding_service.create_finding(finding_data, current_user)
    except ValueError as e:
        print(f"Error in routes.create_finding (ValueError): {e}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) # Audit not found or access denied
    except Exception as e:
        print(f"Error in routes.create_finding: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error creating finding: {str(e)}")

@findings_router.put("/{finding_id}")
async def update_finding(
    finding_id: int,
    finding_data: Dict[str, Any],
    finding_service: FindingService = Depends(get_finding_service),
    current_user: User = Depends(get_current_user)
):
    """Update an existing audit finding"""
    try:
        return finding_service.update_finding(finding_id, finding_data, current_user)
    except ValueError as e:
        print(f"Error in routes.update_finding (ValueError): {e}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) # Finding not found or access denied
    except Exception as e:
        print(f"Error in routes.update_finding: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error updating finding: {str(e)}")

@findings_router.get("/{finding_id}")
async def get_finding_details(
    finding_id: int,
    finding_service: FindingService = Depends(get_finding_service),
    current_user: User = Depends(get_current_user)
):
    """Get detailed information about a specific finding"""
    try:
        return finding_service.get_finding_details(finding_id, current_user)
    except ValueError as e:
        print(f"Error in routes.get_finding_details (ValueError): {e}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) # Finding not found or access denied
    except Exception as e:
        print(f"Error in routes.get_finding_details: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error fetching finding details: {str(e)}")

@findings_router.delete("/{finding_id}")
async def delete_finding(
    finding_id: int,
    finding_service: FindingService = Depends(get_finding_service),
    current_user: User = Depends(get_current_user)
):
    """Delete a finding (soft delete)"""
    try:
        return finding_service.delete_finding(finding_id, current_user)
    except ValueError as e:
        print(f"Error in routes.delete_finding (ValueError): {e}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) # Finding not found or access denied
    except Exception as e:
        print(f"Error in routes.delete_finding: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error deleting finding: {str(e)}")

# ==================== COMMENTS MANAGEMENT ====================

@findings_router.post("/{finding_id}/comments")
async def add_finding_comment(
    finding_id: int,
    comment_data: Dict[str, Any],
    finding_service: FindingService = Depends(get_finding_service),
    current_user: User = Depends(get_current_user)
):
    """Add a comment to a finding"""
    try:
        return finding_service.add_finding_comment(finding_id, comment_data, current_user)
    except ValueError as e:
        print(f"Error in routes.add_finding_comment (ValueError): {e}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) # Finding not found or access denied
    except Exception as e:
        print(f"Error in routes.add_finding_comment: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error adding comment: {str(e)}")

@findings_router.get("/{finding_id}/comments")
async def get_finding_comments(
    finding_id: int,
    finding_service: FindingService = Depends(get_finding_service),
    current_user: User = Depends(get_current_user)
):
    """Get comments for a specific finding"""
    try:
        return finding_service.get_finding_comments(finding_id, current_user)
    except ValueError as e:
        print(f"Error in routes.get_finding_comments (ValueError): {e}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) # Finding not found or access denied
    except Exception as e:
        print(f"Error in routes.get_finding_comments: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error fetching comments: {str(e)}")

# ==================== MEETINGS MANAGEMENT ====================

@findings_router.get("/meetings/all")
async def get_meetings(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    meeting_type: Optional[str] = Query(None),
    audit_id: Optional[int] = Query(None),
    finding_service: FindingService = Depends(get_finding_service),
    current_user: User = Depends(get_current_user)
):
    """Get all audit meetings with filtering and pagination"""
    print('Fetching meetings with parameters:', {
        "page": page,
        "per_page": per_page,
        "status": status,
        "meeting_type": meeting_type,
        "audit_id": audit_id
    })
    try:
        return finding_service.get_meetings(
            current_user, 
            page=page, 
            per_page=per_page, 
            status=status, 
            meeting_type=meeting_type, 
            audit_id=audit_id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching meetings: {str(e)}")

@findings_router.post("/meetings")
async def create_meeting(
    meeting_data: Dict[str, Any],
    finding_service: FindingService = Depends(get_finding_service),
    current_user: User = Depends(get_current_user)
):
    """Create a new audit meeting"""
    try:
        return finding_service.create_meeting(meeting_data, current_user)
    except ValueError as e:
        print(f"Error in routes.create_meeting (ValueError): {e}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) # Audit not found or access denied
    except Exception as e:
        print(f"Error in routes.create_meeting: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error creating meeting: {str(e)}")

@findings_router.put("/meetings/{meeting_id}")
async def update_meeting(
    meeting_id: int,
    meeting_data: Dict[str, Any],
    finding_service: FindingService = Depends(get_finding_service),
    current_user: User = Depends(get_current_user)
):
    """Update an existing meeting"""
    try:
        return finding_service.update_meeting(meeting_id, meeting_data, current_user)
    except ValueError as e:
        print(f"Error in routes.update_meeting (ValueError): {e}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) # Meeting not found or access denied
    except Exception as e:
        print(f"Error in routes.update_meeting: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error updating meeting: {str(e)}")

@findings_router.get("/meetings/{meeting_id}")
async def get_meeting_details(
    meeting_id: int,
    finding_service: FindingService = Depends(get_finding_service),
    current_user: User = Depends(get_current_user)
):
    """Get detailed information about a specific meeting"""
    try:
        return finding_service.get_meeting_details(meeting_id, current_user)
    except ValueError as e:
        print(f"Error in routes.get_meeting_details (ValueError): {e}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) # Meeting not found or access denied
    except Exception as e:
        print(f"Error in routes.get_meeting_details: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error fetching meeting details: {str(e)}")

# ==================== AI INTEGRATION ROUTES ====================

@findings_router.post("/ai/analyze-document")
async def analyze_document_for_findings_route(
    file: UploadFile = File(...),
    audit_id: int = Form(...),
    finding_service: FindingService = Depends(get_finding_service),
    current_user: User = Depends(get_current_user)
):
    """Analyze uploaded document for potential findings using AI"""
    try:
        file_content = await file.read()
        return finding_service.analyze_document_for_findings(
            audit_id, file_content, file.content_type, current_user
        )
    except ValueError as e:
        print(f"Error in routes.analyze_document_for_findings_route (ValueError): {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        print(f"Error in routes.analyze_document_for_findings_route: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Analysis failed: {str(e)}")

@findings_router.post("/ai/generate-remediation")
async def generate_remediation_suggestions_route(
    finding_id: int,
    finding_service: FindingService = Depends(get_finding_service),
    current_user: User = Depends(get_current_user)
):
    """Generate AI-powered remediation suggestions for a finding"""
    try:
        return finding_service.generate_remediation_suggestions(finding_id, current_user)
    except ValueError as e:
        print(f"Error in routes.generate_remediation_suggestions_route (ValueError): {e}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) # Finding not found or access denied
    except Exception as e:
        print(f"Error in routes.generate_remediation_suggestions_route: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to generate suggestions: {str(e)}")

# ==================== ACTION ITEMS MANAGEMENT (Placeholder) ====================
# These routes would also be refactored to use the service layer if their logic grows.

@findings_router.get("/{finding_id}/actions")
async def get_finding_actions(
    finding_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get action items for a finding"""
    try:
        # This logic would ideally move to finding_service as well
        actions = db.query(ActionItem).options(
            joinedload(ActionItem.assignee)
        ).filter(ActionItem.finding_id == finding_id).all()
        
        return {
            "actions": [
                {
                    "id": action.id,
                    "description": action.description,
                    "status": action.status,
                    "priority": action.priority,
                    "due_date": action.due_date.isoformat() if action.due_date else None,
                    "assignee": {
                        "id": action.assignee.id,
                        "name": f"{action.assignee.f_name} {action.assignee.l_name}"
                    } if action.assignee else None,
                    "created_at": action.created_at.isoformat(),
                    "completed_at": action.completed_at.isoformat() if action.completed_at else None,
                    "progress_notes": action.progress_notes
                }
                for action in actions
            ]
        }
    except Exception as e:
        print(f"Error in routes.get_finding_actions: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error fetching action items: {str(e)}")

@findings_router.post("/{finding_id}/actions")
async def create_action_item(
    finding_id: int,
    action_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create action item for finding"""
    try:
        # This logic would ideally move to finding_service as well
        finding = db.query(AuditFinding).filter(AuditFinding.id == finding_id).first()
        if not finding:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Finding not found")
        
        action = ActionItem(
            finding_id=finding_id,
            assigned_to=action_data.get("assigned_to"),
            description=action_data.get("description"),
            due_date=datetime.fromisoformat(action_data.get("due_date")) if action_data.get("due_date") else None,
            priority=action_data.get("priority", "medium"),
            status=action_data.get("status", "pending")
        )
        
        db.add(action)
        db.commit()
        
        return {"message": "Action item created successfully"}
    except Exception as e:
        db.rollback()
        print(f"Error in routes.create_action_item: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error creating action item: {str(e)}")

# ==================== REPORTING ENDPOINTS (Placeholder) ====================

@findings_router.get("/{audit_id}/findings/export")
async def export_findings(
    audit_id: int,
    format: str = Query("json", regex="^(json|csv|pdf)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Export findings in various formats"""
    try:
        # This logic would ideally move to finding_service as well
        findings = db.query(AuditFinding).filter(AuditFinding.audit_id == audit_id).all()
        
        if format == "json":
            return {
                "findings": [
                    {
                        "finding_id": f.finding_id,
                        "title": f.title,
                        "description": f.description,
                        "severity": f.severity.value,
                        "status": f.status.value,
                        "created_at": f.created_at.isoformat()
                    }
                    for f in findings
                ]
            }
        
        # For CSV and PDF formats, you would implement the respective export logic
        raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail=f"Export in {format} format not yet implemented")
    except Exception as e:
        print(f"Error in routes.export_findings: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error exporting findings: {str(e)}")
