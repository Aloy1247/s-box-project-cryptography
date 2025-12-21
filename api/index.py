from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

# Ensure the backend directory is in the python path
# Go up one level from 'api' to project root, where 'backend' folder lives
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(__file__))))

from backend.config import settings
from backend.api import api_router

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Vercel Entry Point",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS + ["https://s-box-project-cryptography.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.get("/")
async def root():
    return {"status": "Vercel Backend Running"}
