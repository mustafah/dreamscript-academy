// "Loose" values: what you type after `~ name =` without quotes or brackets.
//   red, blue, teal         -> list
//   a | b | c               -> variation (60% a | 40% b for weights)
//   Ethereal Field Walk     -> text (a "phrase")
//   Seed * 2                -> expression
import { splitTop, matchClose } from './src.js';
import { lex } from './lexer.js';
import { norm } from './names.js';
import { parseExprText } from './expr.js';
import { parseTemplate, hasInterpolation } from './template.js';

const SPACED_OPS = new Set(['+', '-', '*', '/', '×', '÷', '^', '%']);
const ALWAYS_OPS = new Set(['==', '!=', '<=', '>=', '<', '>', '??', '|>', '..', '..<', '=>', '&&', '||']);

// Split alternatives at `|`, but not `|>` or `||`.
export function splitAlts(text) {
  return splitTop(text, '|', {
    skip: (t, i) => t[i + 1] === '>' || t[i + 1] === '|' || t[i - 1] === '|',
  });
}

// Leading `60%` weight of an alternative. Returns { w, skip }.
export function takeWeight(raw) {
  const m = /^(\s*)(\d+(?:\.\d+)?)%\s+/.exec(raw);
  return m ? { w: Number(m[2]), skip: m[0].length } : { w: null, skip: 0 };
}

function knownPrefix(toks, ctx) {
  const words = [];
  for (let j = 0; toks[j].k === 'word' && words.length < (ctx.maxWords || 1); j++) words.push(toks[j].v);
  for (let k = words.length; k >= 1; k--) {
    if (ctx.names.has(norm(words.slice(0, k).join(' ')))) return k;
  }
  return 0;
}

function looksLikeExpr(text, ctx) {
  const c = text[0];
  if (c === '"' || c === '{' || c === '[') return true;
  if (c === '(') {
    const close = matchClose(text, 0);
    return !(close > 0 && text[close + 1] === '~');
  }
  if (/^(#[0-9a-f]{3,8}|-?\d+(\.\d+)?|true|false|null)$/i.test(text)) return true;
  const toks = lex(text);
  if (toks.some((t) => t.k === 'bad')) return false;
  if (/^[\p{L}_][\p{L}\p{N}_]*\(.*\)$/su.test(text) && matchClose(text, text.indexOf('(')) === text.length - 1) return true;
  const first = toks[0];
  if (first.k === 'word') {
    const lw = first.v.toLowerCase();
    if (lw === 'match') return true;
    if (lw === 'if' && toks.some((t) => t.k === 'word' && t.v.toLowerCase() === 'then')) return true;
  }
  const k = knownPrefix(toks, ctx);
  const after = toks[k];
  if (k > 0 && (after.k === 'eof' || (after.k === 'op' && !after.sp && ['.', '[', '(', '?.'].includes(after.v)))) return true;
  const isName = (t) => t.k === 'word' && ctx.names.has(norm(t.v));
  const anchored = toks.some((t) => ['num', 'str', 'color'].includes(t.k) || isName(t));
  const lastOp = toks[toks.length - 2];
  if (anchored && toks.length > 2 && lastOp.k === 'op' && SPACED_OPS.has(lastOp.v) && lastOp.sp) return true;
  for (let j = 0; j < toks.length - 1; j++) {
    const t = toks[j];
    const n = toks[j + 1];
    if (t.k === 'word' && n.k === 'op' && n.v === '(' && !n.sp && (ctx.names.has(norm(t.v)) || ctx.std?.has(norm(t.v)))) return true;
    if (t.k !== 'op') continue;
    if (ALWAYS_OPS.has(t.v) && (anchored || t.v === '=>')) return true;
    if (SPACED_OPS.has(t.v) && t.sp && n.sp && j > 0) return anchored;
    if (t.v === '!' && n.k === 'eof' && anchored && j > 0) return true;
  }
  return false;
}

export function phraseNode(text, ctx, base) {
  const parts = parseTemplate(text, ctx, base, (x, off) => parseExprText(x, ctx, off));
  const loc = ctx.src.span(base, base + text.length);
  if (!hasInterpolation(parts)) return { t: 'str', v: parts.map((p) => p.s).join(''), loc, phrase: true };
  return { t: 'tpl', parts, loc, phrase: true };
}

function parseItem(raw, off, ctx) {
  const lead = raw.length - raw.trimStart().length;
  const text = raw.trim();
  const base = off + lead;
  if (text === '') return null;
  if (looksLikeExpr(text, ctx)) {
    try {
      return parseExprText(text, ctx, base);
    } catch (err) {
      ctx.diag.add(
        'warning',
        `I couldn't read \`${text.length > 40 ? `${text.slice(0, 40)}…` : text}\` as an expression, so I kept it as plain text. (${err.message})`,
        err.loc || ctx.src.span(base, base + text.length),
        'Put text in "quotes" to be explicit, or fix the math.',
        ctx.file
      );
    }
  }
  hyphenHint(text, ctx, base);
  return phraseNode(text, ctx, base);
}

// `Seed-1` is one word, which is rarely what someone typing math meant.
function hyphenHint(text, ctx, base) {
  const m = /^([\p{L}_][\p{L}\p{N}_]*)-(\d+|[\p{L}_][\p{L}\p{N}_]*)$/u.exec(text);
  if (!m || !ctx.names.has(norm(m[1])) || !(/^\d+$/.test(m[2]) || ctx.names.has(norm(m[2])))) return;
  ctx.diag.add(
    'warning',
    `\`${text}\` is one word, so I kept it as text.`,
    ctx.src.span(base, base + text.length),
    `To subtract, put spaces around the minus: \`${m[1]} - ${m[2]}\`.`,
    ctx.file
  );
}

function parseList(text, off, ctx) {
  const parts = splitTop(text, ',');
  const items = parts.map((p) => parseItem(text.slice(p.s, p.e), off + p.s, ctx));
  if (parts.length === 1) return items[0] ?? { t: 'null', loc: ctx.src.span(off, off + 1), empty: true };
  return { t: 'list', items: items.filter(Boolean).map((e) => ({ e })), loc: ctx.src.span(off, off + text.length) };
}

/** Parse the value on the right of `=` in loose mode. */
export function parseLoose(text, ctx, base) {
  const parts = splitAlts(text);
  if (parts.length === 1) return parseList(text, base, ctx);
  const alts = parts.map((p) => {
    const raw = text.slice(p.s, p.e);
    const { w, skip } = takeWeight(raw);
    const inner = raw.slice(skip);
    return { w, e: parseList(inner, base + p.s + skip, ctx), src: inner.trim() };
  });
  return { t: 'vary', alts, loc: ctx.src.span(base, base + text.length) };
}
