function titleCaseToken(token = '') {
  if (!token) return '';
  const lower = token.toLowerCase();
  if (token.length <= 2) return token.toUpperCase();
  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
}

function formatTokens(tokens = []) {
  return tokens
    .map((t) => {
      if (!t) return '';
      if (/^[A-Z0-9]+$/.test(t)) return t; // already uppercase acronym
      if (/^[a-z]{1}$/.test(t)) return t.toLowerCase();
      return titleCaseToken(t);
    })
    .filter(Boolean)
    .join(' ');
}

function parseDateToken(token) {
  if (!token) return { text: '', iso: null };
  let clean = token.replace(/[^0-9]/g, '');
  if (clean.length === 8) {
    const year = clean.slice(0, 4);
    const month = clean.slice(4, 6);
    const day = clean.slice(6, 8);
    return {
      text: `${year}年${month}月${day}日`,
      iso: `${year}-${month}-${day}`,
    };
  }
  if (clean.length === 6) {
    const yy = clean.slice(0, 2);
    const month = clean.slice(2, 4);
    const day = clean.slice(4, 6);
    const yearNum = Number(yy);
    const year = yearNum >= 70 ? 1900 + yearNum : 2000 + yearNum;
    return {
      text: `${year}年${month}月${day}日`,
      iso: `${year}-${month}-${day}`,
    };
  }
  return { text: '', iso: null };
}

export function parseAudioFilename(filename = '') {
  const result = {
    title: filename,
    program: '',
    dateText: '',
    dateIso: null,
  };

  if (!filename) return result;

  const withoutExt = filename.replace(/\.[^.]+$/, '');
  let parts = withoutExt.split(/[_\s]+/).filter(Boolean);
  if (!parts.length) {
    result.title = withoutExt;
    return result;
  }

  // extract date token if present
  let datePart = null;
  if (/^\d{6}$/.test(parts[0]) || /^\d{8}$/.test(parts[0])) {
    datePart = parts.shift();
  }
  const { text: dateText, iso } = parseDateToken(datePart);
  result.dateText = dateText;
  result.dateIso = iso;

  // remove trailing utility tokens
  const trailingStopWords = new Set(['transcript', 'audio', 'episode']);
  while (parts.length && trailingStopWords.has(parts[parts.length - 1].toLowerCase())) {
    parts.pop();
  }

  if (!parts.length) {
    result.title = withoutExt;
    return result;
  }

  // detect program names (currently known: 6_minute_english)
  let programTokens = [];
  let remaining = parts;
  const joinedLower = parts.join('_').toLowerCase();

  if (parts.length >= 3 && parts.slice(0, 3).map((p) => p.toLowerCase()).join('_') === '6_minute_english') {
    programTokens = parts.slice(0, 3);
    remaining = parts.slice(3);
  }

  if (!remaining.length) {
    remaining = programTokens;
    programTokens = [];
  }

  result.program = formatTokens(programTokens);
  result.title = formatTokens(remaining) || withoutExt;

  return result;
}

export default parseAudioFilename;
