import asyncio
from app.database import db_manager, get_db

async def run_diag():
    await db_manager.connect()
    db = get_db()
    
    tenders = await db['tenders'].find({}).to_list(100)
    print(f"Total Tenders: {len(tenders)}")
    for t in tenders:
        tid = t.get('tender_id')
        count = await db['bidders'].count_documents({'tender_ids': tid})
        print(f"  Tender {tid}: {count} bidders (Title: {t.get('tender_title')[:30]}...)")
    
    total_bidders = await db['bidders'].count_documents({})
    print(f"\nTotal Bidders in DB: {total_bidders}")
    
    # Check sample bidders and their tender_ids
    sample = await db['bidders'].find({}).limit(5).to_list(5)
    for b in sample:
        print(f"  Bidder {b.get('bidder_id')} ({b.get('company_name')[:25]}): tender_ids = {b.get('tender_ids')}, status = {b.get('verification_status')}, risk = {b.get('risk_level')}")
        
    # Check verification queue filter: verification_status == 'REQUIRES_REVIEW'
    req_review = await db['bidders'].count_documents({'verification_status': 'REQUIRES_REVIEW'})
    print(f"\nBidders with REQUIRES_REVIEW: {req_review}")
    
    # Check compliance collection
    compliance_count = await db['compliance_results'].count_documents({})
    print(f"Compliance results in DB: {compliance_count}")
    
    # Check documents collection
    docs_count = await db['documents'].count_documents({})
    print(f"Documents in DB: {docs_count}")
    
    # Check audit collection
    audit_count = await db['audit_logs'].count_documents({})
    print(f"Audit logs in DB: {audit_count}")

    # Check government verifications
    govt_count = await db['government_verifications'].count_documents({})
    print(f"Government verifications in DB: {govt_count}")

if __name__ == '__main__':
    asyncio.run(run_diag())
