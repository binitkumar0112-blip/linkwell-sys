from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

from routes import problems, ai, notifications, verifications, resources

app = FastAPI(
    title="Linkwell API",
    description="Backend for the Linkwell civic problem coordination platform.",
    version="2.0.0",
)

# ── CORS ───────────────────────────────────────────────────────────────────────
cors_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Add Render frontend URL if provided
render_frontend = os.getenv("RENDER_FRONTEND_URL")
if render_frontend:
    cors_origins.append(render_frontend)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
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
    port = int(os.getenv("PORT", 8000))
    reload = os.getenv("ENV", "development") == "development"
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=reload)
