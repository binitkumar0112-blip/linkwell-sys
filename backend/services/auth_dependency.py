from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
import jwt
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

bearer_scheme = HTTPBearer()

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_ANON_KEY")
supabase_jwt_secret = os.getenv("SUPABASE_JWT_SECRET")

supabase: Client | None = None
if supabase_url and supabase_key:
    supabase = create_client(supabase_url, supabase_key)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """
    Dependency: verify Supabase JWT token from Authorization: Bearer <token> header.
    Returns decoded token payload enriched with Supabase user data: uid, email, role, assigned_ngo_id.
    """
    token = credentials.credentials
    
    if not supabase_jwt_secret:
        # no JWT secret? fall back to supabase client validation
        if not supabase:
            raise HTTPException(status_code=500, detail="Supabase client not configured.")
        try:
            user_resp = supabase.auth.get_user(token)
            if not user_resp or not user_resp.user:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
            uid = user_resp.user.id
            email = user_resp.user.email
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    else:
        try:
            # decode locally when we have the secret
            decoded = jwt.decode(
                token, 
                supabase_jwt_secret, 
                algorithms=["HS256"], 
                audience="authenticated"
            )
            uid = decoded.get("sub")
            email = decoded.get("email")
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired.")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token.")

    if not supabase:
        return {
            "uid": uid,
            "email": email,
            "role": "community",
            "assigned_ngo_id": None
        }

    # public.users is the source of truth for roles
    response = supabase.table("users").select("role, assigned_ngo_id").eq("id", uid).execute()
    
    if len(response.data) > 0:
        db_user = response.data[0]
        role = db_user.get("role") or "citizen"
        assigned_ngo_id = db_user.get("assigned_ngo_id")
    else:
        # new user, hasn't been synced yet
        role = "citizen"
        assigned_ngo_id = None

    return {
        "uid": uid,
        "email": email,
        "role": role,
        "assigned_ngo_id": assigned_ngo_id
    }
