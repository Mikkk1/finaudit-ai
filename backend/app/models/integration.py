# integration.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Integration(Base):
    __tablename__ = "integrations"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    integration_type = Column(String(50))
    config = Column(JSON)
    is_active = Column(Boolean, default=True)

    # Relationships
    company = relationship("Company", back_populates="integrations")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    is_read = Column(Boolean, default=False)
    notification_type = Column(String(50))

    # Relationships
    user = relationship("User", back_populates="notifications")
