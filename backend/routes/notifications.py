from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/notifications", tags=["notifications"])

class NotificationRequest(BaseModel):
    device_token: str
    title: str
    body: str
    data: Optional[dict] = {}


@router.post("/send")
async def send_notification(req: NotificationRequest):
    """
    Dummy endpoint for push notifications. 
    Firebase has been completely removed.
    """
    # stub - returns success so the frontend doesn't break
    return {"success": True, "message_id": "dummy-supabase-notification-id"}
