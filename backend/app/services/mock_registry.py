import os
from datetime import datetime, date
from typing import Dict, Any, List, Optional
import openpyxl
from app.config import settings
from app.database import get_db
from app.auth import get_password_hash

FLAGSHIP_TENDER = {
    "tender_id": "GEM/2026/B/894210",
    "tender_title": "Procurement of High-Pressure Control Valves & Actuators — CPCL Manali Refinery",
    "organization": "Ministry of Petroleum & Natural Gas",
    "department": "Chennai Petroleum Corporation Limited (CPCL)",
    "category": "Class-I Local Supplier",
    "tender_value": 18500000.0,
    "submission_deadline": "2026-10-31",
    "tender_status": "ACTIVE",
    "required_local_content_pct": 50.0,
    "epfo_esic_required": True,
    "startup_waiver_eligible": True,
    "msme_preference": True,
    "iso_certification_required": True,
    "oem_authorization_required": True,
    "min_turnover_inr": 5000000.0,
    "technical_requirements": [
        "ISO 9001:2015 Quality Management System Certification required.",
        "Tender-specific Manufacturer Authorization Form (MAF) required from valve OEM.",
        "Proven past performance supplying API-6D / ANSI Class 600 valves to PSU refineries."
    ],
    "financial_requirements": [
        "Audited balance sheets & P&L accounts for the last 3 financial years.",
        "Section 206AB / 206CCA compliance without higher tax withholding rate."
    ],
    "special_requirements": [
        "Make in India (PPP-MII) Local Content Affidavit certifying minimum 50% domestic value addition.",
        "Statutory Labor Welfare Compliance: Active EPFO & ESIC accounts with zero arrears.",
        "Non-Blacklisting / Debarment self-declaration on company letterhead."
    ],
    "extracted_from_doc": "SAMPLE_TENDER_GEM_894210.pdf",
    "confirmed_by_officer": True,
    "bidders_count": 0,
    "created_at": datetime.utcnow().isoformat()
}

class MockRegistrySeeder:
    def __init__(self):
        self.dataset_path = settings.DATASET_PATH

    async def seed_all(self, force: bool = False) -> Dict[str, int]:
        db = get_db()
        
        # Check if already seeded
        bidder_count = await db["bidders"].count_documents()
        if bidder_count > 0 and not force:
            tender_count = await db["tenders"].count_documents()
            return {"bidders": bidder_count, "tenders": tender_count, "message": "Database already populated"}

        print("[Seeder] Initializing Database with CPCL & GeM synthetic procurement dataset...")
        
        # 1. Clean existing collections if forcing
        if force:
            await db["bidders"].drop()
            await db["tenders"].drop()
            await db["documents"].drop()
            await db["document_extractions"].drop()
            await db["compliance_results"].drop()
            await db["government_verifications"].drop()
            await db["audit_logs"].drop()
            await db["users"].drop()

        # 2. Seed Default Users
        users = [
            {
                "username": "officer_cpcl",
                "email": "officer.cpcl@gov.in",
                "role": "PROCUREMENT_OFFICER",
                "full_name": "Rajesh Kumar, Senior Procurement Officer",
                "department": "Chennai Petroleum Corporation Limited (CPCL)",
                "hashed_password": get_password_hash("Cpcl@2026!"),
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "username": "admin_gem",
                "email": "admin@gem.gov.in",
                "role": "ADMIN",
                "full_name": "Dr. Ananya Sharma, Joint Director",
                "department": "Government e-Marketplace (GeM)",
                "hashed_password": get_password_hash("Admin@2026!"),
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "username": "auditor_cag",
                "email": "auditor@cag.gov.in",
                "role": "AUDITOR",
                "full_name": "Vikram Seth, Principal Director of Audit",
                "department": "Comptroller & Auditor General (Petroleum Audit)",
                "hashed_password": get_password_hash("Auditor@2026!"),
                "created_at": datetime.utcnow().isoformat()
            }
        ]
        await db["users"].insert_many(users)

        # 3. Read dataset from Excel
        tenders_map = {FLAGSHIP_TENDER["tender_id"]: dict(FLAGSHIP_TENDER)}
        bidders_list = []

        if os.path.exists(self.dataset_path):
            try:
                wb = openpyxl.load_workbook(self.dataset_path)
                sheet = wb.active
                rows = list(sheet.iter_rows(values_only=True))
                header = rows[0]
                
                for r in rows[1:]:
                    if not r[0]: continue
                    b_id = str(r[0]).strip()
                    c_name = str(r[1]).strip()
                    state = str(r[2]).strip()
                    sector = str(r[3]).strip()
                    entity_cat = str(r[4]).strip()
                    udyam_no = str(r[5]).strip()
                    udyam_status = str(r[6]).strip()
                    gstin = str(r[7]).strip()
                    gst_status = str(r[8]).strip()
                    
                    last_gst = r[9]
                    if isinstance(last_gst, (datetime, date)):
                        last_gst_str = last_gst.strftime("%Y-%m-%d")
                    else:
                        last_gst_str = str(last_gst) if last_gst else "2026-08-25"

                    pan = str(r[10]).strip()
                    pan_206ab = bool(r[11]) if r[11] is not None else True
                    cin = str(r[12]).strip() if r[12] else None
                    mca_status = str(r[13]).strip() if r[13] else "Active / Compliant"
                    epfo_status = str(r[14]).strip() if r[14] else "Active"
                    esic_status = str(r[15]).strip() if r[15] else "Active"
                    nsic_registered = bool(r[16]) if r[16] is not None else False
                    startup_recognized = bool(r[17]) if r[17] is not None else False
                    startup_cert = str(r[18]).strip() if r[18] else None
                    
                    lc_pct = float(r[19]) if r[19] is not None else 50.0
                    blacklisted = bool(r[20]) if r[20] is not None else False
                    blacklist_reason = str(r[21]).strip() if r[21] else None
                    scenario_tag = str(r[22]).strip() if r[22] else "clean"
                    
                    tender_id = str(r[23]).strip() if r[23] else None
                    tender_title = str(r[24]).strip() if r[24] else None
                    tender_cat = str(r[25]).strip() if r[25] else "Class-I Local Supplier"
                    if tender_title:
                        tender_title = tender_title.replace("â€”", "—").replace("A???", "—").replace("Â", "")
                    c_name = c_name.replace("â€”", "—").replace("A???", "—")
                    t_min_lc = float(r[26]) if r[26] is not None else 50.0
                    t_epfo_req = bool(r[27]) if r[27] is not None else True
                    t_startup_waiver = bool(r[28]) if r[28] is not None else False

                    # Register Tender
                    if tender_id and tender_id not in tenders_map:
                        tenders_map[tender_id] = {
                            "tender_id": tender_id,
                            "tender_title": tender_title,
                            "organization": "Ministry of Petroleum & Natural Gas",
                            "department": "Chennai Petroleum Corporation Limited (CPCL)",
                            "category": tender_cat,
                            "tender_value": 12000000.0,
                            "submission_deadline": "2026-10-25",
                            "tender_status": "ACTIVE",
                            "required_local_content_pct": t_min_lc,
                            "epfo_esic_required": t_epfo_req,
                            "startup_waiver_eligible": t_startup_waiver,
                            "msme_preference": True,
                            "iso_certification_required": True,
                            "oem_authorization_required": True,
                            "min_turnover_inr": 4000000.0,
                            "technical_requirements": [
                                "ISO 9001:2015 Certification",
                                "Tender-specific OEM Authorization"
                            ],
                            "financial_requirements": [
                                "PAN 206AB Compliance",
                                "Active GST Registration"
                            ],
                            "special_requirements": [
                                f"Make in India local content >= {t_min_lc:.0f}%",
                                "Non-blacklisting declaration"
                            ],
                            "extracted_from_doc": None,
                            "confirmed_by_officer": True,
                            "bidders_count": 0,
                            "created_at": datetime.utcnow().isoformat()
                        }

                    t_ids = [tender_id] if tender_id else [FLAGSHIP_TENDER["tender_id"]]
                    # Always also associate the first 10 bidders with the flagship tender for convenient demo!
                    if b_id in ["BID-001", "BID-002", "BID-003", "BID-004", "BID-005", "BID-006", "BID-007", "BID-008", "BID-009", "BID-010"]:
                        if FLAGSHIP_TENDER["tender_id"] not in t_ids:
                            t_ids.append(FLAGSHIP_TENDER["tender_id"])

                    # Determine initial verification status based on scenario
                    if scenario_tag == "clean":
                        init_verif = "VERIFIED"
                        init_risk = "LOW"
                        init_score = 96.5
                    elif scenario_tag in ["blacklisted", "mca_strikeoff"]:
                        init_verif = "REQUIRES_REVIEW"
                        init_risk = "CRITICAL"
                        init_score = 42.0
                    elif scenario_tag in ["gst_lapse", "low_local_content", "epfo_esic_arrears"]:
                        init_verif = "REQUIRES_REVIEW"
                        init_risk = "HIGH"
                        init_score = 64.0
                    else:
                        init_verif = "IN_PROGRESS"
                        init_risk = "MEDIUM"
                        init_score = 78.0

                    bidder_entry = {
                        "bidder_id": b_id,
                        "company_name": c_name,
                        "entity_category": entity_cat,
                        "state": state,
                        "sector": sector,
                        "udyam_number": udyam_no,
                        "udyam_status": udyam_status,
                        "gstin": gstin,
                        "gst_status": gst_status,
                        "gst_last_return_filed": last_gst_str,
                        "pan": pan,
                        "pan_206ab_compliant": pan_206ab,
                        "cin": cin,
                        "mca_status": mca_status,
                        "epfo_status": epfo_status,
                        "esic_status": esic_status,
                        "nsic_registered": nsic_registered,
                        "startup_recognized": startup_recognized,
                        "startup_certificate": startup_cert,
                        "local_content_pct": lc_pct,
                        "blacklisted": blacklisted,
                        "blacklist_reason": blacklist_reason,
                        "scenario_tag": scenario_tag,
                        "tender_ids": t_ids,
                        "verification_status": init_verif,
                        "compliance_score": init_score,
                        "risk_level": init_risk,
                        "officer_decision": "PENDING",
                        "officer_remarks": None,
                        "created_at": datetime.utcnow().isoformat()
                    }
                    bidders_list.append(bidder_entry)

            except Exception as e:
                print(f"[Seeder] Error loading excel file {self.dataset_path}: {e}")

        # Update bidder count for each tender
        for t_id, t_data in tenders_map.items():
            t_data["bidders_count"] = sum(1 for b in bidders_list if t_id in b["tender_ids"])

        await db["tenders"].insert_many(list(tenders_map.values()))
        if bidders_list:
            await db["bidders"].insert_many(bidders_list)

        # 4. Attach sample documents for BID-001 so the demo is ready immediately
        sample_docs = [
            {
                "bidder_id": "BID-001",
                "tender_id": FLAGSHIP_TENDER["tender_id"],
                "document_type": "GST_CERTIFICATE",
                "filename": "BID-001_GST_CERTIFICATE.pdf",
                "file_path": os.path.join(settings.SAMPLE_DOCS_DIR, "BID-001_GST_CERTIFICATE.pdf"),
                "file_size": 24500,
                "mime_type": "application/pdf",
                "is_synthetic": True,
                "extraction_status": "EXTRACTED",
                "uploaded_at": datetime.utcnow().isoformat(),
                "extraction": {
                    "document_type": "GST_CERTIFICATE",
                    "extracted_fields": {
                        "gstin": "32HFTRX0402Q3Z3",
                        "legal_name": "Hindustan Drilling Equipment & Co.",
                        "trade_name": "Hindustan Drilling Equipment & Co.",
                        "registration_status": "Active",
                        "registration_date": "2018-07-01",
                        "taxpayer_type": "Regular",
                        "state": "Kerala"
                    },
                    "confidence_score": 0.98,
                    "raw_text_snippet": "FORM GST REG-06 - GOVERNMENT OF INDIA Registration Certificate (Under Section 25 of the CGST Act, 2017)",
                    "page_number": 1,
                    "extraction_method": "AI_GEMINI",
                    "inconsistencies_detected": []
                }
            },
            {
                "bidder_id": "BID-001",
                "tender_id": FLAGSHIP_TENDER["tender_id"],
                "document_type": "PAN_CARD",
                "filename": "BID-001_PAN_CARD.pdf",
                "file_path": os.path.join(settings.SAMPLE_DOCS_DIR, "BID-001_PAN_CARD.pdf"),
                "file_size": 18200,
                "mime_type": "application/pdf",
                "is_synthetic": True,
                "extraction_status": "EXTRACTED",
                "uploaded_at": datetime.utcnow().isoformat(),
                "extraction": {
                    "document_type": "PAN_CARD",
                    "extracted_fields": {
                        "pan": "HFTRX0402Q",
                        "name": "Hindustan Drilling Equipment & Co.",
                        "entity_type": "Company",
                        "issue_date": "2015-08-12",
                        "status": "Valid"
                    },
                    "confidence_score": 0.99,
                    "raw_text_snippet": "INCOME TAX DEPARTMENT - GOVT OF INDIA Permanent Account Number Card Name: Hindustan Drilling Equipment & Co.",
                    "page_number": 1,
                    "extraction_method": "AI_GEMINI",
                    "inconsistencies_detected": []
                }
            },
            {
                "bidder_id": "BID-001",
                "tender_id": FLAGSHIP_TENDER["tender_id"],
                "document_type": "LOCAL_CONTENT_AFFIDAVIT",
                "filename": "BID-001_LOCAL_CONTENT_AFFIDAVIT.pdf",
                "file_path": os.path.join(settings.SAMPLE_DOCS_DIR, "BID-001_LOCAL_CONTENT_AFFIDAVIT.pdf"),
                "file_size": 31000,
                "mime_type": "application/pdf",
                "is_synthetic": True,
                "extraction_status": "EXTRACTED",
                "uploaded_at": datetime.utcnow().isoformat(),
                "extraction": {
                    "document_type": "LOCAL_CONTENT_AFFIDAVIT",
                    "extracted_fields": {
                        "declared_local_content_pct": 28.7,
                        "deponent_name": "Authorized Director, Hindustan Drilling",
                        "notarized": True,
                        "declaration_date": "2026-08-20"
                    },
                    "confidence_score": 0.96,
                    "raw_text_snippet": "MAKE IN INDIA (MII) SELF-CERTIFICATION AFFIDAVIT Declared Local Content: 28.7%",
                    "page_number": 1,
                    "extraction_method": "AI_GEMINI",
                    "inconsistencies_detected": [
                        "Declared local content 28.7% is below the required 50.0% threshold for Class-I Local Supplier."
                    ]
                }
            }
        ]
        await db["documents"].insert_many(sample_docs)

        # 5. Pre-compute compliance evaluation & simulated government verifications for all bidders
        from app.services.compliance_engine import compliance_engine
        from app.services.government_providers import govt_service

        all_govt = []
        all_comp = []
        for b in bidders_list:
            t_id = b["tender_ids"][0] if b.get("tender_ids") else FLAGSHIP_TENDER["tender_id"]
            t = tenders_map.get(t_id, FLAGSHIP_TENDER)

            # Run all 10 government verification adapters
            govt_results = await govt_service.verify_all(b, t)
            for g in govt_results:
                g["bidder_id"] = b["bidder_id"]
                all_govt.append(g)

            # Fetch sample docs if any
            b_docs = [d for d in sample_docs if d["bidder_id"] == b["bidder_id"]]

            # Run deterministic compliance engine
            comp_res = compliance_engine.evaluate_bidder(
                bidder=b,
                tender=t,
                documents=b_docs,
                govt_verifications=govt_results
            )
            comp_dict = comp_res.model_dump()
            comp_dict["tender_id"] = t_id
            comp_dict["bidder_id"] = b["bidder_id"]
            comp_dict["verified_at"] = datetime.utcnow().isoformat()
            all_comp.append(comp_dict)

            # Synchronize bidder record in database
            new_score = comp_res.compliance_score
            new_risk = comp_res.risk_level
            new_status = "REQUIRES_REVIEW" if new_risk in ["CRITICAL", "HIGH"] else ("VERIFIED" if new_score >= 85 else "IN_PROGRESS")

            await db["bidders"].update_one(
                {"bidder_id": b["bidder_id"]},
                {"$set": {
                    "compliance_score": new_score,
                    "risk_level": new_risk,
                    "verification_status": new_status
                }}
            )

        if all_govt:
            await db["government_verifications"].insert_many(all_govt)
        if all_comp:
            await db["compliance_results"].insert_many(all_comp)

        # 6. Log audit trail
        await db["audit_logs"].insert_one({
            "timestamp": datetime.utcnow().isoformat(),
            "user": "system_seeder",
            "action": "SYSTEM_DATABASE_SEEDED",
            "entity": "system",
            "entity_id": "seed_001",
            "source": "DATASET_EXCEL_IMPORT",
            "details": f"Loaded {len(bidders_list)} bidders across {len(tenders_map)} tenders from complygem_full_dataset with pre-calculated deterministic compliance results."
        })

        return {
            "bidders": len(bidders_list),
            "tenders": len(tenders_map),
            "documents": len(sample_docs),
            "compliance_results": len(all_comp),
            "government_verifications": len(all_govt),
            "message": "Synthetic demo database successfully loaded and indexed."
        }

mock_registry = MockRegistrySeeder()
