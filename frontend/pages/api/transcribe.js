import fs from 'fs/promises';
import formidable from 'formidable';
import { setCors } from '../../lib/cors';
import { recognizeBuffer } from '../../lib/googleSpeech';

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
    const { fields, files } = await parseMultipart(req);
    const language = fields.language?.toString() || 'en-US';
    const gapSec = Number(fields.gapSec || 0.6);
    const maxDurSec = Number(fields.maxDurSec || 10);
    const minSpeakerCount = Number(fields.minSpeakerCount || process.env.SPEAKER_MIN_COUNT || 1);
    const maxSpeakerCount = Number(fields.maxSpeakerCount || process.env.SPEAKER_MAX_COUNT || 4);

    const fileObj = files.file || files.audio || files.upload;
    if (!fileObj) return res.status(400).json({ error: 'No file field provided (expected name: file)' });
    const f = Array.isArray(fileObj) ? fileObj[0] : fileObj;

    const buf = await fs.readFile(f.filepath || f.path);

    const { segments } = await recognizeBuffer({
      buffer: buf,
      language,
      model: 'short',
      minSpeakerCount,
      maxSpeakerCount,
      gapSec,
      maxDurSec,
    });

    res.status(200).json({ status: 'succeeded', language, segments });
  } catch (e) {
    console.error('Transcribe error:', e);
    res.status(500).json({ status: 'failed', error: e.message || 'Unknown error' });
  }
}
