import mongoose from 'mongoose';
import GuidelineDocument from '../models/GuidelineDocument.js';
import Brand from '../models/Brand.js';
import BrandGuideline from '../models/BrandGuideline.js';
import ApprovedFact from '../models/ApprovedFact.js';
import TerminologyRule from '../models/TerminologyRule.js';
import BrandVisualAsset from '../models/BrandVisualAsset.js';
import { extractDocumentContent } from '../services/documentExtractorService.js';
import { isGeminiConfigured, getGeminiClient, getGeminiModelName } from '../config/gemini.js';

/**
 * Intelligent Rule Extractor from raw guideline text.
 * Deterministic extraction with robust pattern matching for PDF & text guidelines.
 */
export function extractRulesFromText(text, brandName = 'Brand') {
  const items = [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // 1. Color Palette Extraction
  const hexMatch = text.match(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})/g);
  if (hexMatch && hexMatch.length > 0) {
    const uniqueHex = [...new Set(hexMatch.map((h) => h.toUpperCase()))];
    const prohibitedColors = [];
    const prohRegex = /prohibited\s*color[s]?:?\s*(#[0-9a-fA-F]{6})/gi;
    let pm;
    while ((pm = prohRegex.exec(text)) !== null) {
      if (pm[1]) prohibitedColors.push(pm[1].toUpperCase());
    }

    const approvedHex = uniqueHex.filter((h) => !prohibitedColors.includes(h));

    items.push({
      _id: new mongoose.Types.ObjectId(),
      type: 'visual_asset',
      title: `${brandName} Official Color Palette`,
      severity: 'critical',
      content: `Approved Brand Colors: ${approvedHex.join(', ')}.${prohibitedColors.length > 0 ? ` Strictly Prohibited colors: ${prohibitedColors.join(', ')}.` : ''}`,
      status: 'pending',
    });
  }

  // 2. Logo Rules Extraction
  const logoMatch = text.match(/(logo[^\.\n]*?(clear space|padding|margin|rotate|placement|dimension)[^\.\n]*?\.)/i);
  if (logoMatch) {
    items.push({
      _id: new mongoose.Types.ObjectId(),
      type: 'visual_asset',
      title: `${brandName} Logo Clear Space & Usage Rules`,
      severity: 'critical',
      content: logoMatch[1].trim(),
      status: 'pending',
    });
  } else {
    const logoLine = lines.find((l) => /logo/i.test(l) && !/guidelines/i.test(l));
    if (logoLine) {
      items.push({
        _id: new mongoose.Types.ObjectId(),
        type: 'visual_asset',
        title: `${brandName} Logo Identity & Presentation Standards`,
        severity: 'critical',
        content: logoLine,
        status: 'pending',
      });
    }
  }

  // 3. Typography Extraction
  const typoMatch = text.match(/(typography|font|typeface)[^\.\n]*?:\s*([^\.\n]+)/i);
  if (typoMatch) {
    items.push({
      _id: new mongoose.Types.ObjectId(),
      type: 'visual_asset',
      title: `${brandName} Typography & Typeface Guidelines`,
      severity: 'warning',
      content: `Official Typography: ${typoMatch[2].trim()}`,
      status: 'pending',
    });
  }

  // 4. Approved Pricing & Facts
  const priceMatches = text.match(/(?:₹|\$|rs\.?|inr|usd|eur|gbp)\s*[\d,]+(?:\s*\/\s*(?:month|mo|year|yr|pass|session))?/gi);
  if (priceMatches && priceMatches.length > 0) {
    const uniquePrices = [...new Set(priceMatches.map((p) => p.trim()))];
    uniquePrices.slice(0, 3).forEach((price, idx) => {
      const keyName = idx === 0 ? 'standard_pricing_tier' : `pricing_tier_${idx + 1}`;
      items.push({
        _id: new mongoose.Types.ObjectId(),
        type: 'fact',
        title: `Official Pricing Tier (${price})`,
        severity: 'critical',
        content: `Approved official price is ${price}. All promotional marketing must reflect this exact price.`,
        factKey: keyName,
        factValue: price,
        status: 'pending',
      });
    });
  }

  // 5. Terminology Rules (Prohibited Terms vs Preferred Terms)
  let termCount = 0;
  for (const line of lines) {
    const m = line.match(/(?:prohibited|never use|don't use|do not use):\s*["']?([^"'\n>–-]+?)["']?\s*(?:->|–>|preferred:|\/|instead use|always use)\s*(?:preferred:)?\s*["']?([^"'\n\r]+?)["']?$/i);
    if (m && termCount < 5) {
      const prohibited = m[1].replace(/["']/g, '').trim();
      const preferred = m[2].replace(/["']/g, '').trim();
      if (prohibited && preferred && prohibited.toLowerCase() !== preferred.toLowerCase()) {
        items.push({
          _id: new mongoose.Types.ObjectId(),
          type: 'terminology',
          title: `Terminology Rule: "${prohibited}" → "${preferred}"`,
          severity: 'critical',
          content: `Never use the term "${prohibited}". Always use approved brand term "${preferred}".`,
          prohibitedTerm: prohibited,
          preferredTerm: preferred,
          status: 'pending',
        });
        termCount++;
      }
    }
  }

  // Fallback terminology if structured pattern didn't capture
  if (termCount === 0 && /users?/i.test(text) && /(members?|athletes?|pilots?)/i.test(text)) {
    const pref = text.match(/pilots?/i) ? 'pilots' : text.match(/athletes?/i) ? 'athletes' : 'members';
    items.push({
      _id: new mongoose.Types.ObjectId(),
      type: 'terminology',
      title: `Customer Terminology: "users" → "${pref}"`,
      severity: 'critical',
      content: `Prohibited term: "users". Always refer to registered customers as "${pref}".`,
      prohibitedTerm: 'users',
      preferredTerm: pref,
      status: 'pending',
    });
  }

  // 6. Core Tone & Brand Voice Guidelines
  const toneMatch = text.match(/(tone|voice|brand voice)[^\.\n]*?:\s*([^\.\n]+)/i);
  if (toneMatch) {
    items.push({
      _id: new mongoose.Types.ObjectId(),
      type: 'guideline',
      title: `${brandName} Voice & Tone Standards`,
      severity: 'warning',
      content: `Tone of Voice: ${toneMatch[2].trim()}`,
      status: 'pending',
    });
  }

  // 7. General guideline policy bullet points
  const guideRegex = /^(?:guideline\s*\d*[:.]?|\d+[.:)]|[-•*])\s+[A-Z]/i;
  const guidelineBullets = lines.filter((l) => guideRegex.test(l) && l.length > 20);
  guidelineBullets.slice(0, 4).forEach((bullet, idx) => {
    const cleanContent = bullet.replace(/^(?:guideline\s*\d*[:.]?|\d+[.:)]|[-•*])\s+/i, '');
    items.push({
      _id: new mongoose.Types.ObjectId(),
      type: 'guideline',
      title: `Brand Policy Rule #${idx + 1}`,
      severity: idx === 0 ? 'critical' : 'warning',
      content: cleanContent,
      status: 'pending',
    });
  });

  return items;
}

/**
 * @route   GET /api/brands/:id/documents
 * @desc    Get all guideline source documents uploaded for a brand
 * @access  Private (Admin, Brand Manager)
 */
export const getBrandDocuments = async (req, res, next) => {
  try {
    let brandId = null;
    const organizationId = req.user.organizationId;
    if (req.params.id && mongoose.Types.ObjectId.isValid(req.params.id)) {
      const brand = await Brand.findById(req.params.id);
      if (brand) {
        if (brand.organizationId.toString() !== organizationId.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Forbidden: You cannot access documents from another organization',
          });
        }
        brandId = brand._id;
      }
    }
    if (!brandId) {
      const activeBrand = await Brand.findOne({ organizationId, status: 'active' });
      if (activeBrand) brandId = activeBrand._id;
    }
    if (!brandId) {
      return res.status(200).json({ success: true, data: { documents: [] }, documents: [] });
    }

    const documents = await GuidelineDocument.find({ brandId, organizationId })
      .select('-rawText')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { documents },
      documents,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/brands/:id/documents/:docId
 * @desc    Get a single guideline document with full extracted items
 * @access  Private (Admin, Brand Manager)
 */
export const getBrandDocumentById = async (req, res, next) => {
  try {
    const doc = await GuidelineDocument.findById(req.params.docId);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Guideline document not found' });
    }
    if (doc.organizationId && doc.organizationId.toString() !== req.user.organizationId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot access documents from another organization',
      });
    }

    res.status(200).json({
      success: true,
      data: { document: doc },
      document: doc,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/brands/:id/documents
 * @desc    Upload brand guideline PDF or raw text and automatically extract candidate rules
 * @access  Private (Admin, Brand Manager)
 */
export const uploadBrandDocument = async (req, res, next) => {
  try {
    let brand = null;
    if (req.params.id && mongoose.Types.ObjectId.isValid(req.params.id)) {
      brand = await Brand.findById(req.params.id);
    }
    if (!brand) {
      brand = await Brand.findOne({ status: 'active' });
    }
    if (!brand) {
      brand = await Brand.create({
        name: 'NovaFit',
        description: 'Subscription fitness and wellness app',
        tone: 'Professional and encouraging',
        organizationId: req.user.organizationId,
        createdBy: req.user._id,
      });
    }

    let rawText = '';
    let filename = 'brand_guidelines.txt';
    let fileSize = 0;
    let mimeType = 'text/plain';

    if (req.file) {
      filename = req.file.originalname;
      fileSize = req.file.size || req.file.buffer.length;
      mimeType = req.file.mimetype;

      if (mimeType.includes('pdf') || filename.toLowerCase().endsWith('.pdf')) {
        const docResult = await extractDocumentContent(req.file.buffer, { declaredName: filename });
        rawText = docResult.fullText || '';
      } else {
        rawText = req.file.buffer.toString('utf8');
      }
    } else if (req.body.rawText) {
      rawText = req.body.rawText;
      filename = req.body.filename || 'brand_guidelines_paste.txt';
      fileSize = Buffer.byteLength(rawText, 'utf8');
    } else {
      return res.status(400).json({
        success: false,
        message: 'No file or rawText provided. Please upload a PDF or enter guideline text.',
      });
    }

    // Extract Candidate Items from text
    const extractedItems = extractRulesFromText(rawText, brand.name);

    const newDoc = new GuidelineDocument({
      brandId: brand._id,
      organizationId: req.user.organizationId,
      uploadedBy: req.user._id,
      filename,
      fileSize,
      mimeType,
      rawText,
      status: 'in_review',
      extractedItems,
    });

    await newDoc.save();

    res.status(201).json({
      success: true,
      message: `Document processed successfully. Extracted ${extractedItems.length} candidate items.`,
      data: { document: newDoc },
      document: newDoc,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/brands/:id/documents/:docId/items/:itemId
 * @desc    Approve or reject an extracted candidate item into official brand guidelines
 * @access  Private (Admin, Brand Manager)
 */
export const reviewExtractedItem = async (req, res, next) => {
  try {
    const { action } = req.body; // 'approve' or 'reject'
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be "approve" or "reject"' });
    }

    const doc = await GuidelineDocument.findById(req.params.docId);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const item = doc.extractedItems.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Extracted item not found' });
    }

    item.status = action === 'approve' ? 'approved' : 'rejected';

    // If approved, insert into official database models
    if (action === 'approve') {
      const brandId = doc.brandId;
      const organizationId = doc.organizationId;
      const userId = req.user._id;

      if (item.type === 'guideline') {
        await BrandGuideline.create({
          brandId,
          organizationId,
          createdBy: userId,
          title: item.title,
          category: 'general',
          ruleText: item.content,
          severity: item.severity === 'critical' ? 'critical' : item.severity === 'warning' ? 'high' : 'medium',
          status: 'active',
        });
      } else if (item.type === 'fact') {
        await ApprovedFact.create({
          brandId,
          organizationId,
          createdBy: userId,
          key: item.factKey || item.title.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          value: item.factValue || item.content,
          category: 'pricing',
          description: item.content,
          verificationStatus: 'verified',
          status: 'active',
        });
      } else if (item.type === 'terminology') {
        if (item.prohibitedTerm) {
          const existing = await TerminologyRule.findOne({ brandId, prohibitedTerm: item.prohibitedTerm.toLowerCase() });
          if (!existing) {
            await TerminologyRule.create({
              brandId,
              organizationId,
              createdBy: userId,
              prohibitedTerm: item.prohibitedTerm,
              preferredTerm: item.preferredTerm || '',
              replacementSuggestion: item.preferredTerm || '',
              explanation: item.content,
              status: 'active',
            });
          }
        }
      } else if (item.type === 'visual_asset') {
        await BrandVisualAsset.create({
          brandId,
          organizationId,
          createdBy: userId,
          name: item.title,
          assetType: item.title.toLowerCase().includes('color') ? 'color_palette' : 'logo',
          details: { notes: item.content },
          status: 'active',
        });
      }

      // Automatically sync approved specs and assets directly onto the Brand model
      const brand = await Brand.findById(brandId);
      if (brand) {
        if (!brand.assets) brand.assets = [];

        if (item.type === 'visual_asset' && /color/i.test(item.title)) {
          const hexes = item.content.match(/#[0-9a-fA-F]{6}/gi);
          if (hexes && hexes.length > 0) {
            brand.primaryColor = hexes[0].toUpperCase();
            if (hexes[1]) brand.secondaryColor = hexes[1].toUpperCase();
            if (!brand.visualIdentity) brand.visualIdentity = {};
            brand.visualIdentity.primaryColors = [brand.primaryColor];
            brand.visualIdentity.secondaryColors = hexes.slice(1).map((h) => h.toUpperCase());
          }
          brand.assets.push({
            name: item.title,
            type: 'color',
            data: hexes ? hexes.join(', ') : item.content,
            description: item.content,
          });
        } else if (item.type === 'visual_asset' && /typography|font/i.test(item.title)) {
          if (!brand.fonts) brand.fonts = {};
          if (/inter/i.test(item.content)) {
            brand.fonts.heading = 'Inter SemiBold (600)';
            brand.fonts.primary = 'Inter Regular (400)';
            brand.fonts.secondary = 'Montserrat Bold (700)';
          } else if (/space grotesk/i.test(item.content)) {
            brand.fonts.heading = 'Space Grotesk Bold (700)';
            brand.fonts.primary = 'Roboto Mono (400)';
          } else {
            brand.fonts.heading = item.content.split(/[:.]/)[0] || 'Inter SemiBold';
            brand.fonts.primary = 'Inter Regular';
          }
          brand.assets.push({
            name: item.title,
            type: 'typography',
            data: brand.fonts.heading,
            description: item.content,
          });
        } else if (item.type === 'visual_asset' && /logo/i.test(item.title)) {
          brand.assets.push({
            name: item.title,
            type: 'logo',
            data: 'Clear space & positioning rule',
            description: item.content,
          });
        } else if (item.type === 'fact') {
          if (!brand.officialClaims) brand.officialClaims = [];
          brand.officialClaims.push({ claim: item.content, verified: true });
          brand.assets.push({
            name: item.title,
            type: 'claim',
            data: item.factValue || item.content,
            description: item.content,
          });
        } else if (item.type === 'terminology') {
          brand.assets.push({
            name: item.title,
            type: 'terminology',
            data: `Prohibited: ${item.prohibitedTerm} -> Preferred: ${item.preferredTerm}`,
            description: item.content,
          });
        }

        await brand.save();
      }
    }

    // Check overall document status
    const pendingCount = doc.extractedItems.filter((i) => i.status === 'pending').length;
    doc.status = pendingCount === 0 ? 'completed' : 'in_review';

    await doc.save();

    res.status(200).json({
      success: true,
      message: action === 'approve' ? 'Item approved and added to official brand guidelines' : 'Item rejected',
      data: {
        item,
        docStatus: doc.status,
      },
      item,
      docStatus: doc.status,
    });
  } catch (error) {
    next(error);
  }
};
