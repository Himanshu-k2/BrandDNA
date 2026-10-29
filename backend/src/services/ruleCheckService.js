import mongoose from 'mongoose';

/**
 * Deterministic Rule Checker
 * Executes exact JavaScript pattern matching for terminology, pricing, and required phrases.
 */

// Helper to escape special regex characters
const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Normalizes numeric price strings (e.g. "₹999", "999", "Rs. 999", "999.00" -> 999)
 */
const extractPriceNumber = (str) => {
  if (!str) return null;
  const match = str.replace(/,/g, '').match(/(\d+(?:\.\d{1,2})?)/);
  return match ? parseFloat(match[1]) : null;
};

/**
 * Runs deterministic rule checks on submitted text.
 *
 * @param {string} content - Raw content text submitted for review
 * @param {Object} brandContext - Approved guidelines, facts, and terminology
 * @param {Object} [meta={}] - Optional metadata (pageNumber, reviewModality)
 * @returns {Array<Object>} List of standardized finding objects
 */
export const runDeterministicChecks = (content, brandContext, meta = {}) => {
  const findings = [];
  const { terminologyRules = [], facts = [], guidelines = [] } = brandContext;
  const pageNumber = meta.pageNumber ?? null;
  const reviewModality = meta.reviewModality || 'text';

  // -------------------------------------------------------------
  // 1. Terminology Rules (Prohibited vs. Preferred Terms)
  // -------------------------------------------------------------
  for (const rule of terminologyRules) {
    if (rule.status !== 'active' || !rule.prohibitedTerm) continue;

    const term = rule.prohibitedTerm.trim();
    const flags = rule.caseSensitive ? 'g' : 'gi';
    // Match whole words to avoid sub-word false positives (e.g., "users" shouldn't match "browser")
    const regex = new RegExp(`\\b${escapeRegex(term)}\\b`, flags);

    let match;
    const seenMatches = new Set();
    while ((match = regex.exec(content)) !== null) {
      const matchedWord = match[0];
      if (seenMatches.has(matchedWord.toLowerCase())) continue;
      seenMatches.add(matchedWord.toLowerCase());

      const preferred = rule.preferredTerm || rule.replacementSuggestion || 'approved term';

      findings.push({
        findingId: new mongoose.Types.ObjectId().toString(),
        type: 'terminology_violation',
        severity: 'medium',
        problematicText: matchedWord,
        explanation:
          rule.explanation ||
          `The term '${matchedWord}' is prohibited by brand terminology guidelines. Use '${preferred}' instead.`,
        suggestedCorrection: rule.replacementSuggestion || rule.preferredTerm,
        sourceType: 'terminology_rule',
        sourceId: rule._id ? rule._id.toString() : null,
        confidence: 'high',
        analysisStatus: 'confirmed_mismatch',
        pageNumber,
        reviewModality,
        evidence: pageNumber ? `Prohibited term '${matchedWord}' detected on page ${pageNumber}` : `Prohibited term '${matchedWord}' detected`,
      });
    }
  }

  // -------------------------------------------------------------
  // 2. Approved Facts - Pricing Checks
  // -------------------------------------------------------------
  const pricingFacts = facts.filter(
    (f) =>
      f.status === 'active' &&
      (f.category === 'pricing' ||
        f.key.includes('price') ||
        f.key.includes('fee') ||
        f.key.includes('subscription'))
  );

  if (pricingFacts.length > 0) {
    // Regex matching currency indicators: ₹799, Rs 799, INR 799, $799, 799 rupees, or "priced at 799", "costs 799", "fee of 799"
    const priceRegex =
      /(?:₹|Rs\.?|INR|\$)\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)|(?:costs?|pricing|fee(?:\s+is|\s+of)?|priced\s+at)\s+(?:only\s+|just\s+)?(?:₹|Rs\.?|INR|\$)?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)|(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:rupees|rs\.?|inr)/gi;

    let priceMatch;
    const foundPricesInText = [];

    while ((priceMatch = priceRegex.exec(content)) !== null) {
      const rawMatch = priceMatch[0];
      const numericVal = extractPriceNumber(priceMatch[1] || priceMatch[2] || priceMatch[3]);
      if (numericVal !== null) {
        foundPricesInText.push({ raw: rawMatch.trim(), num: numericVal });
      }
    }

    // Set of all approved prices for this brand
    const approvedPrices = pricingFacts
      .map((f) => ({ fact: f, num: extractPriceNumber(f.value) }))
      .filter((item) => item.num !== null);

    const approvedPriceNums = new Set(approvedPrices.map((p) => p.num));

    for (const found of foundPricesInText) {
      // If the found price matches ANY approved price fact in the brand, it's valid!
      if (approvedPriceNums.has(found.num)) {
        continue;
      }

      // If it doesn't match any approved price fact, it is an unapproved / incorrect price
      const primaryFact = approvedPrices[0]?.fact;
      const expectedText = primaryFact ? `(${primaryFact.key.replace(/_/g, ' ')}: ${primaryFact.value})` : '';

      findings.push({
        findingId: new mongoose.Types.ObjectId().toString(),
        type: 'incorrect_price',
        severity: 'high',
        problematicText: found.raw,
        explanation: `The quoted price of ${found.raw} contradicts the approved brand pricing ${expectedText}.`,
        suggestedCorrection: primaryFact
          ? `Replace ${found.raw} with the approved price of ${primaryFact.value}.`
          : 'Use an approved pricing figure.',
        sourceType: 'approved_fact',
        sourceId: primaryFact?._id ? primaryFact._id.toString() : null,
        confidence: 'high',
        analysisStatus: 'confirmed_mismatch',
        pageNumber,
        reviewModality,
        evidence: pageNumber ? `Price discrepancy '${found.raw}' identified on page ${pageNumber}` : `Price discrepancy '${found.raw}' identified`,
      });
    }
  }

  // -------------------------------------------------------------
  // 3. Brand Guidelines - Required Phrases
  // -------------------------------------------------------------
  const requiredPhraseGuidelines = guidelines.filter(
    (g) => g.status === 'active' && g.category === 'Required phrases'
  );

  for (const guideline of requiredPhraseGuidelines) {
    // Check if the guideline rule specifies a quoted phrase, e.g. 'Must include "..."'
    const quotedMatch = guideline.ruleText.match(/["']([^"']{3,})["']/);
    const targetPhrase = quotedMatch ? quotedMatch[1] : null;

    if (targetPhrase) {
      const hasPhrase = content.toLowerCase().includes(targetPhrase.toLowerCase());
      if (!hasPhrase) {
        findings.push({
          findingId: new mongoose.Types.ObjectId().toString(),
          type: 'required_phrase_missing',
          severity: guideline.severity || 'medium',
          problematicText: '',
          explanation: `Mandatory phrase missing: "${targetPhrase}" is required by brand guidelines.`,
          suggestedCorrection: `Include "${targetPhrase}" in the copy.`,
          sourceType: 'brand_guideline',
          sourceId: guideline._id ? guideline._id.toString() : null,
          confidence: 'high',
          analysisStatus: 'guideline_violation',
          pageNumber,
          reviewModality,
          evidence: `Required phrase "${targetPhrase}" was not found in the content`,
        });
      }
    }
  }

  return findings;
};

/**
 * Runs deterministic checks across all pages of a PDF document.
 */
export const runDeterministicDocumentChecks = (pages, brandContext) => {
  const allFindings = [];

  // Combine full text to check global required phrases once
  const fullDocText = pages.map((p) => p.text).join('\n');

  for (const page of pages) {
    if (!page.hasExtractableText) continue;
    // Check terms and pricing per page
    const pageFindings = runDeterministicChecks(page.text, brandContext, {
      pageNumber: page.pageNumber,
      reviewModality: 'document',
    });
    // Filter out required_phrase_missing per page, since disclaimers can appear on any page
    const filtered = pageFindings.filter((f) => f.type !== 'required_phrase_missing');
    allFindings.push(...filtered);
  }

  // Check required phrases globally across the entire document
  const { guidelines = [] } = brandContext;
  const requiredPhraseGuidelines = guidelines.filter(
    (g) => g.status === 'active' && g.category === 'Required phrases'
  );
  for (const guideline of requiredPhraseGuidelines) {
    const quotedMatch = guideline.ruleText.match(/["']([^"']{3,})["']/);
    const targetPhrase = quotedMatch ? quotedMatch[1] : null;
    if (targetPhrase && !fullDocText.toLowerCase().includes(targetPhrase.toLowerCase())) {
      allFindings.push({
        findingId: new mongoose.Types.ObjectId().toString(),
        type: 'required_phrase_missing',
        severity: guideline.severity || 'medium',
        problematicText: '',
        explanation: `Mandatory phrase missing: "${targetPhrase}" is required by brand guidelines across the document.`,
        suggestedCorrection: `Include "${targetPhrase}" in the document.`,
        sourceType: 'brand_guideline',
        sourceId: guideline._id ? guideline._id.toString() : null,
        confidence: 'high',
        analysisStatus: 'guideline_violation',
        pageNumber: null,
        reviewModality: 'document',
        evidence: `Required phrase "${targetPhrase}" was not found on any page`,
      });
    }
  }

  return allFindings;
};

/**
 * Runs deterministic brand color checks against prohibited brand palette colors.
 *
 * @param {string|null} dominantColorHex - Hex code of dominant color in image
 * @param {Object} brandContext - Brand context with visualIdentity and visualAssets
 * @returns {Array<Object>} Deterministic visual findings
 */
export const runDeterministicImageColorChecks = (dominantColorHex, brandContext) => {
  const findings = [];
  if (!dominantColorHex) return findings;

  const hexNorm = dominantColorHex.trim().toUpperCase();
  const brandProhibited = brandContext.brand?.visualIdentity?.prohibitedColors || [];
  const assetProhibited = (brandContext.visualAssets || [])
    .filter((a) => a.assetType === 'color_palette' && a.rules?.prohibitedColors)
    .flatMap((a) => a.rules.prohibitedColors);

  const allProhibited = [...new Set([...brandProhibited, ...assetProhibited])].map((c) =>
    c.trim().toUpperCase()
  );

  for (const prohibited of allProhibited) {
    if (prohibited === hexNorm) {
      const primaryColors = brandContext.brand?.visualIdentity?.primaryColors;
      const primarySuggestion =
        primaryColors && primaryColors.length > 0
          ? `Replace with approved brand primary color (${primaryColors.join(', ')})`
          : 'Use approved brand colors';

      findings.push({
        findingId: new mongoose.Types.ObjectId().toString(),
        type: 'color_palette_mismatch',
        severity: 'high',
        problematicText: hexNorm,
        explanation: `Image uses prohibited brand color ${hexNorm}, violating brand visual governance guidelines.`,
        suggestedCorrection: primarySuggestion,
        sourceType: 'brand_guideline',
        sourceId: null,
        confidence: 'high',
        analysisStatus: 'visual_branding_violation',
        pageNumber: null,
        boundingBox: null,
        imageRegion: 'dominant_color',
        evidence: `Extracted image color ${hexNorm} matches prohibited brand color ${prohibited}`,
        reviewModality: 'visual-branding',
      });
    }
  }

  return findings;
};

