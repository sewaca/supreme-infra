# Quick Testing Guide

## Setup

The database is initialized on first deployment via `infra/databases/core-messages-db/init.sql`.
Test data is loaded via `infra/databases/core-messages-db/migrations/001_initial_test_data.sql` on every `helm upgrade`.

### Test data summary

After migrations you have:

- **Direct conversation** (`cccccccc-cccc-cccc-cccc-cccccccccccc`) between Иван Иванов и Мария Петрова — 3 сообщения
- **Broadcast** (`dddddddd-dddd-dddd-dddd-dddddddddddd`) от Марии для группы ИКПИ-25 — 1 сообщение
- **User cache** заполнен для всех трёх пользователей

```
Conversations:
  Direct:    cccccccc-cccc-cccc-cccc-cccccccccccc  (Иван ↔ Мария)
  Broadcast: dddddddd-dddd-dddd-dddd-dddddddddddd  (Мария → ИКПИ-25)

Messages (direct):
  cc100001-cccc-cccc-cccc-000000000001  (от Марии)
  cc100002-cccc-cccc-cccc-000000000002  (от Ивана)
  cc100003-cccc-cccc-cccc-000000000003  (от Ивана — последнее)

Messages (broadcast):
  dd100001-dddd-dddd-dddd-000000000001  (от Марии)

Users:
  Студент:  550e8400-e29b-41d4-a716-446655440000  Иван Иванов
  Преподаватель: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa  Мария Петрова
  Студент2: bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb  Алексей Сидоров
```

### Start locally

```bash
cd services/core-messages
uv run uvicorn app.main:app --host 0.0.0.0 --port 8006
```

Requires a running PostgreSQL with `core_messages_db` and correct credentials in `.env`.

## Environment

```bash
export BASE_URL="https://diploma.sewaca.ru/core-messages"

# Student token (user_id: 550e8400-e29b-41d4-a716-446655440000, role: student)
export STUDENT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJqdGkiOiI5NzA2YzdlMS05NjMxLTQ5YzEtYTgxMi0wZTliOGI5MjlkOTIiLCJlbWFpbCI6Iml2YW4uaXZhbm92QGV4YW1wbGUuY29tIiwibmFtZSI6Ilx1MDQxOFx1MDQzMlx1MDQzMFx1MDQzZCBcdTA0MThcdTA0MzJcdTA0MzBcdTA0M2RcdTA0M2VcdTA0MzIiLCJyb2xlIjoic3R1ZGVudCIsImlhdCI6MTc3NDgwMzk2NCwiZXhwIjoxNzc1NDA4NzY0fQ.e2Y3EqlQYaXuuMjjEWk3rLpO7XXwDy0cY-95b4bhMxE"

# Teacher token (role: teacher) — needed for broadcast endpoints
export TEACHER_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

export STUDENT_ID="550e8400-e29b-41d4-a716-446655440000"
export CONV_ID="cccccccc-cccc-cccc-cccc-cccccccccccc"
export BROADCAST_ID="dddddddd-dddd-dddd-dddd-dddddddddddd"
export MSG_ID="cc100003-cccc-cccc-cccc-000000000003"
```

To generate tokens for testing, use the `core-auth` login endpoint:

```bash
# Login as student
curl -s -X POST "https://diploma.sewaca.ru/core-auth/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "user@example.com"}' | jq -r '.access_token'

# Login as teacher
curl -s -X POST "https://diploma.sewaca.ru/core-auth/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "moder@example.com", "password": "moder@example.com"}' | jq -r '.access_token'
```

## Verify Database

```bash
kubectl exec -n default postgresql-core-messages-0 -- \
  psql -U core_messages_user -d core_messages_db \
  -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
```

Expected tables:

```
     table_name
----------------------
 conversation
 conversation_participant
 message
 message_attachment
 user_cache
```

## Quick Test Commands

### Status

```bash
curl -s "$BASE_URL/status" | jq .
```

```json
{ "status": "ok", "service": "core-messages" }
```

### Conversations

#### List conversations (empty on fresh DB)

```bash
curl -s "$BASE_URL/conversations" \
  -H "Authorization: Bearer $STUDENT_TOKEN" | jq .
```

```json
{ "items": [], "next_cursor": null }
```

#### Create direct conversation

```bash
# Replace RECIPIENT_ID with another user's UUID
export RECIPIENT_ID="11111111-1111-1111-1111-111111111111"

curl -s -X POST "$BASE_URL/conversations/direct" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"recipient_id\": \"$RECIPIENT_ID\"}" | jq .
```

```json
{
  "id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "type": "direct",
  "title": null,
  "owner_id": null,
  "last_message_at": null,
  "last_message_preview": null,
  "unread_count": 0,
  "participants": [
    {
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Иван",
      "last_name": "Иванов",
      "avatar": null,
      "role": null
    },
    {
      "user_id": "11111111-1111-1111-1111-111111111111",
      "name": "...",
      "last_name": "...",
      "avatar": null,
      "role": null
    }
  ],
  "participant_count": 2
}
```

Save the conversation ID:

```bash
export CONV_ID="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
```

#### Get conversation

```bash
curl -s "$BASE_URL/conversations/$CONV_ID" \
  -H "Authorization: Bearer $STUDENT_TOKEN" | jq .
```

#### Delete (soft-delete for current user)

```bash
curl -s -X DELETE "$BASE_URL/conversations/$CONV_ID" \
  -H "Authorization: Bearer $STUDENT_TOKEN"
# Expects 204 No Content
```

### Messages

#### Send message

```bash
curl -s -X POST "$BASE_URL/conversations/$CONV_ID/messages" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Привет!", "content_type": "text"}' | jq .
```

```json
{
  "id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  "conversation_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "sender_id": "550e8400-e29b-41d4-a716-446655440000",
  "sender_name": "Иван",
  "sender_last_name": "Иванов",
  "sender_avatar": null,
  "content": "Привет!",
  "content_type": "text",
  "attachments": [],
  "created_at": "2026-03-29T19:00:00Z",
  "is_own": true
}
```

Save message ID:

```bash
export MSG_ID="bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
```

#### List messages (cursor pagination)

```bash
curl -s "$BASE_URL/conversations/$CONV_ID/messages" \
  -H "Authorization: Bearer $STUDENT_TOKEN" | jq .
```

```json
{
  "items": [
    /* newest first */
  ],
  "next_cursor": null,
  "has_more": false
}
```

With pagination:

```bash
curl -s "$BASE_URL/conversations/$CONV_ID/messages?limit=10&cursor=<next_cursor>" \
  -H "Authorization: Bearer $STUDENT_TOKEN" | jq .
```

#### Mark as read

```bash
curl -s -X POST "$BASE_URL/conversations/$CONV_ID/messages/read" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"last_read_message_id\": \"$MSG_ID\"}"
# Expects 204 No Content
```

### Updates (polling)

```bash
curl -s "$BASE_URL/conversations/updates?since=2026-01-01T00:00:00Z" \
  -H "Authorization: Bearer $STUDENT_TOKEN" | jq .
```

```json
{
  "conversations": [
    {
      "conversation_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "last_message_at": "2026-03-29T19:00:00Z",
      "last_message_preview": "Привет!",
      "unread_count": 1
    }
  ],
  "server_time": "2026-03-29T19:05:00Z"
}
```

### Search

```bash
curl -s "$BASE_URL/messages/search?q=привет" \
  -H "Authorization: Bearer $STUDENT_TOKEN" | jq .
```

```json
{
  "items": [
    {
      "message": {
        /* MessageResponse */
      },
      "conversation_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "conversation_title": null,
      "conversation_type": "direct",
      "highlight": "...<b>Привет</b>!..."
    }
  ],
  "next_cursor": null
}
```

### File attachments

```bash
# After a file is uploaded via the file storage service, register it with a message:
curl -s -X POST "$BASE_URL/files" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"message_id\": \"$MSG_ID\",
    \"file_url\": \"https://storage.example.com/files/photo.jpg\",
    \"file_name\": \"photo.jpg\",
    \"file_size\": 102400,
    \"mime_type\": \"image/jpeg\",
    \"thumbnail_url\": \"https://storage.example.com/files/photo_thumb.jpg\"
  }" | jq .
```

```json
{
  "id": "cccccccc-cccc-cccc-cccc-cccccccccccc",
  "file_url": "https://storage.example.com/files/photo.jpg",
  "file_name": "photo.jpg",
  "file_size": 102400,
  "mime_type": "image/jpeg",
  "thumbnail_url": "https://storage.example.com/files/photo_thumb.jpg"
}
```

### Broadcasts (teacher only)

#### Get available groups

```bash
curl -s "$BASE_URL/broadcasts/groups" \
  -H "Authorization: Bearer $TEACHER_TOKEN" | jq .
```

```json
["1234", "5678", "9012"]
```

#### Create broadcast

```bash
curl -s -X POST "$BASE_URL/broadcasts" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Объявление для группы 1234",
    "group_names": ["1234"],
    "initial_message": "Завтра пары отменяются!"
  }' | jq .
```

```json
{
  "id": "dddddddd-dddd-dddd-dddd-dddddddddddd",
  "type": "broadcast",
  "title": "Объявление для группы 1234",
  "owner_id": "teacher-uuid-here",
  "last_message_preview": "Завтра пары отменяются!",
  "unread_count": 0,
  "participants": [
    /* teacher + all students in group 1234 */
  ],
  "participant_count": 30
}
```

#### List teacher's broadcasts

```bash
curl -s "$BASE_URL/broadcasts" \
  -H "Authorization: Bearer $TEACHER_TOKEN" | jq .
```

#### Access denied (non-teacher)

```bash
curl -s -X POST "$BASE_URL/broadcasts" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "test", "group_names": ["1234"]}' | jq .
```

```json
{ "detail": "Only teachers can create broadcasts" }
```

### WebSocket

Test real-time connection:

```bash
# Install wscat: npm install -g wscat
wscat -c "wss://diploma.sewaca.ru/core-messages/ws?token=$STUDENT_TOKEN"
```

After connecting, send a message via another session and verify the WS event arrives:

```json
{
  "type": "new_message",
  "data": {
    /* MessageResponse */
  }
}
```

Other event types:

- `new_conversation` — when added to a new broadcast
- `message_read` — when recipient reads your message

### User search

```bash
curl -s "$BASE_URL/users/search?q=Иван" \
  -H "Authorization: Bearer $STUDENT_TOKEN" | jq .
```

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Иван",
    "last_name": "Иванов",
    "avatar": null,
    "role": "student"
  }
]
```

## Database Verification

```bash
# Count conversations
kubectl exec -n default postgresql-core-messages-0 -- \
  psql -U core_messages_user -d core_messages_db \
  -c "SELECT type, count(*) FROM conversation GROUP BY type;"

# Check messages for a conversation
kubectl exec -n default postgresql-core-messages-0 -- \
  psql -U core_messages_user -d core_messages_db \
  -c "SELECT id, sender_id, content, created_at FROM message WHERE conversation_id = '<conv-id>' ORDER BY created_at DESC LIMIT 5;"

# Check user cache
kubectl exec -n default postgresql-core-messages-0 -- \
  psql -U core_messages_user -d core_messages_db \
  -c "SELECT user_id, name, last_name, cached_at FROM user_cache LIMIT 10;"

# Check tsvector is populated
kubectl exec -n default postgresql-core-messages-0 -- \
  psql -U core_messages_user -d core_messages_db \
  -c "SELECT id, content, content_search FROM message LIMIT 3;"
```

## Troubleshooting

### 403 Not a participant

Ensure the JWT `sub` matches a participant in the conversation. Use `/conversations/direct` to create a conversation first.

### WebSocket disconnects immediately

Check that `?token=<jwt>` query param is included. The WS endpoint validates the token on connect and closes with code 4001 if invalid.

### Broadcasts return empty group list

Verify `core-client-info` service is running and `/profile/groups` returns data:

```bash
curl -s "https://diploma.sewaca.ru/core-client-info/profile/groups" | jq .
```

### Search returns no results

The `content_search` tsvector column is populated by a PostgreSQL trigger on message insert. Verify it's set:

```bash
kubectl exec -n default postgresql-core-messages-0 -- \
  psql -U core_messages_user -d core_messages_db \
  -c "SELECT content, content_search IS NOT NULL as has_fts FROM message LIMIT 5;"
```

If `content_search` is NULL, the trigger may not have been created. Check `init.sql` was applied correctly.

### User names show as empty strings

User data is fetched from `core-client-info` and cached in `user_cache`. On first access the cache miss calls the remote service. Check:

```bash
# Verify user_cache is being populated
kubectl exec -n default postgresql-core-messages-0 -- \
  psql -U core_messages_user -d core_messages_db \
  -c "SELECT count(*) FROM user_cache;"

# Check core-client-info batch endpoint is reachable
kubectl exec -n default <core-messages-pod> -- \
  curl -s "http://core-client-info.default.svc.cluster.local/core-client-info/profile/users/batch" \
  -X POST -H "Content-Type: application/json" \
  -d '{"user_ids": ["550e8400-e29b-41d4-a716-446655440000"]}' | jq .
```

### Database connection

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=core_messages_db
DB_USER=core_messages_user
DB_PASSWORD=your_password
JWT_SECRET=local-development-secret
CORE_AUTH_URL=http://localhost:8002/core-auth
CORE_CLIENT_INFO_URL=http://localhost:8000/core-client-info
```

## See Also

- `README.md` — Service overview
- `docs/prompts/29-03-2026__21-00__s3-file-service-instructions.md` — File storage service implementation notes
- `infra/databases/core-messages-db/init.sql` — Database schema
- `docs/databases.md` — database init, SQL migrations, deploy workflow
