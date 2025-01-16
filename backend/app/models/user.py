from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Enum,
    ForeignKey
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base

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
    employee_id = Column(Integer, ForeignKey("employees.id"), unique=True)

    # Relationships
    documents = relationship("Document", back_populates="owner")
    comments = relationship("Comment", back_populates="user")
    activities = relationship("Activity", back_populates="user")
    employee = relationship("Employee", back_populates="user", uselist=False)
    compliance_reports = relationship("ComplianceReport", back_populates="generated_by")
    audit_logs = relationship("AuditLog", back_populates="user")
    notifications = relationship("Notification", back_populates="user")

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    first_name = Column(String(100))
    last_name = Column(String(100))
    email = Column(String(255), unique=True, index=True)
    position = Column(String(100))
    department = Column(String(100))
    hire_date = Column(DateTime)
    is_active = Column(Boolean, default=True)

    # Relationships
    company = relationship("Company", back_populates="employees")
    user = relationship("User", back_populates="employee")