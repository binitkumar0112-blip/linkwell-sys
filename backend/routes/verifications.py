from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional

from services import verification_service
from services.auth_dependency import get_current_user

router = APIRouter(prefix="/verification", tags=["verification"])


class SubmitProofRequest(BaseModel):
    issue_id: str
    volunteer_id: str
    proof_image_url: str
    description: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class VerifyTaskRequest(BaseModel):
    submission_id: str
    ngo_id: str
    action: str
    notes: Optional[str] = None


@router.post("/submit-proof")
async def submit_proof(req: SubmitProofRequest, current_user: dict = Depends(get_current_user)):
    return verification_service.submit_proof(req)


@router.get("/ngo/{ngo_id}/pending-verifications")
async def get_pending_verifications(ngo_id: str, current_user: dict = Depends(get_current_user)):
    return verification_service.get_pending_verifications(ngo_id)


@router.post("/verify-task")
async def verify_task(req: VerifyTaskRequest, current_user: dict = Depends(get_current_user)):
    return verification_service.verify_task(req)
