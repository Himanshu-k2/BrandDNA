import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Brand from '../src/models/Brand.js';
import BrandGuideline from '../src/models/BrandGuideline.js';
import ApprovedFact from '../src/models/ApprovedFact.js';
import TerminologyRule from '../src/models/TerminologyRule.js';
import { generateToken } from '../src/utils/jwt.js';
import { seedNovaFitData } from '../src/utils/seedNovaFit.js';

describe('Phase 3: Brand Management & Knowledge Base Tests', () => {
  let mongoServer;
  let server;
  let baseUrl;

  let adminUser;
  let creatorUser;
  let reviewerUser;
  let otherOrgUser;

  let adminToken;
  let creatorToken;
  let reviewerToken;
  let otherOrgToken;

  const orgA = new mongoose.Types.ObjectId();
  const orgB = new mongoose.Types.ObjectId();

  before(async () => {
    process.env.JWT_SECRET = 'test_jwt_secret_key_branddna_secure';
    process.env.JWT_EXPIRES_IN = '1h';

    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(uri);

    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', resolve);
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
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
    await Promise.all([
      User.deleteMany({}),
      Brand.deleteMany({}),
      BrandGuideline.deleteMany({}),
      ApprovedFact.deleteMany({}),
      TerminologyRule.deleteMany({}),
    ]);

    // Create test users
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@org-a.com',
      passwordHash: 'Password123!',
      role: 'admin',
      organizationId: orgA,
    });

    creatorUser = await User.create({
      name: 'Creator User',
      email: 'creator@org-a.com',
      passwordHash: 'Password123!',
      role: 'creator',
      organizationId: orgA,
    });

    reviewerUser = await User.create({
      name: 'Reviewer User',
      email: 'reviewer@org-a.com',
      passwordHash: 'Password123!',
      role: 'reviewer',
      organizationId: orgA,
    });

    otherOrgUser = await User.create({
      name: 'Other Org Admin',
      email: 'admin@org-b.com',
      passwordHash: 'Password123!',
      role: 'admin',
      organizationId: orgB,
    });

    adminToken = generateToken({ id: adminUser._id, role: 'admin', organizationId: orgA });
    creatorToken = generateToken({ id: creatorUser._id, role: 'creator', organizationId: orgA });
    reviewerToken = generateToken({ id: reviewerUser._id, role: 'reviewer', organizationId: orgA });
    otherOrgToken = generateToken({ id: otherOrgUser._id, role: 'admin', organizationId: orgB });
  });

  // ==========================================
  // 1. BRAND WORKSPACES
  // ==========================================
  test('1. Admin can create a brand workspace', async () => {
    const res = await fetch(`${baseUrl}/api/brands`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Acme Fitness',
        description: 'Global fitness & wellness brand',
        tone: 'Energetic and inspiring',
      }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.name, 'Acme Fitness');
    assert.equal(body.data.status, 'active');
  });

  test('2. Creator cannot create a brand workspace (Role restriction)', async () => {
    const res = await fetch(`${baseUrl}/api/brands`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creatorToken}`,
      },
      body: JSON.stringify({
        name: 'Unauthorized Brand',
      }),
    });

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.message, /Forbidden.*not permitted/i);
  });

  test('3. Rejects duplicate brand name in same organization', async () => {
    await Brand.create({
      name: 'Acme Fitness',
      organizationId: orgA,
      createdBy: adminUser._id,
    });

    const res = await fetch(`${baseUrl}/api/brands`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Acme Fitness',
      }),
    });

    assert.equal(res.status, 409);
    const body = await res.json();
    assert.match(body.message, /already exists in your workspace/i);
  });

  test('4. Prevents cross-organization brand access', async () => {
    const brandInOrgA = await Brand.create({
      name: 'Private Brand Org A',
      organizationId: orgA,
      createdBy: adminUser._id,
    });

    // Org B user attempts to retrieve Org A brand
    const res = await fetch(`${baseUrl}/api/brands/${brandInOrgA._id}`, {
      headers: { Authorization: `Bearer ${otherOrgToken}` },
    });

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.match(body.message, /permission to access brands from another organization/i);
  });

  test('5. Admin can update and soft-delete/archive a brand', async () => {
    const brand = await Brand.create({
      name: 'Brand To Update',
      organizationId: orgA,
      createdBy: adminUser._id,
    });

    // Update tone
    const patchRes = await fetch(`${baseUrl}/api/brands/${brand._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ tone: 'Warm and friendly' }),
    });

    assert.equal(patchRes.status, 200);
    const patchBody = await patchRes.json();
    assert.equal(patchBody.data.tone, 'Warm and friendly');

    // Soft delete / archive
    const delRes = await fetch(`${baseUrl}/api/brands/${brand._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert.equal(delRes.status, 200);
    const delBody = await delRes.json();
    assert.equal(delBody.data.status, 'archived');
  });

  // ==========================================
  // 2. BRAND GUIDELINES & VERSIONING
  // ==========================================
  test('6. Admin can add a guideline and Creator can read it', async () => {
    const brand = await Brand.create({
      name: 'NovaFit',
      organizationId: orgA,
      createdBy: adminUser._id,
    });

    // Admin creates guideline
    const postRes = await fetch(`${baseUrl}/api/brands/${brand._id}/guidelines`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Tone Rule',
        category: 'Tone of voice',
        ruleText: 'Always speak with empathy and encouragement.',
        severity: 'medium',
      }),
    });

    assert.equal(postRes.status, 201);
    const postBody = await postRes.json();
    assert.equal(postBody.data.version, 1);
    assert.equal(postBody.data.history.length, 0);

    // Creator reads guideline
    const getRes = await fetch(`${baseUrl}/api/brands/${brand._id}/guidelines`, {
      headers: { Authorization: `Bearer ${creatorToken}` },
    });

    assert.equal(getRes.status, 200);
    const getBody = await getRes.json();
    assert.equal(getBody.data.length, 1);
    assert.equal(getBody.data[0].title, 'Tone Rule');
  });

  test('7. Updating a guideline increments version and preserves previous history', async () => {
    const brand = await Brand.create({
      name: 'NovaFit',
      organizationId: orgA,
      createdBy: adminUser._id,
    });

    const guideline = await BrandGuideline.create({
      brandId: brand._id,
      organizationId: orgA,
      title: 'Original Title',
      category: 'Writing style',
      ruleText: 'Initial rule text content v1',
      severity: 'low',
      version: 1,
      createdBy: adminUser._id,
    });

    const patchRes = await fetch(`${baseUrl}/api/guidelines/${guideline._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        ruleText: 'Updated rule text content v2',
        severity: 'high',
      }),
    });

    assert.equal(patchRes.status, 200);
    const patchBody = await patchRes.json();
    assert.equal(patchBody.data.version, 2, 'Version should increment to 2');
    assert.equal(patchBody.data.history.length, 1, 'Previous version should be in history');
    assert.equal(patchBody.data.history[0].version, 1);
    assert.equal(patchBody.data.history[0].ruleText, 'Initial rule text content v1');
  });

  // ==========================================
  // 3. APPROVED FACTS
  // ==========================================
  test('8. Admin creates approved fact; Creator cannot create facts', async () => {
    const brand = await Brand.create({
      name: 'NovaFit',
      organizationId: orgA,
      createdBy: adminUser._id,
    });

    // Creator attempt
    const creatorRes = await fetch(`${baseUrl}/api/brands/${brand._id}/facts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creatorToken}`,
      },
      body: JSON.stringify({
        key: 'subscription_price',
        value: '₹999',
      }),
    });
    assert.equal(creatorRes.status, 403);

    // Admin attempt
    const adminRes = await fetch(`${baseUrl}/api/brands/${brand._id}/facts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        key: 'subscription_price',
        value: '₹999',
        category: 'pricing',
        sourceReference: 'Pricing Committee 2026',
      }),
    });

    assert.equal(adminRes.status, 201);
    const adminBody = await adminRes.json();
    assert.equal(adminBody.data.key, 'subscription_price');
    assert.equal(adminBody.data.value, '₹999');
    assert.equal(adminBody.data.verificationStatus, 'verified');
    assert.equal(adminBody.data.version, 1);
  });

  test('9. Updating approved fact preserves audit history', async () => {
    const brand = await Brand.create({
      name: 'NovaFit',
      organizationId: orgA,
      createdBy: adminUser._id,
    });

    const fact = await ApprovedFact.create({
      brandId: brand._id,
      organizationId: orgA,
      key: 'subscription_price',
      value: '₹899',
      category: 'pricing',
      sourceReference: 'Old Pricing Doc',
      version: 1,
      createdBy: adminUser._id,
    });

    const updateRes = await fetch(`${baseUrl}/api/facts/${fact._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        value: '₹999',
        sourceReference: 'New 2026 Board Memo',
      }),
    });

    assert.equal(updateRes.status, 200);
    const body = await updateRes.json();
    assert.equal(body.data.version, 2);
    assert.equal(body.data.value, '₹999');
    assert.equal(body.data.history.length, 1);
    assert.equal(body.data.history[0].value, '₹899');
  });

  // ==========================================
  // 4. TERMINOLOGY RULES
  // ==========================================
  test('10. Admin creates terminology rule; duplicate prohibited terms rejected', async () => {
    const brand = await Brand.create({
      name: 'NovaFit',
      organizationId: orgA,
      createdBy: adminUser._id,
    });

    const createRes = await fetch(`${baseUrl}/api/brands/${brand._id}/terminology`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        prohibitedTerm: 'users',
        preferredTerm: 'members',
        explanation: 'Always refer to customers as community members.',
      }),
    });

    assert.equal(createRes.status, 201);
    const body = await createRes.json();
    assert.equal(body.data.prohibitedTerm, 'users');
    assert.equal(body.data.preferredTerm, 'members');
    assert.equal(body.data.replacementSuggestion, 'members');

    // Duplicate check
    const dupRes = await fetch(`${baseUrl}/api/brands/${brand._id}/terminology`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        prohibitedTerm: 'users',
        preferredTerm: 'athletes',
      }),
    });

    assert.equal(dupRes.status, 409);
    const dupBody = await dupRes.json();
    assert.match(dupBody.message, /already exists/i);
  });

  // ==========================================
  // 5. NOVAFIT SEED UTILITY
  // ==========================================
  test('11. seedNovaFitData populates complete fictional brand, facts, and guidelines', async () => {
    const seedResult = await seedNovaFitData(orgA, adminUser._id);
    assert.ok(seedResult.brandId);
    assert.equal(seedResult.brandName, 'NovaFit');

    // Verify brand
    const brand = await Brand.findById(seedResult.brandId);
    assert.equal(brand.name, 'NovaFit');
    assert.equal(brand.tone, 'Professional and encouraging');

    // Verify facts
    const facts = await ApprovedFact.find({ brandId: brand._id, status: 'active' });
    assert.ok(facts.length >= 3);
    const priceFact = facts.find((f) => f.key === 'subscription_price');
    assert.equal(priceFact?.value, '₹999');

    // Verify terminology
    const termRules = await TerminologyRule.find({ brandId: brand._id, status: 'active' });
    assert.ok(termRules.length >= 1);
    const userRule = termRules.find((t) => t.prohibitedTerm === 'users');
    assert.equal(userRule?.preferredTerm, 'members');

    // Verify guidelines
    const guidelines = await BrandGuideline.find({ brandId: brand._id, status: 'active' });
    assert.ok(guidelines.length >= 4);
    const claimsGuideline = guidelines.find((g) => g.category === 'Claims and disclaimers');
    assert.match(claimsGuideline?.ruleText || '', /India's No\. 1 fitness app/);
  });
});
