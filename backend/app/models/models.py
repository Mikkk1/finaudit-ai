from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey, JSON, Text, Boolean, Enum, Float
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base
from datetime import datetime

class UserRole(enum.Enum):
    admin = "admin"
    manager = "manager"
    employee = "employee"
    auditor = "auditor"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    last_login = Column(DateTime)
    is_active = Column(Boolean, default=True)
    phone_number = Column(String(15), nullable=True)
    f_name = Column(String(50), nullable=False)
    l_name = Column(String(50), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)  # Added company_id

    employee_id = Column(Integer, ForeignKey("employees.id"), unique=True, nullable=True)
    employee = relationship("Employee", back_populates="user", uselist=False)
    activities = relationship("Activity", back_populates="user")
    notifications = relationship("Notification", back_populates="user")
    company = relationship("Company", back_populates="users")  # Added relationship

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    address = Column(String)
    industry = Column(String)
    subscription_plan = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employees = relationship("Employee", back_populates="company")
    documents = relationship("Document", back_populates="company")
    integrations = relationship("Integration", back_populates="company")
    workflows = relationship("Workflow", back_populates="company")
    users = relationship("User", back_populates="company")  # Added relationship

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String)
    last_name = Column(String)
    email = Column(String, unique=True, index=True)
    position = Column(String)
    department = Column(String)
    company_id = Column(Integer, ForeignKey("companies.id"))
    hire_date = Column(DateTime)

    company = relationship("Company", back_populates="employees")
    user = relationship("User", back_populates="employee", uselist=False)

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    content = Column(Text, nullable=True)  # Changed to nullable
    file_path = Column(String, nullable=False)  # Ensure this column exists
    file_type = Column(String, nullable=False)
    file_size = Column(Float, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User")
    company = relationship("Company", back_populates="documents")
    versions = relationship("DocumentVersion", back_populates="document")
    comments = relationship("Comment", back_populates="document")
    document_workflows = relationship("DocumentWorkflow", back_populates="document")
    ai_analyses = relationship("DocumentAIAnalysis", back_populates="document")

class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String)
    user_id = Column(Integer, ForeignKey("users.id"))
    document_id = Column(Integer, ForeignKey("documents.id"))
    details = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="activities")

class Integration(Base):
    __tablename__ = "integrations"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    integration_type = Column(String(50))
    config = Column(JSON)
    is_active = Column(Boolean, default=True)

    company = relationship("Company", back_populates="integrations")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    is_read = Column(Boolean, default=False)
    notification_type = Column(String(50))

    user = relationship("User", back_populates="notifications")

class DocumentVersion(Base):
    __tablename__ = "document_versions"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    version_number = Column(Integer)
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="versions")

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="comments")
    user = relationship("User")

class Workflow(Base):
    __tablename__ = "workflows"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    company_id = Column(Integer, ForeignKey("companies.id"))

    company = relationship("Company", back_populates="workflows")
    steps = relationship("WorkflowStep", back_populates="workflow")
    document_workflows = relationship("DocumentWorkflow", back_populates="workflow")

class WorkflowStep(Base):
    __tablename__ = "workflow_steps"

    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id"))
    step_number = Column(Integer)
    action = Column(String)
    role_required = Column(Enum('admin', 'manager', 'employee', 'auditor'))

    workflow = relationship("Workflow", back_populates="steps")

class DocumentWorkflow(Base):
    __tablename__ = "document_workflows"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    workflow_id = Column(Integer, ForeignKey("workflows.id"))
    current_step = Column(Integer)
    status = Column(String)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)

    document = relationship("Document", back_populates="document_workflows")
    workflow = relationship("Workflow", back_populates="document_workflows")

class AIModel(Base):
    __tablename__ = "ai_models"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    version = Column(String)
    model_type = Column(String)
    trained_at = Column(DateTime)
    performance_metrics = Column(JSON)

    document_analyses = relationship("DocumentAIAnalysis", back_populates="ai_model")

class DocumentAIAnalysis(Base):
    __tablename__ = "document_ai_analysis"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    ai_model_id = Column(Integer, ForeignKey("ai_models.id"))
    analysis_type = Column(String)
    results = Column(JSON)
    confidence_score = Column(Float)
    processed_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="ai_analyses")
    ai_model = relationship("AIModel", back_populates="document_analyses")

