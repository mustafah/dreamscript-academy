// Prose templates: text with ~name, ~(expr), (expr)~ and name~ interpolations.
// Used for prose lines, quoted strings and unquoted ("loose") values.
import { matchWord, startsWord, norm } from './names.js';
import { matchClose } from './src.js';

function scanChain(text, from) {
  let j = from + matchWord(text, from).length;
  for (;;) {
    const c = text[j];
    if (c === '.' && startsWord(text, j + 1)) {
      j += 1 + matchWord(text, j + 1).length;
    } else if (c === '[' || c === '(') {
      const close = matchClose(text, j);
      if (close < 0) break;
      j = close + 1;
    } else break;
  }
  return j;
}

// A `~` right after a reference is a closing tilde unless it opens the next one.
function eatClosingTilde(text, i) {
  if (text[i] !== '~') return i;
  const next = text[i + 1];
  return next === '(' || startsWord(text, i + 1) ? i : i + 1;
}

const ESCAPES = { n: '\n', t: '\t' };

/**
 * @param {string} text raw template text
 * @param {object} ctx parse context ({src, names})
 * @param {number} base offset of text[0] inside ctx.src
 * @param {(expr:string, off:number)=>object} parseExprAt strict expression parser
 * @param {{string?:boolean}} opts string mode also understands \n and \t
 * @returns {{k:'text',s:string}|{k:'x',e:object|null,src:string,loc:object,err?:Error}[]}
 */
export function parseTemplate(text, ctx, base, parseExprAt, opts = {}) {
  const parts = [];
  let buf = '';
  const flush = () => {
    if (buf) parts.push({ k: 'text', s: buf });
    buf = '';
  };
  // Soft references (`name~`, `(text)~`) fall back to the plain text when unknown.
  const interp = (from, to, exprText, exprFrom, soft = false) => {
    flush();
    const loc = ctx.src.span(base + from, base + to);
    try {
      const e = parseExprAt(exprText, base + exprFrom);
      if (soft && e.t === 'id') e.soft = true;
      parts.push({ k: 'x', e, src: exprText, loc });
    } catch (err) {
      const phrase = exprText.trim();
      const plain = /^[\p{L}\p{N}_][\p{L}\p{N}_ '-]*$/u.test(phrase);
      const e = plain ? { t: 'id', name: phrase, soft: true, loc } : null;
      parts.push({ k: 'x', e, src: exprText, loc, err: plain ? undefined : err });
    }
  };

  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '\\') {
      const n = text[i + 1];
      if (n === '~' || (opts.string && (n === '\\' || n === '"'))) {
        buf += n;
        i += 2;
      } else if (opts.string && ESCAPES[n]) {
        buf += ESCAPES[n];
        i += 2;
      } else {
        buf += ch;
        i++;
      }
    } else if (ch === '<' && text[i + 1] === '~' && (text[i + 2] === '(' || startsWord(text, i + 2))) {
      i++;
    } else if (ch === '~' && text[i + 1] === '(' && matchClose(text, i + 1) > 0) {
      const close = matchClose(text, i + 1);
      interp(i, close + 1, text.slice(i + 2, close), i + 2);
      i = eatClosingTilde(text, close + 1);
    } else if (ch === '~' && startsWord(text, i + 1)) {
      const end = scanChain(text, i + 1);
      interp(i, end, text.slice(i + 1, end), i + 1);
      i = eatClosingTilde(text, end);
    } else if (ch === '(' && matchClose(text, i) > 0 && text[matchClose(text, i) + 1] === '~') {
      const close = matchClose(text, i);
      interp(i, close + 2, text.slice(i + 1, close), i + 1, true);
      i = close + 2;
    } else if (startsWord(text, i)) {
      const w = matchWord(text, i);
      const end = i + w.length;
      if (text[end] === '~' && ctx.names.has(norm(w))) {
        interp(i, end + 1, w, i, true);
        i = end + 1;
      } else if (text[end] === '~') {
        buf += w;
        i = end + 1;
      } else {
        buf += w;
        i = end;
      }
    } else {
      buf += ch;
      i++;
    }
  }
  flush();
  return parts;
}

export const hasInterpolation = (parts) => parts.some((p) => p.k === 'x');
