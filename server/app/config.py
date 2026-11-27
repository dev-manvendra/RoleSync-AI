from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = ""

    llm_api_key: str = ""
    llm_base_url: str = "https://generativelanguage.googleapis.com/v1beta/openai/"
    llm_model: str = "gemini-2.5-flash"

    embed_api_key: str = ""
    embed_base_url: str = "https://generativelanguage.googleapis.com/v1beta/openai/"
    embed_model: str = "gemini-embedding-001"
    embed_dim: int = 768

    allowed_origins: str = "http://localhost:5173"
    rate_limit_per_min: int = 40
    max_upload_mb: int = 5
    max_resume_chars: int = 20000

    # Cosine similarity is mapped onto 0..1 between these two values before scoring.
    # Tune them after looking at real similarities from your embedding model.
    sim_floor: float = 0.50
    sim_ceil: float = 0.85

    @property
    def embed_key(self) -> str:
        return self.embed_api_key or self.llm_api_key

    @property
    def origins(self) -> list[str]:
        return [o.strip().rstrip("/") for o in self.allowed_origins.split(",") if o.strip()]


settings = Settings()
