from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class TenderBase(BaseModel):
    tender_id: str
    tender_title: str
    organization: str = "Ministry of Petroleum & Natural Gas"
    department: str = "Chennai Petroleum Corporation Limited (CPCL)"
    category: str = "Class-I Local Supplier"
    tender_value: float = 12500000.0  # e.g. 1.25 Cr
    submission_deadline: str = "2026-10-31"
    tender_status: str = "ACTIVE"
    required_local_content_pct: float = 50.0
    epfo_esic_required: bool = True
    startup_waiver_eligible: bool = False
    msme_preference: bool = True
    iso_certification_required: bool = True
    oem_authorization_required: bool = True
    min_turnover_inr: float = 5000000.0
    technical_requirements: List[str] = Field(default_factory=lambda: [
        "ISO 9001:2015 Quality Management System Certification",
        "OEM Authorization Form (MAF) if bidding as authorized dealer/distributor",
        "Past track record of supplying similar equipment to PSU refineries"
    ])
    financial_requirements: List[str] = Field(default_factory=lambda: [
        "Audited balance sheets for last 3 financial years",
        "PAN compliance with Section 206AB without withholding surcharge"
    ])
    special_requirements: List[str] = Field(default_factory=lambda: [
        "Make In India Local Content Self-Certification Affidavit",
        "Non-blacklisting / debarment undertaking on stamp paper"
    ])
    extracted_from_doc: Optional[str] = None
    confirmed_by_officer: bool = True

class TenderCreate(TenderBase):
    pass

class TenderUpdate(BaseModel):
    tender_title: Optional[str] = None
    organization: Optional[str] = None
    department: Optional[str] = None
    category: Optional[str] = None
    tender_value: Optional[float] = None
    submission_deadline: Optional[str] = None
    tender_status: Optional[str] = None
    required_local_content_pct: Optional[float] = None
    epfo_esic_required: Optional[bool] = None
    startup_waiver_eligible: Optional[bool] = None
    msme_preference: Optional[bool] = None
    iso_certification_required: Optional[bool] = None
    oem_authorization_required: Optional[bool] = None
    technical_requirements: Optional[List[str]] = None
    financial_requirements: Optional[List[str]] = None
    special_requirements: Optional[List[str]] = None
    confirmed_by_officer: Optional[bool] = None

class Tender(TenderBase):
    id: Optional[str] = Field(None, alias="_id")
    bidders_count: int = 0
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
