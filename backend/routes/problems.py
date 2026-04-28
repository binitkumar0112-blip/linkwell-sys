from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from services.auth_dependency import get_current_user
from services import problem_service

router = APIRouter(prefix="/problems", tags=["problems"])


# ── Request / Response models ─────────────────────────────────────────────────

class ProblemCreate(BaseModel):
    title: str
    description: str
    category: str
    severity: str
    locality: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    amount_needed: Optional[float] = 0.0


class StatusUpdate(BaseModel):
    status: str
    volunteer_id: Optional[str] = None


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/report", response_model=Dict[str, Any])
async def report_problem(
    body: ProblemCreate,
    current_user: dict = Depends(get_current_user),
):
    """Create a new problem. Requires a valid Firebase ID token."""
    data = body.model_dump()
    problem = problem_service.create_problem(data, user_id=current_user["uid"])
    return problem


@router.get("", response_model=List[Dict[str, Any]])
async def get_problems(locality: Optional[str] = None, limit: int = 50):
    """Return all public problems (public, no auth required)."""
    return problem_service.get_all_problems(locality=locality, limit=limit)


@router.post("/{problem_id}/upvote", response_model=Dict[str, Any])
async def upvote(
    problem_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Upvote a problem. Requires auth to prevent anonymous spam."""
    try:
        return problem_service.upvote_problem(problem_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{problem_id}/status", response_model=Dict[str, Any])
async def update_status(
    problem_id: str,
    body: StatusUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update problem status. Requires auth."""
    try:
        return problem_service.update_problem_status(
            problem_id, body.status, body.volunteer_id
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
