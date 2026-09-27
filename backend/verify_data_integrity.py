import asyncio
import sys
from app.database import db_manager, get_db

async def run_integrity_check():
    await db_manager.connect()
    db = get_db()
    
    tenders_count = await db["tenders"].count_documents({})
    bidders_count = await db["bidders"].count_documents({})
    compliance_count = await db["compliance_results"].count_documents({})
    govt_count = await db["government_verifications"].count_documents({})
    docs_count = await db["documents"].count_documents({})
    audit_count = await db["audit_logs"].count_documents({})
    
    # Calculate queue items
    bidders = await db["bidders"].find({}).to_list(200)
    queue_count = sum(
        1 for b in bidders 
        if not (b.get("scenario_tag") == "clean" and b.get("risk_level") == "LOW" and b.get("verification_status") == "VERIFIED")
    )
    
    # Calculate compliance findings (rules that failed or produced warnings)
    compliance_results = await db["compliance_results"].find({}).to_list(200)
    total_checks = sum(len(c.get("checks", [])) for c in compliance_results)
    findings_count = sum(
        sum(1 for chk in c.get("checks", []) if chk.get("status") in ["FAIL", "WARNING"])
        for c in compliance_results
    )
    
    print("=" * 60)
    print("      GE M SENTINEL AI — DATA INTEGRITY REPORT")
    print("=" * 60)
    print(f"Tenders:                {tenders_count}")
    print(f"Bidders:                {bidders_count} (Expected: 74)")
    print(f"Compliance Checks:      {total_checks}")
    print(f"Compliance Findings:    {findings_count}")
    print(f"Verification Queue:     {queue_count}")
    print(f"Government Adapters:    {govt_count}")
    print(f"Audit Logs:             {audit_count}")
    print(f"Documents:              {docs_count}")
    print("=" * 60)
    
    all_pass = (
        tenders_count >= 7 and
        bidders_count == 74 and
        compliance_count >= 74 and
        queue_count > 0 and
        audit_count > 0
    )
    
    if all_pass:
        print(">>> DATA INTEGRITY STATUS: 100% PASS <<<")
        return 0
    else:
        print(">>> DATA INTEGRITY STATUS: FAILED <<<")
        return 1

if __name__ == "__main__":
    code = asyncio.run(run_integrity_check())
    sys.exit(code)
