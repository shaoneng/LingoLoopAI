export function segmentByPause(words, { gapSec = 0.6, maxDurSec = 10 } = {}) {
  const isSentencePunct = (s) => /[.!?]/.test(s);
  const segs = [];
  let buf = [];
  let lastWord = null;
  for (let i = 0; i < words.length; i++) {
    const cur = words[i];
    const speakerChanged = lastWord && lastWord.sp != null && cur.sp != null && lastWord.sp !== cur.sp;
    if (speakerChanged && buf.length) {
      const textPrev = buf.map((x) => x.w).join(' ');
      segs.push({ id: segs.length, start: buf[0].s, end: buf[buf.length - 1].e, text: textPrev, words: buf, speaker: buf[0].sp ?? null });
      buf = [];
    }

    buf.push(cur);
    const prev = buf.length >= 2 ? buf[buf.length - 2] : null;
    const prevForGap = prev || lastWord;
    const gap = prevForGap ? cur.s - prevForGap.e : 0;
    const start = buf.length ? buf[0].s : cur.s;
    const dur = cur.e - start;

    const shouldBreak = (prev && gap >= gapSec) || isSentencePunct(cur.w) || dur >= maxDurSec;

    if (shouldBreak) {
      const text = buf.map((x) => x.w).join(' ');
      segs.push({ id: segs.length, start: buf[0].s, end: buf[buf.length - 1].e, text, words: buf, speaker: buf[0].sp ?? null });
      buf = [];
    }
    lastWord = cur;
  }
  if (buf.length) {
    const text = buf.map((x) => x.w).join(' ');
    segs.push({ id: segs.length, start: buf[0].s, end: buf[buf.length - 1].e, text, words: buf, speaker: buf[0].sp ?? null });
  }
  return segs;
}

export function buildConfig({ language = 'en-US', model = 'short', minSpeakerCount, maxSpeakerCount } = {}) {
  const normalizedModel = model === 'long' ? 'latest_long' : model === 'short' ? 'latest_short' : model;
  const fallbackMin = Math.max(1, Number(process.env.SPEAKER_MIN_COUNT || 1));
  const fallbackMaxEnv = Number(process.env.SPEAKER_MAX_COUNT || 4);
  const resolvedMin = Math.max(1, Number(minSpeakerCount || fallbackMin));
  const resolvedMaxCandidate = Number(maxSpeakerCount || fallbackMaxEnv || resolvedMin);
  const resolvedMax = Math.max(resolvedMin, resolvedMaxCandidate);
  return {
    autoDecodingConfig: {},
    languageCodes: [language],
    model: normalizedModel,
    features: {
      enableAutomaticPunctuation: true,
      enableWordTimeOffsets: true,
    },
    diarizationConfig: {
      minSpeakerCount: resolvedMin,
      maxSpeakerCount: resolvedMax,
    },
  };
}

export async function resolveRecognizerPath(client) {
  const envPid = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
  const projectId = envPid || (await client.getProjectId());
  const location = process.env.SPEECH_LOCATION || 'global';
  if (!projectId) {
    throw new Error('Cannot resolve projectId. Set GCLOUD_PROJECT or configure ADC.');
  }
  return `projects/${projectId}/locations/${location}/recognizers/_`;
}
