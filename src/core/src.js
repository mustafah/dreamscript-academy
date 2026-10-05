// Source text helpers: comment stripping, line records and offset -> line/col mapping.

// A logical statement may span several physical lines (multi-line objects).
// Src keeps the mapping from offsets in the joined text back to real positions.
export class Src {
  constructor(text = '', line = 1, col = 1, file = null) {
    this.text = text;
    this.file = file;
    this.segs = [{ off: 0, line, col }];
  }

  extend(text, line, col) {
    this.segs.push({ off: this.text.length + 1, line, col });
    this.text += `\n${text}`;
  }

  pos(off) {
    let seg = this.segs[0];
    for (const s of this.segs) {
      if (s.off <= off) seg = s;
      else break;
    }
    return { line: seg.line, col: seg.col + (off - seg.off) };
  }

  span(a, b) {
    const p = this.pos(a);
    const q = this.pos(Math.max(a, b));
    return { line: p.line, col: p.col, endLine: q.line, endCol: Math.max(q.col, p.col + 1) };
  }
}

/**
 * Split a document into line records with comments removed. Columns of the
 * surviving characters are preserved, so offsets stay valid for diagnostics.
 * @returns {{n:number, raw:string, lead:number, indent:number, text:string,
 *            blank:boolean, comment:boolean, doc:string|null}[]}
 */
export function splitLines(source) {
  const raws = String(source).replace(/\r\n?/g, '\n').split('\n');
  let inBlock = false;
  return raws.map((raw, idx) => {
    const startedInBlock = inBlock;
    let out = '';
    let quote = false;
    let doc = null;
    for (let i = 0; i < raw.length; i++) {
      const ch = raw[i];
      const next = raw[i + 1];
      if (inBlock) {
        if (ch === '*' && next === '/') {
          inBlock = false;
          out += '  ';
          i++;
        } else out += ' ';
        continue;
      }
      if (quote) {
        out += ch;
        if (ch === '\\' && next !== undefined) {
          out += next;
          i++;
        } else if (ch === '"') quote = false;
        continue;
      }
      if (ch === '"') quote = true;
      else if (ch === '/' && next === '*') {
        inBlock = true;
        out += '  ';
        i++;
        continue;
      } else if (ch === '/' && next === '/' && (i === 0 || /\s/.test(raw[i - 1]))) {
        if (raw[i + 2] === '/' && raw[i + 3] !== '/' && out.trim() === '') doc = raw.slice(i + 3).trim();
        break;
      }
      out += ch;
    }
    const lead = out.length - out.trimStart().length;
    const text = out.trim();
    const visual = out.slice(0, lead).replace(/\t/g, '    ').length;
    const blank = raw.trim() === '' && !startedInBlock;
    return {
      n: idx + 1,
      raw,
      lead,
      indent: visual,
      text,
      blank,
      comment: !blank && text === '',
      doc,
    };
  });
}

// Net count of unclosed {, [ or ( (ignoring quoted strings).
export function bracketDepth(text) {
  let depth = 0;
  let quote = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === '"') quote = false;
    } else if (ch === '"') quote = true;
    else if ('{[('.includes(ch)) depth++;
    else if ('}])'.includes(ch)) depth--;
  }
  return depth;
}

// Split at a separator that sits outside quotes and brackets.
export function splitTop(text, sep, { skip } = {}) {
  const parts = [];
  let depth = 0;
  let quote = false;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === '"') quote = false;
      continue;
    }
    if (ch === '"') quote = true;
    else if ('{[('.includes(ch)) depth++;
    else if ('}])'.includes(ch)) depth = Math.max(0, depth - 1);
    else if (ch === sep && depth === 0 && !(skip && skip(text, i))) {
      parts.push({ s: start, e: i });
      start = i + 1;
    }
  }
  parts.push({ s: start, e: text.length });
  return parts;
}

// Index of the bracket that closes the one at `open`, or -1.
export function matchClose(text, open) {
  const pairs = { '(': ')', '[': ']', '{': '}' };
  let depth = 0;
  let quote = false;
  for (let i = open; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === '"') quote = false;
      continue;
    }
    if (ch === '"') quote = true;
    else if (pairs[ch]) depth++;
    else if ('}])'.includes(ch)) {
      depth--;
      if (depth === 0) return pairs[text[open]] === ch ? i : -1;
    }
  }
  return -1;
}
