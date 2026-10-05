// Block statements: ~( enum | renderer | images | test | template | <params> ... )
import { DreamError } from './diag.js';
import { Src, bracketDepth, matchClose } from './src.js';
import { NAME } from './names.js';
import { makeParser } from './expr.js';
import { parseLoose } from './loose.js';

const MODEL = '[\\w.\\-]+(?:/[\\w.\\-]+)*';
const JOB_RE = new RegExp(`^(?:(?<name>${NAME})\\s*=\\s*)?(?<w>\\d+(?:\\.\\d+)?%\\s+)?(?<model>${MODEL})\\s*\\(`, 'u');
const ALT_RE = new RegExp(`^\\s*\\|\\s*(?<w>\\d+(?:\\.\\d+)?%\\s+)?(?<model>${MODEL})\\s*\\(`, 'u');
const ENUM_MEMBER = new RegExp(`^(?<key>${NAME})(?:\\s*=(?![=>])\\s*(?<rhs>.+))?$`, 'us');
const WORD_END = '(?![\\p{L}\\p{N}_])';

// Index of the `)` line that closes the block starting at parser.i (or -1).
// A `)` line inside an unfinished multi-line call belongs to that call.
function findEnd(parser) {
  let nested = 1;
  let open = 0;
  for (let j = parser.i + 1; j < parser.lines.length; j++) {
    const t = parser.lines[j].text;
    if (t === ')' && open === 0) {
      if (--nested === 0) return j;
    } else if (t.startsWith('~(') && bracketDepth(t) > 0) nested++;
    else open = Math.max(0, open + bracketDepth(t));
  }
  return -1;
}

export function parseBlock(parser, ln, doc) {
  const header = ln.text.slice(2).trim();
  const end = findEnd(parser);
  const body = parser.lines.slice(parser.i + 1, end < 0 ? parser.lines.length : end);
  parser.i = end < 0 ? parser.lines.length : end + 1;
  if (end < 0) {
    parser.shared.diag.add(
      'error',
      'This block is never closed.',
      parser.lineLoc(ln),
      'Close it with a line that contains only `)`.',
      parser.shared.file
    );
  }
  const m = /^([\p{L}_]+)\s*(.*)$/su.exec(header);
  const kind = m ? m[1].toLowerCase() : '';
  const rest = m ? m[2].trim() : header;
  const sub = new parser.constructor(body, parser.shared);
  const base = { doc, line: ln.n, loc: parser.lineLoc(ln) };
  switch (kind) {
    case 'enum': return { t: 'enum', name: firstWord(rest, ln, parser), members: parseEnumMembers(sub), ...base };
    case 'renderer': return { t: 'renderer', label: rest, body: parseJobSeq(sub, -1), ...base };
    case 'images': return { t: 'images', entries: sub.parseEntries(-1), ...base };
    case 'test': return { t: 'test', name: rest.replace(/^"|"$/g, '') || 'test', body: sub.parseSeq(0, 'prose'), ...base };
    case 'template': return parseTemplateBlock(parser, sub, ln, rest, base);
    default: return { t: 'struct', name: header, entries: sub.parseEntries(-1), params: true, ...base };
  }
}

function firstWord(rest, ln, parser) {
  const w = /^[\p{L}_][\p{L}\p{N}_]*/u.exec(rest);
  if (!w) throw new DreamError('`enum` needs a name, like `~( enum ImageSizes`.', { loc: parser.lineLoc(ln) });
  return w[0];
}

function parseEnumMembers(sub) {
  const members = [];
  let docs = [];
  while (sub.i < sub.lines.length) {
    const ln = sub.lines[sub.i];
    if (ln.blank) {
      sub.i++;
      docs = [];
      continue;
    }
    if (ln.comment) {
      if (ln.doc !== null) docs.push(ln.doc);
      sub.i++;
      continue;
    }
    const start = sub.i;
    try {
      const src = sub.single(ln);
      const m = ENUM_MEMBER.exec(ln.text);
      if (!m) throw new DreamError('I expected `Member = "value"` here.', { loc: sub.lineLoc(ln) });
      const { key, rhs } = m.groups;
      const value = rhs ? parseLoose(rhs, sub.ctxFor(src), ln.text.length - rhs.length) : null;
      members.push({ name: key.trim(), value, doc: docs.join(' ') || null, line: ln.n });
    } catch (err) {
      sub.report(err, ln);
      if (sub.i <= start) sub.i = start + 1;
    }
    docs = [];
  }
  return members;
}

function parseTemplateBlock(parser, sub, ln, rest, base) {
  const src = new Src(ln.text, ln.n, ln.lead + 1, parser.shared.file);
  const off = ln.text.indexOf(rest);
  const p = makeParser(rest, parser.ctxFor(src), off);
  const nameTok = p.next();
  if (nameTok.k !== 'word') p.fail('`template` needs a name, like `~( template scene(place)`.', nameTok);
  let params = [];
  if (p.is('(')) {
    p.next();
    params = p.parseParams();
  }
  p.expectEnd();
  return { t: 'template', name: nameTok.v, params, body: sub.parseSeq(0, 'prose'), ...base };
}

// ---- renderer jobs ----------------------------------------------------------
export function parseJobSeq(parser, minIndent) {
  const out = [];
  while (parser.i < parser.lines.length) {
    const ln = parser.lines[parser.i];
    if (ln.blank || ln.comment) {
      parser.i++;
      continue;
    }
    if (ln.indent < minIndent) break;
    const start = parser.i;
    try {
      out.push(parseJob(parser, ln));
    } catch (err) {
      parser.report(err, ln);
      if (parser.i <= start) parser.i = start + 1;
    }
  }
  return out;
}

function parseJob(parser, ln) {
  const t = ln.text;
  const seq = (min) => parseJobSeq(parser, min);
  if (new RegExp(`^for${WORD_END}`, 'iu').test(t)) return parser.parseFor(ln, 0, seq);
  if (new RegExp(`^if${WORD_END}`, 'iu').test(t)) return parser.parseIf(ln, 2, seq, new RegExp(`^else${WORD_END}`, 'iu'));
  return parseJobLine(parser, ln);
}

function parseJobLine(parser, ln) {
  const src = parser.takeLogical(ln);
  const text = src.text;
  const ctx = parser.ctxFor(src);
  let m = JOB_RE.exec(text);
  if (!m) {
    throw new DreamError('I expected a model call like `fal-ai/flux/schnell(seed = 1)` here.', {
      loc: src.span(0, text.length),
      hint: 'Each line in a renderer block calls one model: `vendor/model(params)`.',
    });
  }
  const name = m.groups.name ? m.groups.name.trim() : null;
  const alts = [];
  let pos = 0;
  for (;;) {
    const open = pos + m[0].length - 1;
    const close = matchClose(text, open);
    if (close < 0) throw new DreamError('This call is missing its closing `)`.', { loc: src.span(pos, open + 1) });
    const model = m.groups.model;
    const at = pos + m[0].lastIndexOf(model);
    const args = makeParser(text.slice(open + 1, close), ctx, open + 1).parseArgList();
    alts.push({ w: m.groups.w ? parseFloat(m.groups.w) : null, model, args, loc: src.span(at, at + model.length), src: text.slice(at, close + 1) });
    pos = close + 1;
    const rest = text.slice(pos);
    m = ALT_RE.exec(rest);
    if (!m) {
      if (rest.trim()) {
        throw new DreamError(`I wasn't expecting \`${rest.trim().slice(0, 20)}\` after the call.`, { loc: src.span(pos, text.length) });
      }
      break;
    }
  }
  return { t: 'job', name, alts, line: ln.n, loc: alts[0].loc };
}
