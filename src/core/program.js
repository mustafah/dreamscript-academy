// Statement parser: turns lines + indentation into statement nodes.
import { DreamError } from './diag.js';
import { Src, splitLines, bracketDepth, splitTop } from './src.js';
import { norm, NAME } from './names.js';
import { makeParser, parseExprText } from './expr.js';
import { parseType, parseTypeText } from './types.js';
import { parseLoose, splitAlts, takeWeight } from './loose.js';
import { parseTemplate } from './template.js';
import { parseBlock, parseJobSeq } from './blocks.js';
import { parseFnStatement, parseCodeStatement, parseArmLines } from './functions.js';

export const DECL_RE = new RegExp(`^(?<name>${NAME})\\s*(?::\\s*(?<type>[^=]+?))?\\s*=(?![=>])\\s*(?<rhs>.*)$`, 'us');
const STRUCT_RE = new RegExp(`^(?<name>${NAME})\\s*:$`, 'u');
const KV_EQ = new RegExp(`^(?<key>${NAME})\\s*=(?![=>])\\s*(?<rhs>.*)$`, 'us');
const KV_COLON = new RegExp(`^(?<key>${NAME})\\s*:\\s+(?<rhs>\\S.*)$`, 'us');
const KEYWORD = /^(import|fn|assert|for|if|else|type|renderer)(?![\p{L}\p{N}_])/iu;
const CHANNELS = { '≈': 'translation', '☽': 'note', '◊': 'concept' };

export class Parser {
  constructor(lines, shared) {
    this.lines = lines;
    this.i = 0;
    this.shared = shared; // { names, maxWords, std, file, diag }
  }

  ctxFor(src) {
    return { ...this.shared, src, parseType };
  }

  report(err, ln) {
    if (!(err instanceof DreamError)) throw err;
    const loc = err.loc || { line: ln.n, col: ln.lead + 1, endCol: ln.lead + ln.text.length + 1 };
    this.shared.diag.add(err.severity, err.message, loc, err.hint, this.shared.file);
  }

  // The next line that is neither blank nor a comment (not consumed).
  peekLine() {
    for (let j = this.i; j < this.lines.length; j++) {
      const l = this.lines[j];
      if (!l.blank && !l.comment) return { ln: l, idx: j };
    }
    return null;
  }

  // Consume a statement line plus continuation lines until brackets balance.
  takeLogical(ln) {
    const src = new Src(ln.text, ln.n, ln.lead + 1, this.shared.file);
    const startIdx = this.i;
    this.i++;
    let depth = bracketDepth(ln.text);
    while (depth > 0) {
      if (this.i >= this.lines.length) {
        this.i = startIdx + 1; // don't swallow the rest of the file
        throw new DreamError('This bracket is never closed.', {
          loc: src.span(0, 1),
          hint: 'Add the matching closing bracket.',
        });
      }
      const nx = this.lines[this.i++];
      if (nx.blank || nx.comment) continue;
      src.extend(nx.text, nx.n, nx.lead + 1);
      depth += bracketDepth(nx.text);
    }
    return src;
  }

  // A parser over the tail of a header line, e.g. the `x in xs` of `for x in xs:`.
  headerParser(ln, from) {
    let text = ln.text.slice(from);
    const colon = /:\s*$/.exec(text);
    if (colon) text = text.slice(0, colon.index);
    const src = new Src(ln.text, ln.n, ln.lead + 1, this.shared.file);
    return makeParser(text, this.ctxFor(src), from);
  }

  // ---- sequences --------------------------------------------------------
  parseSeq(minIndent = 0, mode = 'prose') {
    const out = [];
    let docs = [];
    while (this.i < this.lines.length) {
      const ln = this.lines[this.i];
      if (ln.blank) {
        // Blank lines after the end of an indented body belong to the parent.
        const nx = minIndent > 0 ? this.peekLine() : null;
        if (minIndent > 0 && (!nx || nx.ln.indent < minIndent)) break;
        if (mode === 'prose') out.push({ t: 'break', line: ln.n });
        this.i++;
        continue;
      }
      if (ln.comment) {
        if (ln.doc !== null) docs.push(ln.doc);
        this.i++;
        continue;
      }
      if (ln.indent < minIndent) break;
      const doc = docs.join(' ') || null;
      docs = [];
      const start = this.i;
      try {
        const st = mode === 'code' ? parseCodeStatement(this, ln) : this.parseStmt(ln, doc);
        if (st) out.push(st);
      } catch (err) {
        this.report(err, ln);
        if (this.i <= start) this.i = start + 1;
      }
    }
    return out;
  }

  parseStmt(ln, doc) {
    const text = ln.text;
    if (text.startsWith('~(') && bracketDepth(text) > 0) return parseBlock(this, ln, doc);
    const isEmit = text.startsWith('<~');
    if (isEmit || text[0] === '~') {
      const st = this.parseTilde(ln, doc, isEmit);
      if (st) return st;
    }
    return this.parseProse(ln);
  }

  // `~ ...` and `<~ ...` lines. Returns null when the line is really prose.
  parseTilde(ln, doc, emit) {
    const from = emit ? 2 : 1;
    const rest = ln.text.slice(from).trimStart();
    const at = ln.text.length - rest.length;
    const kw = KEYWORD.exec(rest);
    if (kw && !emit) {
      const st = this.parseKeyword(ln, kw[1].toLowerCase(), rest, at, doc);
      if (st) return st;
    }
    const m = DECL_RE.exec(rest);
    if (m) return this.parseDecl(ln, m, at, emit, doc);
    const s = STRUCT_RE.exec(rest);
    if (s && !emit) return this.parseStructHeader(ln, s.groups.name.trim(), doc);
    if (rest !== '' && /^\s/.test(ln.text.slice(from))) return this.parseExprStatement(ln, at, emit);
    return null;
  }

  parseKeyword(ln, kw, rest, at, doc) {
    const after = rest.slice(kw.length);
    switch (kw) {
      case 'import': return /^\s+\S/.test(after) ? this.parseImport(ln, at + kw.length) : null;
      case 'fn': return /^\s+\S/.test(after) ? parseFnStatement(this, ln, at + kw.length, doc) : null;
      case 'assert': return /^\s+\S/.test(after) ? this.parseAssert(ln, at + kw.length) : null;
      case 'for': return this.parseFor(ln, at, (min) => this.parseSeq(min, 'prose'));
      case 'if': return this.parseIf(ln, at + 2, (min) => this.parseSeq(min, 'prose'), /^~\s*else(?![\p{L}\p{N}_])/iu);
      case 'else': throw new DreamError('`else` needs an `if` right above it.', { loc: this.lineLoc(ln) });
      case 'type': return this.parseTypeDecl(ln, at + kw.length);
      case 'renderer': return /^\s+\S/.test(after) ? this.parseOneLineRenderer(ln, at + kw.length) : null;
      default: return null;
    }
  }

  lineLoc(ln) {
    return { line: ln.n, col: ln.lead + 1, endCol: ln.lead + ln.text.length + 1 };
  }

  // ---- declarations -----------------------------------------------------
  parseDecl(ln, m, at, emit, doc) {
    const { name, type, rhs } = m.groups;
    const rhsOff = at + (m[0].length - rhs.length);
    const multi = /^[{[(]/.test(rhs);
    const src = multi ? this.takeLogical(ln) : this.single(ln);
    const ctx = this.ctxFor(src);
    let typeNode = null;
    if (type) typeNode = parseTypeText(type.trim(), ctx, at + name.length + 1);
    const text = src.text.slice(rhsOff);
    const value = text.trim() === '' ? { t: 'null', empty: true, loc: src.span(rhsOff, rhsOff + 1) } : parseLoose(text, ctx, rhsOff);
    if (value.t === 'match' && value.arms === null) value.arms = parseArmLines(this, ln.indent);
    return { t: 'decl', name: name.trim(), type: typeNode, value, emit, doc, line: ln.n, loc: src.span(at, at + name.length) };
  }

  single(ln) {
    this.i++;
    return new Src(ln.text, ln.n, ln.lead + 1, this.shared.file);
  }

  parseStructHeader(ln, name, doc) {
    this.i++;
    const entries = this.parseEntries(ln.indent);
    return { t: 'struct', name, entries, doc, line: ln.n, loc: this.lineLoc(ln) };
  }

  parseTypeDecl(ln, from) {
    const m = new RegExp(`^\\s+(?<name>${NAME})\\s*=\\s*(?<rhs>.+)$`, 'us').exec(ln.text.slice(from));
    if (!m) return null;
    const src = this.single(ln);
    const off = ln.text.length - m.groups.rhs.length;
    const type = parseTypeText(m.groups.rhs, this.ctxFor(src), off);
    return { t: 'type', name: m.groups.name.trim(), type, line: ln.n };
  }

  // Entries of a struct / params / images body: `key = value`, `key:` nested, `...spread`.
  parseEntries(parentIndent) {
    const entries = [];
    while (this.i < this.lines.length) {
      const ln = this.lines[this.i];
      if (ln.blank || ln.comment) {
        this.i++;
        continue;
      }
      if (ln.indent <= parentIndent) break;
      const start = this.i;
      try {
        entries.push(this.parseEntry(ln));
      } catch (err) {
        this.report(err, ln);
        if (this.i <= start) this.i = start + 1;
      }
    }
    return entries;
  }

  parseEntry(ln) {
    const text = ln.text;
    if (text.startsWith('...')) {
      const src = this.takeLogical(ln);
      return { spread: parseExprText(src.text.slice(3), this.ctxFor(src), 3), line: ln.n };
    }
    const nested = STRUCT_RE.exec(text);
    if (nested) {
      this.i++;
      return { key: nested.groups.name.trim(), entries: this.parseEntries(ln.indent), line: ln.n, loc: this.lineLoc(ln) };
    }
    const m = KV_EQ.exec(text) || KV_COLON.exec(text);
    if (!m) {
      throw new DreamError('I expected `name = value` here.', {
        loc: this.lineLoc(ln),
        hint: 'Inside a block every line is `name = value`; use `name:` to start a nested group.',
      });
    }
    const { key, rhs } = m.groups;
    const rhsOff = text.length - rhs.length;
    const src = /^[{[(]/.test(rhs) ? this.takeLogical(ln) : this.single(ln);
    const value = parseLoose(src.text.slice(rhsOff), this.ctxFor(src), rhsOff);
    return { key: key.trim(), value, line: ln.n, loc: src.span(0, key.length) };
  }

  // ---- other statements ---------------------------------------------------
  parseImport(ln, from) {
    const src = this.single(ln);
    const items = splitTop(ln.text.slice(from), ',').map((part) => {
      const raw = ln.text.slice(from).slice(part.s, part.e).trim();
      const m = /^(?<path>"[^"]+"|\S+?)(?:\s+as\s+(?<alias>\*|[^\s,]+))?$/u.exec(raw);
      if (!m) throw new DreamError('I expected an import like `~ import ./colors.dream`.', { loc: src.span(0, ln.text.length) });
      return { path: m.groups.path.replace(/^"|"$/g, ''), alias: m.groups.alias || null, loc: src.span(0, ln.text.length) };
    });
    return { t: 'import', items, line: ln.n };
  }

  parseAssert(ln, from) {
    const p = this.headerParser(ln, from);
    this.i++;
    const first = p.peek();
    const e = p.parseVariation();
    const text = p.text.slice(first.s, p.tokens[p.i - 1].e);
    let msg = null;
    if (p.is(',')) {
      p.next();
      msg = p.parseVariation();
    }
    p.expectEnd();
    return { t: 'assert', e, msg, text, line: ln.n, loc: this.lineLoc(ln) };
  }

  parseExprStatement(ln, at, emit) {
    const src = this.single(ln);
    const text = ln.text.slice(at);
    const e = parseLoose(text, this.ctxFor(src), at);
    return emit ? { t: 'emit', e, line: ln.n, loc: src.span(at, ln.text.length) } : { t: 'expr', e, line: ln.n };
  }

  parseOneLineRenderer(ln, from) {
    const fake = { ...ln, text: ln.text.slice(from).trim(), lead: ln.lead + from + (ln.text.slice(from).length - ln.text.slice(from).trimStart().length) };
    const save = this.lines;
    this.lines = [fake];
    this.i = 0;
    const body = parseJobSeq(this, -1);
    this.lines = save;
    this.i = save.indexOf(ln) + 1;
    return { t: 'renderer', label: '', body, line: ln.n };
  }

  // for x in xs [if cond]:   (shared by prose mode and renderer blocks)
  parseFor(ln, from, bodyFn) {
    const p = this.headerParser(ln, from);
    const gens = p.parseGens();
    p.expectEnd();
    this.i++;
    return { t: 'for', gens, body: bodyFn(ln.indent + 1), line: ln.n, loc: this.lineLoc(ln) };
  }

  parseIf(ln, from, bodyFn, elseRe) {
    const branches = [];
    let elseBody = null;
    let cur = ln;
    let at = from;
    for (;;) {
      const p = this.headerParser(cur, at);
      const cond = p.parseVariation();
      p.expectEnd();
      this.i++;
      branches.push({ cond, body: bodyFn(ln.indent + 1) });
      const nx = this.peekLine();
      if (!nx || nx.ln.indent !== ln.indent || !elseRe.test(nx.ln.text)) break;
      this.i = nx.idx;
      const rest = nx.ln.text.replace(/^~?\s*else/i, '');
      const chained = /^\s+if(?![\p{L}\p{N}_])/iu.exec(rest);
      if (chained) {
        cur = nx.ln;
        at = nx.ln.text.length - rest.length + chained[0].length;
        continue;
      }
      this.i++;
      elseBody = bodyFn(ln.indent + 1);
      break;
    }
    return { t: 'if', branches, else: elseBody, line: ln.n, loc: this.lineLoc(ln) };
  }

  // ---- prose --------------------------------------------------------------
  parseProse(ln) {
    const text = ln.text;
    const src = this.single(ln);
    const ctx = this.ctxFor(src);
    const tpl = (raw, off) => ({
      parts: parseTemplate(raw, ctx, off, (x, o) => parseExprText(x, ctx, o)),
      src: raw.trim(),
    });
    const channel = CHANNELS[text[0]];
    if (channel) {
      const body = text.slice(1);
      const lead = body.length - body.trimStart().length;
      return { t: 'channel', ch: channel, symbol: text[0], tpl: tpl(body.trimStart(), 1 + lead), line: ln.n };
    }
    const pieces = splitAlts(text);
    const alts = pieces.map((p) => {
      const raw = text.slice(p.s, p.e);
      const { w, skip } = pieces.length > 1 ? takeWeight(raw) : { w: null, skip: 0 };
      const inner = raw.slice(skip);
      const lead = inner.length - inner.trimStart().length;
      return { w, ...tpl(inner.trim(), p.s + skip + lead) };
    });
    return { t: 'prose', alts, line: ln.n, loc: src.span(0, text.length) };
  }
}

// ---- pre-scan: collect declared names so multi-word names parse correctly -----
export function collectNames(lines, std) {
  const names = new Set(['index', 'it', 'images']);
  let maxWords = 1;
  const add = (raw) => {
    const n = raw.trim();
    if (!n) return;
    names.add(norm(n));
    maxWords = Math.max(maxWords, Math.min(5, n.split(/\s+/).length));
  };
  const declRe = new RegExp(`^(?:<~|~)\\s*(?<name>${NAME})\\s*(?:=(?![=>])|:\\s*$|:\\s*[^=]+=(?![=>]))`, 'u');
  const fnRe = /^~\s*fn\s+([\p{L}_][\p{L}\p{N}_]*)/iu;
  const blockRe = /^~\(\s*(?:(enum|template)\s+([\p{L}_][\p{L}\p{N}_]*)\b.*|([^\n]+?))\s*$/iu;
  const importRe = /^~\s*import\s+(.+)$/iu;
  const loopRe = /\bfor\s+([\p{L}_][\p{L}\p{N}_ ,]*?)\s+in\b/giu;
  const letRe = /^let\s+([\p{L}_][\p{L}\p{N}_]*)/iu;
  const jobRe = new RegExp(`^(?<name>${NAME})\\s*=\\s*[\\w.\\-]+(?:/[\\w.\\-]+)*\\s*\\(`, 'u');
  for (const ln of lines) {
    const t = ln.text;
    if (!t) continue;
    let m;
    const bare = t.replace(/^(?:<~|~)\s*/, '');
    const isKeyword = /^(for|if|else|import|fn|assert|renderer)(?![\p{L}\p{N}_])/iu.test(bare);
    if (!isKeyword && (m = declRe.exec(t))) add(m.groups.name);
    if ((m = fnRe.exec(t))) add(m[1]);
    if (t.startsWith('~(') && (m = blockRe.exec(t))) {
      if (m[1]) add(m[2]);
      else if (!/^(renderer|images|test)\b/i.test(m[3])) add(m[3]);
    }
    if ((m = importRe.exec(t))) {
      for (const item of m[1].split(',')) {
        const parts = item.trim().split(/\s+as\s+/i);
        const alias = parts[1] || parts[0].replace(/^"|"$/g, '').split('/').pop().replace(/\.dream$/i, '');
        add(alias);
      }
    }
    for (const lm of t.matchAll(loopRe)) lm[1].split(',').forEach(add);
    if ((m = letRe.exec(t))) add(m[1]);
    if ((m = jobRe.exec(t))) add(m.groups.name);
  }
  for (const s of std || []) names.add(s);
  return { names, maxWords };
}

/**
 * Parse a whole file.
 * @returns {{ body: object[], names: Set<string>, maxWords: number }}
 */
export function parseProgram(source, { file = 'main.dream', diag, std } = {}) {
  const lines = splitLines(source);
  const { names, maxWords } = collectNames(lines, null);
  const parser = new Parser(lines, { names, maxWords, std, file, diag });
  const body = parser.parseSeq(0, 'prose');
  return { body, names, maxWords, lines };
}
