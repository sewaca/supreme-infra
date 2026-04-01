from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    port: int = 8007
    python_env: str = "development"
    loki_endpoint: str = "http://loki-gateway.monitoring.svc.cluster.local/otlp/v1/logs"
    jwt_secret: str = "local-development-secret"
    core_auth_url: str = "http://core-auth.default.svc.cluster.local/core-auth"


settings = Settings()
