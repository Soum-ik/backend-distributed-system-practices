import { test, expect } from 'bun:test';
import { healthService } from './health.service.ts';

test('health check returns ok status', () => {
  const result = healthService.check();
  expect(result.status).toBe('ok');
  expect(result.uptimeSeconds).toBeGreaterThanOrEqual(0);
  expect(typeof result.timestamp).toBe('string');
});
