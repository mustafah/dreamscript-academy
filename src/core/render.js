// Renderer jobs: build parameters, check them against the model catalog and
// simulate a result so later jobs can use it (`base.images[0]`).
import { DreamError, didYouMean } from './diag.js';
import { norm } from './names.js';
import { Obj, Choice } from './values.js';
import { evalNode } from './interp.js';
import { describeKind } from './ops.js';
import { MODELS, IMAGE_SIZES, RESERVED } from './catalog.js';

function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

function checkParam(spec, v) {
  switch (spec.type) {
    case 'text': return typeof v === 'string' ? null : 'expected text';
    case 'bool': return typeof v === 'boolean' ? null : 'expected true or false';
    case 'enum': return spec.values.includes(String(v)) ? null : `expected one of ${spec.values.join(', ')}`;
    default: {
      if (typeof v !== 'number' || (spec.type === 'int' && !Number.isInteger(v))) return `expected a ${spec.type === 'int' ? 'whole ' : ''}number`;
      if ((spec.min !== undefined && v < spec.min) || (spec.max !== undefined && v > spec.max)) return `must be between ${spec.min} and ${spec.max}`;
      return null;
    }
  }
}

function validate(model, params, alt, ctx) {
  const info = MODELS[model];
  if (!info) {
    ctx.diag.add('info', `\`${model}\` isn't in this playground's catalog, so its parameters aren't checked.`, alt.loc, null, ctx.file);
    return;
  }
  const keys = Object.keys(info.params);
  for (const [k, v] of Object.entries(params)) {
    const key = keys.find((x) => norm(x) === norm(k));
    if (!key) {
      const close = didYouMean(k, keys);
      ctx.warn(`\`${model}\` has no parameter called \`${k}\`.`, alt.loc, close ? `Did you mean \`${close}\`?` : `It accepts: ${keys.join(', ')}.`);
      continue;
    }
    const problem = checkParam(info.params[key], v);
    if (problem) ctx.warn(`\`${k}\` for \`${model}\`: ${problem} (got ${JSON.stringify(v)}).`, alt.loc);
  }
}

function dimensions(params) {
  const sized = IMAGE_SIZES[params.image_size];
  if (sized) return sized;
  return [Number(params.width) || 1024, Number(params.height) || 768];
}

function mergeArgs(alt, scope, ctx) {
  const merged = new Obj('object');
  const sources = {};
  for (const a of alt.args) {
    if (a.name) {
      merged.set(a.name, evalNode(a.e, scope, ctx));
      sources[norm(a.name)] = 'named';
      continue;
    }
    const v = ctx.force(evalNode(a.e, scope, ctx));
    if (v === null) continue;
    if (!(v instanceof Obj)) {
      throw new DreamError(`A model call takes named values like \`seed = 5\` or a block of them, not ${describeKind(v)}.`, {
        loc: a.e.loc,
        hint: 'Pass a struct or params block (e.g. `fal-ai/flux/dev(MyParams, seed = 2)`).',
      });
    }
    const from = a.e.t === 'id' ? a.e.name : 'object';
    for (const [k, x] of v.entries()) {
      merged.set(k, x);
      sources[norm(k)] = from;
    }
  }
  return { merged, sources };
}

export function execJob(st, scope, ctx) {
  const pick = st.alts.length > 1
    ? ctx.force(new Choice(st.alts.map((a) => ({ w: a.w, src: a.src, get: () => a })), null, st.loc))
    : st.alts[0];
  const { merged, sources } = mergeArgs(pick, scope, ctx);
  const params = {};
  const meta = {};
  const origin = {};
  for (const [k, v] of merged.entries()) {
    const plain = ctx.toJS(v);
    if (RESERVED.has(norm(k))) meta[norm(k)] = plain;
    else {
      params[k] = plain;
      origin[k] = sources[norm(k)];
    }
  }
  validate(pick.model, params, pick, ctx);
  const count = Math.max(1, Math.min(8, Number.isInteger(params.num_images) ? params.num_images : 1));
  const [width, height] = dimensions(params);
  const baseSeed = Number.isInteger(params.seed) ? params.seed : hash(pick.model + JSON.stringify(params)) % 100000;
  const id = ctx.renders.length + 1;
  const stamp = hash(pick.model + JSON.stringify(params)).toString(36);
  const images = Array.from({ length: count }, (_, i) => ({ url: `dream://${pick.model}/${stamp}-${i + 1}.png`, width, height, seed: baseSeed + i }));
  ctx.renders.push({
    id, model: pick.model, label: MODELS[pick.model]?.label || null, line: st.line, file: ctx.file, name: st.name || null,
    title: meta.title ?? meta.label ?? null, params, origin, promptFromDream: false, count, width, height, seed: baseSeed, images,
    chosen: st.alts.length > 1 ? st.alts.indexOf(pick) : null, alternatives: st.alts.length,
  });
  if (st.name) {
    const result = Obj.of([
      ['ok', true], ['model', pick.model], ['seed', baseSeed], ['count', count],
      ['images', images.map((im) => Obj.of(Object.entries(im)))],
    ]);
    scope.define(st.name, result, { kind: 'job', line: st.line });
  }
}
