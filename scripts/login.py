#!/usr/bin/env python3
import os
import sys
import asyncio

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
except ImportError:
    print("ERROR: python-dotenv is not installed.")
    print("Run: pip install -r telethon/requirements.txt")
    sys.exit(1)

try:
    from telethon import TelegramClient
except ImportError:
    print("ERROR: Telethon is not installed.")
    print("Run: pip install -r telethon/requirements.txt")
    sys.exit(1)


async def main():
    api_id = os.environ.get("TELEGRAM_API_ID")
    api_hash = os.environ.get("TELEGRAM_API_HASH")
    session_name = os.environ.get("SESSION_NAME", "telegram")

    if not api_id or not api_hash:
        print("ERROR: TELEGRAM_API_ID and TELEGRAM_API_HASH must be set in .env")
        sys.exit(1)

    session_dir = os.path.join(os.path.dirname(__file__), '..', 'telethon', 'session')
    os.makedirs(session_dir, exist_ok=True)
    session_path = os.path.join(session_dir, session_name)

    print("=" * 50)
    print("  Telegram Login")
    print("=" * 50)
    print(f"  API ID   : {api_id}")
    print(f"  Session  : {session_path}.session")
    print("=" * 50)
    print()

    async with TelegramClient(session_path, int(api_id), api_hash) as client:
        await client.start()
        me = await client.get_me()
        print()
        print(f"Logged in as: {me.first_name} (@{me.username})")
        print(f"Session saved to: {session_path}.session")
        print()
        print("You can now start the API:")
        print("  npm run start:telethon   # start Python service")
        print("  npm start                # start Node API")


if __name__ == "__main__":
    asyncio.run(main())