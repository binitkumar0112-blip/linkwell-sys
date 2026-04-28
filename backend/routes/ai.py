from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from services import ai_service

router = APIRouter(prefix="/ai", tags=["ai"])


class PrioritizeRequest(BaseModel):
    description: str
    category: Optional[str] = ""
    upvotes: Optional[int] = 0


class MatchNgoRequest(BaseModel):
    description: str
    ngos: List[Dict[str, Any]]


class SensitiveCheckRequest(BaseModel):
    text: str


class AssessUrgencyRequest(BaseModel):
    title: str
    description: str
    category: Optional[str] = ""


@router.post("/prioritize")
async def prioritize(body: PrioritizeRequest):
    """Use Gemini to return priority_score + urgency for a problem."""
    return ai_service.prioritize_problem(body.description, body.category, body.upvotes)


@router.post("/match-ngo")
async def match_ngo(body: MatchNgoRequest):
    """Use Gemini to recommend best NGO for a problem."""
    return ai_service.match_ngo(body.description, body.ngos)


@router.post("/check-sensitive")
async def check_sensitive(body: SensitiveCheckRequest):
    """Use Gemini to classify text as normal / sensitive / critical."""
    return ai_service.check_sensitive(body.text)


@router.post("/assess-urgency")
async def assess_urgency(body: AssessUrgencyRequest):
    """Return AI-assessed urgency and reason for a report."""
    return ai_service.assess_urgency(body.title, body.description, body.category or "")
