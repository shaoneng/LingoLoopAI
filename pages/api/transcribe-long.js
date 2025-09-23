import { setCors } from '../../lib/cors';
import { recognizeGcsUri } from '../../lib/googleSpeech';

// Backwards compatibility: this endpoint now proxies to the new upload pipeline structure.
// For direct file uploads we still accept multipart data (legacy demo usage).
import formidable from 'formidable';
import fs from 'fs/promises';
import { Storage } from '@google-cloud/storage';
import crypto from 'crypto';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function parseMultipart(req) {
  const form = formidable({ multiples: false, keepExtensions: true });
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const bucketName = process.env.GCS_BUCKET;
    if (!bucketName) {
      return res.status(500).json({ error: 'Missing GCS_BUCKET env for long transcription' });
    }

    const { fields, files } = await parseMultipart(req);
    const language = fields.language?.toString() || 'en-US';
    const gapSec = Number(fields.gapSec || 0.6);
    const maxDurSec = Number(fields.maxDurSec || 10);
    const minSpeakerCount = Number(fields.minSpeakerCount || process.env.SPEAKER_MIN_COUNT || 1);
    const maxSpeakerCount = Number(fields.maxSpeakerCount || process.env.SPEAKER_MAX_COUNT || 4);

    const fileObj = files.file || files.audio || files.upload;
    if (!fileObj) return res.status(400).json({ error: 'No file field provided (expected name: file)' });
    const f = Array.isArray(fileObj) ? fileObj[0] : fileObj;
    const localPath = f.filepath || f.path;
    const contentType = f.mimetype || f.mime || 'application/octet-stream';

    // Upload legacy file to GCS temporary location
    const storage = new Storage();
    const buffer = await fs.readFile(localPath);
    const name = `legacy/${Date.now()}_${crypto.randomUUID()}`;
    const bucket = storage.bucket(bucketName);
    const gcsFile = bucket.file(name);
    await gcsFile.save(buffer, { resumable: false, metadata: { contentType } });
    const gcsUri = `gs://${bucketName}/${name}`;

    const recognition = await recognizeGcsUri({
      uri: gcsUri,
      language,
      model: 'long',
      minSpeakerCount,
      maxSpeakerCount,
      gapSec,
      maxDurSec,
    });

    await gcsFile.delete().catch(() => undefined);

    res.status(200).json({ status: 'succeeded', language, gcsUri, segments: recognition.segments });
  } catch (error) {
    console.error('Transcribe-long error:', error);
    res.status(500).json({ status: 'failed', error: error.message || 'Unknown error' });
  }
}
