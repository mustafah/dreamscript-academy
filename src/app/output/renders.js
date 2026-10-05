import { clear, el } from '../dom.js';
import { artNode, paletteFromVariant } from '../art.js';
import { plural, t } from '../i18n.js';

function imageGrid(images, palette) {
  return el('div', { class: 'render-image-grid' }, images.map((image) => el('figure', { class: 'render-thumb' }, artNode(image, palette))));
}

export function renderRenders(node, ctx) {
  clear(node);
  const jobs = ctx.variant?.renders || [];
  if (!jobs.length) {
    node.append(el('div', { class: 'empty-state', text: t('renders.empty') }));
    return;
  }
  const palette = paletteFromVariant(ctx.variant);
  node.append(el('div', { class: 'render-list' }, jobs.map((job) => el('article', { class: 'render-card' },
    el('div', { class: 'render-head' },
      el('div', {},
        el('strong', { class: 'render-model', text: job.label || job.model }),
        el('div', { class: 'muted', text: [job.name, job.title].filter(Boolean).join(' · ') || job.model }),
      ),
      el('div', { class: 'render-badges' },
        job.promptFromDream ? el('span', { class: 'pill', text: t('renders.promptFromDream') }) : null,
        el('span', { class: 'pill', text: `${job.width}×${job.height}` }),
      ),
    ),
    el('div', { class: 'render-grid' },
      el('div', { class: 'render-preview' },
        imageGrid(job.images || [], palette),
        el('div', { class: 'soft render-caption', text: t('renders.preview') }),
      ),
      el('div', { class: 'render-table-wrap' },
        el('table', { class: 'kv-table' }, Object.entries(job.params || {}).map(([key, value]) => el('tr', {},
          el('td', {}, el('code', { text: key })),
          el('td', {}, String(value), job.origin?.[key] ? el('span', { class: 'origin-chip', text: job.origin[key] }) : null),
        ))),
        el('div', {
          class: 'muted',
          text: t('renders.jobMeta', {
            seed: t('renders.seed', { seed: job.seed }),
            images: plural('renders.images', job.count),
            alternatives: plural('renders.alternatives', job.alternatives),
          }),
        }),
      ),
    ),
  ))));
}
