from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from routes import problems, ai, notifications, verifications, resources

app = FastAPI(
    title="Linkwell API",
    description="Backend for the Linkwell civic problem coordination platform.",
    version="2.0.0",
)

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Health check ───────────────────────────────────────────────────────────────
@app.get("/", tags=["health"])
async def root():
    return {"status": "ok", "message": "Linkwell API v2 is running"}

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(problems.router)
app.include_router(ai.router)
app.include_router(notifications.router)
app.include_router(verifications.router)
app.include_router(resources.router)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
