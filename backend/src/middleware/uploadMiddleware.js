import multer from 'multer';

// Use memory storage for secure processing without orphaned disk files
const storage = multer.memoryStorage();

// 20MB maximum file size limit
const MAX_UPLOAD_SIZE = 20 * 1024 * 1024;

export const uploadSingleFile = multer({
  storage,
  limits: {
    fileSize: MAX_UPLOAD_SIZE,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    // Basic MIME check; definitive binary signature check happens in pipeline
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/octet-stream', // Often sent by clients for binary files
    ];

    if (allowedMimes.includes(file.mimetype.toLowerCase()) || file.originalname.match(/\.(pdf|jpe?g|png|webp)$/i)) {
      cb(null, true);
    } else {
      const error = new Error('Unsupported file type. Please upload a PDF document or an image (JPEG, PNG, WebP).');
      error.statusCode = 400;
      cb(error);
    }
  },
}).single('file');

/**
 * Express error-handling wrapper for Multer file uploads.
 */
export const handleUpload = (req, res, next) => {
  uploadSingleFile(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: `File size exceeds maximum allowed limit of ${MAX_UPLOAD_SIZE / (1024 * 1024)}MB`,
          });
        }
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`,
        });
      }
      return res.status(err.statusCode || 400).json({
        success: false,
        message: err.message,
      });
    }
    next();
  });
};
