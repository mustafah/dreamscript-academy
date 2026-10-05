// The standard library: every built-in function, registered into the prelude scope.
import { Scope } from '../scope.js';
import { Native } from '../values.js';
import { norm } from '../names.js';
import { register as text } from './text.js';
import { register as math } from './math.js';
import { register as list } from './list.js';
import { register as objects } from './objects.js';
import { register as colors } from './colors.js';
import { register as variation } from './variation.js';

const GROUPS = { text, math, list, objects, colors, variation };

export function buildPrelude() {
  const scope = new Scope(null, 'prelude');
  for (const [group, register] of Object.entries(GROUPS)) {
    register((name, sig, doc, impl, opts = {}) => {
      scope.define(name, new Native(name, impl, { sig, doc, group, ...opts }), { kind: 'native' });
    });
  }
  return scope;
}

// Names and signatures for editors (completions, cheat sheet).
export function stdDocs() {
  return buildPrelude().own().map((b) => ({ name: b.name, sig: b.value.sig, doc: b.value.doc, group: b.value.group }));
}

export const stdNames = () => new Set(stdDocs().map((d) => norm(d.name)));
