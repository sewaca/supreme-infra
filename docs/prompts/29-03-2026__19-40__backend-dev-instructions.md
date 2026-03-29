# Инструкции: бэкенд-сервис core-messages (FastAPI)

## Контекст

Нужен сервис обмена сообщениями между пользователями университетской платформы:
- **Личные сообщения** — любой пользователь может написать любому другому
- **Рассылки (broadcast)** — преподаватель отправляет сообщение студентам выбранных групп. Студенты не могут ответить в рассылке, но могут нажать «Ответить в ЛС» — это создаёт отдельный direct-чат с преподавателем
- **Файлы/изображения** — к сообщениям можно прикреплять файлы
- **WebSocket** — доставка сообщений в реальном времени
- **Курсорная пагинация** — для эффективной подгрузки истории чата
- **Полнотекстовый поиск** — поиск по сообщениям (русский язык)

Данные о пользователях берутся из `core-client-info` и кэшируются локально в таблице `user_cache`.

---

## Шаг 0. Генерация сервиса

Запусти генератор **интерактивно**:

```bash
pnpm generate:service
```

Параметры:
- Name: `core-messages`
- Type: **FastAPI (Python Backend)**
- Description: `Messaging — direct messages, broadcasts, file attachments`
- Port: `8006`
- API prefix: `core-messages`
- Database: **Yes**
  - DB name: `core_messages_db`
  - DB user: `core_messages_user`
  - Password secret: `DB_PASSWORD`

После генерации:
```bash
cd services/core-messages && uv sync
```

Генератор создаст стандартный скелет в `services/core-messages/` и обновит:
- `services.yaml` — добавит запись fastapi
- `packages/api-client/openapi-ts.config.ts` — добавит schema mapping
- `packages/api-client/src/index.ts` — добавит export

**Образец структуры** — смотри `services/core-client-info/`.

---

## Шаг 1. Конфигурация (app/config.py)

Дополни сгенерированный `app/config.py` дополнительными настройками:

```python
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    port: int = 8006
    python_env: str = "development"
    loki_endpoint: str = "http://loki-gateway.monitoring.svc.cluster.local/otlp/v1/logs"
    jwt_secret: str = "local-development-secret"
    core_auth_url: str = "http://core-auth.default.svc.cluster.local/core-auth"

    # Database
    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "core_messages_db"
    db_user: str = "core_messages_user"
    db_password: str = ""

    # Service-to-service
    core_client_info_url: str = "http://core-client-info.default.svc.cluster.local/core-client-info"

    # Cache
    user_cache_ttl_seconds: int = 3600  # 1 час

    # File storage (MinIO / S3-compatible)
    s3_endpoint: str = "http://minio.default.svc.cluster.local:9000"
    s3_access_key: str = "minioadmin"
    s3_secret_key: str = ""
    s3_bucket: str = "messages-attachments"
    s3_region: str = "us-east-1"
    max_file_size_mb: int = 10
    max_image_size_mb: int = 5

    @property
    def database_url(self) -> str:
        return f"postgresql+asyncpg://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"


settings = Settings()
```

---

## Шаг 2. База данных

### 2.1. database.py

Копируй один-в-один паттерн из `services/core-client-info/app/database.py`:
- `create_async_engine` с `statement_cache_size: 0`, `pool_pre_ping=True`
- `async_sessionmaker`, `DeclarativeBase`, `get_db` generator
- SQL query logging через `event.listens_for`

### 2.2. Модели (ORM)

Паттерн — `services/core-client-info/app/models/user.py`: используй `Mapped[]`, `mapped_column()`, `UUID(as_uuid=True)`, `DateTime(timezone=True)`, `func.now()`.

#### app/models/conversation.py

```python
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Conversation(Base):
    __tablename__ = "conversation"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type: Mapped[str] = mapped_column(String(20), nullable=False)  # 'direct' | 'broadcast'
    title: Mapped[str | None] = mapped_column(String(500), nullable=True)  # для broadcast
    owner_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)  # teacher UUID для broadcast

    # Denormalized для быстрой сортировки списка чатов
    last_message_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    last_message_preview: Mapped[str | None] = mapped_column(String(200), nullable=True)
    last_message_sender_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    participants: Mapped[list["ConversationParticipant"]] = relationship(back_populates="conversation", lazy="selectin")


class ConversationParticipant(Base):
    __tablename__ = "conversation_participant"

    __table_args__ = (
        UniqueConstraint("conversation_id", "user_id", name="uq_conv_participant"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("conversation.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="member")  # 'owner' | 'member'
    can_reply: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    last_read_message_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    last_read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_deleted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    conversation: Mapped["Conversation"] = relationship(back_populates="participants")
```

#### app/models/message.py

```python
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.dialects.postgresql import TSVECTOR, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Message(Base):
    __tablename__ = "message"

    __table_args__ = (
        Index("ix_messages_conversation_created", "conversation_id", "created_at", "id", postgresql_using="btree"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("conversation.id", ondelete="CASCADE"), nullable=False
    )
    sender_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    content_type: Mapped[str] = mapped_column(String(20), nullable=False, default="text")  # 'text' | 'image' | 'file'

    # Full-text search (заполняется trigger'ом)
    content_search: Mapped[str | None] = mapped_column(TSVECTOR, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_deleted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    attachments: Mapped[list["MessageAttachment"]] = relationship(back_populates="message", lazy="selectin")


class MessageAttachment(Base):
    __tablename__ = "message_attachment"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    message_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("message.id", ondelete="CASCADE"), nullable=False, index=True
    )
    file_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    file_name: Mapped[str] = mapped_column(String(500), nullable=False)
    file_size: Mapped[int] = mapped_column(nullable=False)  # bytes
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    thumbnail_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)  # для изображений

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    message: Mapped["Message"] = relationship(back_populates="attachments")
```

#### app/models/user_cache.py

```python
import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class UserCache(Base):
    __tablename__ = "user_cache"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    last_name: Mapped[str] = mapped_column(String(255), nullable=False)
    middle_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar: Mapped[str | None] = mapped_column(String(500), nullable=True)
    group_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    faculty: Mapped[str | None] = mapped_column(String(255), nullable=True)
    role: Mapped[str | None] = mapped_column(String(50), nullable=True)  # 'student' | 'teacher' | 'admin'

    cached_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
```

#### app/models/__init__.py

```python
from app.models.conversation import Conversation, ConversationParticipant  # noqa: F401
from app.models.message import Message, MessageAttachment  # noqa: F401
from app.models.user_cache import UserCache  # noqa: F401
```

### 2.3. Alembic-миграция

После создания моделей:

```bash
cd services/core-messages
alembic revision --autogenerate -m "001_initial_messaging_schema"
```

В сгенерированную миграцию **вручную** добавь в `upgrade()`:

```python
# GIN-индекс для full-text search
op.create_index(
    "ix_messages_content_search",
    "message",
    ["content_search"],
    postgresql_using="gin",
)

# tsvector trigger
op.execute("""
CREATE OR REPLACE FUNCTION messages_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.content_search := to_tsvector('russian', COALESCE(NEW.content, ''));
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER tsvector_update
  BEFORE INSERT OR UPDATE OF content ON message
  FOR EACH ROW EXECUTE FUNCTION messages_search_trigger();
""")
```

И в `downgrade()`:
```python
op.execute("DROP TRIGGER IF EXISTS tsvector_update ON message;")
op.execute("DROP FUNCTION IF EXISTS messages_search_trigger();")
op.drop_index("ix_messages_content_search", table_name="message")
```

---

## Шаг 3. Pydantic-схемы (app/schemas/)

### app/schemas/conversation.py

```python
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ParticipantBrief(BaseModel):
    user_id: UUID
    name: str
    last_name: str
    avatar: str | None = None
    role: str | None = None  # 'student' | 'teacher'


class ConversationResponse(BaseModel):
    id: UUID
    type: str  # 'direct' | 'broadcast'
    title: str | None = None
    owner_id: UUID | None = None
    last_message_at: datetime | None = None
    last_message_preview: str | None = None
    unread_count: int = 0
    participants: list[ParticipantBrief] = []
    participant_count: int = 0  # полезно для broadcast


class ConversationListResponse(BaseModel):
    items: list[ConversationResponse]
    next_cursor: str | None = None


class CreateDirectConversationRequest(BaseModel):
    recipient_id: UUID


class CreateBroadcastRequest(BaseModel):
    title: str
    group_names: list[str]
    initial_message: str | None = None
```

### app/schemas/message.py

```python
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class AttachmentResponse(BaseModel):
    id: UUID
    file_url: str
    file_name: str
    file_size: int
    mime_type: str
    thumbnail_url: str | None = None


class MessageResponse(BaseModel):
    id: UUID
    conversation_id: UUID
    sender_id: UUID
    sender_name: str
    sender_last_name: str
    sender_avatar: str | None = None
    content: str
    content_type: str
    attachments: list[AttachmentResponse] = []
    created_at: datetime
    is_own: bool = False


class MessageListResponse(BaseModel):
    items: list[MessageResponse]
    next_cursor: str | None = None
    has_more: bool = False


class SendMessageRequest(BaseModel):
    content: str = Field(..., max_length=5000)
    content_type: str = "text"


class MarkReadRequest(BaseModel):
    last_read_message_id: UUID


class MessageSearchResult(BaseModel):
    message: MessageResponse
    conversation_id: UUID
    conversation_title: str | None = None
    conversation_type: str
    highlight: str


class SearchMessagesResponse(BaseModel):
    items: list[MessageSearchResult]
    next_cursor: str | None = None
```

### app/schemas/user.py

```python
from uuid import UUID

from pydantic import BaseModel


class UserBrief(BaseModel):
    user_id: UUID
    name: str
    last_name: str
    avatar: str | None = None
    group_name: str | None = None
    role: str | None = None


class UserSearchResponse(BaseModel):
    items: list[UserBrief]
```

### app/schemas/common.py

```python
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ConversationUpdateItem(BaseModel):
    conversation_id: UUID
    last_message_at: datetime | None = None
    last_message_preview: str | None = None
    unread_count: int = 0
    last_sender_name: str | None = None


class UpdatesResponse(BaseModel):
    conversations: list[ConversationUpdateItem]
    server_time: datetime


class UploadResponse(BaseModel):
    file_url: str
    thumbnail_url: str | None = None
    file_name: str
    file_size: int
    mime_type: str
```

---

## Шаг 4. Утилиты (app/services/)

### app/services/cursor.py — курсорная пагинация

```python
import base64
from datetime import datetime
from uuid import UUID


def encode_cursor(ts: datetime, record_id: UUID) -> str:
    raw = f"{ts.isoformat()}|{record_id}"
    return base64.urlsafe_b64encode(raw.encode()).decode()


def decode_cursor(cursor: str) -> tuple[datetime, UUID]:
    raw = base64.urlsafe_b64decode(cursor.encode()).decode()
    ts_str, id_str = raw.split("|", 1)
    return datetime.fromisoformat(ts_str), UUID(id_str)
```

**Использование в запросах:**

```python
from sqlalchemy import and_, or_

query = select(Message).where(
    Message.conversation_id == conversation_id,
    Message.is_deleted == False,
)
if cursor:
    cursor_ts, cursor_id = decode_cursor(cursor)
    query = query.where(
        or_(
            Message.created_at < cursor_ts,
            and_(Message.created_at == cursor_ts, Message.id < cursor_id),
        )
    )
query = query.order_by(Message.created_at.desc(), Message.id.desc()).limit(limit + 1)

results = (await db.execute(query)).scalars().all()
has_more = len(results) > limit
items = results[:limit]
next_cursor = encode_cursor(items[-1].created_at, items[-1].id) if has_more else None
```

### app/services/user_cache_service.py — кэш пользователей

```python
import logging
from datetime import datetime, timezone
from uuid import UUID

import httpx
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.user_cache import UserCache

logger = logging.getLogger(__name__)


async def get_cached_user(user_id: UUID, db: AsyncSession) -> UserCache | None:
    """Получить пользователя из кэша. Если устарел или отсутствует — обновить из core-client-info."""
    result = await db.execute(select(UserCache).where(UserCache.user_id == user_id))
    cached = result.scalar_one_or_none()

    now = datetime.now(timezone.utc)
    if cached and (now - cached.cached_at.replace(tzinfo=timezone.utc)).total_seconds() < settings.user_cache_ttl_seconds:
        return cached

    # Fetch from core-client-info
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                f"{settings.core_client_info_url}/profile/user",
                params={"user_id": str(user_id)},
            )
            if resp.status_code != 200:
                logger.warning("core-client-info returned %d for user %s", resp.status_code, user_id)
                return cached  # вернуть устаревший кэш, если есть

            data = resp.json()
    except Exception:
        logger.exception("Failed to fetch user %s from core-client-info", user_id)
        return cached

    stmt = insert(UserCache).values(
        user_id=user_id,
        name=data.get("name", ""),
        last_name=data.get("last_name", ""),
        middle_name=data.get("middle_name"),
        email=data.get("email", ""),
        avatar=data.get("avatar"),
        group_name=data.get("group"),
        faculty=data.get("faculty"),
        role=data.get("role"),
        cached_at=now,
    ).on_conflict_do_update(
        index_elements=["user_id"],
        set_={
            "name": data.get("name", ""),
            "last_name": data.get("last_name", ""),
            "middle_name": data.get("middle_name"),
            "email": data.get("email", ""),
            "avatar": data.get("avatar"),
            "group_name": data.get("group"),
            "faculty": data.get("faculty"),
            "role": data.get("role"),
            "cached_at": now,
        },
    )
    await db.execute(stmt)
    await db.flush()

    result = await db.execute(select(UserCache).where(UserCache.user_id == user_id))
    return result.scalar_one_or_none()


async def get_cached_users_batch(user_ids: list[UUID], db: AsyncSession) -> dict[UUID, UserCache]:
    """Получить несколько пользователей. Для отсутствующих/устаревших — подгрузить."""
    if not user_ids:
        return {}

    result = await db.execute(select(UserCache).where(UserCache.user_id.in_(user_ids)))
    cached = {u.user_id: u for u in result.scalars().all()}

    now = datetime.now(timezone.utc)
    stale_ids = [
        uid for uid in user_ids
        if uid not in cached
        or (now - cached[uid].cached_at.replace(tzinfo=timezone.utc)).total_seconds() >= settings.user_cache_ttl_seconds
    ]

    if stale_ids:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.post(
                    f"{settings.core_client_info_url}/profile/users/batch",
                    json={"user_ids": [str(uid) for uid in stale_ids]},
                )
                if resp.status_code == 200:
                    users_data = resp.json()
                    for u in users_data:
                        uid = UUID(u["id"])
                        stmt = insert(UserCache).values(
                            user_id=uid,
                            name=u.get("name", ""),
                            last_name=u.get("last_name", ""),
                            middle_name=u.get("middle_name"),
                            email=u.get("email", ""),
                            avatar=u.get("avatar"),
                            group_name=u.get("group"),
                            faculty=u.get("faculty"),
                            role=u.get("role"),
                            cached_at=now,
                        ).on_conflict_do_update(
                            index_elements=["user_id"],
                            set_={
                                "name": u.get("name", ""),
                                "last_name": u.get("last_name", ""),
                                "cached_at": now,
                            },
                        )
                        await db.execute(stmt)
                    await db.flush()

                    # Re-fetch updated
                    result = await db.execute(select(UserCache).where(UserCache.user_id.in_(user_ids)))
                    cached = {u.user_id: u for u in result.scalars().all()}
        except Exception:
            logger.exception("Failed batch fetch from core-client-info")

    return cached
```

### app/services/file_service.py — работа с файлами (MinIO/S3)

```python
import io
import uuid
import logging
from pathlib import Path

import boto3
from botocore.config import Config as BotoConfig
from PIL import Image

from app.config import settings

logger = logging.getLogger(__name__)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
THUMBNAIL_SIZE = (200, 200)


def _get_s3_client():
    return boto3.client(
        "s3",
        endpoint_url=settings.s3_endpoint,
        aws_access_key_id=settings.s3_access_key,
        aws_secret_access_key=settings.s3_secret_key,
        region_name=settings.s3_region,
        config=BotoConfig(signature_version="s3v4"),
    )


def _ensure_bucket(client):
    try:
        client.head_bucket(Bucket=settings.s3_bucket)
    except Exception:
        client.create_bucket(Bucket=settings.s3_bucket)


async def upload_file(
    file_content: bytes,
    file_name: str,
    mime_type: str,
    conversation_id: uuid.UUID,
) -> dict:
    """Загрузить файл в S3 и вернуть метаданные."""
    client = _get_s3_client()
    _ensure_bucket(client)

    file_ext = Path(file_name).suffix
    object_key = f"{conversation_id}/{uuid.uuid4()}{file_ext}"

    client.put_object(
        Bucket=settings.s3_bucket,
        Key=object_key,
        Body=file_content,
        ContentType=mime_type,
    )

    file_url = f"{settings.s3_endpoint}/{settings.s3_bucket}/{object_key}"
    thumbnail_url = None

    # Генерация thumbnail для изображений
    if mime_type in ALLOWED_IMAGE_TYPES:
        try:
            img = Image.open(io.BytesIO(file_content))
            img.thumbnail(THUMBNAIL_SIZE)
            thumb_buffer = io.BytesIO()
            img.save(thumb_buffer, format="WEBP", quality=80)
            thumb_buffer.seek(0)

            thumb_key = f"{conversation_id}/thumbs/{uuid.uuid4()}.webp"
            client.put_object(
                Bucket=settings.s3_bucket,
                Key=thumb_key,
                Body=thumb_buffer.getvalue(),
                ContentType="image/webp",
            )
            thumbnail_url = f"{settings.s3_endpoint}/{settings.s3_bucket}/{thumb_key}"
        except Exception:
            logger.exception("Failed to generate thumbnail for %s", file_name)

    return {
        "file_url": file_url,
        "file_name": file_name,
        "file_size": len(file_content),
        "mime_type": mime_type,
        "thumbnail_url": thumbnail_url,
    }
```

> **Зависимости**: добавь `boto3>=1.35.0` и `Pillow>=10.0.0` в `pyproject.toml`.

### app/services/websocket_manager.py — WebSocket менеджер

```python
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

    async def broadcast_to_conversation(self, participant_ids: list[UUID], event: dict, exclude_user: UUID | None = None):
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
```

---

## Шаг 5. Dependencies (app/dependencies.py)

Создай файл с auth-зависимостями. Паттерн — `packages/authorization-py/authorization_py/dependencies.py`:

```python
from typing import Annotated, Any

from fastapi import Depends

from authorization_py.dependencies import get_current_user, require_valid_session

# Алиасы для удобства в роутерах
CurrentUser = Annotated[dict[str, Any], Depends(get_current_user)]
ValidSession = Annotated[dict[str, Any], Depends(require_valid_session)]
```

---

## Шаг 6. Роутеры (app/routers/)

### app/routers/status.py

Уже сгенерирован — оставить как есть.

### app/routers/conversations.py

```
Prefix: /conversations
Tags: ["conversations"]
```

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| `GET` | `/conversations` | valid | Список чатов текущего пользователя |
| `POST` | `/conversations/direct` | valid | Создать или получить existing direct чат |
| `GET` | `/conversations/updates` | valid | Poll для обновлений (fallback, если WS недоступен) |
| `GET` | `/conversations/{conversation_id}` | valid + participant | Детали чата |
| `DELETE` | `/conversations/{conversation_id}` | valid + participant | Soft-delete (is_deleted=true на participant) |

**GET /conversations** — список чатов:
- Query params: `cursor: str | None`, `limit: int = 20` (max 50)
- SQL: JOIN `conversation_participant` (WHERE user_id = current_user AND is_deleted = false) с `conversation`, ORDER BY `last_message_at DESC NULLS LAST`
- Cursor кодирует `(last_message_at, conversation_id)`
- Для каждого чата считай `unread_count`: `COUNT(message) WHERE conversation_id = X AND created_at > participant.last_read_at` (или полный count если last_read_at IS NULL)
- Participants enriched from user_cache

**POST /conversations/direct** — создать/получить direct чат:
- Body: `{ "recipient_id": "uuid" }`
- Логика:
  1. Проверить, что recipient_id != current_user_id
  2. Найти existing direct conversation, где оба пользователя — участники
  3. Если найден — вернуть его (200)
  4. Если нет — создать Conversation(type='direct') + 2 ConversationParticipant (can_reply=true) → вернуть (201)

**GET /conversations/updates** — polling endpoint:
- Query params: `since: datetime` (ISO 8601)
- Возвращает только conversations где current_user — participant AND last_message_at > since
- Response: `UpdatesResponse` с `server_time`

### app/routers/messages.py

```
Prefix: /conversations/{conversation_id}/messages
Tags: ["messages"]
```

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| `GET` | `/conversations/{id}/messages` | valid + participant | Сообщения с курсорной пагинацией |
| `POST` | `/conversations/{id}/messages` | valid + participant + can_reply | Отправить сообщение |
| `POST` | `/conversations/{id}/read` | valid + participant | Отметить прочитанным |

**GET /conversations/{id}/messages** — paginated:
- Query: `cursor: str | None`, `limit: int = 30` (max 100)
- SQL: `WHERE conversation_id = :id AND is_deleted = false AND (created_at, id) < (:cursor_ts, :cursor_id) ORDER BY created_at DESC, id DESC LIMIT :limit + 1`
- Каждое сообщение обогащается sender info из user_cache
- `is_own = (sender_id == current_user_id)`

**POST /conversations/{id}/messages** — отправка:
- Body: `SendMessageRequest`
- Проверить `participant.can_reply` (для broadcast студенты не могут)
- Insert message → UPDATE conversation SET last_message_at, last_message_preview, last_message_sender_id
- **Через WebSocket**: отправить `new_message` event всем участникам conversation
- Response: `MessageResponse` (201)

**POST /conversations/{id}/read** — mark read:
- Body: `MarkReadRequest`
- UPDATE conversation_participant SET last_read_message_id, last_read_at = now()
- Через WebSocket: отправить `message_read` event sender'у
- Response: 204

### app/routers/messages_search.py

```
Prefix: /messages
Tags: ["messages"]
```

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| `GET` | `/messages/search` | valid | Поиск по сообщениям |

**GET /messages/search**:
- Query: `q: str` (min 2 chars), `cursor: str | None`, `limit: int = 20`
- SQL:
```sql
SELECT m.*,
       ts_headline('russian', m.content, plainto_tsquery('russian', :q),
                   'MaxWords=30, MinWords=15, StartSel=<mark>, StopSel=</mark>') as highlight
FROM message m
JOIN conversation_participant cp ON cp.conversation_id = m.conversation_id
WHERE cp.user_id = :current_user
  AND cp.is_deleted = false
  AND m.is_deleted = false
  AND m.content_search @@ plainto_tsquery('russian', :q)
ORDER BY ts_rank(m.content_search, plainto_tsquery('russian', :q)) DESC, m.created_at DESC
LIMIT :limit + 1
```
- Response: `SearchMessagesResponse`

### app/routers/broadcasts.py

```
Prefix: /broadcasts
Tags: ["broadcasts"]
```

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| `POST` | `/broadcasts` | valid + role=teacher | Создать рассылку |
| `GET` | `/broadcasts` | valid + role=teacher | Список рассылок преподавателя |
| `GET` | `/broadcasts/groups` | valid + role=teacher | Доступные группы для выбора |

**POST /broadcasts**:
- Body: `CreateBroadcastRequest` (title, group_names, initial_message?)
- Логика:
  1. Проверить `user["role"] == "teacher"`, иначе 403
  2. Для каждой группы из `group_names` — запросить user_ids из core-client-info (`GET /profile/users-by-group?group=<name>`)
  3. Создать Conversation(type='broadcast', title=title, owner_id=teacher_id)
  4. Создать participant для teacher: role='owner', can_reply=true
  5. Создать participants для студентов (batch insert): role='member', can_reply=false
  6. Если `initial_message` не пуст — создать первое сообщение и обновить last_message_*
  7. Через WebSocket: отправить `new_conversation` event всем студентам
- Response: `ConversationResponse` (201)

**GET /broadcasts/groups**:
- Проксирует запрос к core-client-info для получения списка групп
- Response: `list[str]`

### app/routers/users.py

```
Prefix: /users
Tags: ["users"]
```

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| `GET` | `/users/search` | valid | Поиск пользователей по имени |
| `GET` | `/users/{user_id}` | valid | Информация о пользователе |

**GET /users/search**:
- Query: `q: str`, `limit: int = 10`
- Ищет в user_cache по `name ILIKE :q%` OR `last_name ILIKE :q%`
- Если результатов мало — дополнить из core-client-info
- Response: `UserSearchResponse`

### app/routers/files.py

```
Prefix: /files
Tags: ["files"]
```

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| `POST` | `/files/upload` | valid | Загрузить файл |

**POST /files/upload**:
- Multipart form: `file: UploadFile`, `conversation_id: UUID`
- Проверить что current_user — participant conversation
- Проверить размер файла (max 10MB, изображения max 5MB)
- Загрузить через `file_service.upload_file()`
- Response: `UploadResponse`

### app/routers/ws.py — WebSocket endpoint

```python
import logging

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query

from authorization_py.jwt_verify import decode_token_safe
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
    # Verify JWT
    payload, jwt_status = decode_token_safe(token, settings.jwt_secret)
    if jwt_status != "valid" or payload is None:
        await websocket.close(code=4001, reason="Invalid token")
        return

    from uuid import UUID
    user_id = UUID(payload["sub"])

    await ws_manager.connect(websocket, user_id)
    try:
        while True:
            # Клиент может отправлять ping / typing events
            data = await websocket.receive_text()
            try:
                import json
                msg = json.loads(data)
                if msg.get("type") == "typing":
                    # Broadcast typing indicator
                    # (опционально — получить participant_ids из БД)
                    pass
            except Exception:
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, user_id)
```

### app/routers/__init__.py

Импортируй все роутеры.

---

## Шаг 7. main.py

Обнови `app/main.py` по паттерну `services/core-client-info/app/main.py`:

```python
import logging
import time
from contextlib import asynccontextmanager

from _auth_routes_generated import AUTH_ROUTES
from authorization_py.middleware import AuthMiddleware
from fastapi import FastAPI, Request
from fastapi.exception_handlers import request_validation_exception_handler
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.instrumentation import instrument_app, setup_instrumentation
from app.routers import broadcasts, conversations, files, messages, messages_search, status, users, ws

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


setup_instrumentation()

app = FastAPI(
    title="core-messages",
    description="Messaging — direct messages, broadcasts, file attachments",
    version="0.1.0",
    root_path="/core-messages",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    AuthMiddleware,
    routes=AUTH_ROUTES,
    core_auth_url=settings.core_auth_url,
    jwt_secret=settings.jwt_secret,
)

instrument_app(app)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000
    query = f"?{request.url.query}" if request.url.query else ""
    logger.info("%s %s%s → %d (%.0fms)", request.method, request.url.path, query, response.status_code, duration_ms)
    return response


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    try:
        body_bytes = await request.body()
        body_str = body_bytes.decode("utf-8", errors="replace")
    except Exception:
        body_str = "<unreadable>"
    query = f"?{request.url.query}" if request.url.query else ""
    logger.error(
        "422 Validation error | %s %s%s | body=%s | errors=%s",
        request.method, request.url.path, query, body_str[:2000], exc.errors(),
    )
    return await request_validation_exception_handler(request, exc)


app.include_router(status.router)
app.include_router(conversations.router)
app.include_router(messages.router)
app.include_router(messages_search.router)
app.include_router(broadcasts.router)
app.include_router(users.router)
app.include_router(files.router)
app.include_router(ws.router)
```

---

## Шаг 8. Дополнительные зависимости в pyproject.toml

К стандартным зависимостям генератора добавь:

```toml
    "boto3>=1.35.0",
    "Pillow>=10.0.0",
    "websockets>=12.0",
```

---

## Шаг 9. Изменения в core-client-info

В сервисе `services/core-client-info` нужно добавить три новых endpoint'а для обслуживания core-messages. Создай новый роутер `app/routers/internal.py`:

| Метод | Путь | Описание |
|-------|------|----------|
| `POST` | `/profile/users/batch` | Получить список пользователей по UUID (max 100) |
| `GET` | `/profile/groups` | Список всех групп (distinct) |
| `GET` | `/profile/users-by-group` | Пользователи конкретной группы |

**POST /profile/users/batch**:
```python
class BatchUsersRequest(BaseModel):
    user_ids: list[UUID] = Field(..., max_length=100)

@router.post("/users/batch")
async def get_users_batch(body: BatchUsersRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(User.id.in_(body.user_ids))
    )
    users = result.scalars().all()
    return [
        {
            "id": str(u.id),
            "name": u.name,
            "last_name": u.last_name,
            "middle_name": u.middle_name,
            "email": u.email,
            "avatar": u.avatar,
            "group": u.group,
            "faculty": u.faculty,
            "role": "teacher" if u.qualification == "teacher" else "student",  # адаптируй логику определения роли
        }
        for u in users
    ]
```

**GET /profile/groups**:
```python
@router.get("/groups")
async def get_groups(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User.group).where(User.group.isnot(None)).distinct().order_by(User.group)
    )
    return [row[0] for row in result.all()]
```

**GET /profile/users-by-group**:
```python
@router.get("/users-by-group")
async def get_users_by_group(group: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(User.group == group)
    )
    users = result.scalars().all()
    return [
        {"id": str(u.id), "name": u.name, "last_name": u.last_name, "avatar": u.avatar}
        for u in users
    ]
```

Не забудь зарегистрировать роутер в `app/main.py` и обновить `router.yaml`.

---

## Шаг 10. router.yaml

После написания всех роутеров запусти генератор:

```bash
pnpm run generate:router
```

Затем установи `auth_level: valid` для всех endpoint'ов, кроме:
- `/api/status` → `auth_level: none`
- `/ws` → `auth_level: none` (аутентификация внутри WebSocket handler'а через query param)

---

## Шаг 11. MinIO (файловое хранилище)

### Для локальной разработки

Добавь в `docker-compose.dev.yml`:

```yaml
  minio:
    image: minio/minio:latest
    container_name: supreme-minio-dev
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data
```

И в volumes:
```yaml
  minio_data:
    driver: local
```

### Для production

Нужен Helm chart для MinIO. Создай `infra/helmcharts/minio/` по аналогии с другими charts. Основные values:
- `persistence.size: 10Gi`
- Bucket `messages-attachments` создаётся при первом обращении из file_service

Добавь в `service.yaml` core-messages:
```yaml
secrets:
  S3_ACCESS_KEY: MINIO_ACCESS_KEY
  S3_SECRET_KEY: MINIO_SECRET_KEY
env:
  S3_ENDPOINT: "http://minio.default.svc.cluster.local:9000"
  S3_BUCKET: "messages-attachments"
```

---

## Шаг 12. Kubernetes / Ingress

В `infra/helmcharts/ingress-nginx/values.yaml` нужно добавить секцию для core-messages.
Важно: для WebSocket нужна аннотация на ingress правило. Генератор (`pnpm run generate`) автоматически добавит HTTP-роуты, но WebSocket-роут `/core-messages/ws` нужно проверить вручную.

Ingress-nginx по умолчанию поддерживает WebSocket — нужно убедиться что `proxy-read-timeout` достаточно большой для long-lived connections.

---

## Шаг 13. Генерация API-клиента

После того как сервис запущен и отдаёт OpenAPI schema:

```bash
pnpm gen:api-client
```

Это:
1. Запустит `scripts/export_openapi.py` в services/core-messages
2. Скопирует `openapi.json` в `packages/api-client/schemas/core-messages.json`
3. Сгенерирует TypeScript клиент в `packages/api-client/src/generated/core-messages/`

---

## Шаг 14. WebSocket — формат событий

Все события — JSON:

```json
// new_message — новое сообщение в чате
{
  "type": "new_message",
  "data": {
    "id": "uuid",
    "conversation_id": "uuid",
    "sender_id": "uuid",
    "sender_name": "Иван",
    "sender_last_name": "Петров",
    "sender_avatar": "url",
    "content": "Привет!",
    "content_type": "text",
    "attachments": [],
    "created_at": "2026-03-29T19:00:00Z",
    "is_own": false
  }
}

// message_read — пользователь прочитал сообщения
{
  "type": "message_read",
  "data": {
    "conversation_id": "uuid",
    "user_id": "uuid",
    "last_read_message_id": "uuid"
  }
}

// new_conversation — новый чат (при создании direct или broadcast)
{
  "type": "new_conversation",
  "data": { /* ConversationResponse */ }
}

// typing — индикатор набора текста (опционально)
{
  "type": "typing",
  "data": {
    "conversation_id": "uuid",
    "user_id": "uuid"
  }
}
```

---

## Шаг 15. .env.example

```env
PORT=8006
PYTHON_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=core_messages_db
DB_USER=core_messages_user
DB_PASSWORD=dev_password

# Auth
JWT_SECRET=local-development-secret
CORE_AUTH_URL=http://localhost:8002/core-auth

# Service-to-service
CORE_CLIENT_INFO_URL=http://localhost:8003/core-client-info

# File storage (MinIO)
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=messages-attachments

# Observability
LOKI_ENDPOINT=http://localhost:3100/otlp/v1/logs
SKIP_INSTRUMENTATION=1
```

---

## Performance-заметки

1. **Индекс `ix_messages_conversation_created`** на `(conversation_id, created_at DESC, id DESC)` — критический для курсорной пагинации. Работает как index-only scan для основного запроса чата.

2. **Denormalized `last_message_at/preview`** на conversation — избегает дорогого JOIN+subquery при листинге чатов.

3. **Batch insert** участников при broadcast (executemany / `insert().values([...])`) — для рассылок на 200+ студентов.

4. **WebSocket connection manager** — in-memory dict. При горизонтальном масштабировании (>1 pod) нужен Redis Pub/Sub для cross-pod delivery. Это покрывается в отдельном плане Redis.

5. **user_cache** в PostgreSQL — достаточно для старта. При росте нагрузки — перенести в Redis (отдельный план).

6. **Full-text search** с GIN-индексом и `'russian'` конфигурацией — намного эффективнее ILIKE для русского текста. Автоматическая лемматизация.

---

## Порядок реализации

1. Генерация сервиса (`pnpm generate:service`)
2. Config, database, models
3. Alembic-миграция (с trigger + GIN index)
4. Schemas, cursor utility, user_cache_service
5. File service (+ MinIO в docker-compose)
6. WebSocket manager
7. Роутеры: status → conversations → messages → search → broadcasts → users → files → ws
8. Обновить main.py
9. Добавить endpoint'ы в core-client-info
10. `pnpm run generate:router` для обоих сервисов
11. `pnpm gen:api-client`
12. Тесты
