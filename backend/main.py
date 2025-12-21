"""
S-box Forge Backend API

Research-grade web application for AES-style S-box construction and analysis.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import sys
from pathlib import Path

# Add the 'backend' directory to sys.path so modules can find each other
sys.path.append(str(Path(__file__).parent))

try:
    from backend.config import settings
    from backend.api import api_router
except ImportError:
    try:
        from config import settings
        from api import api_router
    except ImportError:
        # Final fallback for when running inside the backend dir itself
        import sys
        sys.path.append('.')
        from config import settings
        from api import api_router


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Research-grade API for AES-style S-box construction and cryptographic analysis.",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running"
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
