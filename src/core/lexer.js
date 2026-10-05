// Tokenizer for DreamScript expressions ("strict" mode).
// Prose and loose values are handled elsewhere; this only sees expression text.

const NUM = /\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/y;
const COLOR = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![\p{L}\p{N}_])/uy;
const CONT = '\\p{L}\\p{N}_\\p{M}\\p{Extended_Pictographic}\\p{Emoji_Modifier}\\u200d\\ufe0f';
const WORD = new RegExp(
  `[\\p{L}_\\p{Extended_Pictographic}][${CONT}]*(?:-[\\p{L}\\p{N}_][${CONT}]*)*`,
  'uy'
);
const OPS = ['...', '..<', '..', '|>', '=>', '==', '!=', '<=', '>=', '??', '?.', '&&', '||'];
const SINGLE = new Set([...'+-*/%^×÷<>=!|,:;()[]{}.?~@&']);

function sticky(re, text, i) {
  re.lastIndex = i;
  return re.exec(text);
}

function readString(text, i) {
  const quote = text[i];
  for (let j = i + 1; j < text.length; j++) {
    if (text[j] === '\\') j++;
    else if (text[j] === quote) return { end: j + 1, inner: text.slice(i + 1, j) };
  }
  return null;
}

/**
 * @returns {{k:string, v:any, s:number, e:number, sp:boolean, nl:boolean}[]}
 *  k is one of num, str, color, word, op, bad, eof.
 */
export function lex(text) {
  const tokens = [];
  let i = 0;
  let sp = false;
  let nl = false;
  const push = (k, v, s, e, extra) => {
    tokens.push({ k, v, s, e, sp, nl, ...extra });
    sp = false;
    nl = false;
  };
  while (i < text.length) {
    const ch = text[i];
    if (ch === '\n') {
      nl = true;
      sp = true;
      i++;
      continue;
    }
    if (/\s/.test(ch)) {
      sp = true;
      i++;
      continue;
    }
    let m;
    if (ch === '"' || ch === "'" || ch === '`') {
      const str = readString(text, i);
      if (!str) push('bad', ch, i, text.length, { msg: 'This text is missing its closing quote.' });
      else push('str', str.inner, i, str.end, { raw: ch !== '"' });
      i = str ? str.end : text.length;
    } else if (ch === '#' && (m = sticky(COLOR, text, i))) {
      push('color', m[0], i, i + m[0].length);
      i += m[0].length;
    } else if (ch >= '0' && ch <= '9') {
      m = sticky(NUM, text, i);
      push('num', Number(m[0]), i, i + m[0].length);
      i += m[0].length;
    } else if ((m = sticky(WORD, text, i))) {
      push('word', m[0], i, i + m[0].length);
      i += m[0].length;
    } else {
      const op = OPS.find((o) => text.startsWith(o, i));
      if (op) {
        push('op', op, i, i + op.length);
        i += op.length;
      } else if (SINGLE.has(ch)) {
        push('op', ch, i, i + 1);
        i++;
      } else {
        push('bad', ch, i, i + 1, { msg: `I don't know what \`${ch}\` means here.` });
        i++;
      }
    }
  }
  tokens.push({ k: 'eof', v: '', s: text.length, e: text.length, sp, nl });
  return tokens;
}
