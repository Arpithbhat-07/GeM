from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field

class GovernmentVerificationItem(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    bidder_id: str
    provider: str  # GSTN, UDYAM, PAN_206AB, MCA, EPFO, ESIC, STARTUP_INDIA, NSIC, BLACKLIST_GEM, LOCAL_CONTENT_REGISTRY, DIGILOCKER
    provider_name: str
    status: str  # VERIFIED, FAILED, WARNING, UNAVAILABLE
    simulated_label: str = "SIMULATED GOVERNMENT DATA"
    query_key: str
    query_value: str
    response_data: Dict[str, Any] = Field(default_factory=dict)
    discrepancies: List[str] = Field(default_factory=list)
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class AuditLog(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    user: str = "officer_cpcl"
    action: str  # e.g., "DOC_UPLOADED", "COMPLIANCE_RUN", "OFFICER_REVIEW", "REQUIREMENT_UPDATED"
    entity: str  # "tender", "bidder", "document", "compliance"
    entity_id: str
    old_value: Optional[Any] = None
    new_value: Optional[Any] = None
    source: str = "WEB_PORTAL"
    verification_id: Optional[str] = None
    details: Optional[str] = None

class Notification(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    title: str
    message: str
    type: str = "INFO"  # ALERT, INFO, WARNING, SUCCESS
    read: bool = False
    link: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
