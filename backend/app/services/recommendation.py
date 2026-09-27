from typing import Dict, Any, List, Optional
import json
import requests
from app.config import settings

class RecommendationService:
    def __init__(self):
        self.ai_mode = settings.AI_MODE
        self.api_key = settings.GEMINI_API_KEY

    async def generate_explanation(self, rule_check: dict, bidder_data: dict, tender_data: dict) -> dict:
        """Generates detailed 'Why is this flagged?' explainability card for a specific rule."""
        req_name = rule_check.get("requirement", "")
        status = rule_check.get("status", "")
        reason = rule_check.get("reason", "")
        evidence_list = rule_check.get("evidence", [])
        
        # Build structured explainability response
        ev_summary = []
        for ev in evidence_list:
            ev_summary.append({
                "source": ev.get("source", "Document"),
                "detected": str(ev.get("detected_value", "")),
                "expected": str(ev.get("expected_value", "")),
                "citation": ev.get("citation", "")
            })

        explanation = {
            "title": f"{req_name} — {status}",
            "tender_requirement": f"Mandatory compliance per GeM Tender {tender_data.get('tender_id', 'GEM/2026/...')}: {req_name}",
            "detected_state": reason,
            "evidence_chain": ev_summary,
            "ai_confidence": rule_check.get("confidence", 0.95),
            "regulatory_basis": "General Financial Rules (GFR 2017) Rule 144 / DPIIT PPP-MII Order 2017 / GeM GTC Clauses",
            "recommended_officer_action": rule_check.get("recommendation_action", "Review document in detail and record observation."),
            "disclaimer": "AI findings are decision-support indicators. The Procurement Officer retains sovereign authority to accept or reject."
        }

        # Optional Gemini enhancement
        if self.ai_mode == "gemini" and self.api_key and status in ["FAIL", "WARNING"]:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"
                prompt = f"""
You are an AI Procurement Advisor for Chennai Petroleum Corporation Limited.
Provide a concise, 2-sentence legal/procurement explanation for why this item was flagged and what the procurement officer should legally cite.
Requirement: {req_name}
Status: {status}
Details: {reason}
Bidder: {bidder_data.get('company_name')}
Return JSON: {{"explanation": string, "suggested_letter_clause": string}}
"""
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.1, "responseMimeType": "application/json"}
                }
                res = requests.post(url, json=payload, timeout=6)
                if res.status_code == 200:
                    data = res.json()
                    extra = json.loads(data["candidates"][0]["content"]["parts"][0]["text"])
                    explanation["llm_advisory_clause"] = extra.get("suggested_letter_clause")
                    explanation["llm_legal_explanation"] = extra.get("explanation")
            except Exception as e:
                print(f"[LLM Explanation] Gemini advisory failed: {e}")

        return explanation

recommendation_service = RecommendationService()
