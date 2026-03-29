import json
import logging
from uuid import UUID

from authorization_py.jwt_verify import decode_token_safe
from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from app.config import settings
from app.services.websocket_manager import ws_manager

logger = logging.getLogger(__name__)

router = APIRouter(tags=["websocket"])


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
):
    """WebSocket для получения событий в реальном времени.

    Аутентификация через query parameter: /ws?token=<jwt>
    (WebSocket не поддерживает кастомные заголовки при handshake)

    Формат событий (JSON):
    - new_message: { type: "new_message", data: MessageResponse }
    - message_read: { type: "message_read", data: { conversation_id, user_id, last_read_message_id } }
    - new_conversation: { type: "new_conversation", data: ConversationResponse }
    - typing: { type: "typing", data: { conversation_id, user_id } }
    """
    payload, jwt_status = decode_token_safe(token, settings.jwt_secret)
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
                    # Broadcast typing indicator (опционально)
                    pass
            except Exception:
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, user_id)
