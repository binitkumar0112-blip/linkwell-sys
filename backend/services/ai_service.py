import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))

_model = genai.GenerativeModel("gemini-1.5-flash")


def prioritize_problem(description: str, category: str = "", upvotes: int = 0) -> dict:
    """
    Ask Gemini to score a civic problem by priority and urgency.
    Returns: { priority_score: int (0-100), urgency: str }
    """
    prompt = f"""
You are an AI model that helps triage civic problems reported by community members.

Analyse the following problem and respond ONLY with a valid JSON object.

Problem description: "{description}"
Category: "{category}"
Community upvotes: {upvotes}

Respond with ONLY this JSON structure (no markdown, no extra text):
{{
  "priority_score": <integer 0-100>,
  "urgency": "<low | medium | high | critical>"
}}
""".strip()

    try:
        response = _model.generate_content(prompt)
        raw = response.text.strip()
        # Strip accidental markdown fences
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return json.loads(raw)
    except Exception as e:
        # Fallback if Gemini fails or key is missing
        return {"priority_score": 50, "urgency": "medium", "error": str(e)}


def match_ngo(description: str, ngos: list[dict]) -> dict:
    """
    Ask Gemini to recommend the best NGO for a given problem.
    Returns: { best_ngo_id: str, confidence: str, reason: str }
    """
    ngo_list = "\n".join(
        [f'- id: {n.get("id")}, name: {n.get("name")}, focus: {n.get("focus", "general")}' for n in ngos]
    )
    prompt = f"""
You are an AI model that matches civic problems with the most suitable NGO.

Problem: "{description}"

Available NGOs:
{ngo_list}

Respond with ONLY this JSON (no markdown):
{{
  "best_ngo_id": "<ngo id>",
  "confidence": "<low | medium | high>",
  "reason": "<one sentence reason>"
}}
""".strip()

    try:
        response = _model.generate_content(prompt)
        raw = response.text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return json.loads(raw)
    except Exception as e:
        return {"best_ngo_id": None, "confidence": "low", "reason": str(e)}


def check_sensitive(text: str) -> dict:
    """
    Classify a text as normal / sensitive / critical.
    Returns: { classification: str, reason: str }
    """
    prompt = f"""
Classify the following community report text as one of: normal, sensitive, critical.
Use "critical" for reports about violence, child abuse, or medical emergencies.
Use "sensitive" for reports about harassment, discrimination, or personal distress.
Use "normal" for all other civic/infrastructure issues.

Text: "{text}"

Respond with ONLY this JSON (no markdown):
{{
  "classification": "<normal | sensitive | critical>",
  "reason": "<one sentence>"
}}
""".strip()

    try:
        response = _model.generate_content(prompt)
        raw = response.text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return json.loads(raw)
    except Exception as e:
        return {"classification": "normal", "reason": str(e)}


def assess_urgency(title: str, description: str, category: str = "") -> dict:
    """
    Deterministic, local heuristic to assess urgency without external APIs.
    Returns: { "urgency": "low|medium|high", "reason": "one sentence explanation" }
    Falls back to 'medium' when unsure.
    """
    try:
        text = " ".join([str(title or ""), str(description or ""), str(category or "")]).lower()

        # Keyword sets (ordered by priority)
        HIGH = [
            'collapse', 'collapsed', 'trapped', 'fire', 'burning', 'smoke', 'bleed', 'bleeding', 'injured', 'injury',
            'unconscious', 'not breathing', 'drowning', 'heart attack', 'stroke', 'pregnant and', 'pregnant',
            'gas leak', 'explosion', 'electrocution', 'knife', 'gun', 'shooting', 'attack', 'assault', 'help now',
            'immediate', 'emergency', 'life-threatening', 'life threatening', 'critical'
        ]

        MEDIUM = [
            'blocked road', 'blocked', 'road blocked', 'flood', 'flooding', 'power outage', 'power cut', 'no power',
            'water supply', 'no water', 'sewage', 'sewer', 'broken', 'traffic light', 'traffic signal', 'landslide',
            'sinkhole', 'collapsed road', 'bridge', 'structural damage', 'leak', 'overflow', 'widespread'
        ]

        LOW = [
            'pothole', 'potholes', 'graffiti', 'litter', 'trash', 'dumping', 'noise', 'streetlight', 'bench', 'weed',
            'cosmetic', 'paint', 'stain', 'minor', 'small'
        ]

        def find_matches(keywords):
            found = []
            for k in keywords:
                if k in text:
                    found.append(k)
            return found

        high_matches = find_matches(HIGH)
        if high_matches:
            reason = f"Immediate danger indicators found: {', '.join(high_matches[:3])}."
            return {"urgency": "high", "reason": reason}

        med_matches = find_matches(MEDIUM)
        if med_matches:
            reason = f"Infrastructure/service impact indicators: {', '.join(med_matches[:3])}."
            return {"urgency": "medium", "reason": reason}

        low_matches = find_matches(LOW)
        if low_matches:
            reason = f"Minor issue indicators: {', '.join(low_matches[:3])}."
            return {"urgency": "low", "reason": reason}

        # Heuristic: very short titles/descriptions likely low; extremely urgent words fallback
        if len(text) < 40:
            return {"urgency": "low", "reason": "Short report with no clear urgency indicators."}

        # Default
        return {"urgency": "medium", "reason": "No clear urgency indicators detected; defaulting to medium."}
    except Exception as e:
        return {"urgency": "medium", "reason": f"Error in local urgency assessment: {str(e)}"}
