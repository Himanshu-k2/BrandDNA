import ContentReview from '../models/ContentReview.js';
import ReviewRevision from '../models/ReviewRevision.js';
import ReviewComment from '../models/ReviewComment.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Brand from '../models/Brand.js';
import BrandGuideline from '../models/BrandGuideline.js';
import ApprovedFact from '../models/ApprovedFact.js';
import TerminologyRule from '../models/TerminologyRule.js';
import BrandVisualAsset from '../models/BrandVisualAsset.js';
import {
  runDeterministicChecks,
  runDeterministicDocumentChecks,
  runDeterministicImageColorChecks,
} from './ruleCheckService.js';
import {
  runGeminiReview,
  runGeminiDocumentReview,
  runGeminiImageReview,
} from './aiReviewService.js';
import { extractDocumentContent } from './documentExtractorService.js';
import { processImageContent } from './imageProcessorService.js';
import { validateFileSignature } from '../utils/fileSignature.js';
import { combineAndDeduplicateFindings, calculateReviewSummary } from './reviewService.js';

/**
 * Creates in-app notifications for users in the organization based on role or specific user ID.
 */
const sendNotification = async ({ recipientId, role, organizationId, reviewId, type, title, message }) => {
  try {
    if (recipientId) {
      await Notification.create({
        recipientId,
        organizationId,
        reviewId,
        type,
        title,
        message,
      });
    } else if (role) {
      const users = await User.find({ organizationId, role, isActive: true });
      const notifications = users.map((u) => ({
        recipientId: u._id,
        organizationId,
        reviewId,
        type,
        title,
        message,
      }));
      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    }
  } catch (err) {
    console.error('Error dispatching notification:', err.message);
  }
};

/**
 * Submits content review for formal human approval.
 */
export const submitReviewForApproval = async (reviewId, user) => {
  const review = await ContentReview.findById(reviewId);
  if (!review) {
    const error = new Error('Review not found');
    error.statusCode = 404;
    throw error;
  }

  if (review.organizationId.toString() !== user.organizationId.toString()) {
    const error = new Error('Forbidden: You cannot submit reviews from another organization');
    error.statusCode = 403;
    throw error;
  }

  if (review.status === 'approved') {
    const error = new Error('Review is already approved and cannot be resubmitted without a new revision');
    error.statusCode = 400;
    throw error;
  }

  review.status = 'pending_approval';
  await review.save();

  // Update current revision status
  await ReviewRevision.findOneAndUpdate(
    { reviewId: review._id, versionNumber: review.currentVersion || 1 },
    { status: 'pending_approval' }
  );

  await AuditLog.create({
    organizationId: review.organizationId,
    reviewId: review._id,
    actorId: user._id,
    action: 'content_submitted',
    versionNumber: review.currentVersion || 1,
    details: { submittedBy: user.name, previousStatus: review.status },
  });

  // Notify reviewers and admins
  await sendNotification({
    role: 'reviewer',
    organizationId: review.organizationId,
    reviewId: review._id,
    type: 'review_submitted',
    title: 'Content Submitted for Approval',
    message: `${user.name} submitted content for review. Ready for reviewer inspection.`,
  });

  return review;
};

/**
 * Submits a new content revision, archives previous versions, and re-runs AI & rule analysis.
 * Supports text copy as well as multimodal file revisions (PDF, JPEG, PNG, WebP).
 */
export const createReviewRevision = async (
  reviewId,
  { content = '', file = null, submissionNote },
  user
) => {
  const review = await ContentReview.findById(reviewId);
  if (!review) {
    const error = new Error('Review not found');
    error.statusCode = 404;
    throw error;
  }

  if (review.organizationId.toString() !== user.organizationId.toString()) {
    const error = new Error('Forbidden: You cannot modify reviews from another organization');
    error.statusCode = 403;
    throw error;
  }

  // Ensure user is the creator or an admin
  if (user.role === 'creator' && review.submittedBy.toString() !== user._id.toString()) {
    const error = new Error('Forbidden: You can only revise content that you created');
    error.statusCode = 403;
    throw error;
  }

  if (review.status === 'approved') {
    const error = new Error('Cannot revise an already approved review. Create a new review instead.');
    error.statusCode = 400;
    throw error;
  }

  // 1. Fetch brand context including visual assets
  const brand = await Brand.findById(review.brandId);
  const [guidelines, facts, terminologyRules, visualAssets] = await Promise.all([
    BrandGuideline.find({ brandId: review.brandId, status: 'active' }),
    ApprovedFact.find({ brandId: review.brandId, status: 'active', verificationStatus: 'verified' }),
    TerminologyRule.find({ brandId: review.brandId, status: 'active' }),
    BrandVisualAsset.find({ brandId: review.brandId, status: 'active' }),
  ]);

  const brandContext = { brand, guidelines, facts, terminologyRules, visualAssets };

  const guidelineVersions = {};
  for (const g of guidelines) {
    guidelineVersions[g._id.toString()] = g.version || 1;
  }
  const factVersions = {};
  for (const f of facts) {
    factVersions[f._id.toString()] = f.version || 1;
  }

  const evidenceSnapshot = {
    guidelines: guidelines.map((g) => ({
      id: g._id.toString(),
      title: g.title,
      category: g.category,
      ruleText: g.ruleText,
      severity: g.severity,
      version: g.version || 1,
    })),
    facts: facts.map((f) => ({
      id: f._id.toString(),
      key: f.key,
      value: f.value,
      category: f.category,
      description: f.description,
      sourceReference: f.sourceReference,
      version: f.version || 1,
    })),
    terminology: terminologyRules.map((t) => ({
      id: t._id.toString(),
      prohibitedTerm: t.prohibitedTerm,
      preferredTerm: t.preferredTerm,
      replacementSuggestion: t.replacementSuggestion,
      explanation: t.explanation,
    })),
    visualAssets: visualAssets.map((v) => ({
      id: v._id.toString(),
      name: v.name,
      assetType: v.assetType,
      details: v.details,
    })),
  };

  let modality = review.modality || 'text';
  let processedContent = content || '';
  let fileAsset = review.fileAsset || null;
  let deterministicFindings = [];
  let aiResult = { findings: [], isPartial: false };
  const warnings = [];
  const methodsRan = ['deterministic_rule_engine'];

  // 2. Process file or text revision
  if (file && file.buffer) {
    const sig = validateFileSignature(file.buffer, file.originalname);

    if (sig.category === 'document') {
      modality = 'document';
      const doc = await extractDocumentContent(file.buffer, { declaredName: file.originalname });
      processedContent = doc.fullText || (content || '[Document without extractable text]');
      fileAsset = {
        originalName: file.originalname,
        mimeType: doc.mimeType,
        fileSize: doc.fileSize,
        pageCount: doc.totalPages,
        extractedText: doc.fullText,
        dataUrl: file.mimetype?.includes('pdf') || file.originalname?.endsWith('.pdf') ? `data:${doc.mimeType};base64,${file.buffer.toString('base64')}` : null,
        pageSummaries: doc.pages.map((p) => ({
          pageNumber: p.pageNumber,
          characterCount: p.characterCount,
          hasExtractableText: p.hasExtractableText,
        })),
        unanalyzablePages: doc.unanalyzablePages,
      };

      if (doc.unanalyzablePages.length > 0) {
        warnings.push(
          `Pages ${doc.unanalyzablePages.join(', ')} contain little or no extractable text.`
        );
      }

      deterministicFindings = runDeterministicDocumentChecks(doc.pages, brandContext);
      aiResult = await runGeminiDocumentReview({
        pages: doc.pages,
        pdfBuffer: file.buffer,
        brandContext,
      });
      if (!aiResult.isPartial) methodsRan.push('gemini_document_ai');
    } else if (sig.category === 'image') {
      modality = 'image';
      const img = await processImageContent(file.buffer, { declaredName: file.originalname });
      aiResult = await runGeminiImageReview({
        imageBuffer: img.buffer,
        mimeType: img.mimeType,
        brandContext,
      });
      if (!aiResult.isPartial) methodsRan.push('gemini_multimodal_vision_ai');

      const transcribedText = aiResult.extractedText || '';
      processedContent = transcribedText
        ? (content && content.trim() ? `${transcribedText}\n\n[Attached Caption]: ${content.trim()}` : transcribedText)
        : (content || '[Image without detected text]');
      fileAsset = {
        originalName: file.originalname,
        mimeType: img.mimeType,
        fileSize: img.fileSize,
        dimensions: img.dimensions,
        extractedText: transcribedText,
        dataUrl: `data:${img.mimeType};base64,${img.base64}`,
      };

      if (img.dominantColor) {
        const colorFindings = runDeterministicImageColorChecks(img.dominantColor, brandContext);
        deterministicFindings.push(...colorFindings);
      }

      if (processedContent && processedContent !== '[Image without detected text]') {
        deterministicFindings.push(
          ...runDeterministicChecks(processedContent, brandContext, {
            reviewModality: 'image-text',
          })
        );
      }
    }
  } else {
    // Pure text revision
    processedContent = content || review.content || '';
    deterministicFindings = runDeterministicChecks(processedContent, brandContext, {
      reviewModality: 'text',
    });
    aiResult = await runGeminiReview(processedContent, brandContext);
    if (!aiResult.isPartial) methodsRan.push('gemini_contextual_ai');
  }

  const newVersionNumber = (review.currentVersion || 1) + 1;

  const mergedFindings = combineAndDeduplicateFindings(
    deterministicFindings,
    aiResult.findings || []
  ).map((f) => ({
    ...f,
    analysisVersion: newVersionNumber,
  }));
  const summary = calculateReviewSummary(mergedFindings);

  if (aiResult.isPartial && aiResult.warning) {
    warnings.push(aiResult.warning);
  }

  const initialStatus = mergedFindings.length > 0 ? 'needs_changes' : 'pending_approval';
  const analysisCompletionStatus = aiResult.isPartial ? 'partial' : 'complete';

  // 3. Mark previous revisions as superseded
  await ReviewRevision.updateMany(
    { reviewId: review._id, status: { $ne: 'superseded' } },
    { status: 'superseded' }
  );

  const analyzedAt = new Date();

  // 4. Create new revision document
  const revision = new ReviewRevision({
    reviewId: review._id,
    organizationId: review.organizationId,
    versionNumber: newVersionNumber,
    contentSnapshot: processedContent,
    contentType: review.contentType,
    modality,
    fileAsset: (fileAsset && (fileAsset.originalName || fileAsset.mimeType)) ? fileAsset : null,
    submittedBy: user._id,
    submissionNote: submissionNote || `Revision v${newVersionNumber}`,
    findings: mergedFindings,
    summary,
    status: initialStatus,
    analysisCompletionStatus,
    analysisMetadata: {
      methodsRan,
      fallbackUsed: Boolean(aiResult.isPartial),
      geminiAvailable: !aiResult.isPartial,
      timestamp: analyzedAt,
    },
    checksCompleted: {
      deterministicRules: true,
      terminology: true,
      pricingAndFacts: true,
      geminiContextual: !aiResult.isPartial,
    },
    warnings,
    isPartialAnalysis: aiResult.isPartial,
    guidelineVersions,
    factVersions,
    evidenceSnapshot,
    analyzedAt,
  });
  await revision.save();

  // 5. Update main review record
  review.content = processedContent;
  review.modality = modality;
  if (fileAsset && (fileAsset.originalName || fileAsset.mimeType)) {
    review.fileAsset = fileAsset;
  }
  review.currentVersion = newVersionNumber;
  review.findings = mergedFindings;
  review.summary = summary;
  review.status = initialStatus;
  review.analysisCompletionStatus = analysisCompletionStatus;
  review.analysisMetadata = {
    methodsRan,
    fallbackUsed: Boolean(aiResult.isPartial),
    geminiAvailable: !aiResult.isPartial,
    timestamp: analyzedAt,
  };
  review.checksCompleted = revision.checksCompleted;
  review.warnings = warnings;
  review.isPartialAnalysis = revision.isPartialAnalysis;
  review.guidelineVersions = guidelineVersions;
  review.factVersions = factVersions;
  review.evidenceSnapshot = evidenceSnapshot;
  review.analyzedAt = analyzedAt;
  review.isStale = false;
  review.decision = { status: 'none', decidedBy: null, decidedAt: null, reason: '' };
  await review.save();

  // 6. Record audit log
  await AuditLog.create({
    organizationId: review.organizationId,
    reviewId: review._id,
    actorId: user._id,
    action: 'revision_created',
    versionNumber: newVersionNumber,
    details: {
      modality,
      hasFile: Boolean(fileAsset),
      submissionNote,
      findingsCount: mergedFindings.length,
      score: summary.overallScore,
      status: initialStatus,
      analysisCompletionStatus,
    },
  });

  // 7. Notify reviewers if ready for approval
  if (initialStatus === 'pending_approval') {
    await sendNotification({
      role: 'reviewer',
      organizationId: review.organizationId,
      reviewId: review._id,
      type: 'review_submitted',
      title: `Revision v${newVersionNumber} Pending Approval`,
      message: `${user.name} submitted a revised version ready for inspection.`,
    });
  }

  return { review, revision };
};

/**
 * Human approval decision by reviewer or admin.
 */
export const approveContentReview = async (reviewId, user, { comment = '' }) => {
  const review = await ContentReview.findById(reviewId);
  if (!review) {
    const error = new Error('Review not found');
    error.statusCode = 404;
    throw error;
  }

  if (review.organizationId.toString() !== user.organizationId.toString()) {
    const error = new Error('Forbidden: You cannot approve reviews from another organization');
    error.statusCode = 403;
    throw error;
  }

  // Prevent creator self-approval
  if (review.submittedBy.toString() === user._id.toString()) {
    const error = new Error(
      'Forbidden: Content creators are not permitted to approve their own submissions. Approval requires an independent reviewer or admin decision.'
    );
    error.statusCode = 403;
    throw error;
  }

  // Must be in pending_approval status
  if (review.status !== 'pending_approval') {
    const error = new Error(
      `Cannot approve review in '${review.status}' status. Only reviews in 'pending_approval' can be approved.`
    );
    error.statusCode = 400;
    throw error;
  }

  const currentVer = review.currentVersion || 1;

  review.status = 'approved';
  review.decision = {
    status: 'approved',
    decidedBy: user._id,
    decidedAt: new Date(),
    reason: comment,
  };
  await review.save();

  // Mark current revision as approved
  await ReviewRevision.findOneAndUpdate(
    { reviewId: review._id, versionNumber: currentVer },
    { status: 'approved' }
  );

  // Audit log
  await AuditLog.create({
    organizationId: review.organizationId,
    reviewId: review._id,
    actorId: user._id,
    action: 'content_approved',
    versionNumber: currentVer,
    details: { reviewerName: user.name, comment },
  });

  // Notify creator
  await sendNotification({
    recipientId: review.submittedBy,
    organizationId: review.organizationId,
    reviewId: review._id,
    type: 'review_approved',
    title: 'Content Approved!',
    message: `Your content (Version ${currentVer}) has been officially approved by ${user.name}.`,
  });

  return review;
};

/**
 * Human rejection decision by reviewer or admin.
 */
export const rejectContentReview = async (reviewId, user, { reason }) => {
  const review = await ContentReview.findById(reviewId);
  if (!review) {
    const error = new Error('Review not found');
    error.statusCode = 404;
    throw error;
  }

  if (review.organizationId.toString() !== user.organizationId.toString()) {
    const error = new Error('Forbidden: You cannot reject reviews from another organization');
    error.statusCode = 403;
    throw error;
  }

  if (review.status !== 'pending_approval') {
    const error = new Error(
      `Cannot reject review in '${review.status}' status. Only reviews in 'pending_approval' can be rejected.`
    );
    error.statusCode = 400;
    throw error;
  }

  const currentVer = review.currentVersion || 1;

  review.status = 'rejected';
  review.decision = {
    status: 'rejected',
    decidedBy: user._id,
    decidedAt: new Date(),
    reason,
  };
  await review.save();

  await ReviewRevision.findOneAndUpdate(
    { reviewId: review._id, versionNumber: currentVer },
    { status: 'rejected' }
  );

  await AuditLog.create({
    organizationId: review.organizationId,
    reviewId: review._id,
    actorId: user._id,
    action: 'content_rejected',
    versionNumber: currentVer,
    details: { reviewerName: user.name, reason },
  });

  await sendNotification({
    recipientId: review.submittedBy,
    organizationId: review.organizationId,
    reviewId: review._id,
    type: 'review_rejected',
    title: 'Content Submission Rejected',
    message: `Your content (Version ${currentVer}) was rejected by ${user.name}. Reason: "${reason}"`,
  });

  return review;
};

/**
 * Human changes requested decision by reviewer or admin.
 */
export const requestReviewChanges = async (reviewId, user, { reason }) => {
  const review = await ContentReview.findById(reviewId);
  if (!review) {
    const error = new Error('Review not found');
    error.statusCode = 404;
    throw error;
  }

  if (review.organizationId.toString() !== user.organizationId.toString()) {
    const error = new Error('Forbidden: You cannot request changes on reviews from another organization');
    error.statusCode = 403;
    throw error;
  }

  const currentVer = review.currentVersion || 1;

  review.status = 'needs_changes';
  review.decision = {
    status: 'changes_requested',
    decidedBy: user._id,
    decidedAt: new Date(),
    reason,
  };
  await review.save();

  await ReviewRevision.findOneAndUpdate(
    { reviewId: review._id, versionNumber: currentVer },
    { status: 'needs_changes' }
  );

  // Automatically attach a requested_change comment
  await ReviewComment.create({
    reviewId: review._id,
    organizationId: review.organizationId,
    versionNumber: currentVer,
    authorId: user._id,
    body: reason,
    commentType: 'requested_change',
  });

  await AuditLog.create({
    organizationId: review.organizationId,
    reviewId: review._id,
    actorId: user._id,
    action: 'changes_requested',
    versionNumber: currentVer,
    details: { reviewerName: user.name, reason },
  });

  await sendNotification({
    recipientId: review.submittedBy,
    organizationId: review.organizationId,
    reviewId: review._id,
    type: 'changes_requested',
    title: 'Revisions Requested',
    message: `${user.name} requested changes on Version ${currentVer}: "${reason}"`,
  });

  return review;
};

/**
 * Adds a comment or feedback item to a review.
 */
export const addReviewComment = async (reviewId, user, { body, commentType = 'general_feedback', versionNumber }) => {
  const review = await ContentReview.findById(reviewId);
  if (!review) {
    const error = new Error('Review not found');
    error.statusCode = 404;
    throw error;
  }

  if (review.organizationId.toString() !== user.organizationId.toString()) {
    const error = new Error('Forbidden: You cannot comment on reviews from another organization');
    error.statusCode = 403;
    throw error;
  }

  const verNum = versionNumber || review.currentVersion || 1;

  const comment = new ReviewComment({
    reviewId: review._id,
    organizationId: review.organizationId,
    versionNumber: verNum,
    authorId: user._id,
    body,
    commentType,
  });

  await comment.save();

  await AuditLog.create({
    organizationId: review.organizationId,
    reviewId: review._id,
    actorId: user._id,
    action: 'comment_added',
    versionNumber: verNum,
    details: { commentType, authorName: user.name },
  });

  // Notify creator if author is someone else; or notify reviewers if author is creator
  if (review.submittedBy.toString() !== user._id.toString()) {
    await sendNotification({
      recipientId: review.submittedBy,
      organizationId: review.organizationId,
      reviewId: review._id,
      type: 'comment_added',
      title: 'New Feedback on Your Content',
      message: `${user.name} left a comment: "${body.substring(0, 80)}${body.length > 80 ? '...' : ''}"`,
    });
  } else {
    await sendNotification({
      role: 'reviewer',
      organizationId: review.organizationId,
      reviewId: review._id,
      type: 'comment_added',
      title: 'Creator Comment on Content',
      message: `${user.name} commented on Version ${verNum}: "${body.substring(0, 80)}${body.length > 80 ? '...' : ''}"`,
    });
  }

  return comment.populate('authorId', 'name email role');
};

/**
 * Computes a detailed diff between two text strings.
 */
export const computeTextDiff = (oldText = '', newText = '') => {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const chunks = [];
  let linesAdded = 0;
  let linesRemoved = 0;
  let linesUnchanged = 0;

  const oldSet = new Set(oldLines);
  const newSet = new Set(newLines);

  let i = 0;
  let j = 0;

  while (i < oldLines.length || j < newLines.length) {
    if (i < oldLines.length && j < newLines.length && oldLines[i] === newLines[j]) {
      chunks.push({ type: 'unchanged', text: oldLines[i], lineOld: i + 1, lineNew: j + 1 });
      linesUnchanged++;
      i++;
      j++;
    } else if (j < newLines.length && !oldSet.has(newLines[j])) {
      chunks.push({ type: 'added', text: newLines[j], lineNew: j + 1 });
      linesAdded++;
      j++;
    } else if (i < oldLines.length && !newSet.has(oldLines[i])) {
      chunks.push({ type: 'removed', text: oldLines[i], lineOld: i + 1 });
      linesRemoved++;
      i++;
    } else {
      if (i < oldLines.length) {
        chunks.push({ type: 'removed', text: oldLines[i], lineOld: i + 1 });
        linesRemoved++;
        i++;
      }
      if (j < newLines.length) {
        chunks.push({ type: 'added', text: newLines[j], lineNew: j + 1 });
        linesAdded++;
        j++;
      }
    }
  }

  return {
    linesAdded,
    linesRemoved,
    linesUnchanged,
    chunks,
  };
};

/**
 * Compares two revision snapshots of a review, computing content diff and findings comparison.
 */
export const compareReviewRevisions = async (reviewId, v1Num, v2Num, user) => {
  const review = await ContentReview.findById(reviewId);
  if (!review) {
    const error = new Error('Review not found');
    error.statusCode = 404;
    throw error;
  }

  if (review.organizationId.toString() !== user.organizationId.toString()) {
    const error = new Error('Forbidden: You cannot access reviews from another organization');
    error.statusCode = 403;
    throw error;
  }

  const v1 = await ReviewRevision.findOne({ reviewId: review._id, versionNumber: v1Num }).populate(
    'submittedBy',
    'name email role'
  );
  const v2 = await ReviewRevision.findOne({ reviewId: review._id, versionNumber: v2Num }).populate(
    'submittedBy',
    'name email role'
  );

  if (!v1 || !v2) {
    const error = new Error(`Revisions v${v1Num} and/or v${v2Num} not found`);
    error.statusCode = 404;
    throw error;
  }

  const diff = computeTextDiff(v1.contentSnapshot || '', v2.contentSnapshot || '');

  // Compare findings between v1 and v2
  const v1FindingKeys = new Set(
    (v1.findings || []).map((f) => `${f.type}_${(f.problematicText || '').toLowerCase().trim()}`)
  );
  const v2FindingKeys = new Set(
    (v2.findings || []).map((f) => `${f.type}_${(f.problematicText || '').toLowerCase().trim()}`)
  );

  const resolvedFindings = (v1.findings || []).filter(
    (f) => !v2FindingKeys.has(`${f.type}_${(f.problematicText || '').toLowerCase().trim()}`)
  );
  const persistentFindings = (v2.findings || []).filter((f) =>
    v1FindingKeys.has(`${f.type}_${(f.problematicText || '').toLowerCase().trim()}`)
  );
  const newFindings = (v2.findings || []).filter(
    (f) => !v1FindingKeys.has(`${f.type}_${(f.problematicText || '').toLowerCase().trim()}`)
  );

  const scoreDelta = (v2.summary?.overallScore || 0) - (v1.summary?.overallScore || 0);

  return {
    reviewId: review._id.toString(),
    v1: {
      versionNumber: v1.versionNumber,
      submittedBy: v1.submittedBy,
      createdAt: v1.createdAt,
      status: v1.status,
      summary: v1.summary,
      totalFindings: (v1.findings || []).length,
      fileAsset: v1.fileAsset || null,
    },
    v2: {
      versionNumber: v2.versionNumber,
      submittedBy: v2.submittedBy,
      createdAt: v2.createdAt,
      status: v2.status,
      summary: v2.summary,
      totalFindings: (v2.findings || []).length,
      fileAsset: v2.fileAsset || null,
    },
    v1Content: v1.contentSnapshot || '',
    v2Content: v2.contentSnapshot || '',
    diffSummary: {
      ...diff,
      scoreDelta,
    },
    findingsComparison: {
      resolved: resolvedFindings,
      persistent: persistentFindings,
      new: newFindings,
    },
  };
};
