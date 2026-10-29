import Brand from '../models/Brand.js';
import BrandGuideline from '../models/BrandGuideline.js';
import ApprovedFact from '../models/ApprovedFact.js';
import TerminologyRule from '../models/TerminologyRule.js';
import BrandVisualAsset from '../models/BrandVisualAsset.js';
import ContentReview from '../models/ContentReview.js';
import ReviewRevision from '../models/ReviewRevision.js';
import AuditLog from '../models/AuditLog.js';
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

/**
 * Deduplicates and prioritizes findings between deterministic checks and Gemini AI.
 * Deterministic checks take precedence for exact pricing, facts, and terminology.
 */
export const combineAndDeduplicateFindings = (deterministicFindings = [], aiFindings = []) => {
  const finalFindings = [...deterministicFindings];

  for (const aiFinding of aiFindings) {
    const aiText = (aiFinding.problematicText || '').toLowerCase().trim();

    // Check if an existing deterministic finding already covers this exact or overlapping phrase
    const matchIndex = finalFindings.findIndex((det) => {
      const detText = (det.problematicText || '').toLowerCase().trim();
      if (!detText || !aiText) return false;

      const pageMatches =
        !det.pageNumber || !aiFinding.pageNumber || det.pageNumber === aiFinding.pageNumber;
      const textOverlaps = detText.includes(aiText) || aiText.includes(detText);
      const typesMatch =
        (det.type.includes('price') && aiFinding.type.includes('price')) ||
        (det.type.includes('terminology') && aiFinding.type.includes('terminology')) ||
        (det.type.includes('fact') && aiFinding.type.includes('fact'));

      return textOverlaps && typesMatch && pageMatches;
    });

    if (matchIndex >= 0) {
      // Enrich deterministic finding with spatial localization from AI if missing
      if (!finalFindings[matchIndex].boundingBox && aiFinding.boundingBox) {
        finalFindings[matchIndex].boundingBox = aiFinding.boundingBox;
      }
      if (!finalFindings[matchIndex].imageRegion && aiFinding.imageRegion) {
        finalFindings[matchIndex].imageRegion = aiFinding.imageRegion;
      }
    } else {
      finalFindings.push(aiFinding);
    }
  }

  return finalFindings;
};

/**
 * Calculates governance metrics, severity counts, and overall compliance score.
 */
export const calculateReviewSummary = (findings = []) => {
  let highSeverityCount = 0;
  let mediumSeverityCount = 0;
  let lowSeverityCount = 0;

  for (const f of findings) {
    if (f.severity === 'high') highSeverityCount += 1;
    else if (f.severity === 'medium') mediumSeverityCount += 1;
    else if (f.severity === 'low') lowSeverityCount += 1;
  }

  // Score starts at 100: -20 for high severity, -10 for medium, -5 for low
  const rawScore = 100 - (highSeverityCount * 20 + mediumSeverityCount * 10 + lowSeverityCount * 5);
  const overallScore = Math.max(0, rawScore);

  let recommendation = 'Content aligns with approved brand guidelines and is ready for human review.';
  if (highSeverityCount > 0) {
    recommendation = 'Content contains high-severity brand guideline or pricing violations that must be corrected.';
  } else if (mediumSeverityCount > 0) {
    recommendation = 'Content requires tone or terminology adjustments to align with brand standards.';
  } else if (lowSeverityCount > 0) {
    recommendation = 'Minor suggestions detected to improve guideline alignment.';
  }

  return {
    totalFindings: findings.length,
    highSeverityCount,
    mediumSeverityCount,
    lowSeverityCount,
    overallScore,
    recommendation,
  };
};

/**
 * Unified Multimodal Review Pipeline.
 * Reviews TEXT, PDF DOCUMENTS, or IMAGES against approved brand rules, facts, terminology, and visual assets.
 *
 * @param {Object} params
 * @param {string} params.brandId - Target brand ID
 * @param {string} [params.content=''] - Text copy if direct text submission
 * @param {string} [params.contentType='text'] - Copy type (e.g., 'text', 'social_post', 'advertisement', 'document', 'image')
 * @param {Object} [params.file] - Uploaded file from multer (buffer, originalname, mimetype, size)
 * @param {string} [params.modality] - Explicit modality ('text', 'document', 'image')
 * @param {string} params.userId - Authenticated user ID
 * @param {string} params.organizationId - User's organization ID
 * @param {string} [params.submissionNote] - Optional submission note
 * @returns {Promise<Object>} Review document and analysis payload
 */
export const executeContentReview = async ({
  brandId,
  content = '',
  contentType = 'text',
  file = null,
  modality: explicitModality,
  userId,
  organizationId,
  submissionNote = 'Initial content submission',
}) => {
  // 1. Fetch Brand & verify organization ownership
  const brand = await Brand.findById(brandId);
  if (!brand) {
    const error = new Error('Brand not found');
    error.statusCode = 404;
    throw error;
  }

  if (brand.organizationId.toString() !== organizationId.toString()) {
    const error = new Error('Forbidden: You cannot review content for another organization brand');
    error.statusCode = 403;
    throw error;
  }

  // 2. Fetch active approved guidelines, verified facts, terminology, and visual assets
  const [guidelines, facts, terminologyRules, visualAssets] = await Promise.all([
    BrandGuideline.find({ brandId, status: 'active' }),
    ApprovedFact.find({ brandId, status: 'active', verificationStatus: 'verified' }),
    TerminologyRule.find({ brandId, status: 'active' }),
    BrandVisualAsset.find({ brandId, status: 'active' }),
  ]);

  const brandContext = {
    brand,
    guidelines,
    facts,
    terminologyRules,
    visualAssets,
  };

  // Collect guideline and fact version snapshots for provenance and staleness checks
  const guidelineVersions = {};
  for (const g of guidelines) {
    guidelineVersions[g._id.toString()] = g.version || 1;
  }
  const factVersions = {};
  for (const f of facts) {
    factVersions[f._id.toString()] = f.version || 1;
  }

  let modality = explicitModality || 'text';
  let processedContent = content || '';
  let fileAsset = null;
  let deterministicFindings = [];
  let aiResult = { findings: [], isPartial: false };
  const warnings = [];

  // ============================================================
  // Input Type Processing
  // ============================================================

  if (file && file.buffer) {
    // Validate file signature to detect true type
    const sig = validateFileSignature(file.buffer, file.originalname);

    if (sig.category === 'document') {
      modality = 'document';
      // 1. Extract PDF content and pages
      const doc = await extractDocumentContent(file.buffer, { declaredName: file.originalname });
      processedContent = doc.fullText || (content || '[Document without extractable text]');

      fileAsset = {
        originalName: file.originalname,
        mimeType: doc.mimeType,
        fileSize: doc.fileSize,
        pageCount: doc.totalPages,
        extractedText: doc.fullText,
        pageSummaries: doc.pages.map((p) => ({
          pageNumber: p.pageNumber,
          characterCount: p.characterCount,
          hasExtractableText: p.hasExtractableText,
        })),
        unanalyzablePages: doc.unanalyzablePages,
      };

      if (doc.unanalyzablePages.length > 0) {
        warnings.push(
          `Pages ${doc.unanalyzablePages.join(', ')} contain little or no extractable text. Scanned or image-only content may require OCR.`
        );
      }

      // 2. Deterministic checks per page
      deterministicFindings = runDeterministicDocumentChecks(doc.pages, brandContext);

      // 3. Gemini document review
      aiResult = await runGeminiDocumentReview({
        pages: doc.pages,
        pdfBuffer: file.buffer,
        brandContext,
      });
    } else if (sig.category === 'image') {
      modality = 'image';
      // 1. Process image with sharp (dimensions, orientation, validation)
      const img = await processImageContent(file.buffer, { declaredName: file.originalname });

      // 2. Gemini multimodal image review (detects both text in image and visual branding)
      aiResult = await runGeminiImageReview({
        imageBuffer: img.buffer,
        mimeType: img.mimeType,
        brandContext,
      });

      const transcribedText = aiResult.extractedText || '';
      processedContent = transcribedText || (content || '[Image without detected text]');

      fileAsset = {
        originalName: file.originalname,
        mimeType: img.mimeType,
        fileSize: img.fileSize,
        dimensions: img.dimensions,
        extractedText: transcribedText,
      };

      // 3. Deterministic brand color checks against prohibited colors
      if (img.dominantColor) {
        const colorFindings = runDeterministicImageColorChecks(img.dominantColor, brandContext);
        deterministicFindings.push(...colorFindings);
      }

      // 4. Deterministic checks on transcribed text from image
      if (transcribedText) {
        deterministicFindings.push(
          ...runDeterministicChecks(transcribedText, brandContext, {
            reviewModality: 'image-text',
          })
        );
      }
    }
  } else {
    // Pure text review
    modality = 'text';
    processedContent = content || '';

    // Step A: Deterministic Rule Checks
    deterministicFindings = runDeterministicChecks(processedContent, brandContext, {
      reviewModality: 'text',
    });

    // Step B: Gemini Contextual AI Review
    aiResult = await runGeminiReview(processedContent, brandContext);
  }

  // Combine and deduplicate findings
  const mergedFindings = combineAndDeduplicateFindings(
    deterministicFindings,
    aiResult.findings || []
  ).map((f) => ({
    ...f,
    analysisVersion: 1,
  }));

  const summary = calculateReviewSummary(mergedFindings);

  if (aiResult.isPartial && aiResult.warning) {
    warnings.push(aiResult.warning);
  }

  const initialStatus = mergedFindings.length > 0 ? 'needs_changes' : 'pending_approval';

  const checksCompleted = {
    deterministicRules: true,
    terminology: true,
    pricingAndFacts: true,
    geminiContextual: !aiResult.isPartial,
  };

  const analyzedAt = new Date();

  // Persist review in MongoDB
  const review = new ContentReview({
    organizationId,
    brandId,
    submittedBy: userId,
    content: processedContent,
    contentType,
    modality,
    fileAsset,
    currentVersion: 1,
    status: initialStatus,
    findings: mergedFindings,
    summary,
    checksCompleted,
    warnings,
    isPartialAnalysis: aiResult.isPartial,
    guidelineVersions,
    factVersions,
    analyzedAt,
    isStale: false,
  });

  await review.save();

  // Create Version 1 snapshot in ReviewRevision
  const revision = new ReviewRevision({
    reviewId: review._id,
    organizationId,
    versionNumber: 1,
    contentSnapshot: processedContent,
    contentType,
    modality,
    fileAsset,
    submittedBy: userId,
    submissionNote,
    findings: mergedFindings,
    summary,
    status: initialStatus,
    checksCompleted,
    warnings,
    isPartialAnalysis: aiResult.isPartial,
    guidelineVersions,
    factVersions,
    analyzedAt,
  });
  await revision.save();

  // Record audit log entry
  await AuditLog.create({
    organizationId,
    reviewId: review._id,
    actorId: userId,
    action: 'review_created',
    versionNumber: 1,
    details: {
      modality,
      hasFile: Boolean(fileAsset),
      findingsCount: mergedFindings.length,
      score: summary.overallScore,
      status: initialStatus,
    },
  });

  return {
    reviewId: review._id.toString(),
    brandId: brand._id.toString(),
    brandName: brand.name,
    status: review.status,
    contentType: review.contentType,
    modality: review.modality,
    fileAsset: review.fileAsset,
    findings: review.findings,
    summary: review.summary,
    checksCompleted: review.checksCompleted,
    warnings: review.warnings,
    isPartialAnalysis: review.isPartialAnalysis,
    createdAt: review.createdAt,
  };
};
