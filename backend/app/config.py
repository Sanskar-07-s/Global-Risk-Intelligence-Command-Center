from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
import os

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,https://g-r-i-c-c.web.app,https://g-r-i-c-c.firebaseapp.com"
    DATABASE_URL: str = "sqlite:///./data/gricc.db"
    SECRET_KEY: str = "gricc-default-secret-key-change-in-production"

    # API Keys
    GEMINI_API_KEY: str = Field(default="", description="Google Gemini API key")
    NASA_API_KEY: str = Field(default="", description="NASA API key")
    FIRMS_MAP_KEY: str = Field(default="", description="NASA FIRMS Map key")

    # Connector switches
    GDELT_ENABLED: bool = True
    USGS_ENABLED: bool = True
    NASA_EONET_ENABLED: bool = True
    CISA_KEV_ENABLED: bool = True
    OPEN_METEO_ENABLED: bool = True
    WORLD_BANK_ENABLED: bool = True

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

settings = Settings()
