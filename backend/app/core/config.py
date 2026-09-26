from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
import os

def normalize_database_url(url: str) -> str:
    """
    Ensure PostgreSQL URLs use the psycopg (v3) driver ('postgresql+psycopg://')
    instead of the default psycopg2 driver, and fix legacy 'postgres://' prefixes
    provided by Render and other cloud hosts.
    """
    if not url or not isinstance(url, str):
        return url
    trimmed = url.strip()
    if trimmed.startswith("postgres://"):
        return "postgresql+psycopg://" + trimmed[len("postgres://"):]
    if trimmed.startswith("postgresql+psycopg2://"):
        return "postgresql+psycopg://" + trimmed[len("postgresql+psycopg2://"):]
    if trimmed.startswith("postgresql://"):
        return "postgresql+psycopg://" + trimmed[len("postgresql://"):]
    return trimmed

class Settings(BaseSettings):
    PROJECT_NAME: str = "GreenPay"
    PROJECT_DESCRIPTION: str = "Smart Urban Waste Accountability, Analytics & Rewards Platform (Bengaluru/BBMP)"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "greenpay-bengaluru-civic-tech-secret-key-change-in-prod-998877")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Admin Registration Secret Barrier
    ADMIN_INVITE_CODE: str = os.getenv("ADMIN_INVITE_CODE", "GREENPAY_BBMP_ADMIN_2025")
    
    # Database
    # Always resolve to canonical greenpay.db in workspace root regardless of process CWD
    _base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    _default_db = os.path.join(_base_dir, "greenpay.db").replace("\\", "/")
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{_default_db}")

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str) -> str:
        return normalize_database_url(v)
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "https://greenpay-five.vercel.app",
    ]
    
    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="allow")

settings = Settings()

