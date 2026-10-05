import { clear, button, el } from './dom.js';
import { t } from './i18n.js';

function moonSvg(stage) {
  const ratio = Math.max(0, Math.min(1, stage.ratio || 0));
  const eclipse = 20 + (ratio * 22);
  const id = `moon-mask-${stage.id}`;
  return `
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <defs>
        <linearGradient id="grad-${stage.id}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#ffe58e" />
          <stop offset="1" stop-color="#f7b733" />
        </linearGradient>
        <mask id="${id}">
          <rect width="40" height="40" fill="white" />
          <circle cx="${eclipse.toFixed(2)}" cy="20" r="15" fill="black" />
        </mask>
      </defs>
      <circle cx="20" cy="20" r="15" fill="#1b2440" stroke="rgba(255,255,255,.18)" />
      <circle cx="20" cy="20" r="15" fill="url(#grad-${stage.id})" mask="url(#${id})" />
    </svg>`;
}

export function renderProgress(node, stages, currentStage, onClick) {
  clear(node).append(el('div', { class: 'moon-track' }, stages.map((stage) => button('', {
    class: `moon-button${stage.id === currentStage ? ' current' : ''}`,
    title: `${t('map.stage', { stage: stage.id, name: stage.name })} — ${t('lesson.done', { done: stage.count, total: stage.total })}`,
    'aria-label': `${t('map.stage', { stage: stage.id, name: stage.name })} — ${t('lesson.done', { done: stage.count, total: stage.total })}`,
    onClick: () => onClick(stage.id),
  },
  el('span', { class: 'moon-svg-wrap', html: moonSvg(stage) }),
  el('span', { class: 'moon-label', text: stage.moon }),
  ))));
}
