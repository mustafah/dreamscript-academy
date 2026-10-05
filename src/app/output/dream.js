import { clear, el, button } from '../dom.js';
import { trimText } from '../state.js';
import { plural, t } from '../i18n.js';

function segNode(seg) {
  if (seg.t === 'text') return document.createTextNode(seg.s);
  if (seg.t === 'val') return el('span', { class: 'seg-chip seg-val', title: seg.src || '' }, seg.color ? el('span', { class: 'inline-swatch', style: { background: seg.color } }) : null, seg.s);
  if (seg.t === 'err') return el('span', { class: 'seg-chip seg-err', title: seg.msg || '' }, seg.s);
  if (seg.t === 'pick') {
    const title = (seg.alts || seg.picks?.[0]?.alts || []).map((alt, i) => `${i === seg.idx ? '✓ ' : ''}${alt}`).join('\n');
    if (seg.inner) return el('span', { class: 'line-pick', title }, seg.inner.map(segNode));
    return el('span', { class: 'seg-chip seg-pick', title }, seg.s);
  }
  return document.createTextNode(seg.s || '');
}

function blocks(items) {
  const out = [[]];
  for (const item of items || []) {
    if (item.kind === 'break') out.push([]);
    else out.at(-1).push(item);
  }
  return out.filter((part) => part.length);
}

function variantDots(count, current, onSelect) {
  if (count < 2 || count > 12) return null;
  return el('div', { class: 'variant-dots' }, [...Array(count)].map((_, index) => button('', {
    class: `variant-dot${index === current ? ' active' : ''}`,
    'aria-label': t('dream.goTo', { count: index + 1 }),
    onClick: () => onSelect(index),
  })));
}

export function renderDream(node, ctx) {
  const { result, variant, variantIndex, onSelectVariant, onRoll, rolled } = ctx;
  clear(node);
  const variants = result?.variants || [];
  const total = result?.total || variants.length || 0;
  const totalText = rolled
    ? t('dream.rolled')
    : result?.exact
      ? plural('dream.total', total)
      : `${plural('dream.approx', total)} · ${t('dream.showing', { count: variants.length })}`;
  const pager = el('div', { class: 'variant-pager', 'data-testid': 'variant-pager' },
    button('◀', { onClick: () => onSelectVariant(Math.max(0, variantIndex - 1)), disabled: rolled || variantIndex < 1, 'aria-label': t('dream.previous') }),
    el('span', { 'data-testid': 'variant-count', text: variant ? `${variantIndex + 1}/${Math.max(variants.length, 1)}` : '0/0' }),
    button('▶', { onClick: () => onSelectVariant(Math.min(variants.length - 1, variantIndex + 1)), disabled: rolled || variantIndex >= variants.length - 1, 'aria-label': t('dream.next') }),
  );
  const body = variant ? el('div', { class: 'dream-block', 'data-testid': 'dream-output' },
    blocks(variant.items).map((block) => el('section', { class: 'dream-entry' }, block.map((item) => el('div', {
      class: `dream-line${item.ch !== 'prompt' ? ' channel-line' : ''}`,
      dir: 'auto',
      'data-channel': item.ch,
    },
    item.ch === 'translation' ? el('span', { class: 'channel-symbol', text: '≈' }) : null,
    item.ch === 'note' ? el('span', { class: 'channel-symbol', text: '☽' }) : null,
    item.ch === 'concept' ? el('span', { class: 'channel-symbol', text: '◊' }) : null,
    el('span', {}, (item.segs || []).map(segNode)),
    )))),
    variant.picks?.length ? el('section', { class: 'output-section' },
      el('div', { class: 'dream-meta-row' }, el('strong', { text: t('dream.choices') }), variant.probability != null ? el('span', { class: 'pill', text: t('dream.chance', { count: Math.round(variant.probability * 100) }) }) : null),
      el('div', { class: 'choice-strip' }, variant.picks.map((pick) => el('span', { class: 'choice-pill', title: pick.options.join('\n') }, `${pick.label || t('dream.choice')}: ${pick.options[pick.index]}`, pick.p != null ? el('span', { class: 'probability', text: `${Math.round(pick.p * 100)}%` }) : null))),
    ) : null,
    variants.length > 1 ? el('details', { class: 'all-dreams-panel' },
      el('summary', { text: t('dream.all') }),
      el('div', { class: 'all-dreams' }, variants.map((item, index) => button(trimText(item.prompt || t('dream.blank')), { class: index === variantIndex ? 'active' : '', onClick: () => onSelectVariant(index) }))),
    ) : null,
  ) : el('div', { class: 'empty-state', 'data-testid': 'dream-output', text: t('dream.empty') });
  node.append(
    el('div', { class: 'variant-toolbar' },
      el('div', { class: 'dream-meta-row' }, pager, variantDots(variants.length, variantIndex, onSelectVariant)),
      el('div', { class: 'dream-meta-row' }, el('span', { class: 'muted', text: totalText }), button(t('dream.roll'), { 'data-testid': 'roll-button', onClick: onRoll })),
    ),
    body,
  );
}
