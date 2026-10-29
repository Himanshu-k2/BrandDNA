import { PDFParse } from 'pdf-parse';
import { validateFileSignature } from '../utils/fileSignature.js';

// Document constraints
export const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024; // 20 MB
export const MAX_PAGE_COUNT = 50; // Maximum supported pages per document

/**
 * Extracts per-page text and metadata from a PDF document buffer.
 *
 * @param {Buffer} buffer - PDF file buffer
 * @param {Object} [options]
 * @param {string} [options.declaredName] - Declared original filename
 * @returns {Promise<Object>} Document extraction results
 */
export const extractDocumentContent = async (buffer, options = {}) => {
  // 1. Enforce size limit
  if (buffer.length > MAX_DOCUMENT_SIZE) {
    const error = new Error(
      `File size exceeds maximum allowed document limit of ${MAX_DOCUMENT_SIZE / (1024 * 1024)}MB (received ${(buffer.length / (1024 * 1024)).toFixed(1)}MB)`
    );
    error.statusCode = 400;
    throw error;
  }

  // 2. Validate file signature
  const sig = validateFileSignature(buffer, options.declaredName);
  if (sig.category !== 'document') {
    const error = new Error(`Expected a PDF document, but received ${sig.mime}`);
    error.statusCode = 400;
    throw error;
  }

  // Check for encrypted PDF dictionary
  if (buffer.toString('binary').includes('/Encrypt')) {
    const error = new Error(
      'Password-protected or encrypted PDFs are not supported for automated compliance review'
    );
    error.statusCode = 400;
    throw error;
  }

  // 3. Parse PDF with PDFParse
  let parser;
  try {
    parser = new PDFParse({ data: buffer });
    await parser.load();
  } catch (err) {
    if (/password|encrypt|decrypt/i.test(err.message)) {
      const error = new Error(
        'Password-protected or encrypted PDFs are not supported for automated compliance review'
      );
      error.statusCode = 400;
      throw error;
    }
    const error = new Error(`Malformed or corrupt PDF document: ${err.message}`);
    error.statusCode = 400;
    throw error;
  }

  // Check encryption / password protection
  let info;
  try {
    info = await parser.getInfo();
    if (info?.info?.EncryptFilterName) {
      const error = new Error(
        'Password-protected or encrypted PDFs are not supported for automated compliance review'
      );
      error.statusCode = 400;
      throw error;
    }
  } catch (err) {
    if (err.statusCode) throw err;
    console.warn('Could not inspect PDF encryption status:', err.message);
  }

  // Extract page text
  let textResult;
  try {
    textResult = await parser.getText();
  } catch (err) {
    const error = new Error(`Failed to extract text from PDF: ${err.message}`);
    error.statusCode = 400;
    throw error;
  }

  const totalPages = textResult.total || textResult.pages?.length || 1;

  // 4. Enforce page count limit
  if (totalPages > MAX_PAGE_COUNT) {
    const error = new Error(
      `Document page count (${totalPages} pages) exceeds the maximum allowed limit of ${MAX_PAGE_COUNT} pages`
    );
    error.statusCode = 400;
    throw error;
  }

  // Process per-page extracted text
  const pages = [];
  const unanalyzablePages = [];
  let combinedText = '';

  const rawPages = textResult.pages || [];
  for (let i = 0; i < totalPages; i++) {
    const pageNum = i + 1;
    const rawPage = rawPages.find((p) => p.num === pageNum) || rawPages[i];
    const pageText = (rawPage?.text || '').trim();

    // Check if page has extractable text (at least 5 characters)
    const hasExtractableText = pageText.length >= 5;

    pages.push({
      pageNumber: pageNum,
      text: pageText,
      characterCount: pageText.length,
      hasExtractableText,
    });

    if (hasExtractableText) {
      combinedText += `\n--- Page ${pageNum} ---\n${pageText}\n`;
    } else {
      unanalyzablePages.push(pageNum);
    }
  }

  const isScannedOrImageOnly = pages.every((p) => !p.hasExtractableText);

  return {
    totalPages,
    pages,
    fullText: combinedText.trim(),
    isScannedOrImageOnly,
    unanalyzablePages,
    fileSize: buffer.length,
    mimeType: 'application/pdf',
  };
};
