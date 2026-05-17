from datetime import datetime, timezone
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_ANON_KEY")

supabase: Client | None = None
if supabase_url and supabase_key:
    supabase = create_client(supabase_url, supabase_key)

def create_problem(data: dict, user_id: str) -> dict:
    """Insert a new problem document into Supabase and return it with its id."""
    if not supabase:
        raise Exception("Supabase client not initialized")
        
    problem = {
        "title": data.get("title", ""),
        "description": data.get("description", ""),
        "category": data.get("category", "other"),
        "latitude": data.get("latitude"),
        "longitude": data.get("longitude"),
        "status": "reported",
        "urgency": data.get("urgency", "medium"),
        "reported_by": user_id,
        "upvotes_count": 0,
        "priority_score": 85.0,
        "amount_needed": data.get("amount_needed", 0),
        "amount_raised": 0,
        "photo_url": data.get("photoUrl", data.get("photo_url")),
        "urgency_reason": data.get("urgencyReason", data.get("urgency_reason"))
    }


    problem = {k: v for k, v in problem.items() if v is not None}

    response = supabase.table("issues").insert(problem).execute()
    if response.data:
        return response.data[0]
    raise Exception("Failed to create problem")


def get_all_problems(locality: str | None = None, limit: int = 50) -> list[dict]:
    """Fetch public problems from Supabase."""
    if not supabase:
        raise Exception("Supabase client not initialized")

    query = supabase.table("issues").select("*").order("created_at", desc=True).limit(limit)
    
    # no locality column in the schema yet — would need PostGIS for geo filtering
    
    response = query.execute()
    return response.data


def upvote_problem(problem_id: str) -> dict:
    """Increment the upvotes_count for a problem."""
    if not supabase:
        raise Exception("Supabase client not initialized")
        

    get_res = supabase.table("issues").select("upvotes_count").eq("id", problem_id).execute()
    if not get_res.data:
        raise Exception("Problem not found")
        
    current_upvotes = get_res.data[0].get("upvotes_count", 0)
    

    update_res = supabase.table("issues").update({"upvotes_count": current_upvotes + 1}).eq("id", problem_id).execute()
    
    if update_res.data:
        return update_res.data[0]
    raise Exception("Failed to upvote problem")


def update_problem_status(
    problem_id: str, new_status: str, volunteer_id: str | None = None
) -> dict:
    """Update status (and optionally assign volunteer) for a problem."""
    if not supabase:
        raise Exception("Supabase client not initialized")
        
    update_data = {"status": new_status}
    
    response = supabase.table("issues").update(update_data).eq("id", problem_id).execute()
    
    # also create assignment record if volunteer is specified
    if volunteer_id and response.data:
        assignment_data = {
            "issue_id": problem_id,
            "assigned_type": "volunteer",
            "assigned_volunteer_id": volunteer_id,
            "status": "assigned"
        }
        supabase.table("issue_assignments").insert(assignment_data).execute()
        
    if response.data:
        return response.data[0]
    raise Exception("Failed to update status")
