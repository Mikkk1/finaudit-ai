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
    phone_number = Column(String(15), nullable=True)
    f_name = Column(String(50), nullable=False)
    l_name = Column(String(50), nullable=False)

    # Relationships
    employee_id = Column(Integer, ForeignKey("employees.id"), unique=True, nullable=True)
    employee = relationship("Employee", back_populates="user", uselist=False)
