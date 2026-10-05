import { clear, el, button } from '../dom.js';
import { kindLabel } from '../intellisense.js';
import { t } from '../i18n.js';

function leaf(desc) {
  if (!desc) return el('span', { class: 'soft', text: '—' });
  if (desc.t === 'null') return el('span', { class: 'hood-v-null', text: t('values.null') });
  if (desc.t === 'color') return el('span', { class: 'value-leaf' }, el('span', { class: 'inline-swatch', style: { background: desc.hex } }), `${desc.hex} (${desc.name})`);
  if (desc.t === 'fn') return el('span', { class: 'hood-v-keyword', text: desc.sig });
  if (desc.t === 'choice') return el('span', { class: 'value-leaf', text: `${t('values.varies')}: ${desc.alts.join(' | ')}${desc.done && desc.value ? ` → ${desc.value.v ?? desc.value.hex ?? ''}` : ''}` });
  if (desc.t === 'text') return el('span', { class: 'hood-v-string', text: JSON.stringify(desc.v) });
  if (desc.t === 'number') return el('span', { class: 'hood-v-number', text: String(desc.v) });
  if (desc.t === 'bool') return el('span', { class: 'hood-v-bool', text: t(desc.v ? 'values.true' : 'values.false') });
  return el('span', { text: desc.t });
}

function leafOrBranch(desc) {
  if (!desc) return leaf(desc);
  if (desc.t === 'list') {
    return el('details', { open: desc.n <= 4 ? '' : null },
      el('summary', { text: t('values.list', { count: desc.n }) }),
      el('div', { class: 'tree value-tree' }, desc.items.map((item, index) => el('div', { class: 'tree-row' }, el('code', { text: t('values.index', { index }) }), leafOrBranch(item)))),
    );
  }
  if (desc.t === 'obj') {
    return el('details', { open: desc.n <= 4 ? '' : null },
      el('summary', { text: t('values.object', { kind: t(`kind.${String(desc.kind || 'object').toLowerCase()}`), name: desc.name || '', count: desc.n }) }),
      el('div', { class: 'tree value-tree' }, desc.entries.map(([key, value, doc]) => el('div', { class: 'tree-row' }, el('code', { text: key }), leafOrBranch(value), doc ? el('div', { class: 'muted', text: doc }) : null))),
    );
  }
  return leaf(desc);
}

function valueCard(value, ctx) {
  return el('article', { class: 'value-item' },
    el('div', { class: 'value-head' },
      el('div', { class: 'value-copy' },
        button(value.name, { class: 'value-link', onClick: () => ctx.onReveal(value.file || ctx.activeFile, value.line || 1) }),
        value.doc ? el('div', { class: 'muted', text: value.doc }) : null,
        value.detail ? el('div', { class: 'soft', text: value.detail }) : null,
      ),
      el('div', { class: 'value-meta' }, el('span', { class: 'kind-chip', text: kindLabel(value.kind) }), value.type ? el('code', { text: value.type }) : null),
    ),
    value.value ? leafOrBranch(value.value) : null,
  );
}

export function renderValues(node, ctx) {
  clear(node);
  const values = [...(ctx.result?.values || [])].sort((a, b) => (a.line || 1e9) - (b.line || 1e9));
  const body = values.length
    ? el('div', { class: 'values-list' }, values.map((value) => valueCard(value, ctx)))
    : el('div', { class: 'empty-state', text: t('values.empty') });
  node.append(body);
}
