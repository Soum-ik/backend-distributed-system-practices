#!/usr/bin/env python3
"""Generate Postman collection for backend-distributed-system-practices API."""

import json
from datetime import datetime, timezone
from typing import Dict, List, Optional

SCHEMA = "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
GENERATED = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def tests(status: int, extra: Optional[List[str]] = None) -> List[Dict]:
    lines = [
        f'pm.test("Status code is {status}", function () {{',
        f"    pm.response.to.have.status({status});",
        "});",
    ]
    if status != 204:
        lines.extend([
            'pm.test("Response is JSON", function () {',
            "    pm.response.to.be.json;",
            "});",
        ])
    if extra:
        lines.extend(extra)
    return [{
        "listen": "test",
        "script": {"type": "text/javascript", "exec": lines},
    }]


def url(path: str, query: Optional[List[Dict]] = None, path_vars: Optional[List[Dict]] = None) -> Dict:
    segments = [s for s in path.strip("/").split("/") if s]
    raw = "{{baseUrl}}/" + "/".join(segments)
    if query:
        raw += "?" + "&".join(f"{q['key']}={q.get('value', '')}" for q in query)
    result: Dict = {
        "raw": raw,
        "host": ["{{baseUrl}}"],
        "path": segments,
    }
    if query:
        result["query"] = query
    if path_vars:
        result["variable"] = path_vars
    return result


def saved_response(status: int, name: str, method: str, path: str, body: str) -> dict:
    return {
        "name": name,
        "status": "OK" if status == 200 else "Created" if status == 201 else "No Content",
        "code": status,
        "_postman_previewlanguage": "json" if body else "plain",
        "header": [{"key": "Content-Type", "value": "application/json"}] if body else [],
        "body": body,
        "originalRequest": {"method": method, "header": [], "url": url(path)},
    }


def req(
    name: str,
    method: str,
    path: str,
    description: str,
    status: int,
    response_body: str = "",
    query: Optional[List[Dict]] = None,
    body_raw: Optional[str] = None,
    path_vars: Optional[List[Dict]] = None,
    auth: bool = False,
    test_extra: Optional[List[str]] = None,
) -> Dict:
    headers = [{"key": "Content-Type", "value": "application/json"}] if body_raw or auth else []
    if auth:
        headers.append({"key": "Authorization", "value": "Bearer {{authToken}}", "description": "JWT from /api/auth/login or /api/auth/register"})
    request: Dict = {
        "method": method,
        "header": headers,
        "url": url(path, query=query, path_vars=path_vars),
        "description": description,
    }
    if body_raw:
        request["body"] = {
            "mode": "raw",
            "raw": body_raw,
            "options": {"raw": {"language": "json"}},
        }
    item: Dict = {
        "name": name,
        "request": request,
        "event": tests(status, test_extra),
        "response": [],
    }
    if response_body:
        item["response"] = [saved_response(status, "Example", method, path, response_body)]
    return item


collection = {
    "info": {
        "name": "backend-distributed-system-practices API",
        "description": (
            f"Auto-generated from codebase. Generated: {GENERATED}.\n\n"
            "## Setup\n"
            "1. Set `baseUrl` (default: http://localhost:3000)\n"
            "2. Register or login via `/api/auth/register` or `/api/auth/login`\n"
            "3. Set `authToken` and `userId` from the response\n"
            "4. Protected endpoints send `Authorization: Bearer {{authToken}}`"
        ),
        "schema": SCHEMA,
    },
    "variable": [
        {"key": "baseUrl", "value": "http://localhost:3000", "type": "string"},
        {"key": "authToken", "value": "", "type": "string", "description": "JWT from auth register/login"},
        {"key": "userId", "value": "1", "type": "string", "description": "Authenticated user ID (example)"},
        {"key": "postId", "value": "1", "type": "string", "description": "Post ID (example)"},
        {"key": "notificationId", "value": "1", "type": "string", "description": "Notification ID (example)"},
    ],
    "item": [
        {
            "name": "Health",
            "item": [
                req(
                    "GET /api/health",
                    "GET",
                    "api/health",
                    "Liveness check. Returns uptime and environment.",
                    200,
                    '{\n  "status": "ok",\n  "uptimeSeconds": 42,\n  "environment": "development",\n  "timestamp": "2026-07-11T15:00:00.000Z"\n}',
                    test_extra=[
                        'pm.test("Status is ok", function () {',
                        '    pm.expect(pm.response.json().status).to.eql("ok");',
                        "});",
                    ],
                ),
            ],
        },
        {
            "name": "Auth",
            "item": [
                req(
                    "POST /api/auth/register",
                    "POST",
                    "api/auth/register",
                    "Register a new user with email, username, and password.",
                    201,
                    '{\n  "user": {\n    "id": "1",\n    "email": "alice@example.com",\n    "username": "alice",\n    "name": "Alice",\n    "bio": null,\n    "avatarUrl": null,\n    "createdAt": "2026-07-11T15:00:00.000Z"\n  },\n  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."\n}',
                    body_raw='{\n  "email": "alice@example.com",\n  "username": "alice",\n  "password": "password123",\n  "name": "Alice",\n  "bio": "Hello world"\n}',
                    test_extra=[
                        "const json = pm.response.json();",
                        'pm.test("Has token", function () { pm.expect(json).to.have.property("token"); });',
                        "if (json.token) pm.collectionVariables.set('authToken', json.token);",
                        "if (json.user && json.user.id) pm.collectionVariables.set('userId', json.user.id);",
                    ],
                ),
                req(
                    "POST /api/auth/login",
                    "POST",
                    "api/auth/login",
                    "Login with email or username and password.",
                    200,
                    '{\n  "user": {\n    "id": "1",\n    "email": "alice@example.com",\n    "username": "alice",\n    "name": "Alice",\n    "bio": null,\n    "avatarUrl": null,\n    "createdAt": "2026-07-11T15:00:00.000Z"\n  },\n  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."\n}',
                    body_raw='{\n  "login": "alice@example.com",\n  "password": "password123"\n}',
                    test_extra=[
                        "const json = pm.response.json();",
                        "if (json.token) pm.collectionVariables.set('authToken', json.token);",
                        "if (json.user && json.user.id) pm.collectionVariables.set('userId', json.user.id);",
                    ],
                ),
                req(
                    "GET /api/auth/me",
                    "GET",
                    "api/auth/me",
                    "Return the authenticated user's profile.",
                    200,
                    '{\n  "id": "1",\n  "email": "alice@example.com",\n  "username": "alice",\n  "name": "Alice",\n  "bio": null,\n  "avatarUrl": null,\n  "createdAt": "2026-07-11T15:00:00.000Z"\n}',
                    auth=True,
                ),
            ],
        },
        {
            "name": "Users",
            "item": [
                req(
                    "GET /api/users",
                    "GET",
                    "api/users",
                    "List users, newest first.",
                    200,
                    '[\n  {\n    "id": "1",\n    "email": "alice@example.com",\n    "username": "alice",\n    "name": "Alice",\n    "bio": null,\n    "avatarUrl": null,\n    "createdAt": "2026-07-11T15:00:00.000Z"\n  }\n]',
                    query=[
                        {"key": "limit", "value": "20", "description": "Max 100, default 20"},
                        {"key": "offset", "value": "0", "description": "Pagination offset"},
                    ],
                    test_extra=[
                        'pm.test("Returns array", function () { pm.expect(pm.response.json()).to.be.an("array"); });',
                    ],
                ),
                req(
                    "GET /api/users/username/:username",
                    "GET",
                    "api/users/username/:username",
                    "Look up a user by username.",
                    200,
                    '{\n  "id": "1",\n  "email": "alice@example.com",\n  "username": "alice",\n  "name": "Alice",\n  "bio": null,\n  "avatarUrl": null,\n  "createdAt": "2026-07-11T15:00:00.000Z"\n}',
                    path_vars=[{"key": "username", "value": "alice", "description": "Username (3-30 chars)"}],
                ),
                req(
                    "GET /api/users/:id",
                    "GET",
                    "api/users/:id",
                    "Get a single user by ID.",
                    200,
                    '{\n  "id": "1",\n  "email": "alice@example.com",\n  "username": "alice",\n  "name": "Alice",\n  "bio": null,\n  "avatarUrl": null,\n  "createdAt": "2026-07-11T15:00:00.000Z"\n}',
                    path_vars=[{"key": "id", "value": "{{userId}}", "description": "User UUID"}],
                ),
                req(
                    "PATCH /api/users/:id",
                    "PATCH",
                    "api/users/:id",
                    "Update your own profile fields (name, bio, avatarUrl). Requires auth.",
                    200,
                    '{\n  "id": "1",\n  "email": "alice@example.com",\n  "username": "alice",\n  "name": "Alice Updated",\n  "bio": "New bio",\n  "avatarUrl": null,\n  "createdAt": "2026-07-11T15:00:00.000Z"\n}',
                    path_vars=[{"key": "id", "value": "{{userId}}", "description": "User UUID"}],
                    body_raw='{\n  "name": "Alice Updated",\n  "bio": "New bio"\n}',
                    auth=True,
                ),
            ],
        },
        {
            "name": "Posts",
            "item": [
                req(
                    "POST /api/posts",
                    "POST",
                    "api/posts",
                    "Create a post. Requires Bearer token.",
                    201,
                    '{\n  "id": "1",\n  "authorId": "1",\n  "body": "Hello world!",\n  "likeCount": 0,\n  "createdAt": "2026-07-11T15:00:00.000Z"\n}',
                    body_raw='{\n  "body": "Hello world!"\n}',
                    auth=True,
                    test_extra=[
                        "const json = pm.response.json();",
                        "if (json.id) pm.collectionVariables.set('postId', json.id);",
                    ],
                ),
                req(
                    "GET /api/posts/feed",
                    "GET",
                    "api/posts/feed",
                    "Home feed: posts from users the acting user follows.",
                    200,
                    '[\n  {\n    "id": "1",\n    "authorId": "2",\n    "body": "Feed post",\n    "likeCount": 3,\n    "createdAt": "2026-07-11T15:00:00.000Z"\n  }\n]',
                    query=[
                        {"key": "limit", "value": "20", "description": "Max 100"},
                        {"key": "offset", "value": "0", "description": "Pagination offset"},
                    ],
                    auth=True,
                ),
                req(
                    "GET /api/posts/author/:authorId",
                    "GET",
                    "api/posts/author/:authorId",
                    "List posts by a specific author.",
                    200,
                    '[\n  {\n    "id": "1",\n    "authorId": "1",\n    "body": "Hello world!",\n    "likeCount": 0,\n    "createdAt": "2026-07-11T15:00:00.000Z"\n  }\n]',
                    path_vars=[{"key": "authorId", "value": "{{userId}}", "description": "Author user ID"}],
                    query=[
                        {"key": "limit", "value": "20", "description": "Max 100"},
                        {"key": "offset", "value": "0", "description": "Pagination offset"},
                    ],
                ),
                req(
                    "GET /api/posts/:id",
                    "GET",
                    "api/posts/:id",
                    "Get a single post by ID.",
                    200,
                    '{\n  "id": "1",\n  "authorId": "1",\n  "body": "Hello world!",\n  "likeCount": 0,\n  "createdAt": "2026-07-11T15:00:00.000Z"\n}',
                    path_vars=[{"key": "id", "value": "{{postId}}", "description": "Post ID"}],
                ),
                req(
                    "DELETE /api/posts/:id",
                    "DELETE",
                    "api/posts/:id",
                    "Delete a post. Only the author may delete.",
                    204,
                    auth=True,
                    path_vars=[{"key": "id", "value": "{{postId}}", "description": "Post ID"}],
                ),
                req(
                    "POST /api/posts/:id/like",
                    "POST",
                    "api/posts/:id/like",
                    "Like a post (idempotent).",
                    200,
                    '{\n  "liked": true,\n  "likeCount": 1\n}',
                    auth=True,
                    path_vars=[{"key": "id", "value": "{{postId}}", "description": "Post ID"}],
                ),
                req(
                    "DELETE /api/posts/:id/like",
                    "DELETE",
                    "api/posts/:id/like",
                    "Remove a like from a post.",
                    200,
                    '{\n  "likeCount": 0\n}',
                    auth=True,
                    path_vars=[{"key": "id", "value": "{{postId}}", "description": "Post ID"}],
                ),
            ],
        },
        {
            "name": "Follows",
            "item": [
                req(
                    "POST /api/users/:id/follow",
                    "POST",
                    "api/users/:id/follow",
                    "Follow another user. Cannot follow yourself.",
                    201,
                    '{\n  "following": true\n}',
                    auth=True,
                    path_vars=[{"key": "id", "value": "2", "description": "User ID to follow (example)"}],
                ),
                req(
                    "DELETE /api/users/:id/follow",
                    "DELETE",
                    "api/users/:id/follow",
                    "Unfollow a user.",
                    200,
                    '{\n  "following": false\n}',
                    auth=True,
                    path_vars=[{"key": "id", "value": "2", "description": "User ID to unfollow (example)"}],
                ),
                req(
                    "GET /api/users/:id/followers",
                    "GET",
                    "api/users/:id/followers",
                    "List users who follow this user.",
                    200,
                    '[\n  {\n    "id": "2",\n    "username": "bob",\n    "name": "Bob",\n    "avatarUrl": null\n  }\n]',
                    path_vars=[{"key": "id", "value": "{{userId}}", "description": "User ID"}],
                    query=[
                        {"key": "limit", "value": "20", "description": "Max 100"},
                        {"key": "offset", "value": "0", "description": "Pagination offset"},
                    ],
                ),
                req(
                    "GET /api/users/:id/following",
                    "GET",
                    "api/users/:id/following",
                    "List users this user follows.",
                    200,
                    '[\n  {\n    "id": "2",\n    "username": "bob",\n    "name": "Bob",\n    "avatarUrl": null\n  }\n]',
                    path_vars=[{"key": "id", "value": "{{userId}}", "description": "User ID"}],
                    query=[
                        {"key": "limit", "value": "20", "description": "Max 100"},
                        {"key": "offset", "value": "0", "description": "Pagination offset"},
                    ],
                ),
                req(
                    "GET /api/users/:id/counts",
                    "GET",
                    "api/users/:id/counts",
                    "Follower and following counts for a user.",
                    200,
                    '{\n  "followers": 10,\n  "following": 5\n}',
                    path_vars=[{"key": "id", "value": "{{userId}}", "description": "User ID"}],
                ),
            ],
        },
        {
            "name": "Notifications",
            "item": [
                req(
                    "GET /api/notifications",
                    "GET",
                    "api/notifications",
                    "List notifications for the authenticated user. Follow/like events are created automatically.",
                    200,
                    '[\n  {\n    "id": "1",\n    "recipientId": "1",\n    "actorId": "2",\n    "type": "like",\n    "entityId": "5",\n    "readAt": null,\n    "createdAt": "2026-07-11T15:00:00.000Z"\n  }\n]',
                    query=[
                        {"key": "unread", "value": "true", "description": "Filter unread only", "disabled": True},
                        {"key": "limit", "value": "20", "description": "Max 100"},
                        {"key": "offset", "value": "0", "description": "Pagination offset"},
                    ],
                    auth=True,
                ),
                req(
                    "GET /api/notifications/unread-count",
                    "GET",
                    "api/notifications/unread-count",
                    "Count unread notifications for the acting user.",
                    200,
                    '{\n  "unread": 3\n}',
                    auth=True,
                ),
                req(
                    "POST /api/notifications/read-all",
                    "POST",
                    "api/notifications/read-all",
                    "Mark all notifications as read for the acting user.",
                    200,
                    '{\n  "updated": 3\n}',
                    auth=True,
                ),
                req(
                    "POST /api/notifications/:id/read",
                    "POST",
                    "api/notifications/:id/read",
                    "Mark a single notification as read.",
                    200,
                    '{\n  "id": "1",\n  "recipientId": "1",\n  "actorId": "2",\n  "type": "like",\n  "entityId": "5",\n  "readAt": "2026-07-11T15:00:00.000Z",\n  "createdAt": "2026-07-11T14:00:00.000Z"\n}',
                    auth=True,
                    path_vars=[{"key": "id", "value": "{{notificationId}}", "description": "Notification ID"}],
                ),
            ],
        },
        {
            "name": "Search",
            "item": [
                req(
                    "GET /api/search",
                    "GET",
                    "api/search",
                    "Search users and posts. Query must be at least 2 characters.",
                    200,
                    '{\n  "users": [\n    {\n      "kind": "user",\n      "id": "1",\n      "username": "alice",\n      "name": "Alice",\n      "avatarUrl": null\n    }\n  ],\n  "posts": [\n    {\n      "kind": "post",\n      "id": "1",\n      "authorId": "1",\n      "body": "hello world",\n      "createdAt": "2026-07-11T15:00:00.000Z"\n    }\n  ]\n}',
                    query=[
                        {"key": "q", "value": "alice", "description": "Search query (min 2 chars, max 100)"},
                        {"key": "limit", "value": "20", "description": "Max 50"},
                    ],
                ),
                req(
                    "GET /api/search/users",
                    "GET",
                    "api/search/users",
                    "Search users by username or name (trigram similarity).",
                    200,
                    '[\n  {\n    "kind": "user",\n    "id": "1",\n    "username": "alice",\n    "name": "Alice",\n    "avatarUrl": null\n  }\n]',
                    query=[
                        {"key": "q", "value": "alice", "description": "Search query (min 2 chars)"},
                        {"key": "limit", "value": "20", "description": "Max 50"},
                    ],
                ),
                req(
                    "GET /api/search/posts",
                    "GET",
                    "api/search/posts",
                    "Full-text search over post bodies.",
                    200,
                    '[\n  {\n    "kind": "post",\n    "id": "1",\n    "authorId": "1",\n    "body": "hello world",\n    "createdAt": "2026-07-11T15:00:00.000Z"\n  }\n]',
                    query=[
                        {"key": "q", "value": "hello", "description": "Search query (min 2 chars)"},
                        {"key": "limit", "value": "20", "description": "Max 50"},
                    ],
                ),
            ],
        },
        {
            "name": "Analytics",
            "item": [
                req(
                    "POST /api/analytics/events",
                    "POST",
                    "api/analytics/events",
                    'Track an analytics event. eventType must be a dotted slug like "post.view".',
                    201,
                    '{\n  "id": "1",\n  "userId": "1",\n  "eventType": "post.view",\n  "entityId": "5",\n  "metadata": {"source": "feed"},\n  "createdAt": "2026-07-11T15:00:00.000Z"\n}',
                    body_raw='{\n  "userId": "1",\n  "eventType": "post.view",\n  "entityId": "5",\n  "metadata": {"source": "feed"}\n}',
                ),
                req(
                    "GET /api/analytics/overview",
                    "GET",
                    "api/analytics/overview",
                    "Platform-wide totals: users, posts, follows, likes.",
                    200,
                    '{\n  "totalUsers": 100,\n  "totalPosts": 250,\n  "totalFollows": 80,\n  "totalLikes": 420\n}',
                ),
                req(
                    "GET /api/analytics/timeseries",
                    "GET",
                    "api/analytics/timeseries",
                    "Daily event counts for a given event type.",
                    200,
                    '[\n  {"day": "2026-07-10", "count": 12},\n  {"day": "2026-07-11", "count": 8}\n]',
                    query=[
                        {"key": "eventType", "value": "post.view", "description": "Dotted slug event type"},
                        {"key": "days", "value": "7", "description": "Lookback days (1-365, default 7)"},
                    ],
                ),
                req(
                    "GET /api/analytics/top-authors",
                    "GET",
                    "api/analytics/top-authors",
                    "Top authors ranked by total likes received.",
                    200,
                    '[\n  {"authorId": "1", "posts": 10, "likes": 55}\n]',
                    query=[
                        {"key": "limit", "value": "10", "description": "Max 100, default 10"},
                    ],
                ),
            ],
        },
    ],
}

out = "/Users/soumiksarkar/Documents/codeing/Projects/backend-distributed-system-practices/postman/backend-distributed-system-practices.postman_collection.json"
with open(out, "w", encoding="utf-8") as f:
    json.dump(collection, f, indent=2)
    f.write("\n")
print(f"Wrote {out}")
