const multer = require('multer');

/**
 * Parses the incoming multipart file into memory (`req.file.buffer`)
 * instead of writing straight to disk — `server/utils/storage.js` then
 * sends that buffer to R2 (or local disk as a fallback) from there. Keeping
 * multer's own job limited to "parse the upload" means the actual storage
 * destination can change without touching this file.
 */
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error('Unsupported file type. Please upload a PDF, Word document, or image.'));
  }
  cb(null, true);
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

module.exports = { upload };
