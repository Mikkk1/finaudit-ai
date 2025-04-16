# Import all models to make them available when importing from app.models
from .models import (
    User, 
    UserRole,
    Company, 
    Employee, 
    Document, 
    Activity, 
    Integration, 
    Notification, 
    DocumentVersion, 
    Comment, 
    Workflow, 
    WorkflowStep, 
    DocumentWorkflow, 
    WorkflowExecutionHistory,  # This was missing
    AIModel,
    DocumentAIAnalysis,
    DocumentMetadata,
    Annotation,
    RelatedDocument
)

# Export all models
__all__ = [
    'User',
    'UserRole',
    'Company',
    'Employee',
    'Document',
    'Activity',
    'Integration',
    'Notification',
    'DocumentVersion',
    'Comment',
    'Workflow',
    'WorkflowStep',
    'DocumentWorkflow',
    'WorkflowExecutionHistory',  # This was missing
    'AIModel',
    'DocumentAIAnalysis',
    'DocumentMetadata',
    'Annotation',
    'RelatedDocument'
]