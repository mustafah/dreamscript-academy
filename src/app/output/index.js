import { clear, el, button } from '../dom.js';
import { renderDream } from './dream.js';
import { renderValues } from './values.js';
import { renderRenders } from './renders.js';
import { renderProblems } from './problems.js';
import { renderHood } from './hood.js';
import { t } from '../i18n.js';

const TABS = [
  ['dream', '✦', 'tabs.dream', 'tab-dream'],
  ['values', '⚙', 'tabs.values', 'tab-values'],
  ['renders', '🎬', 'tabs.renders', 'tab-renders'],
  ['problems', '⚠', 'tabs.problems', 'tab-problems'],
  ['hood', '🔬', 'tabs.hood', 'tab-hood'],
];

function badge(id, ctx) {
  if (id === 'values') return (ctx.result?.values || []).length;
  if (id === 'renders') return (ctx.variant?.renders || []).length;
  if (id === 'problems') return (ctx.result?.diagnostics || []).filter((item) => item.severity !== 'info').length;
  return '';
}

export function renderOutput(node, ctx) {
  clear(node).append(
    el('section', { class: 'glass output-shell', 'data-testid': 'output-pane' },
      el('div', { class: 'output-header' },
        el('div', { class: 'output-tabs', role: 'tablist' }, TABS.map(([id, icon, labelKey, testId]) => button('', {
          class: `tab-button compact-tab${ctx.activeTab === id ? ' active' : ''}`,
          'data-testid': testId,
          'aria-label': t(labelKey),
          'aria-selected': String(ctx.activeTab === id),
          role: 'tab',
          onClick: () => ctx.onTab(id),
        },
        el('span', { class: 'tab-icon', text: icon }),
        el('span', { class: 'tab-label', text: t(labelKey) }),
        badge(id, ctx) ? el('span', { class: 'badge', text: badge(id, ctx) }) : null,
        ))),
      ),
      el('div', { class: 'output-body' }, el('div', { class: 'output-scroll' })),
    ),
  );
  const slot = node.querySelector('.output-scroll');
  if (ctx.activeTab === 'dream') renderDream(slot, ctx);
  else if (ctx.activeTab === 'values') renderValues(slot, ctx);
  else if (ctx.activeTab === 'renders') renderRenders(slot, ctx);
  else if (ctx.activeTab === 'problems') renderProblems(slot, ctx);
  else renderHood(slot, ctx);
}
