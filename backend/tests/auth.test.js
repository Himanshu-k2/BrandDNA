import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import User from '../src/models/User.js';

describe('Phase 2: Authentication & Authorization Tests', () => {
  let mongoServer;
  let server;
  let baseUrl;

  const ADMIN_SECRET = 'test_admin_secret_999';

  before(async () => {
    process.env.JWT_SECRET = 'test_jwt_secret_key_branddna_secure';
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.ADMIN_INVITE_SECRET = ADMIN_SECRET;

    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    // Disconnect if previously connected, then connect to in-memory DB
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(uri);

    // Start Express server on random port
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
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    // Clear users collection before each test
    await User.deleteMany({});
  });

  test('1. Successful user registration (initial user becomes admin)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Initial Admin',
        email: 'admin@branddna.ai',
        password: 'Password123!',
      }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.user.role, 'admin'); // Initial bootstrap user
    assert.equal(body.data.user.email, 'admin@branddna.ai');
    assert.equal(body.data.user.name, 'Initial Admin');
    assert.equal(body.data.user.passwordHash, undefined, 'Password hash must never be returned');
    assert.ok(body.data.user.organizationId);
    assert.ok(body.data.token, 'Must return JWT token');
  });

  test('2. Second user registers as creator by default', async () => {
    // Create initial admin
    await User.create({
      name: 'Admin',
      email: 'admin@branddna.ai',
      passwordHash: 'Password123!',
      role: 'admin',
      organizationId: new mongoose.Types.ObjectId(),
    });

    // Public user registers
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Regular Creator',
        email: 'creator@branddna.ai',
        password: 'Password123!',
      }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.data.user.role, 'creator');
  });

  test('3. Rejects duplicate email registration with 409 Conflict', async () => {
    await User.create({
      name: 'Existing User',
      email: 'duplicate@branddna.ai',
      passwordHash: 'Password123!',
      role: 'creator',
      organizationId: new mongoose.Types.ObjectId(),
    });

    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate User',
        email: 'duplicate@branddna.ai',
        password: 'Password123!',
      }),
    });

    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.message, /already exists/i);
  });

  test('4. Rejects registration with invalid data (Zod validation)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'A', // too short
        email: 'not-an-email',
        password: 'short', // less than 8 chars, no numbers
      }),
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.errors.length >= 2);
  });

  test('5. Blocks unauthorized privilege escalation to admin role', async () => {
    await User.create({
      name: 'Existing User',
      email: 'first@branddna.ai',
      passwordHash: 'Password123!',
      role: 'admin',
      organizationId: new mongoose.Types.ObjectId(),
    });

    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Hacker User',
        email: 'hacker@branddna.ai',
        password: 'Password123!',
        role: 'admin', // Attempt to escalate without secret key
      }),
    });

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.message, /privilege escalation rejected/i);
  });

  test('6. Allows privileged admin registration when valid secret key is provided', async () => {
    await User.create({
      name: 'Existing User',
      email: 'first@branddna.ai',
      passwordHash: 'Password123!',
      role: 'admin',
      organizationId: new mongoose.Types.ObjectId(),
    });

    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Authorized Admin',
        email: 'newadmin@branddna.ai',
        password: 'Password123!',
        role: 'admin',
        adminSecretKey: ADMIN_SECRET,
      }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.data.user.role, 'admin');
  });

  test('7. Successful login with correct credentials', async () => {
    // Register user first
    await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Login Tester',
        email: 'login@branddna.ai',
        password: 'SecurePassword123!',
      }),
    });

    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'login@branddna.ai',
        password: 'SecurePassword123!',
      }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.user.email, 'login@branddna.ai');
    assert.equal(body.data.user.passwordHash, undefined);
    assert.ok(body.data.token);
  });

  test('8. Rejects login with incorrect password', async () => {
    await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Login Tester',
        email: 'wrongpass@branddna.ai',
        password: 'CorrectPassword123!',
      }),
    });

    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'wrongpass@branddna.ai',
        password: 'IncorrectPassword999!',
      }),
    });

    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.message, /invalid email or password/i);
  });

  test('9. Rejects login for non-existent email', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nobody@branddna.ai',
        password: 'AnyPassword123!',
      }),
    });

    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.message, /invalid email or password/i);
  });

  test('10. GET /api/auth/me returns profile when authenticated', async () => {
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Profile Tester',
        email: 'me@branddna.ai',
        password: 'Password123!',
      }),
    });
    const { data } = await regRes.json();
    const token = data.token;

    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.equal(meRes.status, 200);
    const meBody = await meRes.json();
    assert.equal(meBody.success, true);
    assert.equal(meBody.data.user.email, 'me@branddna.ai');
    assert.equal(meBody.data.user.name, 'Profile Tester');
  });

  test('11. Rejects access to protected route when token is missing', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.message, /no authentication token provided/i);
  });

  test('12. Rejects access to protected route with invalid/tampered token', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: 'Bearer invalid.fake.token' },
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.message, /invalid authentication token/i);
  });

  test('13. Role-based restriction: Creator is forbidden from Admin-only endpoint', async () => {
    // Seed admin so next user is creator
    await User.create({
      name: 'Admin',
      email: 'admin1@branddna.ai',
      passwordHash: 'Password123!',
      role: 'admin',
      organizationId: new mongoose.Types.ObjectId(),
    });

    // Register creator
    const creatorRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Creator User',
        email: 'creator1@branddna.ai',
        password: 'Password123!',
      }),
    });
    const { data: creatorData } = await creatorRes.json();

    const res = await fetch(`${baseUrl}/api/test-admin-only`, {
      headers: { Authorization: `Bearer ${creatorData.token}` },
    });

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.message, /Forbidden.*not permitted/i);
  });

  test('14. Role-based authorization: Admin can access Admin-only endpoint', async () => {
    // First user is admin
    const adminRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Admin User',
        email: 'admin2@branddna.ai',
        password: 'Password123!',
      }),
    });
    const { data: adminData } = await adminRes.json();

    const res = await fetch(`${baseUrl}/api/test-admin-only`, {
      headers: { Authorization: `Bearer ${adminData.token}` },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.message, 'Welcome Admin');
  });

  test('15. Organization isolation: Blocks access to another organization resources', async () => {
    const orgA = new mongoose.Types.ObjectId();
    const orgB = new mongoose.Types.ObjectId();

    const userInOrgA = await User.create({
      name: 'Org A User',
      email: 'orga@branddna.ai',
      passwordHash: 'Password123!',
      role: 'creator',
      organizationId: orgA,
    });

    // Login user
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'orga@branddna.ai',
        password: 'Password123!',
      }),
    });
    const { data } = await loginRes.json();

    // Try accessing Org B's resource
    const res = await fetch(`${baseUrl}/api/test-org-protected/${orgB.toString()}`, {
      headers: { Authorization: `Bearer ${data.token}` },
    });

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.message, /permission to access resources in another organization/i);
  });
});
