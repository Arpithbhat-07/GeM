from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.config import settings
from app.database import get_db
from app.models.user import UserBase
from app.models.compliance import ComplianceResult
from app.auth import get_current_user
from app.services.compliance_engine import compliance_engine
from app.services.government_providers import govt_service
from app.services.recommendation import recommendation_service
from app.services.audit_service import audit_service

router = APIRouter(prefix=f"{settings.API_V1_STR}/compliance", tags=["Compliance"])

class RunComplianceRequest(BaseModel):
    bidder_id: str
    tender_id: Optional[str] = None

class ExplainRuleRequest(BaseModel):
    bidder_id: str
    rule_id: str
    tender_id: Optional[str] = None

@router.post("/run", response_model=ComplianceResult)
async def run_compliance_verification(
    req: RunComplianceRequest,
    current_user: UserBase = Depends(get_current_user)
):
    """Executes the full deterministic compliance verification pipeline for a bidder."""
    db = get_db()
    bidder = await db["bidders"].find_one({"bidder_id": req.bidder_id})
    if not bidder:
        raise HTTPException(status_code=404, detail="Bidder not found")

    # Determine tender
    tender_id = req.tender_id or (bidder.get("tender_ids", [None])[0] if bidder.get("tender_ids") else "GEM/2026/B/894210")
    tender = await db["tenders"].find_one({"tender_id": tender_id})
    if not tender:
        tender = await db["tenders"].find_one({})

    # 1. Run / Refresh Simulated Government Checks
    govt_results = await govt_service.verify_all(bidder, tender)
    
    # Cache / Upsert government verifications
    for g in govt_results:
        await db["government_verifications"].update_one(
            {"bidder_id": req.bidder_id, "provider": g["provider"]},
            {"$set": g},
            upsert=True
        )

    # 2. Fetch Bidder Documents & Extractions
    docs_cursor = db["documents"].find({"bidder_id": req.bidder_id})
    documents = await docs_cursor.to_list(50)

    # 3. Execute Deterministic Rules Engine
    compliance_result = compliance_engine.evaluate_bidder(
        bidder=bidder,
        tender=tender,
        documents=documents,
        govt_verifications=govt_results
    )
    result_dict = compliance_result.model_dump()
    result_dict["tender_id"] = tender_id
    result_dict["bidder_id"] = req.bidder_id
    result_dict["verified_at"] = datetime.utcnow().isoformat()

    # Save to compliance_results collection (upsert by bidder_id and tender_id)
    await db["compliance_results"].update_one(
        {"bidder_id": req.bidder_id, "tender_id": tender_id},
        {"$set": result_dict},
        upsert=True
    )

    # Update bidder status
    new_verif_status = "VERIFIED" if compliance_result.risk_level == "LOW" else "REQUIRES_REVIEW"
    await db["bidders"].update_one(
        {"bidder_id": req.bidder_id},
        {
            "$set": {
                "compliance_score": compliance_result.compliance_score,
                "risk_level": compliance_result.risk_level,
                "verification_status": new_verif_status,
                "last_verified_at": datetime.utcnow().isoformat()
            }
        }
    )

    # Log to audit trail
    await audit_service.log(
        action="COMPLIANCE_VERIFICATION_EXECUTED",
        entity="compliance",
        entity_id=req.bidder_id,
        user=current_user.username,
        verification_id=f"VERIF-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
        details=f"Evaluated against Tender {tender_id}. Score: {compliance_result.compliance_score:.1f}%, Risk: {compliance_result.risk_level}. AI Status: {compliance_result.ai_recommendation.status_label}"
    )

    return result_dict

@router.get("/{bidder_id}")
async def get_bidder_compliance(
    bidder_id: str,
    tender_id: Optional[str] = None,
    current_user: UserBase = Depends(get_current_user)
):
    db = get_db()
    query = {"bidder_id": bidder_id}
    if tender_id:
        query["tender_id"] = tender_id
    
    result = await db["compliance_results"].find_one(query)
    if not result:
        # If not verified yet, automatically run verification on-the-fly!
        return await run_compliance_verification(
            RunComplianceRequest(bidder_id=bidder_id, tender_id=tender_id),
            current_user
        )
    return result

@router.post("/explain")
async def explain_flagged_rule(
    req: ExplainRuleRequest,
    current_user: UserBase = Depends(get_current_user)
):
    """Provides deep 'Why is this flagged?' explainability for a specific rule check."""
    db = get_db()
    bidder = await db["bidders"].find_one({"bidder_id": req.bidder_id})
    if not bidder:
        raise HTTPException(status_code=404, detail="Bidder not found")

    tender_id = req.tender_id or (bidder.get("tender_ids", [None])[0] if bidder.get("tender_ids") else "GEM/2026/B/894210")
    tender = await db["tenders"].find_one({"tender_id": tender_id}) or {}

    # Get compliance result
    comp = await db["compliance_results"].find_one({"bidder_id": req.bidder_id})
    if not comp:
        # Run compliance first
        comp = await run_compliance_verification(RunComplianceRequest(bidder_id=req.bidder_id, tender_id=tender_id), current_user)

    target_check = None
    for c in comp.get("checks", []):
        if c.get("rule_id") == req.rule_id:
            target_check = c
            break

    if not target_check:
        raise HTTPException(status_code=404, detail="Rule check not found in compliance results.")

    explanation = await recommendation_service.generate_explanation(target_check, bidder, tender)
    return explanation
