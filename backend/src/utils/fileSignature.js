/**
 * File Signature (Magic Bytes) Validator.
 * Validates actual binary file signatures rather than trusting client-supplied MIME types or extensions.
 */

// Magic byte signatures for supported formats
const SIGNATURES = {
  // PDF: %PDF- (0x25 0x50 0x44 0x46 0x2D)
  pdf: {
    mime: 'application/pdf',
    ext: 'pdf',
    category: 'document',
    validate: (buf) =>
      buf.length >= 5 &&
      buf[0] === 0x25 &&
      buf[1] === 0x50 &&
      buf[2] === 0x44 &&
      buf[3] === 0x46 &&
      buf[4] === 0x2d,
  },
  // PNG: \x89PNG\r\n\x1a\n (0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A)
  png: {
    mime: 'image/png',
    ext: 'png',
    category: 'image',
    validate: (buf) =>
      buf.length >= 8 &&
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47 &&
      buf[4] === 0x0d &&
      buf[5] === 0x0a &&
      buf[6] === 0x1a &&
      buf[7] === 0x0a,
  },
  // JPEG: \xFF\xD8\xFF (0xFF 0xD8 0xFF)
  jpeg: {
    mime: 'image/jpeg',
    ext: 'jpeg',
    category: 'image',
    validate: (buf) =>
      buf.length >= 3 &&
      buf[0] === 0xff &&
      buf[1] === 0xd8 &&
      buf[2] === 0xff,
  },
  // WebP: RIFF....WEBP (0x52 0x49 0x46 0x46 at 0..3 and 0x57 0x45 0x42 0x50 at 8..11)
  webp: {
    mime: 'image/webp',
    ext: 'webp',
    category: 'image',
    validate: (buf) =>
      buf.length >= 12 &&
      buf[0] === 0x52 &&
      buf[1] === 0x49 &&
      buf[2] === 0x46 &&
      buf[3] === 0x46 &&
      buf[8] === 0x57 &&
      buf[9] === 0x45 &&
      buf[10] === 0x42 &&
      buf[11] === 0x50,
  },
};

/**
 * Validates a buffer and returns its verified signature info.
 *
 * @param {Buffer} buffer - Raw file buffer
 * @param {string} [declaredName=''] - Original filename for mismatch diagnostics
 * @returns {{ ext: string, mime: string, category: 'document'|'image' }}
 * @throws {Error} if file signature is unsupported, malformed, or spoofed
 */
export const validateFileSignature = (buffer, declaredName = '') => {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
    const error = new Error('Invalid file: File buffer is empty or missing');
    error.statusCode = 400;
    throw error;
  }

  for (const [key, sig] of Object.entries(SIGNATURES)) {
    if (sig.validate(buffer)) {
      // If declaredName has an extension, verify it doesn't grossly contradict
      if (declaredName) {
        const declaredExt = declaredName.split('.').pop()?.toLowerCase();
        if (declaredExt) {
          const isJpeg = (declaredExt === 'jpg' || declaredExt === 'jpeg') && key === 'jpeg';
          const matches = declaredExt === sig.ext || isJpeg;
          if (!matches) {
            // Note: signature takes precedence, but we warn or enforce
            console.warn(`File extension mismatch: declared .${declaredExt} but verified binary signature is ${sig.mime}`);
          }
        }
      }
      return {
        ext: sig.ext,
        mime: sig.mime,
        category: sig.category,
      };
    }
  }

  const error = new Error(
    'Unsupported or invalid file signature: File contents do not match an authorized PDF or Image (JPEG, PNG, WebP) format'
  );
  error.statusCode = 400;
  throw error;
};
