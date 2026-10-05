// Small helpers that lesson tasks use to inspect a compile result.
import { norm } from '../core/names.js';

export const dream = (r) => r.variants[0] || { prompt: '', items: [], renders: [], picks: [] };
export const promptOf = (r) => dream(r).prompt;
export const noErrors = (r) => !r.diagnostics.some((d) => d.severity === 'error');
export const binding = (r, name) => r.values.find((v) => norm(v.name) === norm(name));

// Turn a described value (see compile().values) back into plain JS.
export function plain(node) {
  if (!node) return undefined;
  switch (node.t) {
    case 'number': case 'text': case 'bool': return node.v;
    case 'null': return null;
    case 'color': return node.hex;
    case 'list': return node.items.map(plain);
    case 'obj': return Object.fromEntries(node.entries.map(([k, v]) => [k, plain(v)]));
    case 'choice': return node.done ? plain(node.value) : node.alts;
    default: return undefined;
  }
}

export const valueOf = (r, name) => plain(binding(r, name)?.value);
export const isType = (r, name, t) => binding(r, name)?.value?.t === t;
export const lines = (r) => promptOf(r).split('\n').filter((l) => l.trim());
export const countMatches = (text, re) => (text.match(re) || []).length;
export const source = (files, name = 'main.dream') => files[name] ?? Object.values(files)[0] ?? '';
// The render jobs of the first dream.
export const allRenders = (r) => dream(r).renders;
