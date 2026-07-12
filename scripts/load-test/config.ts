export const LOAD_TEST = {
  avgRps: 46,
  peakRps: 230,
  durationSec: 30,
  readRatio: 0.9,
} as const;

export const SLO = {
  cachedRead: { p95: 200 },
  uncachedRead: { p95: 400 },
  write: { p95: 300 },
} as const;

export type EndpointGroup = keyof typeof SLO;

export interface Endpoint {
  name: string;
  group: EndpointGroup;
  kind: 'read' | 'write';
  method: 'GET' | 'POST';
  path: string;
  needsAuth?: boolean;
  body?: string;
  weight: number;
}

export interface Fixtures {
  baseUrl: string;
  createdAt: string;
  users: { id: string; username: string; token: string }[];
  postIds: string[];
  searchTerms: string[];
}

export const ENDPOINTS: Endpoint[] = [
  { name: 'feed', group: 'uncachedRead', kind: 'read', method: 'GET', path: '/api/posts/feed', needsAuth: true, weight: 15 },
  { name: 'post-by-id', group: 'cachedRead', kind: 'read', method: 'GET', path: '/api/posts/:postId', weight: 4 },
  { name: 'user-by-id', group: 'cachedRead', kind: 'read', method: 'GET', path: '/api/users/:userId', weight: 3 },
  { name: 'user-by-username', group: 'cachedRead', kind: 'read', method: 'GET', path: '/api/users/username/:username', weight: 3 },
  { name: 'search', group: 'uncachedRead', kind: 'read', method: 'GET', path: '/api/search?q=:searchTerm', weight: 5 },
  { name: 'notifications', group: 'uncachedRead', kind: 'read', method: 'GET', path: '/api/notifications', needsAuth: true, weight: 4 },
  { name: 'unread-count', group: 'uncachedRead', kind: 'read', method: 'GET', path: '/api/notifications/unread-count', needsAuth: true, weight: 1 },
  { name: 'follow-counts', group: 'cachedRead', kind: 'read', method: 'GET', path: '/api/users/:userId/counts', weight: 1 },
  { name: 'health', group: 'cachedRead', kind: 'read', method: 'GET', path: '/api/health', weight: 1 },
  { name: 'auth-me', group: 'cachedRead', kind: 'read', method: 'GET', path: '/api/auth/me', needsAuth: true, weight: 1 },
  { name: 'create-post', group: 'write', kind: 'write', method: 'POST', path: '/api/posts', needsAuth: true, body: '{"body":"autocannon load test"}', weight: 2 },
  { name: 'like-post', group: 'write', kind: 'write', method: 'POST', path: '/api/posts/:postId/like', needsAuth: true, weight: 1 },
  { name: 'follow-user', group: 'write', kind: 'write', method: 'POST', path: '/api/users/:otherUserId/follow', needsAuth: true, weight: 1 },
];
