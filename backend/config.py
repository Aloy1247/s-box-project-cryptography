from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application configuration settings."""
    
    # Server
    APP_NAME: str = "S-box Forge API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ]
    
    # File upload
    ALLOWED_EXTENSIONS: List[str] = [".csv", ".xlsx", ".xls"]
    MAX_UPLOAD_SIZE_MB: int = 1
    
    # Matrix constraints
    MATRIX_ROWS: int = 8
    MATRIX_COLS: int = 8
    
    # GF(2^8) parameters (AES polynomial)
    GF_POLYNOMIAL: int = 0x11B  # x^8 + x^4 + x^3 + x + 1
    GF_GENERATOR: int = 0x03
    
    # Default affine constant (AES)
    DEFAULT_CONSTANT: int = 0x63
    
    class Config:
        env_file = ".env"


settings = Settings()
