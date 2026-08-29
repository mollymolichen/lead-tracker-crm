"""Load application settings from environment variables and .env files."""

from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """App configuration loaded from environment variables / .env file."""

    talkdesk_account_subdomain: str = "api"
    talkdesk_client_id: str = ""
    talkdesk_client_secret: str = ""
    talkdesk_scope: str = "cases:read"
    talkdesk_phone_number: str = ""
    database_url: str = "postgresql://user:password@localhost:5432/talkdesk_sync"
    cors_origins: str = "http://localhost:3000,http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def talkdesk_token_url(self) -> str:
        """Return the Talkdesk OAuth token endpoint for the configured account."""
        return f"https://{self.talkdesk_account_subdomain}.talkdeskid.com/oauth/token"

    @property
    def talkdesk_api_base_url(self) -> str:
        """Return the Talkdesk API base URL for the configured account."""
        return f"https://{self.talkdesk_account_subdomain}.talkdeskapp.com"

    @property
    def cors_origin_list(self) -> list[str]:
        """Return the configured CORS origins as a normalized list."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
