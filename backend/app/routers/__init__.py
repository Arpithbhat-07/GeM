from app.routers.auth_router import router as auth_router
from app.routers.tenders_router import router as tenders_router
from app.routers.bidders_router import router as bidders_router
from app.routers.documents_router import router as documents_router
from app.routers.compliance_router import router as compliance_router
from app.routers.government_router import router as government_router
from app.routers.audit_router import router as audit_router
from app.routers.dashboard_router import router as dashboard_router
from app.routers.reports_router import router as reports_router

__all__ = [
    "auth_router",
    "tenders_router",
    "bidders_router",
    "documents_router",
    "compliance_router",
    "government_router",
    "audit_router",
    "dashboard_router",
    "reports_router"
]
