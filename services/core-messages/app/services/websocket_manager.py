import json
import logging
from uuid import UUID

from fastapi import WebSocket

logger = logging.getLogger(__name__)


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
        dead = []
        for ws in conns:
            try:
                await ws.send_text(json.dumps(event, default=str))
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws, user_id)

    async def broadcast_to_conversation(
        self, participant_ids: list[UUID], event: dict, exclude_user: UUID | None = None
    ):
        """Отправить событие всем участникам conversation."""
        for uid in participant_ids:
            if uid != exclude_user:
                await self.send_to_user(uid, event)

    def is_online(self, user_id: UUID) -> bool:
        return bool(self.active_connections.get(user_id))

    def _total(self) -> int:
        return sum(len(v) for v in self.active_connections.values())


# Singleton
ws_manager = ConnectionManager()
