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
import ContentReview from '../src/models/ContentReview.js';
import { generateToken } from '../src/utils/jwt.js';
import { runDeterministicChecks } from '../src/services/ruleCheckService.js';
import { combineAndDeduplicateFindings } from '../src/services/reviewService.js';
import { seedNovaFitData } from '../src/utils/seedNovaFit.js';

describe('Phase 4: AI & Deterministic Content Review Engine Tests', () => {
  let mongoServer;
  let server;
  let baseUrl;

  let adminUser;
  let creatorUser;
  let otherOrgUser;

  let adminToken;
  let creatorToken;
  let otherOrgToken;

  let novaFitBrandId;
  const orgA = new mongoose.Types.ObjectId();
  const orgB = new mongoose.Types.ObjectId();

  before(async () => {
    process.env.JWT_SECRET = 'test_jwt_secret_key_branddna_secure';
    process.env.JWT_EXPIRES_IN = '1h';
    // Ensure test environment uses deterministic fallback safely without live Gemini calls
    delete process.env.GEMINI_API_KEY;

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
      ContentReview.deleteMany({}),
    ]);

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

    otherOrgUser = await User.create({
      name: 'Other Org User',
      email: 'user@org-b.com',
      passwordHash: 'Password123!',
      role: 'creator',
      organizationId: orgB,
    });

    adminToken = generateToken({ id: adminUser._id, role: 'admin', organizationId: orgA });
    creatorToken = generateToken({ id: creatorUser._id, role: 'creator', organizationId: orgA });
    otherOrgToken = generateToken({ id: otherOrgUser._id, role: 'creator', organizationId: orgB });

    // Seed NovaFit brand knowledge in orgA
    const seed = await seedNovaFitData(orgA, adminUser._id);
    novaFitBrandId = seed.brandId.toString();
  });

  // ==========================================
  // 1. DETERMINISTIC RULE CHECK TESTS
  // ==========================================
  test('1. Deterministic checker flags prohibited terminology ("users" -> "members")', () => {
    const context = {
      terminologyRules: [
        {
          _id: new mongoose.Types.ObjectId(),
          status: 'active',
          prohibitedTerm: 'users',
          preferredTerm: 'members',
          replacementSuggestion: 'members',
          explanation: 'Refer to customers as members.',
          caseSensitive: false,
        },
      ],
      facts: [],
      guidelines: [],
    };

    const text = 'Welcome new users to our community!';
    const findings = runDeterministicChecks(text, context);

    assert.equal(findings.length, 1);
    assert.equal(findings[0].type, 'terminology_violation');
    assert.equal(findings[0].problematicText, 'users');
    assert.equal(findings[0].suggestedCorrection, 'members');
    assert.equal(findings[0].sourceType, 'terminology_rule');
  });

  test('2. Deterministic checker flags incorrect price (₹799 vs approved ₹999)', () => {
    const context = {
      terminologyRules: [],
      facts: [
        {
          _id: new mongoose.Types.ObjectId(),
          status: 'active',
          category: 'pricing',
          key: 'subscription_price',
          value: '₹999',
        },
      ],
      guidelines: [],
    };

    const text = 'Get our premium subscription for just ₹799 today!';
    const findings = runDeterministicChecks(text, context);

    assert.equal(findings.length, 1);
    assert.equal(findings[0].type, 'incorrect_price');
    assert.match(findings[0].problematicText, /799/);
    assert.equal(findings[0].severity, 'high');
    assert.equal(findings[0].sourceType, 'approved_fact');
  });

  test('3. Deterministic checker handles valid price without false positives', () => {
    const context = {
      terminologyRules: [],
      facts: [
        {
          _id: new mongoose.Types.ObjectId(),
          status: 'active',
          category: 'pricing',
          key: 'subscription_price',
          value: '₹999',
        },
      ],
      guidelines: [],
    };

    const text = 'NovaFit Premium is available for ₹999 per month.';
    const findings = runDeterministicChecks(text, context);

    assert.equal(findings.length, 0, 'Should not flag approved price');
  });

  // ==========================================
  // 2. DEDUPLICATION & MERGING TESTS
  // ==========================================
  test('4. Merges deterministic and AI findings while giving precedence to deterministic facts', () => {
    const detFindings = [
      {
        type: 'incorrect_price',
        severity: 'high',
        problematicText: '₹799',
        explanation: 'Price conflicts with approved price ₹999.',
        suggestedCorrection: 'Use ₹999.',
        sourceType: 'approved_fact',
        sourceId: 'fact-123',
        confidence: 'high',
      },
    ];

    const aiFindings = [
      // Duplicate of price finding
      {
        type: 'incorrect_price',
        severity: 'medium',
        problematicText: '₹799',
        explanation: 'AI detected price mismatch.',
        suggestedCorrection: 'Change to 999.',
        sourceType: 'ai_analysis',
        confidence: 'medium',
      },
      // Unique finding: unsupported claim
      {
        type: 'unsupported_claim',
        severity: 'high',
        problematicText: "India's No. 1 fitness app",
        explanation: 'Superlative ranking requires verified third-party audit citation.',
        suggestedCorrection: 'Qualify or remove the unverified claim.',
        sourceType: 'brand_guideline',
        confidence: 'high',
      },
    ];

    const combined = combineAndDeduplicateFindings(detFindings, aiFindings);

    assert.equal(combined.length, 2, 'Should deduplicate price finding and keep unsupported claim');
    assert.equal(combined[0].sourceType, 'approved_fact', 'Deterministic fact takes precedence');
    assert.equal(combined[1].type, 'unsupported_claim');
  });

  // ==========================================
  // 3. POST /api/reviews ENDPOINT TESTS
  // ==========================================
  test('5. Creator successfully submits content for review (NovaFit demo example)', async () => {
    // NovaFit example content containing both prohibited term "users" and incorrect price "₹799"
    const sampleContent = "Hey users! India's No. 1 fitness app is available for just ₹799!";

    const res = await fetch(`${baseUrl}/api/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creatorToken}`,
      },
      body: JSON.stringify({
        brandId: novaFitBrandId,
        content: sampleContent,
        contentType: 'social_post',
      }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.reviewId);
    assert.equal(body.data.brandName, 'NovaFit');
    assert.equal(body.data.status, 'needs_changes');
    assert.ok(body.data.findings.length >= 2, 'Must catch terminology and price violations');

    // Check terminology finding
    const termFinding = body.data.findings.find((f) => f.type === 'terminology_violation');
    assert.ok(termFinding, 'Must identify "users" as prohibited');
    assert.equal(termFinding.suggestedCorrection, 'members');

    // Check pricing finding
    const priceFinding = body.data.findings.find((f) => f.type === 'incorrect_price');
    assert.ok(priceFinding, 'Must identify ₹799 price violation');
    assert.match(priceFinding.problematicText, /799/);

    // Check summary
    assert.ok(body.data.summary.totalFindings >= 2);
    assert.ok(body.data.summary.overallScore < 100);
  });

  test('6. Rejects review when brand belongs to another organization (Cross-tenant security)', async () => {
    const res = await fetch(`${baseUrl}/api/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${otherOrgToken}`, // Org B user
      },
      body: JSON.stringify({
        brandId: novaFitBrandId, // Org A brand
        content: 'Valid marketing text',
      }),
    });

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.message, /Forbidden.*another organization/i);
  });

  test('7. Rejects review when content is missing or empty', async () => {
    const res = await fetch(`${baseUrl}/api/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creatorToken}`,
      },
      body: JSON.stringify({
        brandId: novaFitBrandId,
        content: '   ', // whitespace only
      }),
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.message, /Validation failed/i);
  });

  test('8. Rejects unauthenticated review requests', async () => {
    const res = await fetch(`${baseUrl}/api/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brandId: novaFitBrandId,
        content: 'Some content',
      }),
    });

    assert.equal(res.status, 401);
  });

  // ==========================================
  // 4. RETRIEVING REVIEWS (GET /api/reviews)
  // ==========================================
  test('9. Lists reviews in organization and blocks cross-organization inspection', async () => {
    // Submit review in org A
    await fetch(`${baseUrl}/api/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creatorToken}`,
      },
      body: JSON.stringify({
        brandId: novaFitBrandId,
        content: 'Hey users! Price is ₹799!',
      }),
    });

    // Org A user queries reviews
    const listRes = await fetch(`${baseUrl}/api/reviews`, {
      headers: { Authorization: `Bearer ${creatorToken}` },
    });
    assert.equal(listRes.status, 200);
    const listBody = await listRes.json();
    assert.equal(listBody.data.length, 1);
    const reviewId = listBody.data[0].id;

    // Org B user queries reviews (should see 0)
    const orgBListRes = await fetch(`${baseUrl}/api/reviews`, {
      headers: { Authorization: `Bearer ${otherOrgToken}` },
    });
    assert.equal(orgBListRes.status, 200);
    const orgBListBody = await orgBListRes.json();
    assert.equal(orgBListBody.data.length, 0);

    // Org B user attempts to fetch Org A review by ID -> 403 Forbidden
    const detailRes = await fetch(`${baseUrl}/api/reviews/${reviewId}`, {
      headers: { Authorization: `Bearer ${otherOrgToken}` },
    });
    assert.equal(detailRes.status, 403);
  });
});
