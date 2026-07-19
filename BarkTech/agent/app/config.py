"""Agent configuration — loads env vars and provides typed settings.

Also supports fetching AI model config from the Node.js backend API.
"""

import os
import time
import logging
from dataclasses import dataclass, field
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env"))


@dataclass
class AgentConfig:
    # LLM
    openrouter_api_key: str = field(default_factory=lambda: os.getenv("OPENROUTER_API_KEY", ""))
    openrouter_base_url: str = field(default_factory=lambda: os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"))
    client_model: str = field(default_factory=lambda: os.getenv("CLIENT_MODEL", "deepseek/deepseek-v4-flash"))
    admin_model: str = field(default_factory=lambda: os.getenv("ADMIN_MODEL", "xiaomi/mimo-v2.5"))

    # MongoDB
    mongodb_uri: str = field(default_factory=lambda: os.getenv("MONGODB_URI", "mongodb://localhost:27017"))
    mongodb_db: str = field(default_factory=lambda: os.getenv("MONGODB_DB_NAME", "BarkTech"))

    # LangSmith
    langsmith_api_key: str = field(default_factory=lambda: os.getenv("LANGSMITH_API_KEY", ""))
    langsmith_project: str = field(default_factory=lambda: os.getenv("LANGSMITH_PROJECT", "bark-agents"))
    langsmith_tracing: bool = field(default_factory=lambda: os.getenv("LANGSMITH_TRACING", "false") == "true")

    # Google Calendar
    google_calendar_api_key: str = field(default_factory=lambda: os.getenv("GOOGLE_CALENDAR_API_KEY", ""))
    google_calendar_id: str = field(default_factory=lambda: os.getenv("GOOGLE_CALENDAR_ID", "primary"))
    google_oauth_access_token: str = field(default_factory=lambda: os.getenv("GOOGLE_OAUTH_ACCESS_TOKEN", ""))

    # Google OAuth
    google_client_id: str = field(default_factory=lambda: os.getenv("GOOGLE_CLIENT_ID", ""))

    # Backend API for model config
    backend_api_url: str = field(default_factory=lambda: os.getenv("BACKEND_API_URL", "http://localhost:3000"))

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # Model refresh state
    _last_refresh: float = 0
    _refresh_interval: float = 300  # 5 minutes

    async def refresh_models(self):
        """Fetch active AI models from the Node.js backend API and update config."""
        now = time.time()
        if now - self._last_refresh < self._refresh_interval:
            return

        try:
            import httpx
            async with httpx.AsyncClient(timeout=5.0) as client:
                # Fetch client models
                client_resp = await client.get(f"{self.backend_api_url}/api/ai-models/default/client")
                if client_resp.status_code == 200:
                    data = client_resp.json()
                    if data.get("success") and data.get("data"):
                        self.client_model = data["data"]["modelId"]
                        logger.info(f"Refreshed client model: {self.client_model}")

                # Fetch admin models
                admin_resp = await client.get(f"{self.backend_api_url}/api/ai-models/default/admin")
                if admin_resp.status_code == 200:
                    data = admin_resp.json()
                    if data.get("success") and data.get("data"):
                        self.admin_model = data["data"]["modelId"]
                        logger.info(f"Refreshed admin model: {self.admin_model}")

                self._last_refresh = now
        except Exception as e:
            logger.warning(f"Failed to refresh models from backend: {e}")


config = AgentConfig()
