from pydantic import BaseModel
from datetime import datetime


class DocumentBase(BaseModel):
    title: str
    file_type: str
    file_size: float
    owner_id: int
    company_id: int


class DocumentCreate(DocumentBase):
    file_path: str


class Document(DocumentBase):
    id: int
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
