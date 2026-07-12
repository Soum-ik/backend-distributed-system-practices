/**
 * Simple autocannon load test runner.
 *
 *   bun run load-test:setup
 *   bun run load-test
 *   bun run load-test:average
 *   bun run load-test:peak
 *   bun run load-test -- --dry-run
 *   bun run load-test -- --scenario=peak --duration=60
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ENDPOINTS, LOAD_TEST, SLO, type Endpoint, type Fixtures } from './config.ts';

const here = dirname(fileURLToPath(import.meta.url));
const fixturesFile = join(here, 'fixtures.json');
const autocannonBin = join(process.cwd(), 'node_modules', '.bin', 'autocannon');

const scenario = readArg('scenario', 'both');
const durationSec = Number(readArg('duration', String(LOAD_TEST.durationSec)));
const dryRun = Bun.argv.includes('--dry-run');

interface Job {
  endpoint: Endpoint;
  url: string;
  rps: number;
  token?: string;
}

function readArg(name: string, fallback: string) {
  return Bun.argv.find((arg) => arg.startsWith(`--${name}=`))?.split('=')[1] ?? fallback;
}

async function loadFixtures() {
  if (!existsSync(fixturesFile)) {
    console.error('Missing scripts/load-test/fixtures.json. Run: bun run load-test:setup');
    process.exit(1);
  }

  return JSON.parse(await Bun.file(fixturesFile).text()) as Fixtures;
}

function makeScenarios() {
  if (scenario === 'average') return [{ name: 'average', rps: LOAD_TEST.avgRps }];
  if (scenario === 'peak') return [{ name: 'peak', rps: LOAD_TEST.peakRps }];
  if (scenario === 'both') {
    return [
      { name: 'average', rps: LOAD_TEST.avgRps },
      { name: 'peak', rps: LOAD_TEST.peakRps },
    ];
  }

  console.error(`Unknown scenario "${scenario}". Use: average, peak, both`);
  process.exit(1);
}

function buildJobs(totalRps: number, fixtures: Fixtures) {
  return ENDPOINTS.map((endpoint, index) => ({
    endpoint,
    url: fixtures.baseUrl + fillPath(endpoint.path, fixtures),
    rps: rpsForEndpoint(endpoint, totalRps),
    token: endpoint.needsAuth
      ? fixtures.users[index % fixtures.users.length]!.token
      : undefined,
  }));
}

function rpsForEndpoint(endpoint: Endpoint, totalRps: number) {
  const trafficRps = endpoint.kind === 'read'
    ? totalRps * LOAD_TEST.readRatio
    : totalRps * (1 - LOAD_TEST.readRatio);

  const totalWeight = ENDPOINTS
    .filter((item) => item.kind === endpoint.kind)
    .reduce((sum, item) => sum + item.weight, 0);

  return Math.max(1, Math.round((trafficRps * endpoint.weight) / totalWeight));
}

function fillPath(path: string, fixtures: Fixtures) {
  const user = fixtures.users[0]!;
  const otherUser = fixtures.users[1] ?? user;
  const postId = fixtures.postIds[0]!;
  const searchTerm = encodeURIComponent(fixtures.searchTerms[0]!);

  return path
    .replace(':userId', user.id)
    .replace(':otherUserId', otherUser.id)
    .replace(':postId', postId)
    .replace(':username', user.username)
    .replace(':searchTerm', searchTerm);
}

function autocannonArgs(job: Job) {
  const { endpoint, url, rps } = job;
  const connections = Math.max(10, Math.ceil(rps / 2));
  const args = [
    '-c', String(connections),
    '-R', String(rps),
    '-d', String(durationSec),
    '-m', endpoint.method,
    '--renderStatusCodes',
    '--latency',
  ];

  if (job.token) args.push('-H', `authorization=Bearer ${job.token}`);
  if (endpoint.body) args.push('-H', 'content-type: application/json', '-b', endpoint.body);

  args.push(url);
  return args;
}

function printCommand(job: Job) {
  const command = [autocannonBin, ...autocannonArgs(job)]
    .map((part) => (part.includes(' ') ? `'${part}'` : part))
    .join(' ');

  console.log(`# ${job.endpoint.name}: ${job.rps} RPS, p95 target ${SLO[job.endpoint.group].p95}ms`);
  console.log(`${command}\n`);
}

function runJob(job: Job) {
  return new Promise<void>((resolve, reject) => {
    console.log(`\n${job.endpoint.name}: ${job.endpoint.method} ${job.rps} RPS`);
    console.log(job.url);

    const child = spawn(autocannonBin, autocannonArgs(job), { stdio: 'inherit' });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${job.endpoint.name} failed with exit code ${code}`));
    });
  });
}

async function runScenario(name: string, totalRps: number, fixtures: Fixtures) {
  const jobs = buildJobs(totalRps, fixtures);
  const actualRps = jobs.reduce((sum, job) => sum + job.rps, 0);

  console.log('\n' + '='.repeat(60));
  console.log(`${name}: target ${totalRps} RPS, actual ${actualRps} RPS, duration ${durationSec}s`);
  console.log(`Traffic mix: ${Math.round(LOAD_TEST.readRatio * 100)}% reads, ${Math.round((1 - LOAD_TEST.readRatio) * 100)}% writes`);

  if (dryRun) {
    jobs.forEach(printCommand);
    return;
  }

  await Promise.all(jobs.map(runJob));
}

async function main() {
  if (!existsSync(autocannonBin)) {
    console.error('autocannon is not installed. Run: bun install');
    process.exit(1);
  }

  const fixtures = await loadFixtures();
  console.log(`Fixtures: ${fixtures.users.length} users, ${fixtures.postIds.length} posts`);

  for (const item of makeScenarios()) {
    await runScenario(item.name, item.rps, fixtures);
  }

  console.log(dryRun ? 'Dry run complete.' : 'Load test complete. Check autocannon p95 latency against scripts/load-test/config.ts.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
