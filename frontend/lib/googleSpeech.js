const { SpeechClient } = require('@google-cloud/speech').v2;
import { buildConfig, resolveRecognizerPath, segmentByPause } from './transcription';

let speechClient;

export function getSpeechClient() {
  if (!speechClient) {
    speechClient = new SpeechClient();
  }
  return speechClient;
}

function toSec(dur) {
  if (!dur) return 0;
  const seconds = Number(dur.seconds || 0);
  const nanos = Number(dur.nanos || 0);
  return seconds + nanos / 1e9;
}

export function extractWords(results) {
  const words = [];
  for (const r of results || []) {
    const alt = r?.alternatives?.[0];
    if (!alt) continue;
    for (const w of alt.words || []) {
      words.push({
        w: w.word,
        s: toSec(w.startOffset || w.startTime),
        e: toSec(w.endOffset || w.endTime),
        sp: w.speaker || w.speakerTag || w.speakerLabel || null,
      });
    }
  }
  return words.sort((a, b) => a.s - b.s);
}

function extractWordsFromBatchResult(batchResult) {
  const topLevel = batchResult?.results ?? batchResult?.transcriptionResults ?? [];
  const containers = Array.isArray(topLevel) ? topLevel : Object.values(topLevel || {});
  const nested = [];
  for (const entry of containers) {
    const candidateSets = [
      entry?.inlineResult?.transcript?.results,
      entry?.transcript?.results,
      entry?.results,
    ];
    const firstArray = candidateSets.find(Array.isArray);
    if (firstArray) nested.push(...firstArray);
  }
  return extractWords(nested);
}

export async function recognizeBuffer({
  buffer,
  language = 'en-US',
  model = 'short',
  minSpeakerCount,
  maxSpeakerCount,
  gapSec = 0.6,
  maxDurSec = 10,
}) {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error('recognizeBuffer expects a Buffer input');
  }
  const client = getSpeechClient();
  const recognizer = await resolveRecognizerPath(client);
  const [response] = await client.recognize({
    recognizer,
    config: buildConfig({ language, model, minSpeakerCount, maxSpeakerCount }),
    content: buffer.toString('base64'),
  });
  const words = extractWords(response?.results);
  const segments = segmentByPause(words, { gapSec, maxDurSec });
  return {
    language,
    segments,
    words,
    response,
  };
}

export async function recognizeGcsUri({
  uri,
  language = 'en-US',
  model = 'long',
  minSpeakerCount,
  maxSpeakerCount,
  gapSec = 0.6,
  maxDurSec = 10,
}) {
  if (!uri) {
    throw new Error('缺少 GCS URI，无法进行云端识别');
  }
  const client = getSpeechClient();
  const recognizer = await resolveRecognizerPath(client);
  const [operation] = await client.batchRecognize({
    recognizer,
    config: buildConfig({ language, model, minSpeakerCount, maxSpeakerCount }),
    files: [{ uri }],
    recognitionOutputConfig: { inlineResponseConfig: {} },
  });
  const [result] = await operation.promise();
  const words = extractWordsFromBatchResult(result);
  const segments = segmentByPause(words, { gapSec, maxDurSec });
  return {
    language,
    segments,
    words,
    response: result,
  };
}

export function summarizeSegments(segments) {
  if (!Array.isArray(segments)) return { text: '', speakerCount: null };
  const text = segments.map((seg) => seg.text).join('\n');
  const speakers = new Set();
  for (const seg of segments) {
    if (seg.speaker != null) {
      speakers.add(seg.speaker);
    }
  }
  return { text, speakerCount: speakers.size > 0 ? speakers.size : null };
}

export { segmentByPause } from './transcription';
