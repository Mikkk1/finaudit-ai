# Update main.py to include the new version_routes

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import document_router, auth_router, employee_router, company_router, user_router, workflow_router, version_router,dashboard_router
from app.database import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(title="FinAudit AI API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(document_router, tags=["Documents"])
app.include_router(employee_router, prefix="/employees", tags=["Employees"])
app.include_router(company_router, prefix="/companies", tags=["Companies"])
app.include_router(user_router, prefix="/users", tags=["Users"])
app.include_router(workflow_router, tags=["Workflows"])
app.include_router(version_router, tags=["Versions"])  # Add the new version router
app.include_router(dashboard_router,  tags=["Dashboard"])
@app.get("/")
async def root():
    return {"message": "Welcome to FinAudit AI API"}
