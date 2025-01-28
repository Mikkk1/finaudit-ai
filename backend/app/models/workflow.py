from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey, JSON, Text, Boolean, Enum, Float
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base
from datetime import datetime


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