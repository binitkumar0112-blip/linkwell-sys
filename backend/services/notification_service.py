from fastapi import HTTPException
from firebase_admin import messaging


def send_push_notification(device_token: str, title: str, body: str, data: dict | None = None) -> dict:
    message = messaging.Message(
        notification=messaging.Notification(title=title, body=body),
        data={key: str(value) for key, value in (data or {}).items()},
        token=device_token,
    )

    try:
        response = messaging.send(message)
        return {"success": True, "message_id": response}
    except messaging.UnregisteredError as exc:
        raise HTTPException(status_code=400, detail="Device token is not registered or has expired.") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
