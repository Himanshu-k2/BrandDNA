import fs from 'fs';
import path from 'path';
import { extractDocumentContent } from './src/services/documentExtractorService.js';

/**
 * Builds a multi-page valid PDF 1.4 buffer with Helvetica font and standard page layout.
 */
function createPdfFromPages(pages) {
  let nextId = 4;
  const pageObjIds = [];
  pages.forEach(() => {
    pageObjIds.push(nextId);
    nextId += 2;
  });

  const catalog = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
  const pagesObj = `2 0 obj\n<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>\nendobj\n`;
  const fontObj = `3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;

  let body = catalog + pagesObj + fontObj;

  pages.forEach((pageLines, i) => {
    const pageId = pageObjIds[i];
    const streamId = pageId + 1;

    let streamContent = 'BT\n/F1 11 Tf\n54 730 Td\n';
    pageLines.forEach((line, idx) => {
      const sanitized = (line || '').replace(/[()\\]/g, '\\$&');
      if (idx === 0) {
        streamContent += `(${sanitized}) Tj\n`;
      } else {
        const leading = line.startsWith('===') || line.startsWith('BRAND') || line.startsWith('SECTION') ? -24 : -16;
        streamContent += `0 ${leading} Td\n(${sanitized}) Tj\n`;
      }
    });
    streamContent += 'ET';

    const streamObj = `${streamId} 0 obj\n<< /Length ${Buffer.byteLength(streamContent)} >>\nstream\n${streamContent}\nendstream\nendobj\n`;
    const pageObj = `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${streamId} 0 R >>\nendobj\n`;
    body += pageObj + streamObj;
  });

  const fullPdf =
    `%PDF-1.4\n${body}xref\n0 ${nextId}\n0000000000 65535 f \n` +
    `trailer\n<< /Size ${nextId} /Root 1 0 R >>\nstartxref\n${Buffer.byteLength(body) + 9}\n%%EOF`;
  return Buffer.from(fullPdf);
}

// -------------------------------------------------------------------
// NovaFit Official Brand Guidelines 2026 Content
// -------------------------------------------------------------------
const novaFitPages = [
  [
    'NOVAFIT GLOBAL BRAND GUIDELINES & COMPLIANCE SPECIFICATION (2026)',
    '========================================================================',
    'Version: 2026.1 | Classification: Internal & Verified Creators | Status: Active',
    '',
    'SECTION 1: BRAND IDENTITY & LOGO USAGE',
    '------------------------------------------------------------------------',
    'Logo clear space: Maintain 24px clear space on all sides of the flame emblem.',
    'Logo placement: Place on high-contrast backgrounds with zero rotation or skew.',
    'Never alter the flame emblem aspect ratio or separate the icon from wordmark.',
    '',
    'SECTION 2: OFFICIAL COLOR PALETTE',
    '------------------------------------------------------------------------',
    'Primary Brand Color: #FF4500 (Nova Electric Orange - Primary brand energy)',
    'Secondary Neutral Color: #1E1E1E (Dark Slate - Core contrast background)',
    'Accent Highlight Color: #FFFFFF (Pure White - Clean readability)',
    'Prohibited Color: #39FF14 (Acid Green is strictly prohibited across all media)',
    '',
    'SECTION 3: TYPOGRAPHY & TYPEFACES',
    '------------------------------------------------------------------------',
    'Typography: Inter SemiBold for primary headlines and Inter Regular for body copy.',
    'Secondary Accent Typeface: Montserrat Bold for metrics, stats, and prices.',
    'Minimum legible body copy size is 14px on digital displays and social ads.',
    '',
    'SECTION 4: APPROVED FACTS & PRICING',
    '------------------------------------------------------------------------',
    'Official Pricing: Approved subscription price is Rs. 999 / month.',
    'Annual Membership Tier: Approved tier price is Rs. 9999 / year.',
    'Community Claim: Active athletic community exceeding 150,000 verified members.',
  ],
  [
    'NOVAFIT COMPLIANCE STANDARDS (CONTINUED)',
    '========================================================================',
    '',
    'SECTION 5: MANDATORY TERMINOLOGY RULES',
    '------------------------------------------------------------------------',
    'Terminology: Prohibited: "users" -> Preferred: "athletes"',
    'Terminology: Prohibited: "cheap" -> Preferred: "high-value accessible"',
    'Terminology: Prohibited: "guaranteed fat burn" -> Preferred: "scientifically supported"',
    '',
    'SECTION 6: BRAND VOICE & EDITORIAL TONE',
    '------------------------------------------------------------------------',
    'Brand Voice: High-energy, empowering, authentic, and clinically responsible.',
    'Guideline 1: Always include mandatory hydration and warmup disclaimers on posts.',
    'Guideline 2: Never claim medical treatment or rapid weight loss guarantees.',
    'Guideline 3: All photography must depict inclusive body types and proper form.',
    'Guideline 4: Do not include unverified third-party supplement sponsor badges.',
    '',
    'CONFIDENTIAL - PROPERTY OF NOVAFIT ATHLETICS CORP.',
  ],
];

// -------------------------------------------------------------------
// VoltAuto Official Brand Guidelines 2026 Content
// -------------------------------------------------------------------
const voltAutoPages = [
  [
    'VOLTAUTO MOBILITY CORP - BRAND IDENTITY & TECHNICAL GUIDELINES (2026)',
    '========================================================================',
    'Version: 3.4-EV | Target: Marketing, Retail & Digital Creators | Status: Enforced',
    '',
    'SECTION 1: LOGO DESIGN & CLEAR SPACE',
    '------------------------------------------------------------------------',
    'Logo clear space: Maintain 32px clear space around the Volt lightning emblem.',
    'Logo placement: Always positioned in the top-left quadrant on dark backgrounds.',
    'Never recolor the emblem or overlay it on cluttered photographic backgrounds.',
    '',
    'SECTION 2: CORPORATE COLOR SYSTEM',
    '------------------------------------------------------------------------',
    'Primary Brand Color: #00E5FF (Electric Cyan - Clean propulsion innovation)',
    'Secondary Background Color: #0B0F19 (Midnight Slate - Deep engineering dark)',
    'Accent Chrome Color: #E2E8F0 (Silver Alloy - Technical trim & highlight)',
    'Prohibited Color: #FF0033 (Danger Crimson is strictly prohibited in marketing)',
    '',
    'SECTION 3: TYPOGRAPHY HIERARCHY',
    '------------------------------------------------------------------------',
    'Typography: Space Grotesk Bold for hero titles and Roboto Mono for technical specs.',
    'Font weights must adhere to 700 for headlines and 400 for technical parameters.',
    '',
    'SECTION 4: VERIFIED VEHICLE FACTS & PRICING',
    '------------------------------------------------------------------------',
    'Official Pricing: Approved base model price is Rs. 24,99,000 for Volt Alpha EV.',
    'Fast Charging Fact: 10% to 80% charge achieved in 18 minutes on DC hypercharger.',
    'Verified Range: Certified ARAI range of 520 km per single charge cycle.',
  ],
  [
    'VOLTAUTO MOBILITY STANDARDS (CONTINUED)',
    '========================================================================',
    '',
    'SECTION 5: STRICT TERMINOLOGY GOVERNANCE',
    '------------------------------------------------------------------------',
    'Terminology: Prohibited: "car" -> Preferred: "EV"',
    'Terminology: Prohibited: "drivers" -> Preferred: "pilots"',
    'Terminology: Prohibited: "autopilot" -> Preferred: "VoltPilot Copilot Assistance"',
    '',
    'SECTION 6: SAFETY & REGULATORY COMPLIANCE GUIDELINES',
    '------------------------------------------------------------------------',
    'Brand Voice: Engineering precision, quiet confidence, and zero-emission luxury.',
    'Guideline 1: Ensure vehicle parking brake is engaged prior to connector insertion.',
    'Guideline 2: Always display ARAI certified range disclaimer in 10pt minimum font.',
    'Guideline 3: Never depict reckless driving or hands completely off steering wheel.',
    'Guideline 4: All charger installations must cite licensed electrician requirement.',
    '',
    'CONFIDENTIAL - PROPERTY OF VOLTAUTO MOBILITY CORP.',
  ],
];

async function main() {
  console.log('Generating Brand Guideline PDFs...');

  const novaPdfBuffer = createPdfFromPages(novaFitPages);
  const voltPdfBuffer = createPdfFromPages(voltAutoPages);

  // Validate extraction on both
  console.log('Verifying NovaFit PDF extraction...');
  const novaExtraction = await extractDocumentContent(novaPdfBuffer, { declaredName: 'NovaFit_Brand_Guidelines_2026.pdf' });
  console.log('NovaFit text length:', novaExtraction.fullText.length);

  console.log('Verifying VoltAuto PDF extraction...');
  const voltExtraction = await extractDocumentContent(voltPdfBuffer, { declaredName: 'VoltAuto_Brand_Guidelines_2026.pdf' });
  console.log('VoltAuto text length:', voltExtraction.fullText.length);

  // Target directories
  const desktopDir = 'C:/Users/shekr/Desktop';
  const publicDir = path.resolve('../frontend/public');
  const rootDir = path.resolve('..');

  const files = [
    { name: 'NovaFit_Brand_Guidelines_2026.pdf', buffer: novaPdfBuffer },
    { name: 'VoltAuto_Brand_Guidelines_2026.pdf', buffer: voltPdfBuffer },
  ];

  for (const { name, buffer } of files) {
    // 1. Desktop
    try {
      const desktopPath = path.join(desktopDir, name);
      fs.writeFileSync(desktopPath, buffer);
      console.log(`Saved to Desktop: ${desktopPath} (${buffer.length} bytes)`);
    } catch (e) {
      console.warn(`Could not save to desktop: ${e.message}`);
    }

    // 2. Frontend public
    try {
      const pubPath = path.join(publicDir, name);
      fs.writeFileSync(pubPath, buffer);
      console.log(`Saved to public: ${pubPath} (${buffer.length} bytes)`);
    } catch (e) {
      console.warn(`Could not save to public: ${e.message}`);
    }

    // 3. Project root
    try {
      const rPath = path.join(rootDir, name);
      fs.writeFileSync(rPath, buffer);
      console.log(`Saved to project root: ${rPath} (${buffer.length} bytes)`);
    } catch (e) {
      console.warn(`Could not save to root: ${e.message}`);
    }
  }

  console.log('Brand Guideline PDFs successfully generated!');
}

main().catch(console.error);

