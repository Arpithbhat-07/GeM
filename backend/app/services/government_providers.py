from typing import Dict, Any, List, Optional
from datetime import datetime

SIMULATED_NOTICE = "SIMULATED GOVERNMENT DATA"

class BaseGovernmentAdapter:
    provider: str = "BASE"
    provider_name: str = "Base Government Portal"

    async def verify(self, bidder_data: dict, tender_data: Optional[dict] = None) -> dict:
        raise NotImplementedError

class GSTNAdapter(BaseGovernmentAdapter):
    provider = "GSTN"
    provider_name = "Goods and Services Tax Network (GSTN API Gateway)"

    async def verify(self, bidder_data: dict, tender_data: Optional[dict] = None) -> dict:
        gstin = bidder_data.get("gstin", "")
        status = bidder_data.get("gst_status", "Active")
        last_return = bidder_data.get("gst_last_return_filed", "2026-08-25")
        scenario = bidder_data.get("scenario_tag", "")
        
        discrepancies = []
        is_lapsed = status == "Return Filing Lapsed" or scenario == "gst_lapse"
        
        if not gstin or len(gstin) != 15:
            res_status = "FAILED"
            discrepancies.append("Invalid or missing 15-digit GSTIN format.")
        elif is_lapsed:
            res_status = "WARNING"
            discrepancies.append(f"GSTR-3B return filing has lapsed. Last filed: {last_return} (Beyond permissible 90-day grace window).")
        elif status == "Active":
            res_status = "VERIFIED"
        else:
            res_status = "FAILED"
            discrepancies.append(f"GST registration status is '{status}' (Suspended/Cancelled).")

        return {
            "provider": self.provider,
            "provider_name": self.provider_name,
            "status": res_status,
            "simulated_label": SIMULATED_NOTICE,
            "query_key": "GSTIN",
            "query_value": gstin,
            "response_data": {
                "gstin": gstin,
                "legal_name": bidder_data.get("company_name", ""),
                "trade_name": bidder_data.get("company_name", ""),
                "registration_status": "Active" if not is_lapsed and status == "Active" else status,
                "taxpayer_type": "Regular",
                "state_jurisdiction": bidder_data.get("state", "Tamil Nadu"),
                "date_of_registration": "2018-07-01",
                "last_gstr1_filed": last_return,
                "last_gstr3b_filed": last_return,
                "return_filing_compliance_rating": "Poor" if is_lapsed else "High (10/10)",
                "e_way_bill_blocked": is_lapsed
            },
            "discrepancies": discrepancies,
            "timestamp": datetime.utcnow().isoformat()
        }

class UdyamAdapter(BaseGovernmentAdapter):
    provider = "UDYAM"
    provider_name = "Udyam Registration Portal (Ministry of MSME)"

    async def verify(self, bidder_data: dict, tender_data: Optional[dict] = None) -> dict:
        udyam_no = bidder_data.get("udyam_number", "")
        status = bidder_data.get("udyam_status", "Active")
        scenario = bidder_data.get("scenario_tag", "")
        category = bidder_data.get("entity_category", "Micro")
        
        discrepancies = []
        is_expired = "Expired" in status or scenario == "udyam_expired"
        
        if category == "Not MSME":
            res_status = "VERIFIED"
            note = "Bidder registered as Non-MSME. Udyam check not mandatory for large enterprise."
        elif is_expired:
            res_status = "FAILED"
            discrepancies.append("Legacy EM-II / UAM certificate expired. Bidder has not migrated to modern Udyam Registration as per Gazette Notification S.O. 2119(E).")
        elif status == "Active" and udyam_no.startswith("UDYAM-"):
            res_status = "VERIFIED"
        else:
            res_status = "WARNING"
            discrepancies.append(f"Udyam registration status indicates: {status}")

        return {
            "provider": self.provider,
            "provider_name": self.provider_name,
            "status": res_status,
            "simulated_label": SIMULATED_NOTICE,
            "query_key": "UDYAM_REGISTRATION_NUMBER",
            "query_value": udyam_no,
            "response_data": {
                "udyam_number": udyam_no,
                "enterprise_name": bidder_data.get("company_name", ""),
                "enterprise_type": category,
                "major_activity": "Manufacturing" if "Equipment" in bidder_data.get("sector", "") else "Services",
                "status": "Inactive / Expired" if is_expired else status,
                "nic_5_digit_code": "28120 - Manufacture of fluid power equipment",
                "msme_classification_valid_upto": "2024-03-31" if is_expired else "2027-03-31"
            },
            "discrepancies": discrepancies,
            "timestamp": datetime.utcnow().isoformat()
        }

class PANAdapter(BaseGovernmentAdapter):
    provider = "PAN_206AB"
    provider_name = "Income Tax Department (E-Filing Portal & Section 206AB/206CCA Verification)"

    async def verify(self, bidder_data: dict, tender_data: Optional[dict] = None) -> dict:
        pan = bidder_data.get("pan", "")
        compliant_206ab = bidder_data.get("pan_206ab_compliant", True)
        scenario = bidder_data.get("scenario_tag", "")
        
        discrepancies = []
        if scenario == "pan_206ab":
            compliant_206ab = False
            
        if not pan or len(pan) != 10:
            res_status = "FAILED"
            discrepancies.append("Invalid Permanent Account Number (PAN) format.")
        elif not compliant_206ab:
            res_status = "WARNING"
            discrepancies.append("Specified Person under Section 206AB of Income Tax Act (Non-filer of ITR for preceding AY). Higher rate of TDS/TCS surcharge applicable.")
        else:
            res_status = "VERIFIED"

        return {
            "provider": self.provider,
            "provider_name": self.provider_name,
            "status": res_status,
            "simulated_label": SIMULATED_NOTICE,
            "query_key": "PAN",
            "query_value": pan,
            "response_data": {
                "pan": pan,
                "pan_holder_name": bidder_data.get("company_name", ""),
                "pan_status": "Existing and Valid",
                "aadhaar_seeding_status": "Linked / Not Applicable for Corporate Entity",
                "sec_206ab_specified_person": not compliant_206ab,
                "higher_tds_applicable": not compliant_206ab,
                "itr_filing_status_ay2025_26": "Not Filed" if not compliant_206ab else "Filed"
            },
            "discrepancies": discrepancies,
            "timestamp": datetime.utcnow().isoformat()
        }

class MCAAdapter(BaseGovernmentAdapter):
    provider = "MCA"
    provider_name = "Ministry of Corporate Affairs (MCA21 Portal)"

    async def verify(self, bidder_data: dict, tender_data: Optional[dict] = None) -> dict:
        cin = bidder_data.get("cin", "")
        mca_status = bidder_data.get("mca_status", "Active / Compliant")
        scenario = bidder_data.get("scenario_tag", "")
        
        discrepancies = []
        is_strikeoff = "Strike Off" in mca_status or scenario == "mca_strikeoff"
        
        if is_strikeoff:
            res_status = "FAILED"
            discrepancies.append("Strike Off notice issued under Section 248 of the Companies Act, 2013 by the Registrar of Companies (RoC). High operational default risk.")
        elif mca_status == "Active / Compliant":
            res_status = "VERIFIED"
        else:
            res_status = "WARNING"
            discrepancies.append(f"MCA status flagged: {mca_status}")

        return {
            "provider": self.provider,
            "provider_name": self.provider_name,
            "status": res_status,
            "simulated_label": SIMULATED_NOTICE,
            "query_key": "CIN_LLPIN",
            "query_value": cin,
            "response_data": {
                "cin": cin,
                "company_name": bidder_data.get("company_name", ""),
                "roc_jurisdiction": "RoC Chennai / Mumbai / Delhi",
                "company_status": "Under Strike-Off (STK-2 / Section 248)" if is_strikeoff else "Active",
                "annual_filing_status_mgt7": "Default" if is_strikeoff else "Compliant",
                "financial_statement_status_aoc4": "Default" if is_strikeoff else "Compliant",
                "active_compliance_form_inc22a": "Non-Compliant" if is_strikeoff else "Filed"
            },
            "discrepancies": discrepancies,
            "timestamp": datetime.utcnow().isoformat()
        }

class EPFOAdapter(BaseGovernmentAdapter):
    provider = "EPFO"
    provider_name = "Employees' Provident Fund Organisation (EPFO E-Sewa Portal)"

    async def verify(self, bidder_data: dict, tender_data: Optional[dict] = None) -> dict:
        epfo_status = bidder_data.get("epfo_status", "Active")
        scenario = bidder_data.get("scenario_tag", "")
        has_arrears = "Arrears" in epfo_status or scenario == "epfo_esic_arrears"
        
        epfo_required = True
        if tender_data and not tender_data.get("epfo_esic_required", True):
            epfo_required = False

        discrepancies = []
        if has_arrears:
            res_status = "WARNING" if not epfo_required else "FAILED"
            discrepancies.append("Contribution Arrears Notice issued under Section 7A/14B of EPF & MP Act 1952. Unpaid employer contributions.")
        elif epfo_status == "Active":
            res_status = "VERIFIED"
        else:
            res_status = "WARNING"
            discrepancies.append(f"EPFO status: {epfo_status}")

        return {
            "provider": self.provider,
            "provider_name": self.provider_name,
            "status": res_status,
            "simulated_label": SIMULATED_NOTICE,
            "query_key": "EPFO_ESTABLISHMENT_ID",
            "query_value": f"DLCPM{abs(hash(bidder_data.get('company_name', ''))) % 1000000:07d}",
            "response_data": {
                "establishment_name": bidder_data.get("company_name", ""),
                "status": "Arrears / 7A Proceedings" if has_arrears else "Active & Compliant",
                "active_subscribers": 48 if not has_arrears else 22,
                "last_ecr_challan_month": "2026-08",
                "damages_pending_sec_14b": 184500.0 if has_arrears else 0.0
            },
            "discrepancies": discrepancies,
            "timestamp": datetime.utcnow().isoformat()
        }

class ESICAdapter(BaseGovernmentAdapter):
    provider = "ESIC"
    provider_name = "Employees' State Insurance Corporation (ESIC Portal)"

    async def verify(self, bidder_data: dict, tender_data: Optional[dict] = None) -> dict:
        esic_status = bidder_data.get("esic_status", "Active")
        scenario = bidder_data.get("scenario_tag", "")
        has_arrears = "Arrears" in esic_status or scenario == "epfo_esic_arrears"
        
        esic_required = True
        if tender_data and not tender_data.get("epfo_esic_required", True):
            esic_required = False

        discrepancies = []
        if has_arrears:
            res_status = "WARNING" if not esic_required else "FAILED"
            discrepancies.append("ESIC contribution arrears notice under Section 45A of ESI Act 1948. Outstanding monthly contribution defaults.")
        elif esic_status == "Active":
            res_status = "VERIFIED"
        else:
            res_status = "WARNING"
            discrepancies.append(f"ESIC status: {esic_status}")

        return {
            "provider": self.provider,
            "provider_name": self.provider_name,
            "status": res_status,
            "simulated_label": SIMULATED_NOTICE,
            "query_key": "ESIC_EMPLOYER_CODE",
            "query_value": f"3100{abs(hash(bidder_data.get('company_name', ''))) % 1000000:06d}0000999",
            "response_data": {
                "unit_name": bidder_data.get("company_name", ""),
                "status": "Contribution Defaulter" if has_arrears else "Active & Compliant",
                "insured_persons_count": 36,
                "rc_recovery_notice_active": has_arrears
            },
            "discrepancies": discrepancies,
            "timestamp": datetime.utcnow().isoformat()
        }

class StartupIndiaAdapter(BaseGovernmentAdapter):
    provider = "STARTUP_INDIA"
    provider_name = "Startup India DPIIT Recognition Portal"

    async def verify(self, bidder_data: dict, tender_data: Optional[dict] = None) -> dict:
        is_startup = bidder_data.get("startup_recognized", False)
        cert = bidder_data.get("startup_certificate", "")
        scenario = bidder_data.get("scenario_tag", "")
        
        if scenario == "startup_recognized":
            is_startup = True
            cert = cert or "DIPP-59615"

        discrepancies = []
        if is_startup:
            res_status = "VERIFIED"
        else:
            res_status = "NOT_APPLICABLE"

        return {
            "provider": self.provider,
            "provider_name": self.provider_name,
            "status": res_status,
            "simulated_label": SIMULATED_NOTICE,
            "query_key": "DPIIT_RECOGNITION_NUMBER",
            "query_value": cert or "N/A",
            "response_data": {
                "entity_name": bidder_data.get("company_name", ""),
                "dpiit_recognized": is_startup,
                "recognition_number": cert if is_startup else "Not Registered",
                "tender_prior_experience_waiver_eligible": is_startup,
                "tender_prior_turnover_waiver_eligible": is_startup
            },
            "discrepancies": discrepancies,
            "timestamp": datetime.utcnow().isoformat()
        }

class NSICAdapter(BaseGovernmentAdapter):
    provider = "NSIC"
    provider_name = "National Small Industries Corporation (Single Point Registration Scheme)"

    async def verify(self, bidder_data: dict, tender_data: Optional[dict] = None) -> dict:
        is_nsic = bidder_data.get("nsic_registered", False)
        scenario = bidder_data.get("scenario_tag", "")
        if scenario == "nsic_registered":
            is_nsic = True

        return {
            "provider": self.provider,
            "provider_name": self.provider_name,
            "status": "VERIFIED" if is_nsic else "NOT_APPLICABLE",
            "simulated_label": SIMULATED_NOTICE,
            "query_key": "NSIC_SPRS_NUMBER",
            "query_value": f"NSIC/SPRS/2024/{abs(hash(bidder_data.get('company_name', ''))) % 100000}" if is_nsic else "N/A",
            "response_data": {
                "enterprise_name": bidder_data.get("company_name", ""),
                "sprs_registration_active": is_nsic,
                "emd_exemption_eligible": is_nsic,
                "tender_set_free_cost_eligible": is_nsic
            },
            "discrepancies": [],
            "timestamp": datetime.utcnow().isoformat()
        }

class BlacklistAdapter(BaseGovernmentAdapter):
    provider = "BLACKLIST_GEM"
    provider_name = "GeM Incident Management & Debarment Portal (Dept of Expenditure)"

    async def verify(self, bidder_data: dict, tender_data: Optional[dict] = None) -> dict:
        blacklisted = bidder_data.get("blacklisted", False)
        reason = bidder_data.get("blacklist_reason", "")
        scenario = bidder_data.get("scenario_tag", "")
        
        if scenario == "blacklisted":
            blacklisted = True
            reason = reason or "Debarred under GeM Incident Management for non-performance / misconduct"

        discrepancies = []
        if blacklisted:
            res_status = "FAILED"
            discrepancies.append(f"CRITICAL: Entity is actively debarred/blacklisted on GeM. Reason: {reason}")
        else:
            res_status = "VERIFIED"

        return {
            "provider": self.provider,
            "provider_name": self.provider_name,
            "status": res_status,
            "simulated_label": SIMULATED_NOTICE,
            "query_key": "PAN_OR_CIN",
            "query_value": bidder_data.get("pan", "") or bidder_data.get("cin", ""),
            "response_data": {
                "entity_name": bidder_data.get("company_name", ""),
                "debarred": blacklisted,
                "debarment_reason": reason if blacklisted else "Clear (No incidents found in national watchlist)",
                "debarment_level": "PAN-India GeM & Central Public Sector Enterprises" if blacklisted else "None",
                "valid_until": "2027-12-31" if blacklisted else "N/A"
            },
            "discrepancies": discrepancies,
            "timestamp": datetime.utcnow().isoformat()
        }

class LocalContentAdapter(BaseGovernmentAdapter):
    provider = "LOCAL_CONTENT_REGISTRY"
    provider_name = "Public Procurement Make In India (PPP-MII) Portal"

    async def verify(self, bidder_data: dict, tender_data: Optional[dict] = None) -> dict:
        bidder_lc = float(bidder_data.get("local_content_pct", 50.0) or 0.0)
        req_lc = 50.0
        if tender_data:
            req_lc = float(tender_data.get("required_local_content_pct", 50.0) or 0.0)
            
        discrepancies = []
        if bidder_lc < req_lc:
            res_status = "FAILED"
            discrepancies.append(f"Declared local content of {bidder_lc:.1f}% fails the minimum tender requirement of {req_lc:.1f}%.")
        elif bidder_lc >= 50.0:
            res_status = "VERIFIED"
        else:
            res_status = "VERIFIED" if req_lc <= bidder_lc else "WARNING"

        return {
            "provider": self.provider,
            "provider_name": self.provider_name,
            "status": res_status,
            "simulated_label": SIMULATED_NOTICE,
            "query_key": "MII_AFFIDAVIT_PERCENTAGE",
            "query_value": f"{bidder_lc:.1f}%",
            "response_data": {
                "declared_local_content_pct": bidder_lc,
                "required_local_content_pct": req_lc,
                "supplier_classification": "Class-I Local Supplier (>=50%)" if bidder_lc >= 50 else ("Class-II Local Supplier (>=20%)" if bidder_lc >= 20 else "Non-Local Supplier (<20%)"),
                "eligibility_result": "COMPLIANT" if bidder_lc >= req_lc else "NON-COMPLIANT"
            },
            "discrepancies": discrepancies,
            "timestamp": datetime.utcnow().isoformat()
        }

class DigiLockerAdapter(BaseGovernmentAdapter):
    provider = "DIGILOCKER"
    provider_name = "DigiLocker National Document Exchange (MeitY)"

    async def verify(self, bidder_data: dict, tender_data: Optional[dict] = None) -> dict:
        return {
            "provider": self.provider,
            "provider_name": self.provider_name,
            "status": "VERIFIED",
            "simulated_label": SIMULATED_NOTICE,
            "query_key": "CORPORATE_DIGILOCKER_ID",
            "query_value": bidder_data.get("pan", ""),
            "response_data": {
                "digilocker_verified": True,
                "available_e_signed_documents": [
                    "PAN Card", "GST Registration Certificate", "Udyam Certificate"
                ]
            },
            "discrepancies": [],
            "timestamp": datetime.utcnow().isoformat()
        }

class GovernmentVerificationService:
    def __init__(self):
        self.adapters = [
            GSTNAdapter(),
            UdyamAdapter(),
            PANAdapter(),
            MCAAdapter(),
            EPFOAdapter(),
            ESICAdapter(),
            StartupIndiaAdapter(),
            NSICAdapter(),
            BlacklistAdapter(),
            LocalContentAdapter(),
            DigiLockerAdapter()
        ]

    async def verify_all(self, bidder_data: dict, tender_data: Optional[dict] = None) -> List[dict]:
        results = []
        for adapter in self.adapters:
            res = await adapter.verify(bidder_data, tender_data)
            results.append(res)
        return results

    async def verify_single(self, provider_code: str, bidder_data: dict, tender_data: Optional[dict] = None) -> Optional[dict]:
        for adapter in self.adapters:
            if adapter.provider.lower() == provider_code.lower():
                return await adapter.verify(bidder_data, tender_data)
        return None

govt_service = GovernmentVerificationService()
