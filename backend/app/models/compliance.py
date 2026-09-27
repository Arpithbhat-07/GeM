from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class RuleEvidenceItem(BaseModel):
    source: str  # e.g., "GSTN Database", "GST_Certificate.pdf (Page 1)", "MCA Portal"
    field_checked: str
    detected_value: Any
    expected_value: Any
    citation: Optional[str] = None
    page: Optional[int] = None
    document_id: Optional[str] = None

class ComplianceCheck(BaseModel):
    rule_id: str
    requirement: str
    category: str  # Statutory Compliance, Tax Compliance, Registration Compliance, Tender Eligibility, Local Content, Documentation, Risk Indicators
    status: str  # PASS, FAIL, WARNING, MISSING, UNVERIFIED, NOT_APPLICABLE
    severity: str  # CRITICAL, HIGH, MEDIUM, LOW, INFO
    evidence: List[RuleEvidenceItem] = Field(default_factory=list)
    reason: str = ""
    confidence: float = 0.95
    recommendation_action: str = ""

class ScoreBreakdownCategory(BaseModel):
    category: str
    weight: float
    max_points: float
    earned_points: float
    percentage: float
    checks_passed: int
    checks_total: int

class AIRecommendation(BaseModel):
    status_label: str  # FURTHER REVIEW REQUIRED, FLAGGED FOR OFFICER ATTENTION, ELIGIBLE FOR CONSIDERATION
    summary: str
    critical_issues: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    suggested_action: str
    officer_disclaimer: str = "AI-assisted recommendation is strictly advisory. Final qualification/disqualification decision rests solely with the Procurement Officer."

class ComplianceResult(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    bidder_id: str
    tender_id: str
    compliance_score: float  # 0 to 100
    score_breakdown: List[ScoreBreakdownCategory] = Field(default_factory=list)
    risk_level: str  # LOW, MEDIUM, HIGH, CRITICAL
    risk_reasons: List[str] = Field(default_factory=list)
    ai_recommendation: AIRecommendation
    checks: List[ComplianceCheck] = Field(default_factory=list)
    verified_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
