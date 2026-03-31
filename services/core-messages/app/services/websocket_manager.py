import json
import logging
from uuid import UUID

from fastapi import WebSocket

logger = logging.getLogger(__name__)


def _event_summary(event: dict) -> str:
    t = event.get("type")
    d = event.get("data") or {}
    if t == "new_message":
        return f"msg_id={d.get('id')} conv={d.get('conversation_id')} sender={d.get('sender_id')}"
    if t in ("message_edited", "message_deleted"):
        return f"message_id={d.get('message_id')} conv={d.get('conversation_id')}"
    return f"type={t}"


class ConnectionManager:
    """Управление активными WebSocket-соединениями по user_id."""

    def __init__(self):
        # user_id -> list[WebSocket]
        self.active_connections: dict[UUID, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: UUID):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        logger.info("WS connected: user=%s (total=%d)", user_id, self._total())

    def disconnect(self, websocket: WebSocket, user_id: UUID):
        conns = self.active_connections.get(user_id, [])
        if websocket in conns:
            conns.remove(websocket)
        if not conns and user_id in self.active_connections:
            del self.active_connections[user_id]
        logger.info("WS disconnected: user=%s (total=%d)", user_id, self._total())

    async def send_to_user(self, user_id: UUID, event: dict):
        """Отправить JSON-событие всем соединениям пользователя."""
        conns = self.active_connections.get(user_id, [])
        ev_type = event.get("type", "?")
        logger.info(
            "WS send_to_user user=%s type=%s active_conns_for_user=%d summary=%s",
            user_id,
            ev_type,
            len(conns),
            _event_summary(event),
        )
        dead = []
        for ws in conns:
            try:
                await ws.send_text(json.dumps(event, default=str))
            except Exception as exc:
                logger.warning(
                    "WS send_to_user failed user=%s type=%s: %s",
                    user_id,
                    ev_type,
                    exc,
                    exc_info=True,
                )
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws, user_id)

    async def broadcast_to_conversation(
        self, participant_ids: list[UUID], event: dict, exclude_user: UUID | None = None
    ):
        """Отправить событие всем участникам conversation."""
        logger.info(
            "WS broadcast_to_conversation type=%s participants=%s exclude=%s summary=%s",
            event.get("type"),
            [str(u) for u in participant_ids],
            str(exclude_user) if exclude_user else None,
            _event_summary(event),
        )
        for uid in participant_ids:
            if uid != exclude_user:
                await self.send_to_user(uid, event)

    def is_online(self, user_id: UUID) -> bool:
        return bool(self.active_connections.get(user_id))

    def _total(self) -> int:
        return sum(len(v) for v in self.active_connections.values())


# Singleton
ws_manager = ConnectionManager()
