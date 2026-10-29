import sharp from 'sharp';
import { validateFileSignature } from '../utils/fileSignature.js';

export const MAX_IMAGE_SIZE = 15 * 1024 * 1024; // 15 MB
export const MAX_IMAGE_DIMENSION = 8000; // 8000px max width or height

/**
 * Validates, corrects orientation, and inspects image metadata.
 *
 * @param {Buffer} buffer - Raw image buffer
 * @param {Object} [options]
 * @param {string} [options.declaredName] - Declared original filename
 * @returns {Promise<Object>} Processed image metadata and optimized buffer
 */
export const processImageContent = async (buffer, options = {}) => {
  // 1. Enforce size limit
  if (buffer.length > MAX_IMAGE_SIZE) {
    const error = new Error(
      `File size exceeds maximum allowed image limit of ${MAX_IMAGE_SIZE / (1024 * 1024)}MB (received ${(buffer.length / (1024 * 1024)).toFixed(1)}MB)`
    );
    error.statusCode = 400;
    throw error;
  }

  // 2. Validate file signature
  const sig = validateFileSignature(buffer, options.declaredName);
  if (sig.category !== 'image') {
    const error = new Error(`Expected an image file, but received ${sig.mime}`);
    error.statusCode = 400;
    throw error;
  }

  // 3. Inspect and correct orientation with sharp
  let metadata;
  let normalizedBuffer;
  try {
    const image = sharp(buffer);
    metadata = await image.metadata();

    // Check dimensions
    if (!metadata.width || !metadata.height) {
      throw new Error('Image dimensions could not be read or image is corrupt');
    }

    if (metadata.width > MAX_IMAGE_DIMENSION || metadata.height > MAX_IMAGE_DIMENSION) {
      const error = new Error(
        `Image dimensions (${metadata.width}x${metadata.height}) exceed maximum allowed limit of ${MAX_IMAGE_DIMENSION}x${MAX_IMAGE_DIMENSION}`
      );
      error.statusCode = 400;
      throw error;
    }

    // Auto-rotate based on EXIF orientation to ensure upright orientation
    normalizedBuffer = await image.rotate().toBuffer();

    let dominantColor = null;
    try {
      const stats = await image.stats();
      if (stats && stats.channels && stats.channels.length >= 3) {
        const r = Math.round(stats.channels[0].mean);
        const g = Math.round(stats.channels[1].mean);
        const b = Math.round(stats.channels[2].mean);
        dominantColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
      }
    } catch {
      // Non-critical, continue without dominant color
    }

    return {
      mimeType: sig.mime,
      format: sig.ext,
      fileSize: buffer.length,
      dimensions: {
        width: metadata.width,
        height: metadata.height,
      },
      channels: metadata.channels || 3,
      dominantColor,
      buffer: normalizedBuffer,
      base64: normalizedBuffer.toString('base64'),
    };
  } catch (err) {
    if (err.statusCode) throw err;
    const error = new Error(`Malformed or corrupt image: ${err.message}`);
    error.statusCode = 400;
    throw error;
  }
};
