import os
from functools import lru_cache

from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv()


@lru_cache(maxsize=2)
def get_supabase_client(use_service_role: bool = False) -> Client | None:
    url = os.getenv("SUPABASE_URL")
    key = (
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        if use_service_role
        else os.getenv("SUPABASE_ANON_KEY") or os.getenv("SUPABASE_KEY")
    )

    if not url or not key:
        return None

    return create_client(url, key)
