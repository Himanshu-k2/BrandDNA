import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';

describe('Brad AI Conversational Chat Tests', () => {
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

  test('POST /api/chat/brad rejects request without message', async () => {
    const res = await fetch(`${baseUrl}/api/chat/brad`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
  });

  test('POST /api/chat/brad answers walkthrough request for brand manager', async () => {
    const res = await fetch(`${baseUrl}/api/chat/brad`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'I am new to this platform, please give me a walkthrough',
        context: {
          role: 'brand_manager',
          personaName: 'Priya Kapoor',
          pathname: '/dashboard',
          workspaceId: 'novafit',
        },
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.reply);
    assert.ok(data.reply.text.includes('Brand Manager'));
    assert.ok(Array.isArray(data.reply.actions));
  });

  test('POST /api/chat/brad explains how to collaborate or message another persona', async () => {
    const res = await fetch(`${baseUrl}/api/chat/brad`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'How can I message the brand manager?',
        context: {
          role: 'creator',
          personaName: 'Alex Rivera',
          pathname: '/reviews/new',
          workspaceId: 'novafit',
        },
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.reply.text.includes('Priya Kapoor'));
  });

  test('POST /api/chat/brad answers brand color queries with verified hex specs', async () => {
    const res = await fetch(`${baseUrl}/api/chat/brad`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What are the approved brand colors and hex values for NovaFit?',
        context: {
          role: 'creator',
          workspaceId: 'novafit',
        },
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.reply.text.includes('#FF4500'));
    assert.ok(data.reply.text.includes('#39FF14'));
  });
});

