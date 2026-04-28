from fastapi import HTTPException

from database.supabase_client import get_supabase_client


supabase = get_supabase_client(use_service_role=True)


def require_ngo_admin(current_user: dict) -> None:
    if current_user.get("role") != "ngo_admin":
        raise HTTPException(status_code=403, detail="Only NGO admins can manage resources")


def get_assigned_ngo_id(uid: str) -> str:
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    res = supabase.table("users").select("assigned_ngo_id").eq("id", uid).execute()

    if not res.data or not res.data[0].get("assigned_ngo_id"):
        raise HTTPException(status_code=403, detail="User is not assigned to any NGO.")

    return res.data[0]["assigned_ngo_id"]


def list_resources(current_user: dict) -> list[dict]:
    require_ngo_admin(current_user)
    ngo_id = get_assigned_ngo_id(current_user["uid"])
    res = supabase.table("resources").select("*").eq("ngo_id", ngo_id).execute()
    return res.data


def create_resource(current_user: dict, name: str, category: str, unit: str) -> dict:
    require_ngo_admin(current_user)
    ngo_id = get_assigned_ngo_id(current_user["uid"])

    data = {
        "ngo_id": ngo_id,
        "name": name,
        "category": category,
        "unit": unit,
        "total_added": 0,
        "total_used": 0,
    }

    res = supabase.table("resources").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to create resource")

    return res.data[0]


def add_stock(current_user: dict, resource_id: str, quantity: float, notes: str | None) -> dict:
    require_ngo_admin(current_user)
    if quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than 0")

    ngo_id = get_assigned_ngo_id(current_user["uid"])
    rpc_params = {
        "p_resource_id": resource_id,
        "p_ngo_id": ngo_id,
        "p_type": "added",
        "p_quantity": quantity,
        "p_notes": notes,
    }

    try:
        supabase.rpc("process_resource_transaction", rpc_params).execute()
        return {"status": "success", "message": "Stock added successfully"}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Failed to add stock: {str(exc)}") from exc


def use_stock(
    current_user: dict,
    resource_id: str,
    quantity: float,
    issue_id: str,
    notes: str | None,
) -> dict:
    require_ngo_admin(current_user)
    if quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than 0")

    ngo_id = get_assigned_ngo_id(current_user["uid"])
    rpc_params = {
        "p_resource_id": resource_id,
        "p_ngo_id": ngo_id,
        "p_type": "used",
        "p_quantity": quantity,
        "p_issue_id": issue_id,
        "p_notes": notes,
    }

    try:
        supabase.rpc("process_resource_transaction", rpc_params).execute()
        return {"status": "success", "message": "Stock used successfully"}
    except Exception as exc:
        error_msg = str(exc)
        if "Insufficient stock" in error_msg:
            raise HTTPException(status_code=400, detail="Insufficient stock for this operation.") from exc
        raise HTTPException(status_code=400, detail=f"Failed to use stock: {error_msg}") from exc


def get_analytics(current_user: dict) -> dict:
    require_ngo_admin(current_user)
    ngo_id = get_assigned_ngo_id(current_user["uid"])

    resources_res = supabase.table("resources").select("*").eq("ngo_id", ngo_id).execute()
    resources = resources_res.data or []

    total_items = len(resources)
    total_added_all = sum(r.get("total_added", 0) for r in resources)
    total_used_all = sum(r.get("total_used", 0) for r in resources)

    transactions_res = (
        supabase.table("resource_transactions")
        .select("*, resources(name, category)")
        .eq("ngo_id", ngo_id)
        .execute()
    )
    transactions = transactions_res.data or []

    usage_by_category: dict[str, float] = {}
    for transaction in transactions:
        if transaction.get("type") == "used" and transaction.get("resources"):
            category = transaction["resources"].get("category", "other")
            usage_by_category[category] = usage_by_category.get(category, 0) + transaction.get("quantity", 0)

    low_stock = []
    for resource in resources:
        added = resource.get("total_added", 0)
        used = resource.get("total_used", 0)
        remaining = added - used

        if remaining < 10 or (added > 0 and (remaining / added) < 0.1):
            low_stock.append({
                "id": resource["id"],
                "name": resource["name"],
                "remaining": remaining,
                "unit": resource["unit"],
            })

    return {
        "summary": {
            "total_resource_types": total_items,
            "total_units_added": total_added_all,
            "total_units_used": total_used_all,
            "total_units_remaining": total_added_all - total_used_all,
        },
        "usage_by_category": [{"name": key, "value": value} for key, value in usage_by_category.items()],
        "low_stock_warnings": low_stock,
    }
