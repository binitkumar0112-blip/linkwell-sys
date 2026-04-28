import os, sys
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_ANON_KEY')

if not supabase_url or not supabase_key:
    print('Missing supabase env vars')
    sys.exit(1)

supabase = create_client(supabase_url, supabase_key)
res = supabase.table('users').select('*').execute()
for user in res.data:
    print("UID: " + str(user.get("id")) + " - Role: " + str(user.get("role")) + " - Email: " + str(user.get("email")))
