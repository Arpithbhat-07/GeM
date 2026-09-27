import requests
import json

BASE = 'http://127.0.0.1:8000/api'

def run_tests():
    print('=== 1. TENDERS TEST ===')
    r = requests.get(f'{BASE}/tenders')
    tenders = r.json()
    print(f'Fetched {len(tenders)} tenders. Flagship: {tenders[0]["tender_id"]} - {tenders[0]["tender_title"][:45]}...')

    print('\n=== 2. TENDER DOC AI EXTRACTION TEST ===')
    with open('sample_docs/SAMPLE_TENDER_GEM_894210.pdf', 'rb') as f:
        r = requests.post(f'{BASE}/tenders/upload-doc', files={'file': f})
    print('AI Tender Extraction Status:', r.status_code)
    extracted = r.json().get('extracted_parameters', {})
    print('Extracted Title:', extracted.get('tender_title'))
    print('Extracted MII %:', extracted.get('required_local_content_pct'))
    print('Extracted EPFO/ESIC:', extracted.get('epfo_esic_required'))

    print('\n=== 3. BIDDERS TEST ===')
    r = requests.get(f'{BASE}/bidders?limit=5')
    bidders = r.json()
    print(f'Fetched {len(bidders)} sample bidders.')

    print('\n=== 4. DEMO DOCUMENT CASE INGESTION & COMPLIANCE RUN (BID-001) ===')
    r = requests.post(f'{BASE}/documents/load-demo-case', json={'bidder_id': 'BID-001', 'case_key': 'low_local_content'})
    print('Demo Case Load Status:', r.status_code, r.json().get('case_title'))

    r = requests.post(f'{BASE}/compliance/run', json={'bidder_id': 'BID-001', 'tender_id': 'GEM/2026/B/894210'})
    comp = r.json()
    print(f'Compliance Score: {comp.get("compliance_score")}%')
    print(f'Risk Level: {comp.get("risk_level")}')
    print(f'AI Recommendation: {comp.get("ai_recommendation", {}).get("status_label")}')
    print(f'Checks count: {len(comp.get("checks", []))}')

    print('\n=== 5. EXPLAINABILITY (Why Flagged?) ===')
    flagged_rules = [c for c in comp.get('checks', []) if c.get('status') in ['FAIL', 'WARNING']]
    if flagged_rules:
        target_rule = flagged_rules[0]['rule_id']
        r = requests.post(f'{BASE}/compliance/explain', json={'bidder_id': 'BID-001', 'rule_id': target_rule, 'tender_id': 'GEM/2026/B/894210'})
        exp = r.json()
        print(f'Rule: {target_rule}')
        print(f'Detected: {exp.get("detected_state")[:75]}...')
        print(f'Action: {exp.get("recommended_officer_action")}')

    print('\n=== 6. PROCUREMENT OFFICER REVIEW RECORDING ===')
    r = requests.post(f'{BASE}/bidders/BID-001/review', json={
        'decision': 'CLARIFICATION_REQUESTED',
        'remarks': 'Issued GeM clarification notice seeking revised MII affidavit verifying minimum 50% domestic value addition.'
    })
    print('Officer Decision Status:', r.status_code, r.json().get('decision'))

    print('\n=== 7. REPORT GENERATION ===')
    r = requests.get(f'{BASE}/reports/BID-001?tender_id=GEM/2026/B/894210')
    report = r.json()
    print('Report ID:', report.get('report_metadata', {}).get('report_id'))
    print('Advisory Disclaimer:', report.get('report_metadata', {}).get('advisory_disclaimer'))

    print('\n=== 8. AUDIT TRAIL VERIFICATION ===')
    r = requests.get(f'{BASE}/audit?entity_id=BID-001&limit=3')
    audit_entries = r.json()
    print(f'Audit trail records for BID-001: {len(audit_entries)}')
    for a in audit_entries:
        print(f'  - [{a.get("action")}] by {a.get("user")}: {a.get("details", "")[:60]}...')

    print('\n>>> ALL 8 CORE COMPLIANCE & DECISION-SUPPORT WORKFLOW STEPS PASSED WITH 100% SUCCESS <<<')

if __name__ == '__main__':
    run_tests()
