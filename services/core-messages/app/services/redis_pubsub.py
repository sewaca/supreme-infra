import asyncio
import contextlib
import json
import logging
from uuid import UUID

import redis.asyncio as aioredis

logger = logging.getLogger(__name__)

CHANNEL = "core-messages:ws"
_RECONNECT_DELAY = 5  # seconds between reconnect attempts


class RedisPubSub:
    """
    Redis Pub/Sub bridge for cross-pod WebSocket delivery.

    Flow:
      send_to_user(user_id, event)
        → publish(CHANNEL, {target_user_id, event})
          → all pods receive the message
          → each pod: ws_manager.send_local(user_id, event) → local WS connections
    """

    def __init__(self, redis_url: str) -> None:
        self._redis_url = redis_url
        self._pub: aioredis.Redis | None = None
        self._task: asyncio.Task | None = None
        self._ws_manager = None

    def set_ws_manager(self, ws_manager) -> None:
        self._ws_manager = ws_manager

    async def start(self) -> None:
        self._pub = aioredis.from_url(self._redis_url, decode_responses=True)
        self._task = asyncio.create_task(self._listener_loop())
        logger.info("Redis Pub/Sub started channel=%s url=%s", CHANNEL, self._redis_url)

    async def stop(self) -> None:
        if self._task:
            self._task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self._task
        if self._pub:
            await self._pub.aclose()
        logger.info("Redis Pub/Sub stopped")

    async def publish(self, user_id: UUID, event: dict) -> None:
        if self._pub is None:
            return
        payload = json.dumps({"target_user_id": str(user_id), "event": event}, default=str)
        try:
            await self._pub.publish(CHANNEL, payload)
            print(
                f"[redis] publish user={user_id} type={event.get('type')} channel={CHANNEL}",
                flush=True,
            )
        except Exception as exc:
            print(f"[redis] publish FAILED user={user_id}: {exc}", flush=True)
            logger.error("Redis publish failed user=%s: %s", user_id, exc, exc_info=True)

    async def _listener_loop(self) -> None:
        """Subscribe to CHANNEL and deliver events; reconnects automatically on any error."""
        while True:
            sub: aioredis.Redis | None = None
            try:
                sub = aioredis.from_url(self._redis_url, decode_responses=True)
                pubsub = sub.pubsub()
                await pubsub.subscribe(CHANNEL)
                logger.info("Redis PubSub subscribed channel=%s", CHANNEL)
                print(f"[redis] subscribed channel={CHANNEL}", flush=True)
                async for message in pubsub.listen():
                    if message["type"] != "message":
                        continue
                    try:
                        data = json.loads(message["data"])
                        user_id = UUID(data["target_user_id"])
                        event = data["event"]
                        local_conns = 0
                        if self._ws_manager is not None:
                            local_conns = len(self._ws_manager.active_connections.get(user_id, []))
                            await self._ws_manager.send_local(user_id, event)
                        print(
                            f"[redis] received user={user_id} type={event.get('type')} local_conns={local_conns}",
                            flush=True,
                        )
                    except Exception as exc:
                        print(f"[redis] listener parse error: {exc}", flush=True)
                        logger.warning("Redis listener parse error: %s", exc, exc_info=True)
            except asyncio.CancelledError:
                if sub is not None:
                    await sub.aclose()
                return
            except Exception as exc:
                logger.error(
                    "Redis listener error, reconnecting in %ds: %s",
                    _RECONNECT_DELAY,
                    exc,
                    exc_info=True,
                )
                print(f"[redis] listener error, reconnecting in {_RECONNECT_DELAY}s: {exc}", flush=True)
                if sub is not None:
                    with contextlib.suppress(Exception):
                        await sub.aclose()
                await asyncio.sleep(_RECONNECT_DELAY)
