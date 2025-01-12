from fastapi import APIRouter, UploadFile, File
from app.database import SessionLocal
from app.models.document import Document

router = APIRouter()

@router.post("/upload")
async def upload_document(file: UploadFile, db=SessionLocal()):
    content = await file.read()
    new_doc = Document(title=file.filename, content=content.decode("utf-8"))
    db.add(new_doc)
    db.commit()
    return {"message": f"Document {file.filename} uploaded"}
