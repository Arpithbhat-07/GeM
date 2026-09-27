import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "GeM Sentinel AI"
    PROJECT_SUBTITLE: str = "AI-Powered Bid Compliance & Verification Intelligence"
    API_V1_STR: str = "/api"
    
    # Auth
    JWT_SECRET: str = os.getenv("JWT_SECRET", "gem_sentinel_cpcl_sih_2026_secure_key_#8892!")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    
    # Database
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "gem_sentinel")
    
    # AI Engine
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    AI_MODE: str = os.getenv("AI_MODE", "mock" if not os.getenv("GEMINI_API_KEY") else "gemini")
    
    # Paths
    UPLOAD_DIR: str = str(BASE_DIR / "uploads")
    SAMPLE_DOCS_DIR: str = str(BASE_DIR / "sample_docs")
    DATA_DIR: str = str(BASE_DIR / "data")
    DATASET_PATH: str = os.getenv(
        "DATASET_PATH",
        r"C:\Users\arpit\.gemini\antigravity\brain\48017afc-d55c-44fe-9695-f72c483de02f\.user_uploaded\media_1790325666737.xlsx"
    )

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.SAMPLE_DOCS_DIR, exist_ok=True)
os.makedirs(settings.DATA_DIR, exist_ok=True)
