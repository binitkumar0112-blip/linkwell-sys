from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth
from dotenv import load_dotenv

from database.supabase_client import get_supabase_client

load_dotenv()

bearer_scheme = HTTPBearer()

supabase = get_supabase_client()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """
    Dependency: verify Firebase ID token from Authorization: Bearer <token> header.
    Returns decoded token payload enriched with Supabase user data: uid, email, role, assigned_ngo_id.
    """
    token = credentials.credentials
    try:
        decoded = auth.verify_id_token(token)
    except auth.ExpiredIdTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired.")
    except auth.RevokedIdTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token revoked.")
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token.")

    uid = decoded.get("uid")
    email = decoded.get("email")

    if not supabase:
        # Fallback if Supabase is not configured
        return {
            "uid": uid,
            "email": email,
            "role": decoded.get("role", "community"),
            "assigned_ngo_id": None
        }

    # Use Supabase as the single source of truth
    response = supabase.table("users").select("role, assigned_ngo_id").eq("id", uid).execute()
    
    if len(response.data) > 0:
        db_user = response.data[0]
        role = db_user.get("role") or "citizen"
        assigned_ngo_id = db_user.get("assigned_ngo_id")
    else:
        # If user doesn't exist in Supabase yet, default to citizen
        role = "citizen"
        assigned_ngo_id = None

    return {
        "uid": uid,
        "email": email,
        "role": role,
        "assigned_ngo_id": assigned_ngo_id
    }
