"""
AI analysis service.

Two code paths, same output shape (app.models.schemas.AIAnalysisOut):

1. Real Gemini path (used when settings.GEMINI_API_KEY is set): sends the
   uploaded image to Gemini 1.5 Flash with a structured-JSON prompt, exactly
   as described in the original build spec.

2. Fallback path (used when no key is configured, or if the Gemini call
   raises/times out/returns malformed JSON): a transparent, rule-based
   classifier driven off the complaint's title/description text and category
   hint. It is clearly labeled `source: "rule_based_fallback"` in every
   response so the frontend/admin can always tell which path produced a
   given analysis - nothing is silently faked as a real model output.

This means complaint submission never breaks because of an AI outage, and
the moment a real key is added to .env, real Gemini calls start happening
with zero code changes anywhere else in the app.
"""
import json
import re
from typing import Optional
from app.config import settings
from app.models.db import IssueCategory, SeverityLevel, DEPARTMENT_FOR_CATEGORY

_GEMINI_READY = False
if settings.GEMINI_API_KEY:
    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        _GEMINI_READY = True
    except ImportError:
        _GEMINI_READY = False

ANALYSIS_PROMPT = """
You are an expert civic issue classifier for an Indian municipal corporation.
Analyze this image of a public civic problem and respond ONLY with valid JSON.

Required JSON format:
{
  "category": "pothole|streetlight|garbage|water|drainage|tree|traffic_signal|other",
  "severity": "low|medium|high|critical",
  "confidence": 0.0-1.0,
  "description": "One sentence describing what you see",
  "tags": ["tag1", "tag2", "tag3"],
  "suggested_department": "Department name",
  "estimated_resolution_days": 1-30,
  "explainability": {
    "visual_cues": ["cue1", "cue2"],
    "reasoning": "Why you classified it this way",
    "hazard_assessment": "Safety risk description"
  }
}

Severity guidelines:
- critical: Immediate danger to life/traffic (large potholes, live wires, flooding)
- high: Significant disruption affecting many people
- medium: Noticeable problem, moderate impact
- low: Minor cosmetic or inconvenience issue

Respond ONLY with the JSON object. No markdown, no explanation.
"""

# Keyword signals for the fallback classifier. Each maps to a category and a
# severity nudge. This is intentionally simple and auditable - every decision
# can be traced back to a matched keyword via `explainability.visual_cues`.
_KEYWORD_RULES: list[tuple[re.Pattern, IssueCategory, list[str]]] = [
    (re.compile(r"pothole|road damage|cracked road|crater", re.I), IssueCategory.pothole, ["pothole", "road surface damage"]),
    (re.compile(r"street ?light|lamp post|lamppost", re.I), IssueCategory.streetlight, ["streetlight", "lighting fixture"]),
    (re.compile(r"garbage|trash|waste|dump|litter", re.I), IssueCategory.garbage, ["garbage", "waste accumulation"]),
    (re.compile(r"flood|water log|leak|pipe burst|sewage water", re.I), IssueCategory.water, ["standing water", "water leakage"]),
    (re.compile(r"drain|manhole|sewer", re.I), IssueCategory.drainage, ["drainage", "manhole/drain cover"]),
    (re.compile(r"tree|branch|fallen log", re.I), IssueCategory.tree, ["fallen tree", "overgrown branch"]),
    (re.compile(r"traffic signal|traffic light|signal", re.I), IssueCategory.traffic_signal, ["traffic signal"]),
]

_CRITICAL_SIGNALS = re.compile(r"danger|accident|live wire|electrocut|collapsed|flooding|deep|large|major", re.I)
_HIGH_SIGNALS = re.compile(r"broken|not working|overflow|blocked|damaged|days|weeks", re.I)
_LOW_SIGNALS = re.compile(r"minor|small|cosmetic|slight", re.I)


def _rule_based_classify(title: str, description: str, category_hint: Optional[IssueCategory]) -> dict:
    text = f"{title} {description}"
    matched_cues: list[str] = []
    category = category_hint

    if category is None:
        for pattern, cat, cues in _KEYWORD_RULES:
            if pattern.search(text):
                category = cat
                matched_cues = cues
                break
        if category is None:
            category = IssueCategory.other
            matched_cues = ["no strong category keyword matched; defaulted to 'other'"]
    else:
        # still try to gather supporting cues for the given category
        for pattern, cat, cues in _KEYWORD_RULES:
            if cat == category and pattern.search(text):
                matched_cues = cues
                break
        if not matched_cues:
            matched_cues = [f"category provided by reporter: {category.value}"]

    if _CRITICAL_SIGNALS.search(text):
        severity = SeverityLevel.critical
        confidence = 0.74
    elif _HIGH_SIGNALS.search(text):
        severity = SeverityLevel.high
        confidence = 0.70
    elif _LOW_SIGNALS.search(text):
        severity = SeverityLevel.low
        confidence = 0.68
    else:
        severity = SeverityLevel.medium
        confidence = 0.65

    resolution_days = {
        SeverityLevel.critical: 1,
        SeverityLevel.high: 3,
        SeverityLevel.medium: 7,
        SeverityLevel.low: 14,
    }[severity]

    return {
        "category": category,
        "severity": severity,
        "confidence": confidence,
        "description": f"Reported issue classified as {category.value.replace('_', ' ')} based on the description text.",
        "tags": [category.value, severity.value, "auto-classified"],
        "suggested_department": DEPARTMENT_FOR_CATEGORY[category],
        "estimated_resolution_days": resolution_days,
        "similar_complaints_nearby": 0,
        "explainability": {
            "visual_cues": matched_cues,
            "reasoning": (
                "No Gemini API key is configured (or the live call failed), so this analysis was "
                "produced by a transparent keyword-matching fallback over the title and description, "
                "not by image content. Add GEMINI_API_KEY to backend/.env to enable real image analysis."
            ),
            "hazard_assessment": (
                "Hazard level estimated from severity keywords in the report text; not a substitute "
                "for visual inspection of the photo."
            ),
        },
        "source": "rule_based_fallback",
    }


async def analyze_complaint(
    title: str,
    description: str,
    category_hint: Optional[IssueCategory] = None,
    image_url: Optional[str] = None,
) -> dict:
    """
    Returns a dict matching AIAnalysisOut. Tries real Gemini first (image-based)
    if configured and an image is available; otherwise / on any failure, falls
    back to the rule-based text classifier so submission never blocks.
    """
    if _GEMINI_READY and image_url:
        try:
            return await _gemini_analyze_image(image_url)
        except Exception as e:
            print(f"[gemini_service] Gemini call failed, using fallback: {e}")

    return _rule_based_classify(title, description, category_hint)


async def _gemini_analyze_image(image_url: str) -> dict:
    """Real Gemini 1.5 Flash image analysis path. Requires GEMINI_API_KEY."""
    import base64
    import httpx
    import google.generativeai as genai

    async with httpx.AsyncClient(timeout=settings.AI_PROCESSING_TIMEOUT_SECONDS) as client:
        resp = await client.get(image_url)
        resp.raise_for_status()
        image_data = base64.b64encode(resp.content).decode()
        content_type = resp.headers.get("content-type", "image/jpeg")

    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content([
        {"mime_type": content_type, "data": image_data},
        ANALYSIS_PROMPT,
    ])

    raw_text = response.text.strip()
    if raw_text.startswith("```"):
        raw_text = raw_text.split("```")[1]
        if raw_text.startswith("json"):
            raw_text = raw_text[4:]

    parsed = json.loads(raw_text)
    parsed["category"] = IssueCategory(parsed["category"])
    parsed["severity"] = SeverityLevel(parsed["severity"])
    parsed["similar_complaints_nearby"] = parsed.get("similar_complaints_nearby", 0)
    parsed["source"] = "gemini"
    return parsed
