from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field

class DocumentBase(BaseModel):
    bidder_id: str
    tender_id: Optional[str] = None
    document_type: str  # GST_CERTIFICATE, UDYAM_CERTIFICATE, PAN_CARD, LOCAL_CONTENT_AFFIDAVIT, OEM_AUTHORIZATION, etc.
    filename: str
    file_path: str
    file_size: int = 0
    mime_type: str = "application/pdf"
    is_synthetic: bool = False
    extraction_status: str = "PENDING"  # PENDING, EXTRACTED, FAILED
    uploaded_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class DocumentCreate(DocumentBase):
    pass

class DocumentExtraction(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    document_id: str
    bidder_id: str
    document_type: str
    extracted_fields: Dict[str, Any] = Field(default_factory=dict)
    confidence_score: float = 0.95
    raw_text_snippet: Optional[str] = None
    page_number: int = 1
    extraction_method: str = "AI_MOCK_OCR"  # AI_GEMINI, AI_MOCK_OCR, PYPDF
    inconsistencies_detected: List[str] = Field(default_factory=list)
    extracted_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class Document(DocumentBase):
    id: Optional[str] = Field(None, alias="_id")
    extraction: Optional[DocumentExtraction] = None
