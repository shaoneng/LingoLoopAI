import { Storage } from '@google-cloud/storage';

let storageInstance = null;

export function getStorage() {
  if (!storageInstance) {
    storageInstance = new Storage();
  }
  return storageInstance;
}

export function requireBucketName() {
  const bucketName = process.env.GCS_BUCKET;
  if (!bucketName) {
    const error = new Error('Missing GCS_BUCKET environment variable');
    error.statusCode = 500;
    throw error;
  }
  return bucketName;
}

export function getBucket() {
  const bucketName = requireBucketName();
  return getStorage().bucket(bucketName);
}

export function buildAudioObjectKey({ userId, audioId, filename }) {
  if (!userId || !audioId) {
    throw new Error('userId and audioId are required to build GCS object key');
  }
  const safeFilename = filename && typeof filename === 'string' ? filename : 'audio';
  return `users/${userId}/audio/${audioId}/${safeFilename}`;
}

export function makeGcsUri(bucketName, objectKey) {
  return `gs://${bucketName}/${objectKey}`;
}

export function parseGcsUri(uri) {
  if (!uri || typeof uri !== 'string') return null;
  const match = uri.match(/^gs:\/\/([^/]+)\/(.+)$/i);
  if (!match) return null;
  return { bucket: match[1], key: match[2] };
}

export async function generateV4SignedUrl({ bucketName, objectKey, expiresInSeconds = 600 }) {
  if (!bucketName || !objectKey) {
    throw new Error('Missing bucket name or object key for signed URL');
  }
  const bucket = getStorage().bucket(bucketName);
  const file = bucket.file(objectKey);
  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + Math.max(60, expiresInSeconds) * 1000,
  });
  return url;
}
