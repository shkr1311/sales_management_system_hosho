from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    # Database
    DATABASE_URL: str = "mysql+pymysql://sms_user:sms_password123@localhost:3306/sales_management"

    # JWT
    JWT_SECRET: str = "change-this-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 480

    # CORS
    FRONTEND_URL: str = "http://localhost:5173"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,https://sales-management-system-hosho.onrender.com"

    # App
    APP_ENV: str = "development"
    APP_DEBUG: bool = True

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
