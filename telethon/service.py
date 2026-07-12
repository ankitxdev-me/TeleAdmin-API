import os
import sys
import asyncio
from aiohttp import web

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

from telegram_client import get_client
from handlers import get_admins

PORT = int(os.environ.get("TELETHON_PORT", 5000))


async def handle_health(request):
    client = get_client()
    connected = client.is_connected()
    return web.json_response({"success": True, "status": "ok" if connected else "error"})


async def handle_admins(request):
    username = request.rel_url.query.get("username", "").strip()
    if not username:
        return web.json_response({
            "success": False,
            "error": {"code": "MISSING_USERNAME", "message": "username is required."}
        }, status=400)

    result = await get_admins(username)

    if not result.get("success"):
        code = result.get("error", {}).get("code", "")
        status = 400 if code in ("CHANNEL_NOT_SUPPORTED", "UNSUPPORTED_TYPE") \
            else 404 if code == "GROUP_NOT_FOUND" \
            else 500
        return web.json_response(result, status=status)

    return web.json_response(result)


async def main():
    session_path = os.path.join(
        os.path.dirname(__file__), "session",
        os.environ.get("SESSION_NAME", "telegram") + ".session"
    )

    if not os.path.exists(session_path):
        print("[telethon] ERROR: No session file found.")
        print("[telethon] Run 'npm run login' first.")
        sys.exit(1)

    client = get_client()
    print("[telethon] Connecting to Telegram...")
    await client.start()
    print("[telethon] Connected. Starting HTTP service...")

    app = web.Application()
    app.router.add_get("/health", handle_health)
    app.router.add_get("/admins", handle_admins)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "127.0.0.1", PORT)
    await site.start()

    print(f"[telethon] Listening on http://127.0.0.1:{PORT}")

    try:
        await asyncio.Event().wait()  # run forever
    finally:
        await client.disconnect()
        await runner.cleanup()


if __name__ == "__main__":
    asyncio.run(main())