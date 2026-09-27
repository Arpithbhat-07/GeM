from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class BidderBase(BaseModel):
    bidder_id: str
    company_name: str
    entity_category: str = "Small"
    state: str = "Tamil Nadu"
    sector: str = "Valve & Actuators"
    udyam_number: str = "UDYAM-TN-02-0014829"
    udyam_status: str = "Active"
    gstin: str = "33AABCB1234F1Z2"
    gst_status: str = "Active"
    gst_last_return_filed: Optional[str] = "2026-08-25"
    pan: str = "AABCB1234F"
    pan_206ab_compliant: bool = True
    cin: Optional[str] = "U12070372008PTC049505"
    mca_status: str = "Active / Compliant"
    epfo_status: str = "Active"
    esic_status: str = "Active"
    nsic_registered: bool = False
    startup_recognized: bool = False
    startup_certificate: Optional[str] = None
    local_content_pct: float = 65.0
    blacklisted: bool = False
    blacklist_reason: Optional[str] = None
    scenario_tag: str = "clean"
    tender_ids: List[str] = Field(default_factory=list)
    verification_status: str = "UNVERIFIED"  # UNVERIFIED, IN_PROGRESS, VERIFIED, REQUIRES_REVIEW, OFFICER_REVIEWED
    compliance_score: Optional[float] = None
    risk_level: Optional[str] = None  # LOW, MEDIUM, HIGH, CRITICAL
    officer_decision: str = "PENDING"  # PENDING, QUALIFIED_RECOMMENDED, DISQUALIFIED_RECOMMENDED, CLARIFICATION_REQUESTED
    officer_remarks: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class BidderCreate(BidderBase):
    pass

class BidderUpdate(BaseModel):
    company_name: Optional[str] = None
    entity_category: Optional[str] = None
    state: Optional[str] = None
    sector: Optional[str] = None
    udyam_number: Optional[str] = None
    udyam_status: Optional[str] = None
    gstin: Optional[str] = None
    gst_status: Optional[str] = None
    gst_last_return_filed: Optional[str] = None
    pan: Optional[str] = None
    pan_206ab_compliant: Optional[bool] = None
    cin: Optional[str] = None
    mca_status: Optional[str] = None
    epfo_status: Optional[str] = None
    esic_status: Optional[str] = None
    nsic_registered: Optional[bool] = None
    startup_recognized: Optional[bool] = None
    startup_certificate: Optional[str] = None
    local_content_pct: Optional[float] = None
    blacklisted: Optional[bool] = None
    blacklist_reason: Optional[str] = None
    scenario_tag: Optional[str] = None
    tender_ids: Optional[List[str]] = None
    verification_status: Optional[str] = None
    compliance_score: Optional[float] = None
    risk_level: Optional[str] = None
    officer_decision: Optional[str] = None
    officer_remarks: Optional[str] = None

class Bidder(BidderBase):
    id: Optional[str] = Field(None, alias="_id")
