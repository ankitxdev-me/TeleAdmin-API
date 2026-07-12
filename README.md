# Telegram Group Admin API

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.9%2B-3776AB?logo=python&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)
![Telethon](https://img.shields.io/badge/Telethon-1.36.0-2CA5E0?logo=telegram&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)
![Version](https://img.shields.io/badge/version-1.0.0-blue)

A lightweight REST API that retrieves administrator information from Telegram Groups and Supergroups using a logged-in Telegram account with Telethon.

> **Backend only.** This repository contains no web UI, dashboard, bot, or database.

---

## 📚 Table of Contents

- [Why This Project?](#-why-this-project)
- [Features](#-features)
- [Supported Targets](#-supported-targets)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [Telegram Login](#-telegram-login)
- [Running Locally](#-running-locally)
- [API Documentation](#-api-documentation)
- [Swagger / OpenAPI](#-swagger--openapi)
- [Error Reference](#-error-reference)
- [Known Limitations](#-known-limitations)
- [Troubleshooting](#-troubleshooting)
- [License](#-license)

---

## 💡 Why This Project?

Telegram bots are limited by the Bot API and cannot reliably enumerate group administrators. This project uses a logged-in Telegram user account through Telethon and MTProto, which allows it to fetch full administrator lists for Telegram groups and supergroups.

---

## ✨ Features

- Retrieve all administrators from Telegram groups and supergroups
- Accepts group `@username` or `https://t.me/username`
- Detailed admin profiles including IDs, names, usernames, bot status, premium/verified flags, and custom titles
- Owner vs admin role detection
- Permission breakdown for each admin
- `/health` endpoint for service readiness
- Optional API key authentication for `/api/admins`
- Stateless API design with no database required
- Node.js + Python service separation for clear responsibility boundaries

---

## 📋 Supported Targets

| Telegram Type | Supported | Notes |
|---|---|---|
| Public Groups | ✅ Yes | Fully supported |
| Public Supergroups | ✅ Yes | Fully supported |
| Private Groups | ✅ Yes | Account must be a member |
| Broadcast Channels | ✅ Yes | Supported when the logged-in account can fetch channel admins |
| Private Channels | ❌ No | Not supported |

---

## 🏗️ Architecture

This project runs as two cooperating services:

- `src/server.js` — Node.js Express API that validates requests and forwards them to Python
- `telethon/service.py` — aiohttp service that uses Telethon to interact with Telegram

```mermaid
flowchart LR
    Client[Client\n(curl / app / script)]
    Node[Node.js Express API\nValidation · Routing · Errors]
    Python[Python Telethon Service\nSession · MTProto · Admin Fetch]
    Telegram[Telegram\nMTProto]

    Client --> Node
    Node -->|HTTP localhost| Python
    Python -->|MTProto| Telegram
```

---

## 📁 Project Structure

```
telegram-admin-api/
├── src/
│   ├── server.js
│   ├── routes/admins.js
│   ├── services/telegramService.js
│   └── utils/validator.js
├── scripts/login.py
├── telethon/
│   ├── service.py
│   ├── telegram_client.py
│   ├── handlers.py
│   ├── requirements.txt
│   └── session/
├── .env.example
├── package.json
└── README.md
```

---

## 🚀 Installation

### Prerequisites

- Node.js 18+
- Python 3.9+
- Telegram API credentials from [my.telegram.org/apps](https://my.telegram.org/apps)

### Install dependencies

```bash
npm install
pip install -r telethon/requirements.txt
```

### Configure environment

```bash
cp .env.example .env
```

Then update `.env` with your `TELEGRAM_API_ID`, `TELEGRAM_API_HASH`, and other values.

---

## ⚡ Quick Start

```bash
npm install
pip install -r telethon/requirements.txt
cp .env.example .env
# edit .env to add TELEGRAM_API_ID and TELEGRAM_API_HASH
npm run login
```

Run the Python Telethon service:

```bash
npm run start:telethon
```

Run the Node.js API:

```bash
npm start
```

Check health:

```bash
curl http://localhost:3000/health
```

Fetch administrators:

```bash
curl "http://localhost:3000/api/admins?target=@groupusername"
```

Bulk request example:

```bash
curl -X POST "http://localhost:3000/api/admins/bulk" \
  -H "Content-Type: application/json" \
  -H "x-api-key: your_api_key_here" \
  -d '{"targets": ["@groupusername1", "@groupusername2"]}'
```

View Swagger UI documentation:

```bash
http://localhost:3000/api-docs
```

OpenAPI schema:

```bash
http://localhost:3000/openapi.json
```

---

## 🚢 Docker Support

Build the image:

```bash
docker build -t telegram-admin-api .
```

Run the container:

```bash
docker run -p 3000:3000 --env-file .env telegram-admin-api
```

If you prefer compose:

```bash
TELEGRAM_API_ID=your_api_id TELEGRAM_API_HASH=your_api_hash docker-compose up --build
```

---

## ⚙️ Configuration

Copy `.env.example` to `.env` and set these values:

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3000` | Node.js API port |
| `TELEGRAM_API_ID` | Yes | — | Telegram API ID |
| `TELEGRAM_API_HASH` | Yes | — | Telegram API hash |
| `SESSION_NAME` | No | `telegram` | Telethon session file base name |
| `TELETHON_PORT` | No | `5000` | Python service port |
| `API_KEY` | No | — | Optional API key for `/api/admins` access |

Example:

```env
PORT=3000
TELEGRAM_API_ID=12345678
TELEGRAM_API_HASH=abcdef1234567890abcdef1234567890
SESSION_NAME=telegram
TELETHON_PORT=5000
```

---

## 🔐 Telegram Login

Run the login script once to create the session file:

```bash
npm run login
```

The script uses `TELEGRAM_API_ID`, `TELEGRAM_API_HASH`, and optionally `SESSION_NAME` from `.env`. It will prompt for your phone number, verification code, and 2FA password if enabled.

The session file is stored in `telethon/session/<SESSION_NAME>.session`.

> **Important:** Do not commit the session file to source control.

---

## 💻 Running Locally

Start each service in a separate terminal.

**Terminal 1 — Python service**

```bash
npm run start:telethon
```

**Terminal 2 — Node.js API**

```bash
npm start
```

The Node API is available at `http://localhost:3000`.

---

## 📘 API Documentation

### Health Endpoint

**GET** `/health`

Response:

```json
{
  "success": true,
  "status": "ok",
  "telegram": "connected"
}
```

### Get Admins

**GET** `/api/admins?target=<target>`

Query parameters:

- `target` (required) — Telegram group or supergroup target, e.g. `@groupusername` or `https://t.me/groupusername`

Example:

```bash
curl "http://localhost:3000/api/admins?target=@groupusername"
```

Success response:

```json
{
  "success": true,
  "group": {
    "id": 123456789,
    "title": "Example Group",
    "username": "groupusername",
    "type": "supergroup",
    "member_count": 1200,
    "admins_count": 5
  },
  "admins": [
    {
      "id": 111222333,
      "username": "adminuser",
      "first_name": "Admin",
      "last_name": "User",
      "display_name": "Admin User",
      "role": "admin",
      "custom_title": "Moderator",
      "is_bot": false,
      "is_verified": false,
      "is_premium": false,
      "is_fake": false,
      "is_scam": false,
      "is_deleted": false,
      "permissions": {
        "change_info": true,
        "delete_messages": true,
        "ban_users": true,
        "invite_users": true,
        "pin_messages": true,
        "add_admins": false,
        "anonymous": false,
        "manage_topics": true
      }
    }
  ]
}
```

---

## ⚠️ Error Reference

### Common errors

- `INVALID_TARGET` — target query parameter is missing or invalid
- `TELETHON_UNAVAILABLE` — the local Telethon service is not running
- `MISSING_USERNAME` — Python service did not receive `username`
- `GROUP_NOT_FOUND` — the target username could not be resolved
- `CHANNEL_NOT_SUPPORTED` — Telegram broadcast channels are not supported
- `UNSUPPORTED_TYPE` — the resolved entity is not a group or supergroup
- `FETCH_ADMINS_ERROR` — failed retrieving administrators from Telegram

### HTTP status codes

- `200` — success
- `400` — invalid request or unsupported target
- `404` — group not found
- `503` — Telethon unavailable
- `500` — internal error

---

## 🚫 Known Limitations

- Only Telegram groups and supergroups are supported.
- Broadcast channels are supported when the logged-in account has permission to view channel administrators.
- Private groups require the logged-in Telegram account to be a member.
- No graphical UI or dashboard is included.
- Admin retrieval is performed via Telethon and may be subject to Telegram rate limits.

---

## 🧪 Troubleshooting

- If `/health` reports disconnected, ensure `npm run start:telethon` is running.
- If login fails, verify `TELEGRAM_API_ID` and `TELEGRAM_API_HASH` are correct.
- If the session file is missing, run `npm run login` again.
- If `GROUP_NOT_FOUND` occurs, confirm the group username is correct and your account can access it.
- If service cannot connect, confirm `TELETHON_PORT` matches between `.env` and `src/services/telegramService.js`.

---

## 📄 License

MIT License
