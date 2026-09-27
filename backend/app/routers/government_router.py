from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.config import settings
from app.database import get_db
from app.models.user import UserBase
from app.auth import get_current_user
from app.services.government_providers import govt_service
from app.services.audit_service import audit_service

router = APIRouter(prefix=f"{settings.API_V1_STR}/government", tags=["Government Integrations"])

class VerifyRequest(BaseModel):
    bidder_id: str
    tender_id: Optional[str] = None

@router.get("/{bidder_id}")
async def get_government_verifications(
    bidder_id: str,
    current_user: UserBase = Depends(get_current_user)
):
    db = get_db()
    cursor = db["government_verifications"].find({"bidder_id": bidder_id})
    records = await cursor.to_list(20)
    if not records:
        # If none exist yet, automatically run them!
        bidder = await db["bidders"].find_one({"bidder_id": bidder_id})
        if not bidder:
            raise HTTPException(status_code=404, detail="Bidder not found")
        records = await govt_service.verify_all(bidder)
        for r in records:
            await db["government_verifications"].update_one(
                {"bidder_id": bidder_id, "provider": r["provider"]},
                {"$set": r},
                upsert=True
            )
    return {
        "bidder_id": bidder_id,
        "simulated_label": "SIMULATED GOVERNMENT DATA",
        "verifications": records
    }

@router.post("/verify-all")
async def verify_all_providers(
    req: VerifyRequest,
    current_user: UserBase = Depends(get_current_user)
):
    db = get_db()
    bidder = await db["bidders"].find_one({"bidder_id": req.bidder_id})
    if not bidder:
        raise HTTPException(status_code=404, detail="Bidder not found")

    tender = None
    if req.tender_id:
        tender = await db["tenders"].find_one({"tender_id": req.tender_id})

    results = await govt_service.verify_all(bidder, tender)
    for r in results:
        await db["government_verifications"].update_one(
            {"bidder_id": req.bidder_id, "provider": r["provider"]},
            {"$set": r},
            upsert=True
        )

    await audit_service.log(
        action="GOVERNMENT_CHECKS_EXECUTED",
        entity="government_verification",
        entity_id=req.bidder_id,
        user=current_user.username,
        details="Executed 10 simulated statutory adapters (GSTN, Udyam, PAN 206AB, MCA, EPFO, ESIC, Startup, NSIC, Blacklist, PPP-MII)."
    )
    return {
        "status": "SUCCESS",
        "simulated_label": "SIMULATED GOVERNMENT DATA",
        "verifications": results
    }

@router.post("/{provider}/{bidder_id}")
async def verify_single_provider(
    provider: str,
    bidder_id: str,
    current_user: UserBase = Depends(get_current_user)
):
    db = get_db()
    bidder = await db["bidders"].find_one({"bidder_id": bidder_id})
    if not bidder:
        raise HTTPException(status_code=404, detail="Bidder not found")

    res = await govt_service.verify_single(provider, bidder)
    if not res:
        raise HTTPException(status_code=404, detail=f"Adapter for '{provider}' not found.")

    await db["government_verifications"].update_one(
        {"bidder_id": bidder_id, "provider": res["provider"]},
        {"$set": res},
        upsert=True
    )
    return res
