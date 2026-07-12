import os
from telethon import TelegramClient

_client = None

def get_client() -> TelegramClient:
    global _client
    if _client is None:
        api_id = int(os.environ["TELEGRAM_API_ID"])
        api_hash = os.environ["TELEGRAM_API_HASH"]
        session_name = os.environ.get("SESSION_NAME", "telegram")
        session_path = os.path.join(os.path.dirname(__file__), "session", session_name)
        _client = TelegramClient(session_path, api_id, api_hash)
    return _client