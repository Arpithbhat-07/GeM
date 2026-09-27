from datetime import datetime
from typing import Optional, Any
from app.database import get_db

class AuditService:
    async def log(
        self,
        action: str,
        entity: str,
        entity_id: str,
        user: str = "officer_cpcl",
        old_value: Optional[Any] = None,
        new_value: Optional[Any] = None,
        source: str = "WEB_PORTAL",
        verification_id: Optional[str] = None,
        details: Optional[str] = None
    ) -> dict:
        db = get_db()
        entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "user": user,
            "action": action,
            "entity": entity,
            "entity_id": str(entity_id),
            "old_value": old_value,
            "new_value": new_value,
            "source": source,
            "verification_id": verification_id,
            "details": details
        }
        await db["audit_logs"].insert_one(entry)
        return entry

    async def get_logs(
        self,
        entity: Optional[str] = None,
        entity_id: Optional[str] = None,
        user: Optional[str] = None,
        action: Optional[str] = None,
        limit: int = 100
    ) -> list:
        db = get_db()
        query = {}
        if entity:
            query["entity"] = entity
        if entity_id:
            query["entity_id"] = entity_id
        if user:
            query["user"] = user
        if action:
            query["action"] = action
        
        cursor = db["audit_logs"].find(query).sort("timestamp", -1).limit(limit)
        return await cursor.to_list(limit)

audit_service = AuditService()
