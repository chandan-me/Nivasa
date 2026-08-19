from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db, verify_connection

from app.api.routes.auth import router as auth_router
from app.api.routes.community import router as community_router
from app.api.routes.visitor_gate import router as visitor_gate_router
from app.api.routes.maintenance import router as maintenance_router
from app.api.routes.interactions import router as interactions_router
from app.api.routes.payments import router as payments_router
from app.api.routes.services import router as services_router
from app.api.routes.marketplace import router as marketplace_router
from app.api.routes.parking import router as parking_router
from app.api.routes.support_mod import router as support_mod_router
from app.api.routes.chat import router as chat_router
from app.api.routes.admin_analytics import router as admin_analytics_router

app = FastAPI(
    title="ApartmentHub API",
    description="Backend API for Smart Living and Connected Community residential management",
    version="1.0.0"
)

# Include API Routers
app.include_router(auth_router, prefix="/api")
app.include_router(community_router, prefix="/api")
app.include_router(visitor_gate_router, prefix="/api")
app.include_router(maintenance_router, prefix="/api")
app.include_router(interactions_router, prefix="/api")
app.include_router(payments_router, prefix="/api")
app.include_router(services_router, prefix="/api")
app.include_router(marketplace_router, prefix="/api")
app.include_router(parking_router, prefix="/api")
app.include_router(support_mod_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(admin_analytics_router, prefix="/api")

# CORS configuration
origins = [
    settings.FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    """
    Health check endpoint to verify backend server status and database connectivity.
    """
    db_ok = verify_connection()
    return {
        "status": "healthy",
        "database": "connected" if db_ok else "disconnected",
        "app": "ApartmentHub Backend"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
