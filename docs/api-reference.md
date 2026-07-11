# backend-distributed-system-practices API Reference

> Auto-generated from codebase on 2026-07-11. Import `postman/backend-distributed-system-practices.postman_collection.json` into Postman.

## Setup

- **Base URL:** `http://localhost:3000`
- **Global prefix:** All routes are mounted under `/api`
- **Auth:** No JWT or session auth yet. Endpoints that need an acting user accept `userId` via:
  - `x-user-id` header (recommended)
  - `userId` query parameter
  - `userId` in JSON body
- **Postman variables:** `baseUrl`, `userId`, `postId`, `notificationId`
- **Start server:** `bun run dev`

## Error format

All errors return JSON:

```json
{
  "status": "error",
  "message": "human-readable message"
}
```

| Status | When |
|--------|------|
| 400 | Validation failure |
| 403 | Forbidden (e.g. deleting someone else's post) |
| 404 | Resource not found |
| 409 | Conflict (duplicate email/username) |
| 500 | Internal server error |

---

## Endpoints

**30 endpoints** across 7 resource groups.

### Health

#### `GET /api/health`

Liveness check. Returns uptime and environment.

**Auth:** None

**Response `200`:**

```json
{
  "status": "ok",
  "uptimeSeconds": 42,
  "environment": "development",
  "timestamp": "2026-07-11T15:00:00.000Z"
}
```

**curl:**

```bash
curl -X GET "http://localhost:3000/api/health"
```

---

### Users

#### `POST /api/users`

Register a new user.

**Auth:** None

**Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | yes | Valid email; stored lowercase |
| username | string | yes | 3–30 chars: `a-z`, `0-9`, `_` |
| name | string | no | Display name |
| bio | string | no | Profile bio |
| avatarUrl | string | no | Avatar URL |

**Response `201`:**

```json
{
  "id": "1",
  "email": "alice@example.com",
  "username": "alice",
  "name": "Alice",
  "bio": null,
  "avatarUrl": null,
  "createdAt": "2026-07-11T15:00:00.000Z"
}
```

**curl:**

```bash
curl -X POST "http://localhost:3000/api/users" \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","username":"alice","name":"Alice"}'
```

---

#### `GET /api/users`

List users, newest first.

**Auth:** None

**Query params:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| limit | number | 20 | Max 100 |
| offset | number | 0 | Pagination offset |

**Response `200`:** Array of user objects.

**curl:**

```bash
curl -X GET "http://localhost:3000/api/users?limit=20&offset=0"
```

---

#### `GET /api/users/username/:username`

Look up a user by username.

**Auth:** None

**Path params:**

| Name | Type | Description |
|------|------|-------------|
| username | string | Username (case-insensitive) |

**Response `200`:** User object.

**curl:**

```bash
curl -X GET "http://localhost:3000/api/users/username/alice"
```

---

#### `GET /api/users/:id`

Get a single user by ID.

**Auth:** None

**Path params:**

| Name | Type | Description |
|------|------|-------------|
| id | string | User ID |

**Response `200`:** User object.

**curl:**

```bash
curl -X GET "http://localhost:3000/api/users/1"
```

---

#### `PATCH /api/users/:id`

Update profile fields.

**Auth:** None

**Path params:**

| Name | Type | Description |
|------|------|-------------|
| id | string | User ID |

**Body:** Any of `name`, `bio`, `avatarUrl` (all optional).

**Response `200`:** Updated user object.

**curl:**

```bash
curl -X PATCH "http://localhost:3000/api/users/1" \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice Updated","bio":"New bio"}'
```

---

### Posts

#### `POST /api/posts`

Create a post.

**Auth:** Acting user required (`x-user-id`, `userId` query, or `userId` body)

**Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| body | string | yes | Post text, max 500 chars |

**Response `201`:**

```json
{
  "id": "1",
  "authorId": "1",
  "body": "Hello world!",
  "likeCount": 0,
  "createdAt": "2026-07-11T15:00:00.000Z"
}
```

**curl:**

```bash
curl -X POST "http://localhost:3000/api/posts" \
  -H "Content-Type: application/json" \
  -H "x-user-id: 1" \
  -d '{"body":"Hello world!"}'
```

---

#### `GET /api/posts/feed`

Home feed: posts from users the acting user follows.

**Auth:** Acting user required

**Query params:** `limit` (max 100, default 20), `offset` (default 0)

**Response `200`:** Array of post objects.

**curl:**

```bash
curl -X GET "http://localhost:3000/api/posts/feed?limit=20" \
  -H "x-user-id: 1"
```

---

#### `GET /api/posts/author/:authorId`

List posts by a specific author.

**Auth:** None

**Path params:**

| Name | Type | Description |
|------|------|-------------|
| authorId | string | Author user ID |

**Query params:** `limit`, `offset`

**Response `200`:** Array of post objects.

**curl:**

```bash
curl -X GET "http://localhost:3000/api/posts/author/1?limit=20"
```

---

#### `GET /api/posts/:id`

Get a single post.

**Auth:** None

**Response `200`:** Post object.

**curl:**

```bash
curl -X GET "http://localhost:3000/api/posts/1"
```

---

#### `DELETE /api/posts/:id`

Delete a post. Only the author may delete.

**Auth:** Acting user required (must match author)

**Response `204`:** No body.

**curl:**

```bash
curl -X DELETE "http://localhost:3000/api/posts/1" \
  -H "x-user-id: 1"
```

---

#### `POST /api/posts/:id/like`

Like a post (idempotent).

**Auth:** Acting user required

**Response `200`:**

```json
{
  "liked": true,
  "likeCount": 1
}
```

**curl:**

```bash
curl -X POST "http://localhost:3000/api/posts/1/like" \
  -H "x-user-id: 1"
```

---

#### `DELETE /api/posts/:id/like`

Remove a like.

**Auth:** Acting user required

**Response `200`:**

```json
{
  "likeCount": 0
}
```

**curl:**

```bash
curl -X DELETE "http://localhost:3000/api/posts/1/like" \
  -H "x-user-id: 1"
```

---

### Follows

Mounted under `/api/users/:id/...`.

#### `POST /api/users/:id/follow`

Follow another user. Cannot follow yourself.

**Auth:** Acting user required (follower)

**Path params:**

| Name | Type | Description |
|------|------|-------------|
| id | string | User ID to follow |

**Response `201`:**

```json
{
  "following": true
}
```

**curl:**

```bash
curl -X POST "http://localhost:3000/api/users/2/follow" \
  -H "x-user-id: 1"
```

---

#### `DELETE /api/users/:id/follow`

Unfollow a user.

**Auth:** Acting user required

**Response `200`:**

```json
{
  "following": false
}
```

**curl:**

```bash
curl -X DELETE "http://localhost:3000/api/users/2/follow" \
  -H "x-user-id: 1"
```

---

#### `GET /api/users/:id/followers`

List users who follow this user.

**Auth:** None

**Query params:** `limit`, `offset`

**Response `200`:**

```json
[
  {
    "id": "2",
    "username": "bob",
    "name": "Bob",
    "avatarUrl": null
  }
]
```

**curl:**

```bash
curl -X GET "http://localhost:3000/api/users/1/followers"
```

---

#### `GET /api/users/:id/following`

List users this user follows.

**Auth:** None

**Query params:** `limit`, `offset`

**Response `200`:** Array of user refs (same shape as followers).

**curl:**

```bash
curl -X GET "http://localhost:3000/api/users/1/following"
```

---

#### `GET /api/users/:id/counts`

Follower and following counts.

**Auth:** None

**Response `200`:**

```json
{
  "followers": 10,
  "following": 5
}
```

**curl:**

```bash
curl -X GET "http://localhost:3000/api/users/1/counts"
```

---

### Notifications

#### `POST /api/notifications`

Create a notification (typically called by internal services).

**Auth:** None

**Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| recipientId | string | yes | User receiving the notification |
| type | string | yes | One of: `follow`, `like`, `mention`, `reply` |
| actorId | string | no | User who triggered the event |
| entityId | string | no | Related post/comment ID |

**Response `201`:** Notification object.

**curl:**

```bash
curl -X POST "http://localhost:3000/api/notifications" \
  -H "Content-Type: application/json" \
  -d '{"recipientId":"2","actorId":"1","type":"follow"}'
```

---

#### `GET /api/notifications`

List notifications for the acting user.

**Auth:** Acting user required

**Query params:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| unread | string | — | Set to `true` to filter unread only |
| limit | number | 20 | Max 100 |
| offset | number | 0 | Pagination offset |

**Response `200`:** Array of notification objects.

**curl:**

```bash
curl -X GET "http://localhost:3000/api/notifications?unread=true" \
  -H "x-user-id: 1"
```

---

#### `GET /api/notifications/unread-count`

Count unread notifications.

**Auth:** Acting user required

**Response `200`:**

```json
{
  "unread": 3
}
```

**curl:**

```bash
curl -X GET "http://localhost:3000/api/notifications/unread-count" \
  -H "x-user-id: 1"
```

---

#### `POST /api/notifications/read-all`

Mark all notifications as read.

**Auth:** Acting user required

**Response `200`:**

```json
{
  "updated": 3
}
```

**curl:**

```bash
curl -X POST "http://localhost:3000/api/notifications/read-all" \
  -H "x-user-id: 1"
```

---

#### `POST /api/notifications/:id/read`

Mark a single notification as read.

**Auth:** Acting user required

**Response `200`:** Updated notification object.

**curl:**

```bash
curl -X POST "http://localhost:3000/api/notifications/1/read" \
  -H "x-user-id: 1"
```

---

### Search

All search endpoints require query param `q` with at least 2 characters (max 100).

#### `GET /api/search`

Search users and posts in one request.

**Auth:** None

**Query params:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| q | string | — | Search query (required, min 2 chars) |
| limit | number | 20 | Max 50 |

**Response `200`:**

```json
{
  "users": [
    {
      "kind": "user",
      "id": "1",
      "username": "alice",
      "name": "Alice",
      "avatarUrl": null
    }
  ],
  "posts": [
    {
      "kind": "post",
      "id": "1",
      "authorId": "1",
      "body": "hello world",
      "createdAt": "2026-07-11T15:00:00.000Z"
    }
  ]
}
```

**curl:**

```bash
curl -X GET "http://localhost:3000/api/search?q=alice"
```

---

#### `GET /api/search/users`

Search users by username or name (trigram similarity ranking).

**Auth:** None

**Query params:** `q` (required), `limit` (max 50)

**Response `200`:** Array of user hits.

**curl:**

```bash
curl -X GET "http://localhost:3000/api/search/users?q=alice"
```

---

#### `GET /api/search/posts`

Full-text search over post bodies.

**Auth:** None

**Query params:** `q` (required), `limit` (max 50)

**Response `200`:** Array of post hits.

**curl:**

```bash
curl -X GET "http://localhost:3000/api/search/posts?q=hello"
```

---

### Analytics

#### `POST /api/analytics/events`

Track an analytics event.

**Auth:** None

**Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| eventType | string | yes | Dotted slug, e.g. `post.view` |
| userId | string | no | Associated user |
| entityId | string | no | Related entity |
| metadata | object | no | Arbitrary JSON metadata |

**Response `201`:**

```json
{
  "id": "1",
  "userId": "1",
  "eventType": "post.view",
  "entityId": "5",
  "metadata": {"source": "feed"},
  "createdAt": "2026-07-11T15:00:00.000Z"
}
```

**curl:**

```bash
curl -X POST "http://localhost:3000/api/analytics/events" \
  -H "Content-Type: application/json" \
  -d '{"userId":"1","eventType":"post.view","entityId":"5","metadata":{"source":"feed"}}'
```

---

#### `GET /api/analytics/overview`

Platform-wide totals.

**Auth:** None

**Response `200`:**

```json
{
  "totalUsers": 100,
  "totalPosts": 250,
  "totalFollows": 80,
  "totalLikes": 420
}
```

**curl:**

```bash
curl -X GET "http://localhost:3000/api/analytics/overview"
```

---

#### `GET /api/analytics/timeseries`

Daily event counts for a given event type.

**Auth:** None

**Query params:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| eventType | string | — | Required dotted slug |
| days | number | 7 | Lookback window (1–365) |

**Response `200`:**

```json
[
  {"day": "2026-07-10", "count": 12},
  {"day": "2026-07-11", "count": 8}
]
```

**curl:**

```bash
curl -X GET "http://localhost:3000/api/analytics/timeseries?eventType=post.view&days=7"
```

---

#### `GET /api/analytics/top-authors`

Top authors ranked by total likes received.

**Auth:** None

**Query params:** `limit` (max 100, default 10)

**Response `200`:**

```json
[
  {"authorId": "1", "posts": 10, "likes": 55}
]
```

**curl:**

```bash
curl -X GET "http://localhost:3000/api/analytics/top-authors?limit=10"
```
