from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    port: int = 8007
    python_env: str = "development"
    loki_endpoint: str = "http://loki-gateway.monitoring.svc.cluster.local/otlp/v1/logs"
    jwt_secret: str = "local-development-secret"
    core_auth_url: str = "http://core-auth.default.svc.cluster.local/core-auth"

    s3_endpoint: str = "http://localhost:9000"
    s3_access_key: str = "minioadmin"
    s3_secret_key: str = "minioadmin"
    s3_bucket: str = "messages-attachments"
    s3_region: str = "us-east-1"
    max_file_size_mb: int = 10
    max_image_size_mb: int = 5
    core_messages_url: str = "http://core-messages.default.svc.cluster.local/core-messages"


settings = Settings()
