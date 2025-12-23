from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os
from pathlib import Path

# Ensure the backend directory is in the python path
# Go up one level from 'api' to project root, where 'backend' folder lives
project_root = os.path.join(os.path.dirname(os.path.dirname(__file__)))
sys.path.insert(0, project_root)

# Try to import backend modules with error handling
import_errors = []
settings = None
api_router = None

try:
    from backend.config import settings
except Exception as e:
    import_errors.append(f"Failed to import backend.config: {str(e)}")
    # Create minimal settings
    class MinimalSettings:
        APP_NAME = "S-box API"
        APP_VERSION = "1.0.0"
        CORS_ORIGINS = []
    settings = MinimalSettings()

try:
    from backend.api import api_router
except Exception as e:
    import_errors.append(f"Failed to import backend.api: {str(e)}")
    import traceback
    import_errors.append(traceback.format_exc())

app = FastAPI(
    title=settings.APP_NAME if settings else "S-box API",
    version=settings.APP_VERSION if settings else "1.0.0",
    description="Vercel Entry Point",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=(settings.CORS_ORIGINS if settings and hasattr(settings, 'CORS_ORIGINS') else []) + ["https://s-box-project-cryptography.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if api_router:
    app.include_router(api_router)

@app.get("/api/health")
async def health_check():
    """Simple health check endpoint"""
    try:
        return {
            "status": "ok",
            "message": "Backend is running",
            "has_import_errors": len(import_errors) > 0,
            "api_router_loaded": api_router is not None
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }

@app.get("/api/debug")
async def debug_info():
    """Debug endpoint to show import errors"""
    return {
        "import_errors": import_errors,
        "api_router_loaded": api_router is not None,
        "settings_loaded": settings is not None,
        "project_root": project_root,
        "sys_path": sys.path[:5]
    }

@app.get("/api")
async def root():
    try:
        import traceback
        backend_data_path = Path("backend/data")
        return {
            "status": "Vercel Backend Running",
            "cwd": os.getcwd(),
            "backend_data_exists": backend_data_path.exists(),
            "files_in_backend_data": [str(p) for p in backend_data_path.glob("*")] if backend_data_path.exists() else "backend/data not found",
            "python_path": sys.path[:3],  # Limit to first 3 to avoid too much data
            "api_router_loaded": api_router is not None
        }
    except Exception as e:
        import traceback
        return {
            "status": "error",
            "error": str(e),
            "traceback": traceback.format_exc()
        }
