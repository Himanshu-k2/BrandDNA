import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { connectDB, closeDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import Brand from '../src/models/Brand.js';
import GuidelineDocument from '../src/models/GuidelineDocument.js';

describe('Strix Penetration Testing & AppSec Verification Suite', () => {
  let server;
  let baseUrl;

  before(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'strix-test-jwt-secret-secure-32chars-min!';
    process.env.ADMIN_INVITE_SECRET = 'strix-admin-secret-2026!';
    await connectDB();
    await User.deleteMany({});
    await Brand.deleteMany({});
    await GuidelineDocument.deleteMany({});

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
    await closeDB();
  });

  test('1. Privilege Escalation Defense: Email containing "admin" or "brandmanager" cannot escalate to admin', async () => {
    // Bootstrap initial admin
    await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'System Admin',
        email: 'root@platform.test',
        password: 'Password123!',
      }),
    });

    // Attacker tries to register with admin in email
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Attacker User',
        email: 'evil-admin@attacker.com',
        password: 'Password123!',
      }),
    });

    const data = await res.json();
    assert.equal(res.status, 201);
    assert.equal(data.data.user.role, 'creator', 'Must assign default creator role regardless of email substring');
  });

  test('2. Privilege Escalation Defense: Explicit role="admin" without valid secret is rejected with 403', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Attacker User',
        email: 'attacker-role@attacker.com',
        password: 'Password123!',
        role: 'admin',
      }),
    });

    const data = await res.json();
    assert.equal(res.status, 403);
    assert.match(data.message, /Privilege escalation rejected/i);
  });

  test('3. Multi-Tenant Isolation: New organization does not leak brands from other tenants', async () => {
    // Org A user
    const resA = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Tenant A Admin',
        email: 'admin@tenanta.com',
        password: 'Password123!',
        role: 'admin',
        adminSecretKey: 'strix-admin-secret-2026!',
      }),
    });
    const dataA = await resA.json();
    const tokenA = dataA.data.token;
    const orgAId = dataA.data.user.organizationId;

    // Create custom brand for Org A
    await fetch(`${baseUrl}/api/brands`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        name: 'ConfidentialBrandA',
        description: 'Secret Brand of Tenant A',
        tone: 'Bold',
      }),
    });

    // Org B user
    const resB = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Tenant B User',
        email: 'user@tenantb.com',
        password: 'Password123!',
      }),
    });
    const dataB = await resB.json();
    const tokenB = dataB.data.token;

    // Org B queries brands
    const brandsB = await fetch(`${baseUrl}/api/brands`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const brandsDataB = await brandsB.json();

    assert.equal(brandsB.status, 200);
    const leakedBrands = brandsDataB.data.filter(b => b.organizationId && b.organizationId === orgAId);
    assert.equal(leakedBrands.length, 0, 'Must not return brands from other tenant organizations');
  });

  test('4. BOLA / IDOR Defense: Cross-tenant brand guideline documents access is blocked with 403', async () => {
    // Create doc in Org A
    const resA = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Admin A',
        email: 'admin-doc@tenanta.com',
        password: 'Password123!',
        role: 'admin',
        adminSecretKey: 'strix-admin-secret-2026!',
      }),
    });
    const dataA = await resA.json();
    const tokenA = dataA.data.token;
    const orgAId = dataA.data.user.organizationId;

    const brandA = await Brand.create({
      name: 'SecretBrandA',
      organizationId: orgAId,
      createdBy: dataA.data.user.id,
    });

    const docA = await GuidelineDocument.create({
      brandId: brandA._id,
      organizationId: orgAId,
      filename: 'confidential_rules.pdf',
      originalName: 'confidential_rules.pdf',
      fileSize: 1024,
      fileType: 'application/pdf',
      pageCount: 1,
      rawText: 'CONFIDENTIAL PRICING: $49/mo',
      extractedItems: [],
      uploadedBy: dataA.data.user.id,
      status: 'in_review',
    });

    // Tenant B registers
    const resB = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Attacker B',
        email: 'attacker-doc@tenantb.com',
        password: 'Password123!',
      }),
    });
    const dataB = await resB.json();
    const tokenB = dataB.data.token;

    // Attacker B attempts to fetch Org A's brand documents
    const listAttempt = await fetch(`${baseUrl}/api/brands/${brandA._id}/documents`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.equal(listAttempt.status, 403);

    // Attacker B attempts to read doc directly by ID
    const singleAttempt = await fetch(`${baseUrl}/api/brands/${brandA._id}/documents/${docA._id}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.equal(singleAttempt.status, 403);
  });

  test('5. Function-Level Authorization: Creator role cannot upload brand guideline documents', async () => {
    const resCreator = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Creator Role Only',
        email: 'creator-deny@example.com',
        password: 'Password123!',
      }),
    });
    const data = await resCreator.json();
    const token = data.data.token;
    const orgId = data.data.user.organizationId;

    const testBrand = await Brand.create({
      name: 'CreatorBrandTest',
      organizationId: orgId,
      createdBy: data.data.user.id,
    });

    const uploadAttempt = await fetch(`${baseUrl}/api/brands/${testBrand._id}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ rawText: 'Attempting upload' }),
    });

    const uploadData = await uploadAttempt.json();
    assert.equal(uploadAttempt.status, 403);
    assert.match(uploadData.message, /not permitted to perform this action/i);
  });

  test('6. Information Disclosure Defense: /api/health does not leak internal database host or name', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.database.host, undefined, 'Host must be omitted');
    assert.equal(data.database.name, undefined, 'Database name must be omitted');
    assert.equal(data.database.isConnected, true);
  });
});
