from .document import router as document_router
from .auth import router as auth_router
from .employee import router as employee_router
from .company import router as company_router
from ._user import router as user_router

__all__ = ["document_router", "auth_router", "employee_router", "company_router", "user_router"]

