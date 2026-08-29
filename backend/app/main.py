"""Create and configure the Lead Tracker CRM FastAPI application."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import leads, webhooks

app = FastAPI(title="Lead Tracker CRM")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(leads.router)
app.include_router(webhooks.router)

@app.on_event("startup")
def on_startup():
    """Create database tables that do not already exist."""
    Base.metadata.create_all(bind=engine)

@app.get("/health")
def health_check():
    """Return the service health status."""
    return {"status": "ok"}
