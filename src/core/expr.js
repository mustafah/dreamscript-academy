// Expression parser (Pratt). Produces plain-object AST nodes: { t, loc, ... }.
import { DreamError } from './diag.js';
import { norm, KEYWORDS } from './names.js';
import { lex } from './lexer.js';
import { parseTemplate, hasInterpolation } from './template.js';

const BIN = new Map([
  ['??', { bp: 3, op: '??', logic: true }],
  ['or', { bp: 4, op: 'or', logic: true }],
  ['||', { bp: 4, op: 'or', logic: true }],
  ['and', { bp: 5, op: 'and', logic: true }],
  ['&&', { bp: 5, op: 'and', logic: true }],
  ['==', { bp: 7, op: '==' }],
  ['!=', { bp: 7, op: '!=' }],
  ['<', { bp: 7, op: '<' }],
  ['<=', { bp: 7, op: '<=' }],
  ['>', { bp: 7, op: '>' }],
  ['>=', { bp: 7, op: '>=' }],
  ['in', { bp: 7, op: 'in' }],
  ['..', { bp: 8, range: true }],
  ['..<', { bp: 8, range: true, excl: true }],
  ['+', { bp: 9, op: '+' }],
  ['-', { bp: 9, op: '-' }],
  ['*', { bp: 10, op: '*' }],
  ['×', { bp: 10, op: '*' }],
  ['/', { bp: 10, op: '/' }],
  ['÷', { bp: 10, op: '/' }],
  ['%', { bp: 10, op: '%' }],
  ['^', { bp: 12, op: '^', right: true }],
]);
const WORD_OPS = new Set(['and', 'or', 'in']);
const OPERAND_WORDS = new Set(['true', 'false', 'null', 'not', 'if', 'match']);

export function unescape(s) {
  return s.replace(/\\([\\"'`nt~])/g, (_, c) => ({ n: '\n', t: '\t' })[c] || c);
}

export class ExprParser {
  constructor(text, ctx, base = 0) {
    this.text = text;
    this.ctx = ctx;
    this.base = base;
    this.tokens = lex(text);
    this.i = 0;
  }

  // ---- token helpers --------------------------------------------------
  peek(k = 0) {
    return this.tokens[Math.min(this.i + k, this.tokens.length - 1)];
  }

  next() {
    const t = this.tokens[this.i];
    if (this.i < this.tokens.length - 1) this.i++;
    return t;
  }

  is(op, k = 0) {
    const t = this.peek(k);
    return t.k === 'op' && t.v === op;
  }

  isWord(w, k = 0) {
    const t = this.peek(k);
    return t.k === 'word' && t.v.toLowerCase() === w;
  }

  atEnd() {
    return this.peek().k === 'eof';
  }

  loc(tok, endTok = tok) {
    return this.ctx.src.span(this.base + tok.s, this.base + endTok.e);
  }

  fail(message, tok = this.peek(), hint = null) {
    throw new DreamError(message, { loc: this.loc(tok), hint });
  }

  expect(op, what) {
    if (!this.is(op)) {
      this.fail(`Expected \`${op}\`${what ? ` ${what}` : ''} here.`, this.peek());
    }
    return this.next();
  }

  expectWord(w) {
    if (!this.isWord(w)) this.fail(`Expected \`${w}\` here.`);
    return this.next();
  }

  mk(t, tok, extra = {}) {
    return { t, loc: this.loc(tok), ...extra };
  }

  // ---- entry points ---------------------------------------------------
  parseAll() {
    const e = this.parseVariation();
    this.expectEnd();
    return e;
  }

  expectEnd() {
    if (this.atEnd()) return;
    const t = this.peek();
    if (t.k === 'bad') this.fail(t.msg);
    if (t.k === 'word') {
      this.fail(`I wasn't expecting \`${t.v}\` here.`, t, 'Text inside expressions needs "quotes", e.g. "golden hour".');
    }
    this.fail(`I wasn't expecting \`${t.v}\` here.`, t);
  }

  // variation := alt ('|' alt)*     alt := [NN%] pipeline
  parseVariation() {
    const start = this.peek();
    const first = this.parseAlt();
    if (!this.is('|') && first.w == null) return first.e;
    const alts = [first];
    while (this.is('|')) {
      this.next();
      alts.push(this.parseAlt());
    }
    return this.mk('vary', start, { alts });
  }

  parseAlt() {
    let w = null;
    const n = this.peek();
    const pct = this.peek(1);
    if (n.k === 'num' && pct.k === 'op' && pct.v === '%' && !pct.sp && this.peek(2).sp) {
      w = n.v;
      this.i += 2;
    }
    const start = this.peek();
    const e = this.parsePipeline();
    const end = this.tokens[this.i - 1];
    return { w, e, src: this.text.slice(start.s, end.e) };
  }

  parsePipeline() {
    let left = this.parseBinary(3);
    while (this.is('|>')) {
      const op = this.next();
      const right = this.parseBinary(3);
      left =
        right.t === 'call'
          ? { ...right, args: [{ e: left }, ...right.args] }
          : this.mk('call', op, { f: right, args: [{ e: left }] });
    }
    return left;
  }

  // ---- binary / unary -------------------------------------------------
  binInfo(tok) {
    if (tok.k === 'op') return BIN.get(tok.v);
    if (tok.k === 'word' && WORD_OPS.has(tok.v.toLowerCase())) return BIN.get(tok.v.toLowerCase());
    return null;
  }

  parseBinary(minBp) {
    let left = this.parseUnary();
    for (;;) {
      const tok = this.peek();
      const info = this.binInfo(tok);
      if (!info || info.bp < minBp) break;
      this.next();
      if (info.range) {
        const b = this.parseBinary(info.bp + 1);
        let by = null;
        if (this.isWord('by')) {
          this.next();
          by = this.parseBinary(info.bp + 1);
        }
        left = this.mk('range', tok, { a: left, b, excl: !!info.excl, by });
        continue;
      }
      const right = this.parseBinary(info.right ? info.bp : info.bp + 1);
      // `a.b ?? fallback` says a missing b is fine, so don't warn about it.
      if (info.op === '??' && (left.t === 'member' || left.t === 'index')) left.quiet = true;
      left = this.mk(info.logic ? 'logic' : 'bin', tok, { op: info.op, l: left, r: right });
    }
    return left;
  }

  parseUnary() {
    const t = this.peek();
    if (t.k === 'op' && (t.v === '-' || t.v === '+')) {
      this.next();
      return this.mk('un', t, { op: t.v, e: this.parseBinary(11) });
    }
    if ((t.k === 'op' && t.v === '!') || this.isWord('not')) {
      this.next();
      return this.mk('un', t, { op: 'not', e: this.parseBinary(6) });
    }
    return this.parsePostfix();
  }

  factorialOk() {
    const n = this.peek(1);
    if (['num', 'str', 'color'].includes(n.k)) return false;
    if (n.k === 'word') {
      const w = n.v.toLowerCase();
      return KEYWORDS.has(w) && !OPERAND_WORDS.has(w);
    }
    return !(n.k === 'op' && ['(', '[', '{', '!', '~'].includes(n.v));
  }

  parsePostfix() {
    let e = this.parsePrimary();
    for (;;) {
      const t = this.peek();
      if (t.k !== 'op') break;
      if (t.v === '(' && !t.sp) {
        this.next();
        e = this.mk('call', t, { f: e, args: this.parseArgs() });
      } else if (t.v === '[' && !t.sp) {
        this.next();
        const i = this.parseVariation();
        this.expect(']');
        e = this.mk('index', t, { o: e, i, opt: false });
      } else if (t.v === '.' || t.v === '?.') {
        this.next();
        e = this.parseMember(e, t);
      } else if (t.v === '!' && this.factorialOk()) {
        this.next();
        e = this.mk('un', t, { op: 'fact', e });
      } else break;
    }
    return e;
  }

  parseMember(e, dot) {
    const opt = dot.v === '?.';
    if (opt && (e.t === 'member' || e.t === 'index')) e.quiet = true;
    if (opt && this.is('[')) {
      this.next();
      const i = this.parseVariation();
      this.expect(']');
      return this.mk('index', dot, { o: e, i, opt: true });
    }
    const name = this.next();
    if (name.k !== 'word') this.fail('Expected a property name after the dot.', name);
    return this.mk('member', name, { o: e, name: name.v, opt });
  }

  parseArgs() {
    const args = this.parseArgList(')');
    this.expect(')', 'to close the call');
    return args;
  }

  // Arguments up to `closer` (or to the end of the text when closer is null).
  parseArgList(closer = null) {
    const args = [];
    const done = () => (closer ? this.is(closer) : this.atEnd());
    while (!done()) {
      args.push(this.parseArg());
      if (this.is(',')) this.next();
      else if (!done() && !this.peek().nl) this.fail(`Expected \`,\`${closer ? ` or \`${closer}\`` : ''} here.`);
      if (this.atEnd()) break;
    }
    return args;
  }

  parseArg() {
    if (this.is('...')) {
      this.next();
      return { spread: true, e: this.parseVariation() };
    }
    const t = this.peek();
    if (t.k === 'word' && this.is('=', 1)) {
      this.i += 2;
      return { name: t.v, e: this.parseVariation() };
    }
    return { e: this.parseVariation() };
  }

  // ---- primaries ------------------------------------------------------
  parsePrimary() {
    const t = this.next();
    switch (t.k) {
      case 'num':
        return this.mk('num', t, { v: t.v });
      case 'str':
        return this.strNode(t);
      case 'color':
        return this.mk('color', t, { v: t.v });
      case 'word':
        return this.wordPrimary(t);
      case 'bad':
        return this.fail(t.msg, t);
      case 'op':
        return this.opPrimary(t);
      default:
        return this.fail('I expected a value here, but the line ended.', t, 'Did you forget the part after the operator?');
    }
  }

  opPrimary(t) {
    if (t.v === '(') {
      if (!this.inPattern && this.isLambdaParams()) return this.parseLambda(this.parseParams(), t);
      const e = this.parseVariation();
      this.expect(')');
      return e;
    }
    if (t.v === '[') return this.parseList(t);
    if (t.v === '{') return this.parseObject(t);
    return this.fail(`I wasn't expecting \`${t.v}\` here.`, t);
  }

  strNode(t) {
    if (t.raw) return this.mk('str', t, { v: unescape(t.v) });
    const parts = parseTemplate(t.v, this.ctx, this.base + t.s + 1, (x, off) => parseExprText(x, this.ctx, off), {
      string: true,
    });
    if (!hasInterpolation(parts)) return this.mk('str', t, { v: parts.map((p) => p.s).join('') });
    return this.mk('tpl', t, { parts });
  }

  wordPrimary(t) {
    const lower = t.v.toLowerCase();
    if (lower === 'true' || lower === 'false') return this.mk('bool', t, { v: lower === 'true' });
    if (lower === 'null') return this.mk('null', t);
    if (lower === 'if') return this.parseIf(t);
    if (lower === 'match') return this.parseMatch(t);
    if (!this.inPattern && this.is('=>')) return this.parseLambda([{ name: t.v, def: null }], t);
    let name = t.v;
    const max = this.ctx.maxWords || 1;
    if (max > 1) {
      const words = [t.v];
      for (let j = 0; words.length < max; j++) {
        const n = this.peek(j);
        if (n.k !== 'word' || KEYWORDS.has(n.v.toLowerCase())) break;
        words.push(n.v);
      }
      for (let k = words.length; k >= 2; k--) {
        if (this.ctx.names.has(norm(words.slice(0, k).join(' ')))) {
          name = words.slice(0, k).join(' ');
          this.i += k - 1;
          break;
        }
      }
    }
    return this.mk('id', t, { name });
  }

  parseIf(t) {
    const c = this.parseVariation();
    this.expectWord('then');
    const a = this.parseVariation();
    this.expectWord('else');
    const b = this.parseVariation();
    return this.mk('if', t, { c, a, b });
  }

  // ---- lists, objects, lambdas ---------------------------------------
  parseItem() {
    if (this.is('...')) {
      this.next();
      return { spread: true, e: this.parseVariation() };
    }
    return { e: this.parseVariation() };
  }

  parseList(open) {
    const items = [];
    while (!this.is(']')) {
      const item = this.parseItem();
      if (items.length === 0 && !item.spread && this.isWord('for')) {
        const gens = this.parseGens();
        this.expect(']', 'to close the list');
        return this.mk('comp', open, { body: item.e, gens });
      }
      items.push(item);
      if (this.is(',')) this.next();
      else if (!this.is(']') && !this.peek().nl) this.fail('Expected `,` or `]` here.');
      if (this.atEnd()) break;
    }
    this.expect(']', 'to close the list');
    return this.mk('list', open, { items });
  }

  parseObject(open) {
    const props = [];
    while (!this.is('}')) {
      props.push(this.parseProp());
      if (this.is(',')) this.next();
      else if (!this.is('}') && !this.peek().nl) {
        this.fail('Expected `,` or `}` here.', this.peek(), 'Text inside { } needs "quotes", and entries are separated by commas.');
      }
      if (this.atEnd()) break;
    }
    this.expect('}', 'to close the object');
    return this.mk('obj', open, { props });
  }

  parseProp() {
    if (this.is('...')) {
      this.next();
      return { spread: this.parseVariation() };
    }
    const t = this.peek();
    let key;
    if (t.k === 'str') {
      this.next();
      key = unescape(t.v);
    } else if (t.k === 'word') {
      let j = this.i;
      const words = [];
      while (this.tokens[j].k === 'word') words.push(this.tokens[j++].v);
      const sep = this.tokens[j];
      if (sep.k === 'op' && (sep.v === '=' || sep.v === ':')) {
        key = words.join(' ');
        this.i = j;
      } else if (words.length === 1) {
        this.next();
        return { key: t.v, value: this.mk('id', t, { name: t.v }), loc: this.loc(t) };
      } else this.fail('Expected `=` after this name.', t);
    } else this.fail('Expected a name for this entry.', t, 'Write entries like `name = value`.');
    const sepTok = this.next();
    if (!(sepTok.v === '=' || sepTok.v === ':')) this.fail(`Expected \`=\` after "${key}".`, sepTok);
    return { key, value: this.parseVariation(), loc: this.loc(t) };
  }

  isLambdaParams() {
    let depth = 1;
    let j = this.i;
    for (; this.tokens[j].k !== 'eof'; j++) {
      const t = this.tokens[j];
      if (t.k !== 'op') continue;
      if (t.v === '(') depth++;
      else if (t.v === ')' && --depth === 0) break;
    }
    const after = this.tokens[j + 1];
    return !!after && after.k === 'op' && after.v === '=>';
  }

  // Parameter list after "(" : name [= default], ...  then ")"
  parseParams() {
    const params = [];
    while (!this.is(')')) {
      const n = this.next();
      if (n.k !== 'word') this.fail('Expected a parameter name.', n);
      const p = { name: n.v, def: null, type: null };
      if (this.is(':') && this.ctx.parseType) p.type = this.ctx.parseType(this);
      if (this.is('=')) {
        this.next();
        p.def = this.parseVariation();
      }
      params.push(p);
      if (this.is(',')) this.next();
      else if (!this.is(')')) this.fail('Expected `,` or `)` here.');
    }
    this.expect(')');
    return params;
  }

  parseLambda(params, startTok) {
    this.expect('=>');
    return this.mk('lambda', startTok, { params, body: this.parseVariation() });
  }

  // ---- for-generators (comprehensions and loops) ----------------------
  looksLikeBinders(j) {
    for (;;) {
      if (this.tokens[j].k !== 'word') return false;
      j++;
      if (this.tokens[j].k === 'op' && this.tokens[j].v === ',') j++;
      else return this.tokens[j].k === 'word' && this.tokens[j].v.toLowerCase() === 'in';
    }
  }

  parseGens() {
    const gens = [];
    this.expectWord('for');
    for (;;) {
      const binders = [];
      while (!this.isWord('in')) {
        const b = this.next();
        if (b.k !== 'word') this.fail('Expected a name to loop with, like `for item in list`.', b);
        binders.push(b.v);
        if (this.is(',')) this.next();
      }
      this.next();
      const iter = this.parseVariation();
      let cond = null;
      if (this.isWord('if')) {
        this.next();
        cond = this.parseVariation();
      }
      gens.push({ binders, iter, cond });
      if (this.is(',') && this.looksLikeBinders(this.i + 1)) this.next();
      else if (this.isWord('for')) this.next();
      else break;
    }
    return gens;
  }

  // ---- match ----------------------------------------------------------
  parseMatch(t) {
    const subject = this.parseVariation();
    if (!this.is('{')) return this.mk('match', t, { subject, arms: null });
    this.next();
    const arms = [];
    while (!this.is('}')) {
      arms.push(this.parseArm());
      if (this.is(',')) this.next();
      else if (!this.is('}') && !this.peek().nl) this.fail('Expected `,` or `}` after this match arm.');
      if (this.atEnd()) break;
    }
    this.expect('}', 'to close the match');
    return this.mk('match', t, { subject, arms });
  }

  parseArm() {
    const pats = [this.parsePattern()];
    while (this.is('|')) {
      this.next();
      pats.push(this.parsePattern());
    }
    let guard = null;
    if (this.isWord('when')) {
      this.next();
      guard = this.parseBinary(3);
    }
    this.expect('=>', 'between the pattern and its result');
    return { pats, guard, body: this.parseVariation() };
  }

  // In a pattern `word =>` is the arrow of the arm, not a lambda.
  parsePattern() {
    const t = this.peek();
    if (t.k === 'word' && t.v === '_') {
      this.next();
      return this.mk('wild', t);
    }
    const saved = this.inPattern;
    this.inPattern = true;
    try {
      return this.parseBinary(8);
    } finally {
      this.inPattern = saved;
    }
  }
}

// ---- convenience wrappers ----------------------------------------------
export function parseExprText(text, ctx, base = 0) {
  return new ExprParser(text, ctx, base).parseAll();
}

export function makeParser(text, ctx, base = 0) {
  return new ExprParser(text, ctx, base);
}
