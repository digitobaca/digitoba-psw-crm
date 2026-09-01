const path = require('path');
const fs = require('fs');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

/**
 * File storage for uploaded documents. Cloudflare R2 is S3-compatible, so
 * the standard AWS SDK works against it unchanged — just a different
 * endpoint and no egress fees. Falls back to writing straight to
 * server/uploads/ when R2 isn't configured, so local dev and this app's
 * existing "stub until a provider is set" pattern (see messaging.js,
 * sendEmail.js) keep working with zero setup.
 *
 * IMPORTANT: local-disk storage does NOT survive a deploy on almost any
 * host (Railway/Render/etc. wipe the filesystem on every deploy/restart) —
 * R2 must be configured before going to production, not after.
 */
const R2_CONFIGURED = Boolean(
  process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET_NAME && process.env.R2_PUBLIC_URL
);

let s3Client = null;
if (R2_CONFIGURED) {
  s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
} else {
  console.warn('[storage] R2 not configured — uploads are being written to local disk (server/uploads/). This will NOT survive a deploy on most hosts. See server/.env.example.');
}

const LOCAL_UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

const randomKey = (originalname) => {
  const ext = path.extname(originalname);
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
};

/**
 * Saves a file (from multer's memoryStorage — `file.buffer`) and returns
 * the URL to store as `Document.fileUrl`. R2 when configured; local disk
 * otherwise. Every consumer just stores/reads this URL, same as before —
 * `client/src/lib/utils.js`'s `resolveFileUrl` handles both an absolute R2
 * URL and a relative `/uploads/...` local path.
 */
const saveUploadedFile = async (file) => {
  const key = randomKey(file.originalname);

  if (s3Client) {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );
    return `${process.env.R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`;
  }

  if (!fs.existsSync(LOCAL_UPLOAD_DIR)) fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
  fs.writeFileSync(path.join(LOCAL_UPLOAD_DIR, key), file.buffer);
  return `/uploads/${key}`;
};

/** Deletes a previously-saved file — mirrors saveUploadedFile's R2-or-local branching. */
const deleteUploadedFile = async (fileUrl) => {
  if (!fileUrl) return;
  try {
    if (s3Client && fileUrl.startsWith(process.env.R2_PUBLIC_URL)) {
      const key = fileUrl.slice(process.env.R2_PUBLIC_URL.replace(/\/$/, '').length + 1);
      await s3Client.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key }));
    } else if (fileUrl.startsWith('/uploads/')) {
      const localPath = path.join(LOCAL_UPLOAD_DIR, fileUrl.replace('/uploads/', ''));
      if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
    }
  } catch (err) {
    // Never let a storage cleanup failure block the actual delete the user asked for.
    console.error('File cleanup failed (non-fatal):', err.message);
  }
};

module.exports = { saveUploadedFile, deleteUploadedFile, R2_CONFIGURED };
