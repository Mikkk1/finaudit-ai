from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import company, document, employee, _user, auth
from app.database import engine
from app.models import company as company_model, employee as employee_model, users as user_model, \
    document as document_model, activity as activity_model

# Create database tables
# company_model.Base.metadata.create_all(bind=engine)
# employee_model.Base.metadata.create_all(bind=engine)
# user_model.Base.metadata.create_all(bind=engine)
# document_model.Base.metadata.create_all(bind=engine)
# document_version.Base.metadata.create_all(bind=engine)
# comment.Base.metadata.create_all(bind=engine)
# activity_model.Base.metadata.create_all(bind=engine)

app = FastAPI(title="FinAudit AI API")

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(document.router, prefix="/documents", tags=["Document Management"])
app.include_router(employee.router, prefix="/employees", tags=["Employee Management"])
app.include_router(company.router, prefix="/companies", tags=["Company Management"])
app.include_router(_user.router, prefix="/users", tags=["User Management"])


@app.get("/")
def read_root():
    return {"message": "Welcome to FinAudit AI API"}
