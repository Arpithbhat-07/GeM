import requests
import json
import sys

BASE_URL = 'http://127.0.0.1:8000/api'
FRONTEND_URL = 'http://127.0.0.1:5173'

tests = [
    ('GET', '/health', None),
    ('GET', '/queue', None),
    ('GET', '/tenders', None),
    ('GET', '/bidders', None),
    ('GET', '/bidders?tender_id=GEM/2026/B/894210', None),
    ('GET', '/bidders/BID-001', None),
    ('GET', '/bidders/BID-001?tender_id=GEM/2026/B/894210', None),
    ('GET', '/dashboard/stats', None),
    ('GET', '/audit', None),
    ('GET', '/government/BID-001', None),
    ('GET', '/reports/BID-001?tender_id=GEM/2026/B/894210', None),
    ('GET', '/documents', None),
    ('POST', '/bidders/compare', {'bidder_ids': ['BID-001', 'BID-002', 'BID-003'], 'tender_id': 'GEM/2026/B/894210'}),
    ('POST', '/compliance/run', {'bidder_id': 'BID-001', 'tender_id': 'GEM/2026/B/894210'}),
    ('POST', '/compliance/explain', {'bidder_id': 'BID-001', 'rule_id': 'MII-LC-001', 'tender_id': 'GEM/2026/B/894210'}),
    ('POST', '/bidders/BID-001/review', {'decision': 'CLARIFICATION_REQUESTED', 'remarks': 'Automated QA suite verified'})
]

print("============================================================")
print("       GE M SENTINEL AI - FULL QA TEST SUITE")
print("============================================================")

all_passed = True

for method, ep, body in tests:
    url = f"{BASE_URL}{ep}"
    try:
        if method == 'GET':
            r = requests.get(url, timeout=5)
        else:
            r = requests.post(url, json=body, timeout=5)
        
        status = r.status_code
        passed = (status == 200)
        if not passed:
            all_passed = False
        
        info = ""
        if ep == '/health':
            d = r.json()
            da = d.get('data_availability', {})
            info = f"bidders: {da.get('bidders')}, tenders: {da.get('tenders')}"
        elif ep == '/queue':
            d = r.json()
            info = f"items: {len(d)}"
        elif ep == '/bidders':
            info = f"bidders: {len(r.json())}"
        elif ep == '/dashboard/stats':
            d = r.json()
            info = f"total: {d.get('total_bidders')}, active: {d.get('active_tenders')}, review: {d.get('bids_requiring_review')}"
        
        print(f"[{status}] {method:<4} {ep:<45} -> {'PASS' if passed else 'FAIL'} {info}")
    except Exception as e:
        all_passed = False
        print(f"[ERR] {method:<4} {ep:<45} -> EXCEPTION: {e}")

try:
    rf = requests.get(FRONTEND_URL, timeout=5)
    f_pass = (rf.status_code == 200)
    print(f"[{rf.status_code}] GET  {FRONTEND_URL:<45} -> {'PASS' if f_pass else 'FAIL'} (Vite Single-Page App)")
    if not f_pass:
        all_passed = False
except Exception as e:
    all_passed = False
    print(f"[ERR] GET  {FRONTEND_URL:<45} -> EXCEPTION: {e}")

print("============================================================")
if all_passed:
    print(">>> FINAL QA VERIFICATION RESULT: 100% PASS <<<")
    sys.exit(0)
else:
    print(">>> SOME SUITE CHECKS FAILED <<<")
    sys.exit(1)
