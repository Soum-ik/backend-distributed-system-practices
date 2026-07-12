/**
 * Creates users, posts, and follows for the load test.
 *
 *   bun run load-test:setup
 */
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Fixtures } from './config.ts';

const here = dirname(fileURLToPath(import.meta.url));
const fixturesFile = join(here, 'fixtures.json');
const baseUrl = readArg('base-url', Bun.env.LOAD_TEST_BASE_URL ?? 'http://localhost:3000');

function readArg(name: string, fallback: string) {
  return Bun.argv.find((arg) => arg.startsWith(`--${name}=`))?.split('=')[1] ?? fallback;
}

async function api<T>(method: string, path: string, options: { token?: string; body?: unknown } = {}) {
  const headers: Record<string, string> = {};
  if (options.token) headers.authorization = `Bearer ${options.token}`;
  if (options.body) headers['content-type'] = 'application/json';

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`${method} ${path} failed: ${response.status} ${await response.text()}`);
  }

  return response.json() as Promise<T>;
}

async function checkServer() {
  try {
    const response = await fetch(`${baseUrl}/api/health`, { signal: AbortSignal.timeout(3000) });
    if (!response.ok) throw new Error(String(response.status));
  } catch {
    console.error(`Server is not reachable at ${baseUrl}. Start it with: bun run start`);
    process.exit(1);
  }
}

async function createUser(index: number, runId: string) {
  const username = `load_${runId}_${index}`;
  const password = 'password123';

  await api('POST', '/api/auth/register', {
    body: {
      email: `${username}@loadtest.local`,
      username,
      password,
      name: `Load Test ${index}`,
    },
  });

  const login = await api<{ user: { id: string; username: string }; token: string }>('POST', '/api/auth/login', {
    body: { login: username, password },
  });

  const post = await api<{ id: string }>('POST', '/api/posts', {
    token: login.token,
    body: { body: `Load test post ${index} hello world` },
  });

  return {
    user: {
      id: login.user.id,
      username: login.user.username,
      token: login.token,
    },
    postId: post.id,
  };
}

async function createFollows(users: Fixtures['users']) {
  for (let i = 0; i < users.length; i++) {
    const follower = users[i]!;
    const followee = users[(i + 1) % users.length]!;
    await api('POST', `/api/users/${followee.id}/follow`, { token: follower.token });
  }
}

async function main() {
  await checkServer();

  const users: Fixtures['users'] = [];
  const postIds: string[] = [];
  const runId = Date.now().toString(36);

  console.log(`Creating load-test fixtures at ${baseUrl}...`);

  for (let i = 0; i < 20; i++) {
    const result = await createUser(i, runId);
    users.push(result.user);
    postIds.push(result.postId);
  }

  await createFollows(users);

  const fixtures: Fixtures = {
    baseUrl,
    createdAt: new Date().toISOString(),
    users,
    postIds,
    searchTerms: ['alice', 'hello', 'test', 'world', 'post'],
  };

  await mkdir(here, { recursive: true });
  await Bun.write(fixturesFile, JSON.stringify(fixtures, null, 2));

  console.log(`Wrote ${fixturesFile}`);
  console.log(`Users: ${users.length}`);
  console.log(`Posts: ${postIds.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
