from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import init_db
from app.routers import auth, complaints, upload, stats, rewards, workers

app = FastAPI(
    title="Community Hero API",
    description="AI-powered civic issue management platform — backend API.",
    version="0.1.0",
)

origins = [settings.FRONTEND_ORIGIN, "http://localhost:3000"]
if "," in settings.FRONTEND_ORIGIN:
    origins = [o.strip() for o in settings.FRONTEND_ORIGIN.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app|https://.*\.up\.railway\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()
    try:
        from app.utils.seed import seed
        seed()
    except Exception as e:
        print(f"Error seeding database on startup: {e}")


app.include_router(auth.router)
app.include_router(complaints.router)
app.include_router(upload.router)
app.include_router(stats.router)
app.include_router(rewards.router)
app.include_router(workers.router)

app.mount("/v1/upload/files", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


@app.get("/")
def root():
    return {
        "service": "Community Hero API",
        "status": "running",
        "docs": "/docs",
        "mode": "firebase" if settings.USE_FIREBASE else "local-sqlite",
        "ai": "gemini" if settings.GEMINI_API_KEY else "rule_based_fallback",
    }


@app.get("/health")
def health():
    return {"status": "ok"}
