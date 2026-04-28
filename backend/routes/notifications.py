from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from services import notification_service

router = APIRouter(prefix="/notifications", tags=["notifications"])


class NotificationRequest(BaseModel):
    device_token: str
    title: str
    body: str
    data: Optional[dict] = {}


@router.post("/send")
async def send_notification(req: NotificationRequest):
    return notification_service.send_push_notification(
        req.device_token,
        req.title,
        req.body,
        req.data,
    )
