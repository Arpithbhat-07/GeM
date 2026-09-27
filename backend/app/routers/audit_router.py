from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from app.config import settings
from app.models.user import UserBase
from app.auth import get_current_user
from app.services.audit_service import audit_service

router = APIRouter(prefix=f"{settings.API_V1_STR}/audit", tags=["Audit Trail"])

@router.get("")
async def get_audit_trail(
    entity: Optional[str] = None,
    entity_id: Optional[str] = None,
    user: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = Query(50, le=200),
    current_user: UserBase = Depends(get_current_user)
):
    logs = await audit_service.get_logs(
        entity=entity,
        entity_id=entity_id,
        user=user,
        action=action,
        limit=limit
    )
    return logs
