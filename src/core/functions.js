// Function statements and code-mode bodies (`~ fn`, `let`, `return`, `match` arms).
import { DreamError } from './diag.js';
import { NAME } from './names.js';
import { bracketDepth } from './src.js';
import { makeParser } from './expr.js';
import { parseTypeExpr, parseTypeText } from './types.js';

const WORD_END = '(?![\\p{L}\\p{N}_])';
const LET_RE = new RegExp(`^let\\s+(?<name>${NAME})\\s*(?::\\s*(?<type>[^=]+?))?\\s*=(?![=>])\\s*(?<rhs>.*)$`, 'us');
const RETURN_RE = new RegExp(`^return${WORD_END}`, 'iu');
const IF_RE = new RegExp(`^if${WORD_END}`, 'iu');
const ELSE_RE = new RegExp(`^else${WORD_END}`, 'iu');
const ASSERT_RE = /^assert\s/iu;

// Match arms written on indented lines below `match subject`.
export function parseArmLines(parser, parentIndent) {
  const arms = [];
  while (parser.i < parser.lines.length) {
    const ln = parser.lines[parser.i];
    if (ln.blank || ln.comment) {
      parser.i++;
      continue;
    }
    if (ln.indent <= parentIndent) break;
    const src = parser.takeLogical(ln);
    const p = makeParser(src.text, parser.ctxFor(src), 0);
    arms.push(p.parseArm());
    p.expectEnd();
  }
  if (!arms.length) {
    throw new DreamError('`match` needs at least one arm.', {
      hint: 'Write arms on the indented lines below, like `"dreamy" => 85`.',
    });
  }
  return arms;
}

function withArms(parser, node, indent) {
  if (node.t === 'match' && node.arms === null) node.arms = parseArmLines(parser, indent);
  return node;
}

export function parseFnStatement(parser, ln, from, doc) {
  const src = parser.takeLogical(ln);
  const p = makeParser(src.text.slice(from), parser.ctxFor(src), from);
  const nameTok = p.next();
  if (nameTok.k !== 'word') p.fail('Expected a function name after `fn`.', nameTok);
  p.expect('(', 'after the function name');
  const params = p.parseParams();
  let ret = null;
  if (p.is(':') && p.peek(1).k !== 'eof') {
    p.next();
    ret = parseTypeExpr(p);
  }
  const base = { t: 'fn', name: nameTok.v, params, ret, doc, line: ln.n, loc: p.loc(nameTok) };
  if (p.is('=')) {
    p.next();
    const expr = withArms(parser, p.parseVariation(), ln.indent);
    p.expectEnd();
    return { ...base, body: { expr } };
  }
  if (p.is(':') && p.peek(1).k === 'eof') {
    const stmts = parser.parseSeq(ln.indent + 1, 'code');
    if (!stmts.length) {
      throw new DreamError(`\`fn ${nameTok.v}\` has no body.`, { loc: base.loc, hint: 'Indent the lines of the function below it.' });
    }
    return { ...base, body: { stmts } };
  }
  return p.fail('Expected `= expression` or a `:` followed by an indented body.');
}

export function parseCodeStatement(parser, ln) {
  const text = ln.text;
  const m = LET_RE.exec(text);
  if (m) {
    const { name, type, rhs } = m.groups;
    const rhsOff = text.length - rhs.length;
    const src = /^[{[(]/.test(rhs) ? parser.takeLogical(ln) : parser.single(ln);
    const ctx = parser.ctxFor(src);
    const typeNode = type ? parseTypeText(type.trim(), ctx, 0) : null;
    const value = withArms(parser, makeParser(src.text.slice(rhsOff), ctx, rhsOff).parseAll(), ln.indent);
    return { t: 'let', name: name.trim(), type: typeNode, value, line: ln.n, loc: src.span(4, 4 + name.length) };
  }
  if (RETURN_RE.test(text)) {
    const src = parser.takeLogical(ln);
    const rest = src.text.slice(6);
    if (rest.trim() === '') return { t: 'return', e: null, line: ln.n };
    const e = withArms(parser, makeParser(rest, parser.ctxFor(src), 6).parseAll(), ln.indent);
    return { t: 'return', e, line: ln.n };
  }
  if (IF_RE.test(text)) {
    const node = parser.parseIf(ln, 2, (min) => parser.parseSeq(min, 'code'), ELSE_RE);
    return { ...node, mode: 'code' };
  }
  if (ELSE_RE.test(text)) throw new DreamError('`else` needs an `if` right above it.', { loc: parser.lineLoc(ln) });
  if (ASSERT_RE.test(text)) return parser.parseAssert(ln, 6);
  const src = bracketDepth(text) > 0 ? parser.takeLogical(ln) : parser.single(ln);
  const e = withArms(parser, makeParser(src.text, parser.ctxFor(src), 0).parseAll(), ln.indent);
  return { t: 'expr', e, value: true, line: ln.n };
}
