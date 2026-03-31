import json
import logging
import urllib.parse
from uuid import UUID

from authorization_py.jwt_verify import decode_token_safe
from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from app.config import settings
from app.services.websocket_manager import ws_manager

logger = logging.getLogger(__name__)

# Same name as authorization-lib TOKEN_KEY / Next.js auth cookie
AUTH_TOKEN_COOKIE = "auth_token"

router = APIRouter(tags=["websocket"])


def _resolve_ws_token(websocket: WebSocket, query_token: str | None) -> str | None:
    """Resolve JWT from Authorization, auth_token cookie, or optional query token."""
    auth = websocket.headers.get("authorization") or websocket.headers.get("Authorization")
    if auth:
        parts = auth.split(None, 1)
        if len(parts) == 2 and parts[0].lower() == "bearer":
            return parts[1].strip()

    cookie_header = websocket.headers.get("cookie") or ""
    for part in cookie_header.split(";"):
        chunk = part.strip()
        prefix = f"{AUTH_TOKEN_COOKIE}="
        if chunk.startswith(prefix):
            raw = chunk[len(prefix) :].strip()
            return urllib.parse.unquote(raw)

    return query_token


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str | None = Query(None, description="Deprecated: use Authorization header or auth_token cookie"),
):
    """Realtime events over WebSocket.

    Auth (first match wins):
    - Header ``Authorization: Bearer <jwt>`` (CLI, tests, proxies).
    - Cookie ``auth_token`` on same-origin handshake (browser).
    - Query ``?token=`` only for backward compatibility.

    Browsers cannot attach custom headers to ``new WebSocket(url)``; use the cookie there.

    Event payloads (JSON):
    - new_message: { type: "new_message", data: MessageResponse }
    - message_read: { type: "message_read", data: { conversation_id, user_id, last_read_message_id } }
    - new_conversation: { type: "new_conversation", data: ConversationResponse }
    - typing: { type: "typing", data: { conversation_id, user_id } }
    """
    raw_token = _resolve_ws_token(websocket, token)
    if not raw_token:
        await websocket.close(code=4001, reason="Authentication required")
        return

    payload, jwt_status = decode_token_safe(raw_token, settings.jwt_secret)
    if jwt_status != "valid" or payload is None:
        await websocket.close(code=4001, reason="Invalid token")
        return

    user_id = UUID(payload["sub"])

    await ws_manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "typing":
                    # Broadcast typing indicator (optional)
                    pass
            except Exception:
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, user_id)
