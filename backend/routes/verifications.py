import os
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from supabase import create_client, Client
from dotenv import load_dotenv

from services.auth_dependency import get_current_user

load_dotenv()


SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY")

if SUPABASE_URL and SUPABASE_KEY:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    supabase = None

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
    action: str  # 'approve' or 'reject'
    notes: Optional[str] = None

@router.post("/submit-proof")
async def submit_proof(req: SubmitProofRequest, current_user: dict = Depends(get_current_user)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    # make sure this volunteer is actually assigned
    assignment_res = supabase.table("issue_assignments").select("*").eq("issue_id", req.issue_id).eq("assigned_volunteer_id", req.volunteer_id).execute()
    
    if not assignment_res.data:
        raise HTTPException(status_code=403, detail="Only the assigned volunteer can submit proof.")


    submission_data = {
        "issue_id": req.issue_id,
        "volunteer_id": req.volunteer_id,
        "proof_image_url": req.proof_image_url,
        "description": req.description,
        "latitude": req.latitude,
        "longitude": req.longitude,
        "status": "pending"
    }

    sub_res = supabase.table("task_submissions").insert(submission_data).execute()
    
    if not sub_res.data:
        raise HTTPException(status_code=400, detail="Failed to submit proof.")


    supabase.table("issues").update({"status": "pending_verification"}).eq("id", req.issue_id).execute()

    return {"message": "Proof submitted successfully", "submission": sub_res.data[0]}

@router.get("/ngo/{ngo_id}/pending-verifications")
async def get_pending_verifications(ngo_id: str, current_user: dict = Depends(get_current_user)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")


    assignments = supabase.table("issue_assignments").select("issue_id").eq("assigned_ngo_id", ngo_id).execute()
    if not assignments.data:
        return []

    issue_ids = [a["issue_id"] for a in assignments.data]


    submissions = supabase.table("task_submissions").select("*, issues(*), users!task_submissions_volunteer_id_fkey(*)").in_("issue_id", issue_ids).eq("status", "pending").execute()
    
    return submissions.data

@router.post("/verify-task")
async def verify_task(req: VerifyTaskRequest, current_user: dict = Depends(get_current_user)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    if req.action not in ["approve", "reject"]:
        raise HTTPException(status_code=400, detail="Action must be approve or reject")


    sub_res = supabase.table("task_submissions").select("*").eq("id", req.submission_id).execute()
    if not sub_res.data:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    submission = sub_res.data[0]
    

    new_status = "approved" if req.action == "approve" else "rejected"
    update_res = supabase.table("task_submissions").update({
        "status": new_status,
        "verified_by": req.ngo_id,
        "verification_notes": req.notes
    }).eq("id", req.submission_id).execute()

    issue_id = submission["issue_id"]
    volunteer_user_id = submission["volunteer_id"]  # This is a users.id (NOT volunteers.id)

    if req.action == "approve":

        supabase.table("issues").update({"status": "resolved"}).eq("id", issue_id).execute()
        
        # look up the volunteer's profile (users.id != volunteers.id)
        vol_res = supabase.table("volunteers").select("id, tasks_completed, trust_score").eq("user_id", volunteer_user_id).execute()
        
        if vol_res.data:
            vol = vol_res.data[0]
            # use volunteers.id for assignments, not users.id
            supabase.table("issue_assignments").update({"status": "completed"}).eq("issue_id", issue_id).eq("assigned_volunteer_id", vol["id"]).execute()


            new_tasks = (vol.get("tasks_completed") or 0) + 1
            new_score = (vol.get("trust_score") or 0) + 10
            
            new_level = 'New'
            if new_score > 100: new_level = 'Community Leader'
            elif new_score > 50: new_level = 'Trusted'
            elif new_score > 20: new_level = 'Verified'

            supabase.table("volunteers").update({
                "tasks_completed": new_tasks,
                "trust_score": new_score,
                "trust_level": new_level
            }).eq("user_id", volunteer_user_id).execute()
        else:
            # no volunteer profile — just mark assignment done
            supabase.table("issue_assignments").update({"status": "completed"}).eq("issue_id", issue_id).execute()

    else:
        # rejected: revert to in_progress
        supabase.table("issues").update({"status": "in_progress"}).eq("id", issue_id).execute()

    return {"message": f"Task {new_status} successfully", "submission": update_res.data[0]}
