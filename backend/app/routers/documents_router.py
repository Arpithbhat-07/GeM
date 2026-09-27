import os
import shutil
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from pydantic import BaseModel
from app.config import settings
from app.database import get_db
from app.models.user import UserBase
from app.auth import get_current_user
from app.services.ocr_service import ocr_service
from app.services.audit_service import audit_service
from app.sample_docs.sample_generator import DEMO_DOCUMENT_CASES

router = APIRouter(prefix=f"{settings.API_V1_STR}/documents", tags=["Documents"])

class LoadDemoCaseRequest(BaseModel):
    bidder_id: str
    case_key: str  # e.g., perfect_match, gstin_mismatch, company_name_mismatch, expired_udyam, low_local_content, etc.
    tender_id: Optional[str] = None

@router.get("")
async def list_documents(
    bidder_id: Optional[str] = None,
    tender_id: Optional[str] = None,
    document_type: Optional[str] = None,
    current_user: UserBase = Depends(get_current_user)
):
    db = get_db()
    query = {}
    if bidder_id:
        query["bidder_id"] = bidder_id
    if tender_id:
        query["tender_id"] = tender_id
    if document_type:
        query["document_type"] = document_type

    cursor = db["documents"].find(query).sort("uploaded_at", -1)
    docs = await cursor.to_list(100)
    return docs

@router.post("/upload")
async def upload_document(
    bidder_id: str = Form(...),
    tender_id: Optional[str] = Form(None),
    document_type: Optional[str] = Form("OTHER"),
    file: UploadFile = File(...),
    current_user: UserBase = Depends(get_current_user)
):
    """Uploads a bidder document, classifies it, runs OCR field extraction, and logs audit."""
    db = get_db()
    bidder = await db["bidders"].find_one({"bidder_id": bidder_id})
    if not bidder:
        raise HTTPException(status_code=404, detail="Bidder not found")

    safe_name = f"{bidder_id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{os.path.basename(file.filename)}"
    dest_path = os.path.join(settings.UPLOAD_DIR, safe_name)
    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(dest_path)
    
    # Run OCR & Intelligence
    tender = None
    if tender_id:
        tender = await db["tenders"].find_one({"tender_id": tender_id})

    extracted = await ocr_service.process_document(dest_path, file.filename, bidder, tender)
    detected_type = extracted.get("document_type") if document_type == "OTHER" or not document_type else document_type

    doc_entry = {
        "bidder_id": bidder_id,
        "tender_id": tender_id,
        "document_type": detected_type,
        "filename": os.path.basename(file.filename),
        "file_path": dest_path,
        "file_size": file_size,
        "mime_type": file.content_type or "application/pdf",
        "is_synthetic": False,
        "extraction_status": "EXTRACTED",
        "uploaded_at": datetime.utcnow().isoformat(),
        "extraction": {
            "document_type": detected_type,
            "extracted_fields": extracted.get("extracted_fields", {}),
            "confidence_score": extracted.get("confidence_score", 0.95),
            "raw_text_snippet": extracted.get("raw_text_snippet"),
            "page_number": extracted.get("page_count", 1),
            "extraction_method": extracted.get("extraction_method", "AI_MOCK_OCR"),
            "inconsistencies_detected": extracted.get("inconsistencies_detected", [])
        }
    }

    res = await db["documents"].insert_one(doc_entry)
    doc_entry["_id"] = str(res.inserted_id)

    await audit_service.log(
        action="DOCUMENT_UPLOADED_AND_EXTRACTED",
        entity="document",
        entity_id=str(res.inserted_id),
        user=current_user.username,
        details=f"Uploaded {file.filename} for {bidder_id}. Classified as {detected_type}. Confidence: {extracted.get('confidence_score') * 100:.1f}%"
    )

    return doc_entry

@router.post("/load-demo-case")
async def load_demo_case(
    req: LoadDemoCaseRequest,
    current_user: UserBase = Depends(get_current_user)
):
    """Loads a pre-packaged synthetic document case for hackathon demonstration."""
    db = get_db()
    bidder = await db["bidders"].find_one({"bidder_id": req.bidder_id})
    if not bidder:
        raise HTTPException(status_code=404, detail="Bidder not found")

    case_data = DEMO_DOCUMENT_CASES.get(req.case_key)
    if not case_data:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid case key. Available: {list(DEMO_DOCUMENT_CASES.keys())}"
        )

    # Remove any existing demo docs for this bidder to keep it clean
    await db["documents"].delete_many({"bidder_id": req.bidder_id, "is_synthetic": True})

    created_docs = []
    for doc in case_data["documents"]:
        d_type = doc["document_type"]
        f_name = doc["filename"]
        doc_entry = {
            "bidder_id": req.bidder_id,
            "tender_id": req.tender_id or (bidder.get("tender_ids", [None])[0] if bidder.get("tender_ids") else None),
            "document_type": d_type,
            "filename": f_name,
            "file_path": os.path.join(settings.SAMPLE_DOCS_DIR, f_name),
            "file_size": 25600,
            "mime_type": "application/pdf",
            "is_synthetic": True,
            "extraction_status": "EXTRACTED",
            "uploaded_at": datetime.utcnow().isoformat(),
            "extraction": {
                "document_type": d_type,
                "extracted_fields": doc["extracted_fields"],
                "confidence_score": doc["confidence_score"],
                "raw_text_snippet": f"Demonstration document extract for {d_type} - {f_name}. Checked against GeM compliance norms.",
                "page_number": 1,
                "extraction_method": "AI_SYNTHETIC_SUITE",
                "inconsistencies_detected": doc.get("inconsistencies", [])
            }
        }
        res = await db["documents"].insert_one(doc_entry)
        doc_entry["_id"] = str(res.inserted_id)
        created_docs.append(doc_entry)

    await audit_service.log(
        action="DEMO_DOCUMENT_CASE_LOADED",
        entity="bidder",
        entity_id=req.bidder_id,
        user=current_user.username,
        details=f"Loaded demo case '{case_data['title']}' ({len(created_docs)} documents)."
    )

    return {
        "status": "SUCCESS",
        "case_title": case_data["title"],
        "case_description": case_data["description"],
        "documents_loaded": created_docs
    }

@router.get("/demo-cases")
async def get_demo_cases(current_user: UserBase = Depends(get_current_user)):
    """Returns available synthetic document demonstration scenarios."""
    return [
        {
            "key": k,
            "title": v["title"],
            "description": v["description"],
            "document_count": len(v["documents"])
        }
        for k, v in DEMO_DOCUMENT_CASES.items()
    ]

@router.get("/{doc_id}/evidence")
async def get_document_evidence(
    doc_id: str,
    current_user: UserBase = Depends(get_current_user)
):
    db = get_db()
    doc = await db["documents"].find_one({"_id": doc_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    return {
        "document_id": str(doc.get("_id")),
        "filename": doc.get("filename"),
        "document_type": doc.get("document_type"),
        "uploaded_at": doc.get("uploaded_at"),
        "extraction": doc.get("extraction"),
        "is_synthetic": doc.get("is_synthetic", False)
    }

@router.delete("/{doc_id}")
async def delete_document(
    doc_id: str,
    current_user: UserBase = Depends(get_current_user)
):
    db = get_db()
    doc = await db["documents"].find_one({"_id": doc_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    await db["documents"].delete_one({"_id": doc_id})
    await audit_service.log(
        action="DOCUMENT_DELETED",
        entity="document",
        entity_id=doc_id,
        user=current_user.username,
        details=f"Removed document: {doc.get('filename')}"
    )
    return {"status": "SUCCESS", "message": "Document deleted"}
