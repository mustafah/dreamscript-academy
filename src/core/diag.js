// Friendly diagnostics shared by the parser and the interpreter.
import { norm } from './names.js';

export class DreamError extends Error {
  constructor(message, opts = {}) {
    super(message);
    this.name = 'DreamError';
    this.hint = opts.hint || null;
    this.loc = opts.loc || null;
    this.severity = opts.severity || 'error';
  }
}

export class Diagnostics {
  constructor() {
    this.list = [];
    this.seen = new Set();
  }

  add(severity, message, loc, hint, file) {
    if (!message) return; // silent errors (follow-ups of an error already shown)
    const l = loc || {};
    const line = l.line || 1;
    const col = l.col || 1;
    const key = `${severity}|${file || ''}|${line}|${col}|${message}`;
    if (this.seen.has(key)) return;
    this.seen.add(key);
    this.list.push({
      severity,
      message,
      hint: hint || null,
      file: file || null,
      line,
      col,
      endLine: l.endLine || line,
      endCol: l.endCol || col + 1,
    });
  }
}

export function levenshtein(a, b) {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

// Returns the closest candidate spelling, or null when nothing is close enough.
export function didYouMean(word, candidates, maxDistance) {
  const target = norm(word);
  if (target.length < 2) return null;
  const limit = maxDistance ?? (target.length <= 4 ? 1 : 2);
  let best = null;
  let bestD = Infinity;
  for (const c of candidates) {
    const d = levenshtein(target, norm(c));
    if (d < bestD) {
      best = c;
      bestD = d;
    }
  }
  return bestD <= limit ? best : null;
}
