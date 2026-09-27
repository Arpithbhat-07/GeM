from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from app.config import settings
from app.database import get_db
from app.models.user import UserBase
from app.auth import get_current_user

router = APIRouter(prefix=f"{settings.API_V1_STR}/reports", tags=["Reports"])

@router.get("/{bidder_id}")
@router.get("/{tender_id}/{bidder_id}")
async def generate_bidder_compliance_report(
    bidder_id: str,
    tender_id: Optional[str] = None,
    current_user: UserBase = Depends(get_current_user)
):
    """Generates an official, advisory Bid Compliance Verification Report for the Procurement Officer."""
    db = get_db()
    
    bidder = await db["bidders"].find_one({"bidder_id": bidder_id})
    if not bidder:
        raise HTTPException(status_code=404, detail="Bidder not found")

    target_tender_id = tender_id or (bidder.get("tender_ids", [None])[0] if bidder.get("tender_ids") else "GEM/2026/B/894210")
    tender = await db["tenders"].find_one({"tender_id": target_tender_id})
    if not tender:
        tender = await db["tenders"].find_one({})

    compliance = await db["compliance_results"].find_one({"bidder_id": bidder_id})
    documents = await db["documents"].find({"bidder_id": bidder_id}).to_list(50)
    govt_records = await db["government_verifications"].find({"bidder_id": bidder_id}).to_list(20)
    audit_history = await db["audit_logs"].find({"entity_id": bidder_id}).sort("timestamp", -1).to_list(10)

    report_data = {
        "report_metadata": {
            "report_id": f"REP-CPCL-{bidder_id}-{datetime.utcnow().strftime('%Y%m%d%H%M')}",
            "generated_at": datetime.utcnow().isoformat(),
            "generated_by": current_user.full_name,
            "department": "Refinery Materials Management, Chennai Petroleum Corporation Limited (CPCL)",
            "advisory_disclaimer": "AI-generated analysis is advisory. Final qualification/disqualification decision rests with the Procurement Officer."
        },
        "tender": tender,
        "bidder": bidder,
        "compliance": compliance,
        "documents": [
            {
                "document_type": d.get("document_type"),
                "filename": d.get("filename"),
                "uploaded_at": d.get("uploaded_at"),
                "extraction_status": d.get("extraction_status"),
                "confidence_score": d.get("extraction", {}).get("confidence_score")
            }
            for d in documents
        ],
        "government_verifications": govt_records,
        "audit_history": audit_history,
        "officer_section": {
            "decision": bidder.get("officer_decision", "PENDING"),
            "remarks": bidder.get("officer_remarks", "Pending officer examination.")
        }
    }
    return report_data
