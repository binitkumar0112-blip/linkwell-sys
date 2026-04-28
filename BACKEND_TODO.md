# Backend Integration Notes

## Running frontend
```
cd frontend
npm install
npm run dev
```

## Current frontend structure
- 7+ screens with full UI
- Service layer in `frontend/src/services`
- Hooks in `frontend/src/hooks`
- TS types in `frontend/src/types`
- Mock/reference data in `frontend/src/lib/mock-data.ts`

## Current backend structure
- FastAPI app entry in `backend/main.py`
- API endpoints in `backend/routes`
- Business logic in `backend/services`
- Database/client setup in `backend/database`

### Supabase
- Set up tables (see mock data shapes for reference)
- Add backend keys to `backend/.env`
- Add frontend public keys to `frontend/.env.local`

### Firebase
- Auth (email/password)
- Firestore for realtime alerts
- FCM for push notifications
- Auth hook lives at `frontend/src/hooks/useAuth.ts`

### Service files
Swap mock returns for real Supabase queries. Don't rename the exported functions.

```
frontend/src/services/api.ts
frontend/src/hooks/useAuth.ts
```

### Gemini routes
- `api/gemini/prioritize`
- `api/gemini/match-ngo`
- `api/gemini/check-sensitive`

### Map
Replace placeholder in community view with Google Maps + heatmap layer.
