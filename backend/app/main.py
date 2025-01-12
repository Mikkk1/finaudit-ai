from fastapi import FastAPI
from app.database import engine
from app.models import user, document
from app.routers import auth, document as document_router

# Create tables if they don't exist
user.Base.metadata.create_all(bind=engine)
document.Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI()

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(document_router.router, prefix="/documents", tags=["Document Management"])

@app.get("/")
async def root():
    return {"message": "Welcome to the Document Automation API!"}
