from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import document_router, auth_router, employee_router, company_router, user_router
from app.database import engine
from app.models import *

app = FastAPI(title="FinAudit AI API")

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(document_router, tags=["Document Management"])
app.include_router(employee_router, prefix="/employees", tags=["Employee Management"])
app.include_router(company_router, prefix="/companies", tags=["Company Management"])
app.include_router(user_router, prefix="/users", tags=["User Management"])

@app.get("/")
def read_root():
    return {"message": "Welcome to FinAudit AI API"}