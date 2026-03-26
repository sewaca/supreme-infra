from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    port: int = 8003
    python_env: str = "development"
    loki_endpoint: str = "http://loki-gateway.monitoring.svc.cluster.local/otlp/v1/logs"
    jwt_secret: str = "local-development-secret"
    core_auth_url: str = "http://core-auth.default.svc.cluster.local/core-auth"
    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "core_schedule_db"
    db_user: str = "core_schedule_user"
    db_password: str = ""

    @property
    def database_url(self) -> str:
        return f"postgresql+asyncpg://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"


settings = Settings()
