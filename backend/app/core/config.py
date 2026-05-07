from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://invest:invest123@localhost:5432/investdb"
    REDIS_URL: str = "redis://localhost:6379/0"
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days
    ENVIRONMENT: str = "development"
    USD_TO_BRL: float = 5.70

    class Config:
        env_file = ".env"


settings = Settings()
