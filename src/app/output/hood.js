import { clear, el } from '../dom.js';
import { t } from '../i18n.js';

function scalar(value) {
  if (value == null) return el('span', { class: 'hood-v-null', text: t('values.null') });
  if (typeof value === 'string') return el('span', { class: 'hood-v-string', text: JSON.stringify(value) });
  if (typeof value === 'number') return el('span', { class: 'hood-v-number', text: String(value) });
  if (typeof value === 'boolean') return el('span', { class: 'hood-v-bool', text: t(value ? 'values.true' : 'values.false') });
  return el('span', { text: String(value) });
}

function renderNode(value) {
  if (Array.isArray(value)) return el('div', { class: 'hood-node' }, value.map(renderNode));
  if (!value || typeof value !== 'object') return scalar(value);
  return el('div', { class: 'hood-node' }, Object.entries(value).map(([key, v]) => el('div', {}, el('span', { class: 'hood-k', text: `${key}: ` }), Array.isArray(v) || (v && typeof v === 'object') ? renderNode(v) : scalar(v))));
}

export function renderHood(node, ctx) {
  clear(node);
  const list = ctx.ast || [];
  const line = ctx.cursorLine || 1;
  const stmt = list.filter((item) => (item?.line || 0) <= line).at(-1) || list[0];
  node.append(stmt ? el('article', { class: 'hood-card' }, el('div', { class: 'muted', text: t('hood.description') }), renderNode(stmt)) : el('div', { class: 'empty-state', text: t('hood.empty') }));
}
