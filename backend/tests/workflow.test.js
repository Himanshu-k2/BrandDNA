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
import ReviewRevision from '../src/models/ReviewRevision.js';
import ReviewComment from '../src/models/ReviewComment.js';
import AuditLog from '../src/models/AuditLog.js';
import Notification from '../src/models/Notification.js';
import { generateToken } from '../src/utils/jwt.js';
import { seedNovaFitData } from '../src/utils/seedNovaFit.js';

describe('Phase 5: Review Workflow, Revisions, Comments & Approval Tests', () => {
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

  let novaFitBrandId;
  const orgA = new mongoose.Types.ObjectId();
  const orgB = new mongoose.Types.ObjectId();

  before(async () => {
    process.env.JWT_SECRET = 'test_jwt_secret_key_branddna_secure';
    process.env.JWT_EXPIRES_IN = '1h';
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
      ReviewRevision.deleteMany({}),
      ReviewComment.deleteMany({}),
      AuditLog.deleteMany({}),
      Notification.deleteMany({}),
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

    reviewerUser = await User.create({
      name: 'Reviewer User',
      email: 'reviewer@org-a.com',
      passwordHash: 'Password123!',
      role: 'reviewer',
      organizationId: orgA,
    });

    otherOrgUser = await User.create({
      name: 'Other Org Reviewer',
      email: 'reviewer@org-b.com',
      passwordHash: 'Password123!',
      role: 'reviewer',
      organizationId: orgB,
    });

    adminToken = generateToken({ id: adminUser._id, role: 'admin', organizationId: orgA });
    creatorToken = generateToken({ id: creatorUser._id, role: 'creator', organizationId: orgA });
    reviewerToken = generateToken({ id: reviewerUser._id, role: 'reviewer', organizationId: orgA });
    otherOrgToken = generateToken({ id: otherOrgUser._id, role: 'reviewer', organizationId: orgB });

    const seed = await seedNovaFitData(orgA, adminUser._id);
    novaFitBrandId = seed.brandId.toString();
  });

  // ==========================================
  // 1. REVISION VERSIONING & IMMUTABILITY
  // ==========================================
  test('1. Initial review automatically creates Revision v1 snapshot and audit log', async () => {
    const postRes = await fetch(`${baseUrl}/api/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creatorToken}`,
      },
      body: JSON.stringify({
        brandId: novaFitBrandId,
        content: 'Hey users! Subscription price is ₹799!',
      }),
    });

    assert.equal(postRes.status, 201);
    const { data } = await postRes.json();
    const reviewId = data.reviewId;

    // Verify Revision v1 was created
    const revisions = await ReviewRevision.find({ reviewId });
    assert.equal(revisions.length, 1);
    assert.equal(revisions[0].versionNumber, 1);
    assert.equal(revisions[0].contentSnapshot, 'Hey users! Subscription price is ₹799!');
    assert.equal(revisions[0].status, 'needs_changes');

    // Verify audit log entry
    const auditLogs = await AuditLog.find({ reviewId });
    assert.ok(auditLogs.length >= 1);
    assert.equal(auditLogs[0].action, 'review_created');
  });

  test('2. Submitting a new revision creates v2, marks v1 superseded, and re-analyzes content', async () => {
    // 1. Create initial review with violations (v1)
    const initRes = await fetch(`${baseUrl}/api/reviews`, {
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
    const { data: initData } = await initRes.json();
    const reviewId = initData.reviewId;

    // 2. Creator submits corrected revision (v2)
    const revisedText = 'Hey members! NovaFit Premium is available for ₹999!';
    const revRes = await fetch(`${baseUrl}/api/reviews/${reviewId}/revisions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creatorToken}`,
      },
      body: JSON.stringify({
        content: revisedText,
        submissionNote: 'Fixed terminology from users to members and updated price to ₹999',
      }),
    });

    assert.equal(revRes.status, 201);
    const revBody = await revRes.json();
    assert.equal(revBody.success, true);
    assert.equal(revBody.data.review.currentVersion, 2);
    assert.equal(revBody.data.revision.versionNumber, 2);
    assert.equal(revBody.data.revision.findings.length, 0, 'Corrected copy should have 0 violations');
    assert.equal(revBody.data.review.status, 'pending_approval');

    // Verify v1 is now marked superseded
    const v1 = await ReviewRevision.findOne({ reviewId, versionNumber: 1 });
    assert.equal(v1.status, 'superseded');

    // Verify GET /api/reviews/:id/revisions lists both
    const listRes = await fetch(`${baseUrl}/api/reviews/${reviewId}/revisions`, {
      headers: { Authorization: `Bearer ${creatorToken}` },
    });
    assert.equal(listRes.status, 200);
    const listBody = await listRes.json();
    assert.equal(listBody.data.length, 2);

    // Verify GET /api/reviews/:id/revisions/1 returns immutable v1
    const singleV1Res = await fetch(`${baseUrl}/api/reviews/${reviewId}/revisions/1`, {
      headers: { Authorization: `Bearer ${creatorToken}` },
    });
    assert.equal(singleV1Res.status, 200);
    const singleV1Body = await singleV1Res.json();
    assert.equal(singleV1Body.data.versionNumber, 1);
    assert.equal(singleV1Body.data.contentSnapshot, 'Hey users! Price is ₹799!');
  });

  // ==========================================
  // 2. COMMENTS & FEEDBACK
  // ==========================================
  test('3. Reviewer adds feedback comment to review and Creator can read it', async () => {
    const initRes = await fetch(`${baseUrl}/api/reviews`, {
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
    const { data } = await initRes.json();
    const reviewId = data.reviewId;

    // Reviewer posts comment
    const commentRes = await fetch(`${baseUrl}/api/reviews/${reviewId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${reviewerToken}`,
      },
      body: JSON.stringify({
        body: 'Please make sure to change "users" to "members" per brand terminology guidelines.',
        commentType: 'requested_change',
        versionNumber: 1,
      }),
    });

    assert.equal(commentRes.status, 201);
    const commentBody = await commentRes.json();
    assert.equal(commentBody.data.body, 'Please make sure to change "users" to "members" per brand terminology guidelines.');
    assert.equal(commentBody.data.commentType, 'requested_change');

    // Creator reads comments
    const getRes = await fetch(`${baseUrl}/api/reviews/${reviewId}/comments`, {
      headers: { Authorization: `Bearer ${creatorToken}` },
    });
    assert.equal(getRes.status, 200);
    const getBody = await getRes.json();
    assert.equal(getBody.data.length, 1);
    assert.equal(getBody.data[0].authorId.name, 'Reviewer User');
  });

  // ==========================================
  // 3. HUMAN APPROVAL DECISIONS & PERMISSIONS
  // ==========================================
  test('4. Creator is forbidden from approving their own content (Self-approval block)', async () => {
    const initRes = await fetch(`${baseUrl}/api/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creatorToken}`,
      },
      body: JSON.stringify({
        brandId: novaFitBrandId,
        content: 'Perfect approved text with no violations.',
      }),
    });
    const { data } = await initRes.json();
    const reviewId = data.reviewId;

    // Creator attempts self-approval
    const approveRes = await fetch(`${baseUrl}/api/reviews/${reviewId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creatorToken}`,
      },
      body: JSON.stringify({ comment: 'Self approving' }),
    });

    assert.equal(approveRes.status, 403);
    const body = await approveRes.json();
    assert.match(body.message, /Forbidden.*not permitted/i);
  });

  test('5. Reviewer approves content in pending_approval status', async () => {
    // 1. Creator submits clean content
    const initRes = await fetch(`${baseUrl}/api/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creatorToken}`,
      },
      body: JSON.stringify({
        brandId: novaFitBrandId,
        content: 'Welcome members! NovaFit Premium is available for ₹999.',
      }),
    });
    const { data } = await initRes.json();
    const reviewId = data.reviewId;

    // Review status is pending_approval because 0 violations
    assert.equal(data.status, 'pending_approval');

    // 2. Reviewer approves content
    const approveRes = await fetch(`${baseUrl}/api/reviews/${reviewId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${reviewerToken}`,
      },
      body: JSON.stringify({ comment: 'Looks great! Approved for launch.' }),
    });

    assert.equal(approveRes.status, 200);
    const approveBody = await approveRes.json();
    assert.equal(approveBody.success, true);
    assert.equal(approveBody.data.status, 'approved');
    assert.equal(approveBody.data.decision.status, 'approved');
    assert.equal(approveBody.data.decision.reason, 'Looks great! Approved for launch.');

    // Attempting to approve again fails
    const reApprove = await fetch(`${baseUrl}/api/reviews/${reviewId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${reviewerToken}`,
      },
      body: JSON.stringify({}),
    });
    assert.equal(reApprove.status, 400);
  });

  test('6. Reviewer rejects content with mandatory reason', async () => {
    const initRes = await fetch(`${baseUrl}/api/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creatorToken}`,
      },
      body: JSON.stringify({
        brandId: novaFitBrandId,
        content: 'Clean text pending approval.',
      }),
    });
    const { data } = await initRes.json();
    const reviewId = data.reviewId;

    // Reject without reason fails validation
    const badReject = await fetch(`${baseUrl}/api/reviews/${reviewId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${reviewerToken}`,
      },
      body: JSON.stringify({ reason: '' }),
    });
    assert.equal(badReject.status, 400);

    // Reject with reason succeeds
    const rejectRes = await fetch(`${baseUrl}/api/reviews/${reviewId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${reviewerToken}`,
      },
      body: JSON.stringify({ reason: 'Campaign cancelled by marketing director.' }),
    });

    assert.equal(rejectRes.status, 200);
    const rejectBody = await rejectRes.json();
    assert.equal(rejectBody.data.status, 'rejected');
    assert.equal(rejectBody.data.decision.status, 'rejected');
    assert.equal(rejectBody.data.decision.reason, 'Campaign cancelled by marketing director.');
  });

  test('7. Reviewer requests changes which sets status to needs_changes and adds comment', async () => {
    const initRes = await fetch(`${baseUrl}/api/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creatorToken}`,
      },
      body: JSON.stringify({
        brandId: novaFitBrandId,
        content: 'Clean text pending review.',
      }),
    });
    const { data } = await initRes.json();
    const reviewId = data.reviewId;

    const reqRes = await fetch(`${baseUrl}/api/reviews/${reviewId}/request-changes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${reviewerToken}`,
      },
      body: JSON.stringify({ reason: 'Please make the opening call to action stronger.' }),
    });

    assert.equal(reqRes.status, 200);
    const reqBody = await reqRes.json();
    assert.equal(reqBody.data.status, 'needs_changes');

    // Verify comment was automatically created
    const comments = await ReviewComment.find({ reviewId });
    assert.equal(comments.length, 1);
    assert.equal(comments[0].commentType, 'requested_change');
    assert.equal(comments[0].body, 'Please make the opening call to action stronger.');
  });

  // ==========================================
  // 4. AUDIT TRAIL & NOTIFICATIONS
  // ==========================================
  test('8. Full workflow generates audit logs and delivers in-app notifications', async () => {
    // 1. Creator submits review
    const initRes = await fetch(`${baseUrl}/api/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creatorToken}`,
      },
      body: JSON.stringify({
        brandId: novaFitBrandId,
        content: 'Clean initial copy.',
      }),
    });
    const { data } = await initRes.json();
    const reviewId = data.reviewId;

    // 2. Reviewer requests changes
    await fetch(`${baseUrl}/api/reviews/${reviewId}/request-changes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${reviewerToken}`,
      },
      body: JSON.stringify({ reason: 'Please tweak the closing sentence.' }),
    });

    // 3. Creator checks notifications
    const notifRes = await fetch(`${baseUrl}/api/notifications`, {
      headers: { Authorization: `Bearer ${creatorToken}` },
    });
    assert.equal(notifRes.status, 200);
    const notifBody = await notifRes.json();
    assert.ok(notifBody.unreadCount >= 1);
    const notifId = notifBody.data[0].id;

    // 4. Creator marks notification as read
    const markRes = await fetch(`${baseUrl}/api/notifications/${notifId}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${creatorToken}` },
    });
    assert.equal(markRes.status, 200);
    const markBody = await markRes.json();
    assert.equal(markBody.data.isRead, true);

    // 5. Query Audit Trail
    const auditRes = await fetch(`${baseUrl}/api/reviews/${reviewId}/audit-trail`, {
      headers: { Authorization: `Bearer ${creatorToken}` },
    });
    assert.equal(auditRes.status, 200);
    const auditBody = await auditRes.json();
    const actions = auditBody.data.map((l) => l.action);
    assert.ok(actions.includes('review_created'));
    assert.ok(actions.includes('changes_requested'));
  });

  // ==========================================
  // 5. CROSS-ORGANIZATION ISOLATION
  // ==========================================
  test('9. Prevents cross-organization workflow actions and comment leakage', async () => {
    const initRes = await fetch(`${baseUrl}/api/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creatorToken}`,
      },
      body: JSON.stringify({
        brandId: novaFitBrandId,
        content: 'Org A confidential copy.',
      }),
    });
    const { data } = await initRes.json();
    const reviewId = data.reviewId;

    // Org B reviewer attempts to comment
    const commentRes = await fetch(`${baseUrl}/api/reviews/${reviewId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${otherOrgToken}`,
      },
      body: JSON.stringify({ body: 'Malicious injection' }),
    });
    assert.equal(commentRes.status, 403);

    // Org B reviewer attempts to approve
    const approveRes = await fetch(`${baseUrl}/api/reviews/${reviewId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${otherOrgToken}`,
      },
      body: JSON.stringify({}),
    });
    assert.equal(approveRes.status, 403);

    // Org B reviewer attempts to view revisions
    const revRes = await fetch(`${baseUrl}/api/reviews/${reviewId}/revisions`, {
      headers: { Authorization: `Bearer ${otherOrgToken}` },
    });
    assert.equal(revRes.status, 403);
  });
});
