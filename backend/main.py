import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, SessionLocal
import models
from routes import auth, config, applications, officer, mock_issuer, files
import seed_data

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="VeriCheck AI API",
    description="AI-Assisted Decision Support Engine for Technical Education Regulatory Scrutiny (Problem Statement 26261)",
    version="1.0.0"
)

# CORS configuration for both frontends
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(auth.router)
app.include_router(config.router)
app.include_router(applications.router)
app.include_router(officer.router)
app.include_router(mock_issuer.router)
app.include_router(files.router)

@app.on_event("startup")
def startup_event():
    """Ensure database has seed data on launch."""
    db = SessionLocal()
    try:
        user_count = db.query(models.User).count()
        if user_count == 0:
            print("Database empty. Initializing synthetic seed data...")
            seed_data.seed_all(db)
            print("Seed data loaded successfully!")
    finally:
        db.close()

@app.get("/")
def root():
    return {
        "service": "VeriCheck AI API",
        "status": "online",
        "docs_url": "/docs",
        "advisory_note": "AI findings are advisory only. Final decision rests with the competent AICTE authority."
    }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    is_prod = os.environ.get("ENV", "development").lower() == "production"
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=not is_prod)
