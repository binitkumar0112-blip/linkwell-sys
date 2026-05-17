import os
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from supabase import create_client, Client
from dotenv import load_dotenv

from services.auth_dependency import get_current_user

load_dotenv()


SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY")

if SUPABASE_URL and SUPABASE_KEY:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    supabase = None

router = APIRouter(prefix="/resources", tags=["resources"])


def get_assigned_ngo_id(uid: str) -> str:
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    

    res = supabase.table("users").select("assigned_ngo_id").eq("id", uid).execute()
    
    if not res.data or not res.data[0].get("assigned_ngo_id"):
        raise HTTPException(status_code=403, detail="User is not assigned to any NGO.")
        
    return res.data[0]["assigned_ngo_id"]



class CreateResourceRequest(BaseModel):
    name: str
    category: str
    unit: str

class AddStockRequest(BaseModel):
    resource_id: str
    quantity: float
    notes: Optional[str] = None

class UseStockRequest(BaseModel):
    resource_id: str
    quantity: float
    issue_id: str
    notes: Optional[str] = None


@router.get("/")
async def list_resources(current_user: dict = Depends(get_current_user)):
    """List all resources for the authenticated NGO"""
    if current_user.get("role") != "ngo_admin":
        raise HTTPException(status_code=403, detail="Only NGO admins can manage resources")
        
    ngo_id = get_assigned_ngo_id(current_user["uid"])
    
    res = supabase.table("resources").select("*").eq("ngo_id", ngo_id).execute()
    return res.data


@router.post("/")
async def create_resource(req: CreateResourceRequest, current_user: dict = Depends(get_current_user)):
    """Create a new resource category/item"""
    if current_user.get("role") != "ngo_admin":
        raise HTTPException(status_code=403, detail="Only NGO admins can manage resources")
        
    ngo_id = get_assigned_ngo_id(current_user["uid"])
    
    data = {
        "ngo_id": ngo_id,
        "name": req.name,
        "category": req.category,
        "unit": req.unit,
        "total_added": 0,
        "total_used": 0
    }
    
    res = supabase.table("resources").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to create resource")
        
    return res.data[0]


@router.post("/add")
async def add_stock(req: AddStockRequest, current_user: dict = Depends(get_current_user)):
    """Add stock (purchase/donation) to an existing resource"""
    if current_user.get("role") != "ngo_admin":
        raise HTTPException(status_code=403, detail="Only NGO admins can manage resources")
        
    if req.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than 0")
        
    ngo_id = get_assigned_ngo_id(current_user["uid"])
    
    # RPC keeps totals atomic
    rpc_params = {
        "p_resource_id": req.resource_id,
        "p_ngo_id": ngo_id,
        "p_type": "added",
        "p_quantity": req.quantity,
        "p_notes": req.notes
    }
    
    try:
        supabase.rpc("process_resource_transaction", rpc_params).execute()
        return {"status": "success", "message": "Stock added successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to add stock: {str(e)}")


@router.post("/use")
async def use_stock(req: UseStockRequest, current_user: dict = Depends(get_current_user)):
    """Deduct stock linked to a specific issue"""
    if current_user.get("role") != "ngo_admin":
        raise HTTPException(status_code=403, detail="Only NGO admins can manage resources")
        
    if req.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than 0")
        
    ngo_id = get_assigned_ngo_id(current_user["uid"])
    
    rpc_params = {
        "p_resource_id": req.resource_id,
        "p_ngo_id": ngo_id,
        "p_type": "used",
        "p_quantity": req.quantity,
        "p_issue_id": req.issue_id,
        "p_notes": req.notes
    }
    
    try:
        # RPC throws if stock goes negative
        supabase.rpc("process_resource_transaction", rpc_params).execute()
        return {"status": "success", "message": "Stock used successfully"}
    except Exception as e:

        error_msg = str(e)
        if "Insufficient stock" in error_msg:
            raise HTTPException(status_code=400, detail="Insufficient stock for this operation.")
        raise HTTPException(status_code=400, detail=f"Failed to use stock: {error_msg}")


@router.get("/analytics")
async def get_analytics(current_user: dict = Depends(get_current_user)):
    """Get analytics data for resources"""
    if current_user.get("role") != "ngo_admin":
        raise HTTPException(status_code=403, detail="Only NGO admins can manage resources")
        
    ngo_id = get_assigned_ngo_id(current_user["uid"])
    

    resources_res = supabase.table("resources").select("*").eq("ngo_id", ngo_id).execute()
    resources = resources_res.data or []
    
    total_items = len(resources)
    total_added_all = sum(r.get("total_added", 0) for r in resources)
    total_used_all = sum(r.get("total_used", 0) for r in resources)
    

    transactions_res = supabase.table("resource_transactions").select("*, resources(name, category)").eq("ngo_id", ngo_id).execute()
    transactions = transactions_res.data or []
    

    usage_by_category = {}
    for t in transactions:
        if t.get("type") == "used" and t.get("resources"):
            cat = t["resources"].get("category", "other")
            usage_by_category[cat] = usage_by_category.get(cat, 0) + t.get("quantity", 0)
            

    category_chart = [{"name": k, "value": v} for k, v in usage_by_category.items()]
    
    # flag anything running low
    low_stock = []
    for r in resources:
        added = r.get("total_added", 0)
        used = r.get("total_used", 0)
        remaining = added - used
        
        # low = less than 10 units or under 10% of total
        if remaining < 10 or (added > 0 and (remaining / added) < 0.1):
            low_stock.append({
                "id": r["id"],
                "name": r["name"],
                "remaining": remaining,
                "unit": r["unit"]
            })
            
    return {
        "summary": {
            "total_resource_types": total_items,
            "total_units_added": total_added_all,
            "total_units_used": total_used_all,
            "total_units_remaining": total_added_all - total_used_all
        },
        "usage_by_category": category_chart,
        "low_stock_warnings": low_stock
    }
