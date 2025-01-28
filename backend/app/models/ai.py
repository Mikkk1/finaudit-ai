from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey, JSON, Text, Boolean, Enum, Float
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base
from datetime import datetime

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