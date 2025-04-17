from .document import router as document_router
from .auth import router as auth_router
from .employee import router as employee_router
from .company import router as company_router
from ._user import router as user_router
from .workflow_routes import router as workflow_router
from .version_routes import router as version_router
from .dashboard_routes import router as dashboard_router
__all__ = ["document_router", "auth_router", "employee_router", "company_router", "user_router", "workflow_router", "version_router", "dashboard_router"]

