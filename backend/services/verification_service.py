from fastapi import HTTPException

from database.supabase_client import get_supabase_client


supabase = get_supabase_client()


def require_supabase():
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")


def submit_proof(req) -> dict:
    require_supabase()

    assignment_res = (
        supabase.table("issue_assignments")
        .select("*")
        .eq("issue_id", req.issue_id)
        .eq("assigned_volunteer_id", req.volunteer_id)
        .execute()
    )

    if not assignment_res.data:
        raise HTTPException(status_code=403, detail="Only the assigned volunteer can submit proof.")

    submission_data = {
        "issue_id": req.issue_id,
        "volunteer_id": req.volunteer_id,
        "proof_image_url": req.proof_image_url,
        "description": req.description,
        "latitude": req.latitude,
        "longitude": req.longitude,
        "status": "pending",
    }

    sub_res = supabase.table("task_submissions").insert(submission_data).execute()

    if not sub_res.data:
        raise HTTPException(status_code=400, detail="Failed to submit proof.")

    supabase.table("issues").update({"status": "pending_verification"}).eq("id", req.issue_id).execute()
    return {"message": "Proof submitted successfully", "submission": sub_res.data[0]}


def get_pending_verifications(ngo_id: str) -> list[dict]:
    require_supabase()

    assignments = supabase.table("issue_assignments").select("issue_id").eq("assigned_ngo_id", ngo_id).execute()
    if not assignments.data:
        return []

    issue_ids = [assignment["issue_id"] for assignment in assignments.data]
    submissions = (
        supabase.table("task_submissions")
        .select("*, issues(*), users(*)")
        .in_("issue_id", issue_ids)
        .eq("status", "pending")
        .execute()
    )

    return submissions.data


def verify_task(req) -> dict:
    require_supabase()

    if req.action not in ["approve", "reject"]:
        raise HTTPException(status_code=400, detail="Action must be approve or reject")

    sub_res = supabase.table("task_submissions").select("*").eq("id", req.submission_id).execute()
    if not sub_res.data:
        raise HTTPException(status_code=404, detail="Submission not found")

    submission = sub_res.data[0]
    new_status = "approved" if req.action == "approve" else "rejected"
    update_res = (
        supabase.table("task_submissions")
        .update({
            "status": new_status,
            "verified_by": req.ngo_id,
            "verification_notes": req.notes,
        })
        .eq("id", req.submission_id)
        .execute()
    )

    issue_id = submission["issue_id"]
    volunteer_id = submission["volunteer_id"]

    if req.action == "approve":
        supabase.table("issues").update({"status": "resolved"}).eq("id", issue_id).execute()
        (
            supabase.table("issue_assignments")
            .update({"status": "completed"})
            .eq("issue_id", issue_id)
            .eq("assigned_volunteer_id", volunteer_id)
            .execute()
        )

        vol_res = supabase.table("volunteers").select("tasks_completed, trust_score").eq("user_id", volunteer_id).execute()
        if vol_res.data:
            volunteer = vol_res.data[0]
            new_tasks = (volunteer.get("tasks_completed") or 0) + 1
            new_score = (volunteer.get("trust_score") or 0) + 10

            new_level = "New"
            if new_score > 100:
                new_level = "Community Leader"
            elif new_score > 50:
                new_level = "Trusted"
            elif new_score > 20:
                new_level = "Verified"

            supabase.table("volunteers").update({
                "tasks_completed": new_tasks,
                "trust_score": new_score,
                "trust_level": new_level,
            }).eq("user_id", volunteer_id).execute()
    else:
        supabase.table("issues").update({"status": "in_progress"}).eq("id", issue_id).execute()

    return {"message": f"Task {new_status} successfully", "submission": update_res.data[0]}
