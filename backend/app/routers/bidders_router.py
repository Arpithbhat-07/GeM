from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from app.config import settings
from app.database import get_db
from app.models.bidder import Bidder, BidderCreate, BidderUpdate
from app.models.user import UserBase
from app.auth import get_current_user
from app.services.audit_service import audit_service
from app.services.mock_registry import mock_registry

router = APIRouter(prefix=f"{settings.API_V1_STR}/bidders", tags=["Bidders"])

class ReviewDecisionRequest(BaseModel):
    decision: str  # QUALIFIED_RECOMMENDED, DISQUALIFIED_RECOMMENDED, CLARIFICATION_REQUESTED
    remarks: str

class CompareRequest(BaseModel):
    bidder_ids: List[str]
    tender_id: Optional[str] = None

@router.get("", response_model=List[Bidder])
async def list_bidders(
    tender_id: Optional[str] = None,
    scenario_tag: Optional[str] = None,
    risk_level: Optional[str] = None,
    verification_status: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 200,
    current_user: UserBase = Depends(get_current_user)
):
    db = get_db()
    query = {}
    if tender_id and tender_id not in ["ALL", "all", ""]:
        query["tender_ids"] = tender_id
    if scenario_tag:
        query["scenario_tag"] = scenario_tag
    if risk_level:
        query["risk_level"] = risk_level
    if verification_status:
        query["verification_status"] = verification_status
    if search:
        # Search by company name or bidder ID
        query["$or"] = [
            {"company_name": {"$regex": search}},
            {"bidder_id": {"$regex": search}},
            {"gstin": {"$regex": search}},
            {"pan": {"$regex": search}}
        ]

    cursor = db["bidders"].find(query).sort("bidder_id", 1).limit(limit)
    items = await cursor.to_list(limit)
    return items

@router.post("", response_model=Bidder, status_code=status.HTTP_201_CREATED)
async def create_bidder(
    bidder_in: BidderCreate,
    current_user: UserBase = Depends(get_current_user)
):
    db = get_db()
    existing = await db["bidders"].find_one({"bidder_id": bidder_in.bidder_id})
    if existing:
        raise HTTPException(status_code=400, detail=f"Bidder '{bidder_in.bidder_id}' already exists.")

    data = bidder_in.model_dump()
    data["created_at"] = datetime.utcnow().isoformat()
    await db["bidders"].insert_one(data)
    
    await audit_service.log(
        action="BIDDER_REGISTERED",
        entity="bidder",
        entity_id=bidder_in.bidder_id,
        user=current_user.username,
        new_value=data["company_name"],
        details=f"Sector: {data.get('sector')}, State: {data.get('state')}"
    )
    return data

@router.get("/queue")
async def get_verification_queue(
    tender_id: Optional[str] = None,
    priority: Optional[str] = None,
    limit: int = 100,
    current_user: UserBase = Depends(get_current_user)
):
    """
    Returns prioritized verification queue derived directly from compliance results,
    risk engine signals, and statutory exception flags.
    Prioritizes: CRITICAL -> HIGH -> MEDIUM -> LOW
    """
    db = get_db()
    query = {}
    if tender_id and tender_id not in ["ALL", "all", ""]:
        query["tender_ids"] = tender_id

    bidders = await db["bidders"].find(query).to_list(200)

    queue_items = []
    priority_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}

    for b in bidders:
        scenario = b.get("scenario_tag", "")
        risk = b.get("risk_level", "MEDIUM")
        status = b.get("verification_status", "IN_PROGRESS")
        score = b.get("compliance_score", 0.0)

        is_clean = scenario == "clean" and risk == "LOW" and status == "VERIFIED"

        if is_clean and not priority:
            continue

        item_priority = risk
        if scenario in ["blacklisted", "mca_strikeoff"]:
            item_priority = "CRITICAL"
            issue_title = f"Debarment / Blacklisting Flag: {b.get('blacklist_reason') or 'Active order on GeM incident roster'}" if scenario == "blacklisted" else "RoC Strike-off Proceedings active under Section 248 of Companies Act"
            req_text = "GFR 2017 Rule 151 / GeM Incident Policy" if scenario == "blacklisted" else "Companies Act 2013 Section 248 / RoC MCA21 Legal Existence"
        elif scenario == "gst_lapse":
            item_priority = "HIGH"
            issue_title = f"GSTR-3B Tax Filing Elapsed: Last return filed {b.get('gst_last_return_filed')} exceeds 90-day grace window"
            req_text = "CGST Act 2017 Section 25 / GSTN Gateway Return Recency"
        elif scenario == "low_local_content":
            item_priority = "HIGH"
            issue_title = f"Local Content Shortfall: Declared {b.get('local_content_pct')}% is below minimum tender threshold"
            req_text = "DPIIT Public Procurement Order (PPP-MII) 2017 / GFR Rule 153"
        elif scenario == "udyam_expired":
            item_priority = "HIGH"
            issue_title = "Legacy MSME Invalidation: EM-II/UAM certificate expired without mandatory Udyam migration"
            req_text = "Ministry of MSME Gazette Notification S.O. 2119(E)"
        elif scenario == "epfo_esic_arrears":
            item_priority = "HIGH"
            issue_title = "Statutory Labor Welfare Notice: EPFO Section 7A / ESIC Section 45A contribution recovery proceeding"
            req_text = "EPF & MP Act 1952 / ESI Act 1948 Mandatory Labor Compliance"
        elif scenario == "pan_206ab":
            item_priority = "MEDIUM"
            issue_title = "Income Tax Section 206AB Non-Filer: Higher TDS surcharge withholding applies"
            req_text = "Income Tax Act 1961 Section 206AB / 206CCA Non-Filer Compliance"
        elif risk == "CRITICAL":
            item_priority = "CRITICAL"
            issue_title = "Critical Statutory Discrepancy detected during cross-registry verification"
            req_text = "Statutory Verification Benchmark"
        elif risk == "HIGH":
            item_priority = "HIGH"
            issue_title = "High-Risk Statutory Discrepancy requires Procurement Officer review"
            req_text = "Public Procurement Qualification Standards"
        elif status == "REQUIRES_REVIEW":
            item_priority = "MEDIUM"
            issue_title = "Statutory Documentation Clarification Required on submitted affidavits"
            req_text = "Tender Eligibility & Document Consistency Norms"
        else:
            item_priority = "LOW"
            issue_title = "Routine Statutory Examination and Audit Sign-off"
            req_text = "GFR 2017 Rule 144 Sovereign Review"

        if priority and item_priority != priority:
            continue

        t_ids = b.get("tender_ids", [])
        primary_tid = t_ids[0] if t_ids else "GEM/2026/B/894210"

        queue_items.append({
            "queue_id": f"Q-{b.get('bidder_id')}",
            "priority": item_priority,
            "bidder_id": b.get("bidder_id"),
            "company_name": b.get("company_name"),
            "tender_id": primary_tid,
            "issue": issue_title,
            "requirement": req_text,
            "compliance_score": score,
            "risk_level": risk,
            "detected_date": (b.get("created_at") or "2026-09-27")[:10],
            "status": b.get("officer_decision") or "PENDING",
            "verification_status": status,
            "officer_decision": b.get("officer_decision") or "PENDING",
            "state": b.get("state", ""),
            "sector": b.get("sector", ""),
            "local_content_pct": b.get("local_content_pct", 50.0),
            "scenario_tag": scenario,
            "action": "Examine Dossier"
        })

    queue_items.sort(key=lambda x: (priority_order.get(x["priority"], 99), -x["compliance_score"]))
    return queue_items[:limit]

@router.get("/{bidder_id}")
async def get_bidder_detail(
    bidder_id: str,
    tender_id: Optional[str] = None,
    current_user: UserBase = Depends(get_current_user)
):
    db = get_db()
    bidder = await db["bidders"].find_one({"bidder_id": bidder_id})
    if not bidder:
        raise HTTPException(status_code=404, detail="Bidder not found")

    # Get documents
    doc_query = {"bidder_id": bidder_id}
    docs_cursor = db["documents"].find(doc_query).sort("uploaded_at", -1)
    documents = await docs_cursor.to_list(50)

    # Get latest compliance result if exists
    comp_query = {"bidder_id": bidder_id}
    if tender_id and tender_id not in ["ALL", "all", ""]:
        comp_query["tender_id"] = tender_id
    latest_comp = await db["compliance_results"].find_one(comp_query)

    # Fallback to any tender result for this bidder if specific tender didn't match
    if not latest_comp:
        latest_comp = await db["compliance_results"].find_one({"bidder_id": bidder_id})

    # Auto-evaluate on the fly if still not found
    if not latest_comp:
        from app.services.compliance_engine import compliance_engine
        from app.services.government_providers import govt_service

        t_id = tender_id if (tender_id and tender_id not in ["ALL", "all", ""]) else (bidder.get("tender_ids", ["GEM/2026/B/894210"])[0])
        tender = await db["tenders"].find_one({"tender_id": t_id})
        govt_results = await govt_service.verify_all(bidder, tender)
        for g in govt_results:
            await db["government_verifications"].update_one(
                {"bidder_id": bidder_id, "provider": g["provider"]},
                {"$set": g},
                upsert=True
            )
        comp_res = compliance_engine.evaluate_bidder(bidder, tender, documents, govt_results)
        latest_comp = comp_res.model_dump()
        latest_comp["tender_id"] = t_id
        latest_comp["bidder_id"] = bidder_id
        latest_comp["verified_at"] = datetime.utcnow().isoformat()
        await db["compliance_results"].update_one(
            {"bidder_id": bidder_id, "tender_id": t_id},
            {"$set": latest_comp},
            upsert=True
        )

    # Get simulated government verifications
    govt_cursor = db["government_verifications"].find({"bidder_id": bidder_id})
    govt_verifications = await govt_cursor.to_list(20)

    # Get audit timeline for this bidder
    audit_cursor = db["audit_logs"].find({"entity_id": bidder_id}).sort("timestamp", -1)
    audit_timeline = await audit_cursor.to_list(20)

    return {
        "bidder": bidder,
        "documents": documents,
        "compliance_result": latest_comp,
        "government_verifications": govt_verifications,
        "audit_timeline": audit_timeline
    }

@router.put("/{bidder_id}", response_model=Bidder)
async def update_bidder(
    bidder_id: str,
    bidder_update: BidderUpdate,
    current_user: UserBase = Depends(get_current_user)
):
    db = get_db()
    bidder = await db["bidders"].find_one({"bidder_id": bidder_id})
    if not bidder:
        raise HTTPException(status_code=404, detail="Bidder not found")

    update_data = {k: v for k, v in bidder_update.model_dump().items() if v is not None}
    await db["bidders"].update_one({"bidder_id": bidder_id}, {"$set": update_data})
    
    await audit_service.log(
        action="BIDDER_PROFILE_UPDATED",
        entity="bidder",
        entity_id=bidder_id,
        user=current_user.username,
        details=f"Modified attributes: {list(update_data.keys())}"
    )

    updated = await db["bidders"].find_one({"bidder_id": bidder_id})
    return updated

@router.post("/{bidder_id}/review")
async def record_officer_review(
    bidder_id: str,
    review: ReviewDecisionRequest,
    current_user: UserBase = Depends(get_current_user)
):
    """Allows Procurement Officer to formally record their review decision and remarks."""
    db = get_db()
    bidder = await db["bidders"].find_one({"bidder_id": bidder_id})
    if not bidder:
        raise HTTPException(status_code=404, detail="Bidder not found")

    old_dec = bidder.get("officer_decision", "PENDING")
    update_data = {
        "verification_status": "OFFICER_REVIEWED",
        "officer_decision": review.decision,
        "officer_remarks": review.remarks,
        "reviewed_by": current_user.username,
        "reviewed_at": datetime.utcnow().isoformat()
    }
    await db["bidders"].update_one({"bidder_id": bidder_id}, {"$set": update_data})

    await audit_service.log(
        action="OFFICER_FINAL_REVIEW_RECORDED",
        entity="bidder",
        entity_id=bidder_id,
        user=current_user.username,
        old_value=old_dec,
        new_value=review.decision,
        details=f"Officer Remarks: {review.remarks}"
    )
    return {
        "status": "SUCCESS",
        "message": f"Procurement Officer decision '{review.decision}' successfully registered.",
        "decision": review.decision,
        "remarks": review.remarks
    }

@router.post("/compare")
async def compare_bidders(
    req: CompareRequest,
    current_user: UserBase = Depends(get_current_user)
):
    """Generates side-by-side comparison matrix across selected bidders."""
    db = get_db()
    if not req.bidder_ids:
        raise HTTPException(status_code=400, detail="Please select at least 2 bidders for comparison.")

    cursor = db["bidders"].find({"bidder_id": {"$in": req.bidder_ids}})
    bidders = await cursor.to_list(len(req.bidder_ids))
    
    tender = None
    if req.tender_id:
        tender = await db["tenders"].find_one({"tender_id": req.tender_id})

    # Build comparison matrix
    comparison_data = []
    for b in bidders:
        b_id = b["bidder_id"]
        # Fetch docs count
        docs_count = await db["documents"].count_documents({"bidder_id": b_id})
        
        # Check latest compliance
        comp = await db["compliance_results"].find_one({"bidder_id": b_id})
        score = comp.get("compliance_score", b.get("compliance_score", 0.0)) if comp else b.get("compliance_score", 0.0)
        risk = comp.get("risk_level", b.get("risk_level", "MEDIUM")) if comp else b.get("risk_level", "MEDIUM")

        comparison_data.append({
            "bidder_id": b_id,
            "company_name": b["company_name"],
            "state": b["state"],
            "sector": b["sector"],
            "entity_category": b["entity_category"],
            "compliance_score": score,
            "risk_level": risk,
            "gst_status": b["gst_status"],
            "udyam_status": b["udyam_status"],
            "pan_206ab_compliant": b["pan_206ab_compliant"],
            "mca_status": b["mca_status"],
            "local_content_pct": b["local_content_pct"],
            "blacklisted": b["blacklisted"],
            "blacklist_reason": b.get("blacklist_reason"),
            "documents_count": docs_count,
            "officer_decision": b.get("officer_decision", "PENDING"),
            "scenario_tag": b.get("scenario_tag", "clean")
        })

    return {
        "tender": tender,
        "bidders_matrix": comparison_data,
        "decision_support_notice": "Comparison matrix is decision-support intelligence. No automated winner is selected."
    }

@router.post("/reseed")
async def reseed_dataset(current_user: UserBase = Depends(get_current_user)):
    """Reset and reseed database from excel dataset."""
    res = await mock_registry.seed_all(force=True)
    return res
