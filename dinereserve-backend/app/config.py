import os
from dotenv import load_dotenv

load_dotenv()


def _require_env(name: str, *aliases: str) -> str:
    value = os.getenv(name)
    if value:
        return value

    for alias in aliases:
        value = os.getenv(alias)
        if value:
            return value

    if not value:
        supported_names = ", ".join((name, *aliases))
        raise RuntimeError(
            f"Missing required environment variable. Expected one of: {supported_names}"
        )
    return value


MONGO_URI = _require_env("MONGO_URI", "MONGO_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME", "dinereserve")
JWT_SECRET = _require_env("JWT_SECRET")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
