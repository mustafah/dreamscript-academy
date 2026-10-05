// Name handling. DreamScript names are forgiving: case, spaces, `_` and `-`
// never matter, so `Images Number`, `images_number` and `imagesNumber` are one name.

export const norm = (s) => String(s).toLowerCase().replace(/[\s_-]+/g, '');

export const KEYWORDS = new Set([
  'true', 'false', 'null', 'and', 'or', 'not', 'if', 'then', 'else',
  'match', 'when', 'for', 'in', 'by', 'as', 'let', 'return', 'fn',
]);

const WORD_CHARS = '\\p{L}\\p{N}_\\p{M}\\p{Extended_Pictographic}\\p{Emoji_Modifier}\\u200d\\ufe0f';
const RE_START = /[\p{L}_\p{Extended_Pictographic}]/uy;
const RE_WORD = new RegExp(`[\\p{L}_\\p{Extended_Pictographic}][${WORD_CHARS}]*`, 'uy');
export const WORD_SOURCE = `[\\p{L}_\\p{Extended_Pictographic}][${WORD_CHARS}]*(?:-[\\p{L}\\p{N}_][${WORD_CHARS}]*)*`;

export function startsWord(text, i) {
  RE_START.lastIndex = i;
  return RE_START.test(text);
}

// A plain word (no hyphens) starting at index i, or null.
export function matchWord(text, i) {
  RE_WORD.lastIndex = i;
  const m = RE_WORD.exec(text);
  return m ? m[0] : null;
}

export const titleCase = (s) => s.replace(/\S+/g, (w) => w[0].toUpperCase() + w.slice(1));

// A declarable name: words separated by spaces (e.g. `Images Number`), emoji allowed.
export const NAME =
  '[\\p{L}_\\p{Extended_Pictographic}][\\p{L}\\p{N}_\\p{M}\\p{Extended_Pictographic}\\u200d\\ufe0f \\t]*?';
