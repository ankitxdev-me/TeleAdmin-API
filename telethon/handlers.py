from telethon.tl.types import (
    Channel, Chat,
    ChannelParticipantCreator,
    ChannelParticipantAdmin,
)
from telethon.tl.functions.channels import GetParticipantsRequest
from telethon.tl.types import ChannelParticipantsAdmins
from telegram_client import get_client


def _entity_type(entity) -> str:
    if isinstance(entity, Channel):
        return "channel" if entity.broadcast else "supergroup"
    if isinstance(entity, Chat):
        return "group"
    return "unknown"


def _format_admin(participant, user) -> dict:
    is_owner = isinstance(participant, ChannelParticipantCreator)
    is_admin = isinstance(participant, ChannelParticipantAdmin)

    if is_owner:
        permissions = {
            "change_info": True, "delete_messages": True, "ban_users": True,
            "invite_users": True, "pin_messages": True, "add_admins": True,
            "anonymous": False, "manage_topics": True,
        }
        custom_title = getattr(participant, "rank", None)
        role = "owner"
    elif is_admin:
        rights = participant.admin_rights
        permissions = {
            "change_info": getattr(rights, "change_info", None),
            "delete_messages": getattr(rights, "delete_messages", None),
            "ban_users": getattr(rights, "ban_users", None),
            "invite_users": getattr(rights, "invite_users", None),
            "pin_messages": getattr(rights, "pin_messages", None),
            "add_admins": getattr(rights, "add_admins", None),
            "anonymous": getattr(rights, "anonymous", None),
            "manage_topics": getattr(rights, "manage_topics", None),
        }
        custom_title = getattr(participant, "rank", None)
        role = "admin"
    else:
        permissions = {k: None for k in ["change_info","delete_messages","ban_users",
                                          "invite_users","pin_messages","add_admins",
                                          "anonymous","manage_topics"]}
        custom_title = None
        role = "unknown"

    first_name = getattr(user, "first_name", None)
    last_name = getattr(user, "last_name", None)
    parts = [p for p in [first_name, last_name] if p]
    display_name = " ".join(parts) if parts else (getattr(user, "username", None) or str(user.id))

    return {
        "id": user.id,
        "username": getattr(user, "username", None),
        "first_name": first_name,
        "last_name": last_name,
        "display_name": display_name,
        "role": role,
        "custom_title": custom_title,
        "is_bot": getattr(user, "bot", False),
        "is_verified": getattr(user, "verified", False),
        "is_premium": getattr(user, "premium", False),
        "is_fake": getattr(user, "fake", False),
        "is_scam": getattr(user, "scam", False),
        "is_deleted": getattr(user, "deleted", False),
        "permissions": permissions,
    }


async def get_admins(username: str) -> dict:
    client = get_client()

    try:
        entity = await client.get_entity(username)
    except ValueError:
        return {"success": False, "error": {"code": "GROUP_NOT_FOUND",
                "message": f"Could not find a Telegram group with username @{username}."}}
    except Exception as e:
        return {"success": False, "error": {"code": "ENTITY_RESOLVE_ERROR",
                "message": f"Failed to resolve @{username}: {str(e)}"}}

    if not isinstance(entity, (Channel, Chat)):
        return {"success": False, "error": {"code": "UNSUPPORTED_TYPE",
                "message": "The target is not a Telegram group, supergroup, or channel."}}

    member_count = getattr(entity, "participants_count", None)

    try:
        participants = await client(GetParticipantsRequest(
            channel=entity,
            filter=ChannelParticipantsAdmins(),
            offset=0, limit=200, hash=0,
        ))
    except Exception as e:
        return {"success": False, "error": {"code": "FETCH_ADMINS_ERROR",
                "message": f"Failed to fetch administrators: {str(e)}"}}

    user_map = {u.id: u for u in participants.users}
    admins = []
    for participant in participants.participants:
        user_id = getattr(participant, "user_id", None)
        if user_id is None:
            continue
        user = user_map.get(user_id)
        if user is None:
            continue
        admins.append(_format_admin(participant, user))

    return {
        "success": True,
        "group": {
            "id": entity.id,
            "title": getattr(entity, "title", None),
            "username": getattr(entity, "username", None),
            "type": _entity_type(entity),
            "member_count": member_count,
            "admins_count": len(admins),
        },
        "admins": admins,
    }