import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';

describe('Phase 1: Foundation & Health Check Tests', () => {
  let server;
  let baseUrl;

  before(async () => {
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', resolve);
    });
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test('GET / should return welcome message and docs link', async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(typeof data.message, 'string');
    assert.equal(data.docs, '/api/health');
  });

  test('GET /api/health should return 200 and healthy status structure', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.status, 'healthy');
    assert.equal(data.service, 'BrandDNA Backend API');
    assert.equal(data.version, '1.0.0');
    assert.ok(data.timestamp);
    assert.equal(typeof data.uptimeSeconds, 'number');
    assert.ok(data.database);
    assert.equal(typeof data.database.isConnected, 'boolean');
  });

  test('GET /api/nonexistent-route should return 404 with standardized JSON error', async () => {
    const res = await fetch(`${baseUrl}/api/nonexistent-route`);
    assert.equal(res.status, 404);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.message, /Not Found/);
  });
});
