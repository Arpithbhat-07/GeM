import requests
import json
import sys

PROD_URL = "https://gem-9y7s.onrender.com/api"

endpoints = [
    ("GET", "/health", None),
    ("GET", "/dashboard/stats", None),
    ("GET", "/tenders", None),
    ("GET", "/bidders", None),
    ("GET", "/bidders?limit=5", None),
    ("GET", "/bidders/BID-001", None),
    ("GET", "/queue", None),
    ("GET", "/audit", None),
    ("GET", "/government/BID-001", None),
    ("GET", "/reports/BID-001?tender_id=GEM/2026/B/894210", None),
    ("GET", "/documents", None),
    ("POST", "/bidders/compare", {"bidder_ids": ["BID-001", "BID-002"], "tender_id": "GEM/2026/B/894210"}),
    ("POST", "/compliance/run", {"bidder_id": "BID-001", "tender_id": "GEM/2026/B/894210"}),
    ("POST", "/compliance/explain", {"bidder_id": "BID-001", "rule_id": "MII-LC-001", "tender_id": "GEM/2026/B/894210"}),
]

print("============================================================")
print("     TESTING LIVE RENDER BACKEND: https://gem-9y7s.onrender.com")
print("============================================================")

all_ok = True
for method, ep, body in endpoints:
    url = f"{PROD_URL}{ep}"
    try:
        if method == "GET":
            r = requests.get(url, timeout=15)
        else:
            r = requests.post(url, json=body, timeout=15)
        
        status = r.status_code
        ok = (status == 200)
        if not ok:
            all_ok = False
        
        detail = ""
        if ep == "/dashboard/stats" and ok:
            d = r.json()
            detail = f"Bidders: {d.get('total_bidders')}, Tenders: {d.get('active_tenders')}, Review: {d.get('bids_requiring_review')}"
        elif ep == "/bidders" and ok:
            detail = f"Count: {len(r.json())}"
        elif ep == "/queue" and ok:
            detail = f"Items: {len(r.json())}"
        elif ep == "/health" and ok:
            d = r.json()
            detail = f"Status: {d.get('status')}, Mode: {d.get('database', {}).get('mode')}"
        
        print(f"[{status}] {method:<4} {ep:<35} -> {'PASS' if ok else 'FAIL'} {detail}")
    except Exception as e:
        all_ok = False
        print(f"[ERR] {method:<4} {ep:<35} -> EXCEPTION: {e}")

print("============================================================")
if all_ok:
    print(">>> ALL PRODUCTION API ENDPOINTS TESTED WITH 100% SUCCESS <<<")
else:
    print(">>> SOME PRODUCTION ENDPOINTS FAILED <<<")
