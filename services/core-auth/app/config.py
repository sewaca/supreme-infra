from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    port: int = 8002
    python_env: str = "development"
    loki_endpoint: str = "http://loki-gateway.monitoring.svc.cluster.local/otlp/v1/logs"
    jwt_secret: str = "local-development-secret"
    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "core_auth_db"
    db_user: str = "core_auth_user"
    db_password: str = ""
    core_client_info_url: str = "http://core-client-info.default.svc.cluster.local/core-client-info"
    core_applications_url: str = "http://core-applications.default.svc.cluster.local/core-applications"
    redis_auth_cache_url: str = "redis://redis-auth-cache.default.svc.cluster.local:6379"

    smtp_host: str = "localhost"
    smtp_port: int = 1025
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_use_tls: bool = False
    smtp_use_starttls: bool = False
    mail_from: str = "noreply@supreme.local"
    mail_from_name: str = "Supreme"
    app_base_url: str = "http://localhost:3000"

    @model_validator(mode="after")
    def _validate_smtp_tls(self) -> "Settings":
        if self.smtp_use_tls and self.smtp_use_starttls:
            raise ValueError("SMTP_USE_TLS and SMTP_USE_STARTTLS cannot both be true")
        return self

    @property
    def database_url(self) -> str:
        return f"postgresql+asyncpg://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"


settings = Settings()
