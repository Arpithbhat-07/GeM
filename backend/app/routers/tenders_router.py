import os
import shutil
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from app.config import settings
from app.database import get_db
from app.models.tender import Tender, TenderCreate, TenderUpdate
from app.models.user import UserBase
from app.auth import get_current_user
from app.services.tender_intelligence import tender_intel
from app.services.audit_service import audit_service

router = APIRouter(prefix=f"{settings.API_V1_STR}/tenders", tags=["Tenders"])

@router.get("", response_model=List[Tender])
async def list_tenders(
    status_filter: Optional[str] = None,
    current_user: UserBase = Depends(get_current_user)
):
    db = get_db()
    query = {}
    if status_filter:
        query["tender_status"] = status_filter
    cursor = db["tenders"].find(query).sort("created_at", -1)
    items = await cursor.to_list(100)
    return items

@router.post("", response_model=Tender, status_code=status.HTTP_201_CREATED)
async def create_tender(
    tender_in: TenderCreate,
    current_user: UserBase = Depends(get_current_user)
):
    db = get_db()
    existing = await db["tenders"].find_one({"tender_id": tender_in.tender_id})
    if existing:
        raise HTTPException(status_code=400, detail=f"Tender with ID '{tender_in.tender_id}' already exists.")

    tender_data = tender_in.model_dump()
    tender_data["bidders_count"] = 0
    tender_data["created_at"] = datetime.utcnow().isoformat()
    
    await db["tenders"].insert_one(tender_data)
    await audit_service.log(
        action="TENDER_CREATED",
        entity="tender",
        entity_id=tender_in.tender_id,
        user=current_user.username,
        new_value=tender_data["tender_title"]
    )
    return tender_data

@router.get("/{tender_id}", response_model=Tender)
async def get_tender_detail(
    tender_id: str,
    current_user: UserBase = Depends(get_current_user)
):
    db = get_db()
    # Normalize tender_id
    tender = await db["tenders"].find_one({"tender_id": tender_id})
    if not tender:
        # Try URL decoding or alternate format
        tender = await db["tenders"].find_one({"tender_id": tender_id.replace("%2F", "/")})
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")

    # Update bidder count
    count = await db["bidders"].count_documents({"tender_ids": tender["tender_id"]})
    tender["bidders_count"] = count
    return tender

@router.put("/{tender_id}", response_model=Tender)
async def update_tender(
    tender_id: str,
    tender_update: TenderUpdate,
    current_user: UserBase = Depends(get_current_user)
):
    db = get_db()
    tender = await db["tenders"].find_one({"tender_id": tender_id})
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")

    update_data = {k: v for k, v in tender_update.model_dump().items() if v is not None}
    await db["tenders"].update_one({"tender_id": tender_id}, {"$set": update_data})
    
    await audit_service.log(
        action="TENDER_UPDATED",
        entity="tender",
        entity_id=tender_id,
        user=current_user.username,
        old_value=tender.get("required_local_content_pct"),
        new_value=update_data.get("required_local_content_pct"),
        details=f"Updated fields: {list(update_data.keys())}"
    )

    updated = await db["tenders"].find_one({"tender_id": tender_id})
    return updated

@router.post("/upload-doc")
async def upload_and_extract_tender_doc(
    file: UploadFile = File(...),
    current_user: UserBase = Depends(get_current_user)
):
    """Uploads a tender PDF document and extracts eligibility requirements via AI."""
    safe_name = os.path.basename(file.filename)
    dest_path = os.path.join(settings.UPLOAD_DIR, safe_name)
    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    extracted_params = await tender_intel.extract_requirements_from_pdf(dest_path, safe_name)
    
    await audit_service.log(
        action="TENDER_DOC_AI_EXTRACTED",
        entity="tender",
        entity_id=extracted_params.get("tender_id", "NEW"),
        user=current_user.username,
        details=f"Document '{safe_name}' processed via AI Tender Intelligence. Extracted title: {extracted_params.get('tender_title')}"
    )
    return {
        "status": "SUCCESS",
        "filename": safe_name,
        "extracted_parameters": extracted_params,
        "officer_note": "Please review, edit if necessary, and confirm these AI-extracted requirements before finalizing."
    }

@router.post("/{tender_id}/confirm-requirements")
async def confirm_tender_requirements(
    tender_id: str,
    requirements: dict,
    current_user: UserBase = Depends(get_current_user)
):
    """Allows Procurement Officer to edit and officially confirm AI-extracted requirements."""
    db = get_db()
    tender = await db["tenders"].find_one({"tender_id": tender_id})
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")

    requirements["confirmed_by_officer"] = True
    requirements["officer_confirmed_by"] = current_user.username
    requirements["officer_confirmed_at"] = datetime.utcnow().isoformat()

    await db["tenders"].update_one({"tender_id": tender_id}, {"$set": requirements})
    
    await audit_service.log(
        action="TENDER_REQUIREMENTS_CONFIRMED",
        entity="tender",
        entity_id=tender_id,
        user=current_user.username,
        details="Procurement Officer reviewed, edited, and approved tender eligibility requirements."
    )
    return {"status": "SUCCESS", "message": "Requirements confirmed by Procurement Officer."}
