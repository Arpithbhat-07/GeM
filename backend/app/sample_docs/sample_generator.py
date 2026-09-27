import os
from datetime import datetime
from typing import Dict, Any, List

DEMO_DOCUMENT_CASES = {
    "perfect_match": {
        "title": "Case 1: Clean & Fully Compliant Bidder",
        "description": "All documents match master profile, valid Udyam, active GST, local content exceeds tender threshold.",
        "documents": [
            {
                "document_type": "GST_CERTIFICATE",
                "filename": "DEMO_GST_CERTIFICATE_PERFECT.pdf",
                "extracted_fields": {
                    "gstin": "33AABCB1234F1Z2",
                    "legal_name": "Bharat Valve & Actuators Ltd",
                    "registration_status": "Active",
                    "registration_date": "2018-07-01",
                    "state": "Tamil Nadu"
                },
                "confidence_score": 0.98,
                "inconsistencies": []
            },
            {
                "document_type": "UDYAM_CERTIFICATE",
                "filename": "DEMO_UDYAM_CERTIFICATE_PERFECT.pdf",
                "extracted_fields": {
                    "udyam_number": "UDYAM-TN-02-0014829",
                    "enterprise_name": "Bharat Valve & Actuators Ltd",
                    "enterprise_category": "Small",
                    "status": "Active"
                },
                "confidence_score": 0.97,
                "inconsistencies": []
            },
            {
                "document_type": "PAN_CARD",
                "filename": "DEMO_PAN_CARD_PERFECT.pdf",
                "extracted_fields": {
                    "pan": "AABCB1234F",
                    "name": "Bharat Valve & Actuators Ltd",
                    "status": "Valid"
                },
                "confidence_score": 0.99,
                "inconsistencies": []
            },
            {
                "document_type": "LOCAL_CONTENT_AFFIDAVIT",
                "filename": "DEMO_LOCAL_CONTENT_AFFIDAVIT_65PCT.pdf",
                "extracted_fields": {
                    "declared_local_content_pct": 65.0,
                    "notarized": True,
                    "deponent_name": "Managing Director"
                },
                "confidence_score": 0.96,
                "inconsistencies": []
            }
        ]
    },
    "gstin_mismatch": {
        "title": "Case 2: GSTIN Mismatch",
        "description": "Uploaded GST Certificate contains a different GSTIN than what was submitted in the bid registration profile.",
        "documents": [
            {
                "document_type": "GST_CERTIFICATE",
                "filename": "DEMO_GST_MISMATCH_TAMPERED.pdf",
                "extracted_fields": {
                    "gstin": "27FAKEE9999Z1ZX",
                    "legal_name": "Bharat Valve & Actuators Ltd",
                    "registration_status": "Active",
                    "state": "Maharashtra"
                },
                "confidence_score": 0.95,
                "inconsistencies": [
                    "GSTIN on certificate (27FAKEE9999Z1ZX) does not match Bidder master GSTIN (33AABCB1234F1Z2)."
                ]
            }
        ]
    },
    "company_name_mismatch": {
        "title": "Case 3: Company Legal Name Mismatch",
        "description": "Uploaded GST Certificate belongs to another corporate entity (Shell / Sister firm), indicating identity falsification.",
        "documents": [
            {
                "document_type": "GST_CERTIFICATE",
                "filename": "SAMPLE_MISMATCH_TEST_GST.pdf",
                "extracted_fields": {
                    "gstin": "27FAKEE9999Z1ZX",
                    "legal_name": "Fraudulent Shell Machinery Corp",
                    "registration_status": "Cancelled",
                    "state": "Maharashtra"
                },
                "confidence_score": 0.99,
                "inconsistencies": [
                    "Legal Name on GST certificate ('Fraudulent Shell Machinery Corp') does not match Bidder registered name."
                ]
            }
        ]
    },
    "expired_udyam": {
        "title": "Case 4: Expired Legacy MSME Certificate",
        "description": "Bidder submitted legacy EM-II certificate that expired without mandatory migration to Udyam.",
        "documents": [
            {
                "document_type": "UDYAM_CERTIFICATE",
                "filename": "DEMO_EXPIRED_EM2_CERTIFICATE.pdf",
                "extracted_fields": {
                    "udyam_number": "EM-II-29-32-4684531",
                    "enterprise_name": "Vertex Insulation Services & Co.",
                    "status": "Expired (Legacy EM-II)",
                    "valid_upto": "2021-03-31"
                },
                "confidence_score": 0.97,
                "inconsistencies": [
                    "Legacy EM-II / UAM certificate expired without mandatory Udyam migration."
                ]
            }
        ]
    },
    "low_local_content": {
        "title": "Case 5: Local Content Shortfall",
        "description": "MII Affidavit declares 28.1% domestic value addition, failing the tender minimum threshold of 50.0%.",
        "documents": [
            {
                "document_type": "LOCAL_CONTENT_AFFIDAVIT",
                "filename": "DEMO_MII_SHORTFALL_28PCT.pdf",
                "extracted_fields": {
                    "declared_local_content_pct": 28.1,
                    "notarized": True
                },
                "confidence_score": 0.96,
                "inconsistencies": [
                    "Declared local content 28.1% fails the minimum tender requirement of 50.0%."
                ]
            }
        ]
    },
    "pan_206ab_violation": {
        "title": "Case 6: Section 206AB Non-Filer Status",
        "description": "Bidder PAN verified but flagged as non-compliant with Income Tax Section 206AB (Higher TDS surcharge).",
        "documents": [
            {
                "document_type": "PAN_CARD",
                "filename": "DEMO_PAN_CARD_206AB.pdf",
                "extracted_fields": {
                    "pan": "ZNDRY1569R",
                    "sec_206ab_specified_person": True,
                    "status": "Valid but Non-Filer"
                },
                "confidence_score": 0.98,
                "inconsistencies": [
                    "Specified Person under Section 206AB. Higher tax withholding rate mandatory."
                ]
            }
        ]
    },
    "blacklisted_entity": {
        "title": "Case 7: GeM Debarred / Blacklisted Bidder",
        "description": "Bidder actively debarred on GeM Incident Management portal for prior contract non-performance.",
        "documents": [
            {
                "document_type": "BLACKLIST_DECLARATION",
                "filename": "DEMO_DEBARMENT_NOTICE.pdf",
                "extracted_fields": {
                    "debarred": True,
                    "order_no": "GeM/IM/2025/DEB/4491",
                    "reason": "Debarred under GeM Incident Management for non-performance"
                },
                "confidence_score": 0.99,
                "inconsistencies": [
                    "CRITICAL: Entity is actively debarred on GeM national portal."
                ]
            }
        ]
    },
    "oem_authorization_missing_ref": {
        "title": "Case 8: OEM Authorization Missing Tender Ref",
        "description": "Manufacturer Authorization Form is generic and does not cite the specific GeM bid number.",
        "documents": [
            {
                "document_type": "OEM_AUTHORIZATION",
                "filename": "DEMO_OEM_AUTHORIZATION_GENERIC.pdf",
                "extracted_fields": {
                    "oem_name": "Bharat Heavy Valves Global Corp",
                    "tender_reference_mentioned": False
                },
                "confidence_score": 0.94,
                "inconsistencies": [
                    "OEM authorization document is missing specific tender reference number."
                ]
            }
        ]
    }
}
