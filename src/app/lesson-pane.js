import { clear, el, button } from './dom.js';
import { t } from './i18n.js';

const trusted = (items, className) => el('div', { class: className }, items.map((item) => el('div', { html: item })));

const artistIllustrations = {
  describe: `
    <svg viewBox="0 0 420 190" role="presentation" focusable="false">
      <defs>
        <linearGradient id="artist-describe-sky" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#33246e" />
          <stop offset="1" stop-color="#152e4e" />
        </linearGradient>
        <linearGradient id="artist-describe-card" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#282151" />
          <stop offset="1" stop-color="#1b1839" />
        </linearGradient>
      </defs>
      <rect width="420" height="190" rx="16" fill="#17142f" />
      <circle cx="84" cy="49" r="52" fill="#b362ff" fill-opacity=".12" />
      <rect x="18" y="20" width="202" height="150" rx="13" fill="url(#artist-describe-sky)" stroke="#ffffff" stroke-opacity=".12" />
      <circle cx="170" cy="52" r="19" fill="#ffc857" fill-opacity=".88" />
      <circle cx="48" cy="47" r="2" fill="#ffffff" fill-opacity=".8" />
      <circle cx="72" cy="34" r="1.5" fill="#5eead4" />
      <circle cx="113" cy="63" r="1.7" fill="#ffffff" fill-opacity=".65" />
      <path d="M18 126C55 94 84 116 112 100s48-10 108 14v56H18Z" fill="#12132b" fill-opacity=".72" />
      <path d="M18 144c38-25 66-4 104-20s60-5 116 12v34H18Z" fill="#5eead4" fill-opacity=".23" />
      <path d="M47 125c17-9 29-8 46 1" stroke="#ffc857" stroke-linecap="round" stroke-width="3" />
      <rect x="54" y="119" width="6" height="24" rx="3" fill="#ffc857" />
      <path d="M58 110v-12" stroke="#ffc857" stroke-linecap="round" stroke-width="2" />
      <rect x="244" y="20" width="158" height="150" rx="13" fill="url(#artist-describe-card)" stroke="#ffffff" stroke-opacity=".12" />
      <path d="M265 50h70" stroke="#e4cbff" stroke-linecap="round" stroke-width="6" />
      <path d="M265 70h108" stroke="#5eead4" stroke-linecap="round" stroke-width="4" stroke-opacity=".8" />
      <path d="M265 88h88" stroke="#ffc857" stroke-linecap="round" stroke-width="4" stroke-opacity=".85" />
      <path d="M265 106h114" stroke="#ff6b9d" stroke-linecap="round" stroke-width="4" stroke-opacity=".7" />
      <path d="M265 137h52" stroke="#938db8" stroke-linecap="round" stroke-width="4" />
      <path d="m348 129 20 20 20-34" fill="none" stroke="#7dffb3" stroke-linecap="round" stroke-linejoin="round" stroke-width="4" />
    </svg>`,
  explore: `
    <svg viewBox="0 0 420 190" role="presentation" focusable="false">
      <defs>
        <linearGradient id="artist-explore-bg" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#211747" />
          <stop offset="1" stop-color="#122f3c" />
        </linearGradient>
      </defs>
      <rect width="420" height="190" rx="16" fill="url(#artist-explore-bg)" />
      <circle cx="106" cy="91" r="55" fill="#b362ff" fill-opacity=".13" />
      <path d="M130 92c38-1 52-38 88-47M130 93c39 4 53 34 88 45M130 93h88" fill="none" stroke="#ffffff" stroke-opacity=".24" stroke-linecap="round" stroke-width="3" />
      <rect x="26" y="57" width="104" height="72" rx="14" fill="#2c225c" stroke="#b362ff" stroke-opacity=".55" />
      <path d="M45 78h60M45 92h43M45 106h50" stroke="#e4cbff" stroke-linecap="round" stroke-width="5" />
      <circle cx="130" cy="93" r="9" fill="#ffc857" stroke="#17142f" stroke-width="4" />
      <g>
        <rect x="218" y="23" width="174" height="47" rx="13" fill="#1c3150" stroke="#5eead4" stroke-opacity=".7" />
        <circle cx="240" cy="46" r="8" fill="#5eead4" />
        <path d="M258 39h96M258 52h65" stroke="#b9f8ef" stroke-linecap="round" stroke-width="4" stroke-opacity=".85" />
      </g>
      <g>
        <rect x="218" y="72" width="174" height="47" rx="13" fill="#3c2942" stroke="#ff6b9d" stroke-opacity=".72" />
        <circle cx="240" cy="95" r="8" fill="#ff6b9d" />
        <path d="M258 88h82M258 101h106" stroke="#ffd0df" stroke-linecap="round" stroke-width="4" stroke-opacity=".85" />
      </g>
      <g>
        <rect x="218" y="121" width="174" height="47" rx="13" fill="#403325" stroke="#ffc857" stroke-opacity=".75" />
        <circle cx="240" cy="144" r="8" fill="#ffc857" />
        <path d="M258 137h104M258 150h72" stroke="#ffe9ad" stroke-linecap="round" stroke-width="4" stroke-opacity=".85" />
      </g>
    </svg>`,
  render: `
    <svg viewBox="0 0 420 190" role="presentation" focusable="false">
      <defs>
        <linearGradient id="artist-render-sky" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#46215f" />
          <stop offset="1" stop-color="#142e45" />
        </linearGradient>
        <linearGradient id="artist-render-motion" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#5eead4" />
          <stop offset="1" stop-color="#b362ff" />
        </linearGradient>
      </defs>
      <rect width="420" height="190" rx="16" fill="#17142f" />
      <rect x="22" y="25" width="116" height="140" rx="13" fill="#282151" stroke="#ffffff" stroke-opacity=".12" />
      <path d="M43 55h63M43 72h79M43 89h55" stroke="#e4cbff" stroke-linecap="round" stroke-width="5" />
      <path d="M43 119h31M43 134h55" stroke="#5eead4" stroke-linecap="round" stroke-width="4" />
      <path d="m163 95 36-24v48Z" fill="#ffc857" fill-opacity=".9" />
      <rect x="213" y="25" width="84" height="64" rx="11" fill="url(#artist-render-sky)" stroke="#5eead4" stroke-opacity=".55" />
      <circle cx="272" cy="45" r="10" fill="#ffc857" fill-opacity=".85" />
      <path d="M213 76c20-21 34-9 47-20s22-6 37 4v29h-84Z" fill="#14112b" fill-opacity=".72" />
      <rect x="213" y="101" width="174" height="64" rx="11" fill="#202044" stroke="#b362ff" stroke-opacity=".6" />
      <rect x="225" y="113" width="7" height="40" rx="3.5" fill="#ff6b9d" fill-opacity=".8" />
      <rect x="238" y="113" width="7" height="40" rx="3.5" fill="#ffc857" fill-opacity=".75" />
      <rect x="251" y="113" width="7" height="40" rx="3.5" fill="#5eead4" fill-opacity=".78" />
      <rect x="265" y="113" width="7" height="40" rx="3.5" fill="#b362ff" fill-opacity=".82" />
      <rect x="283" y="113" width="76" height="40" rx="8" fill="url(#artist-render-motion)" fill-opacity=".22" />
      <circle cx="321" cy="133" r="12" fill="#ffffff" fill-opacity=".9" />
      <path d="m318 126 11 7-11 7Z" fill="#2b2252" />
    </svg>`,
};

function renderArtistPath(ctx) {
  if (ctx.lesson.id !== 'prose') return null;
  const steps = [
    ['✍', 'artist.step.describe.title', 'artist.step.describe.copy', 'describe'],
    ['✦', 'artist.step.explore.title', 'artist.step.explore.copy', 'explore'],
    ['◌', 'artist.step.render.title', 'artist.step.render.copy', 'render'],
  ];
  return el('section', { class: 'artist-path', 'data-testid': 'artist-path' },
    el('div', { class: 'artist-path-heading' },
      el('div', { class: 'artist-path-kicker' },
        el('span', { class: 'artist-path-kicker-mark', 'aria-hidden': 'true', text: '✦' }),
        el('span', { text: t('artist.pathLabel') }),
      ),
      el('h3', { text: t('artist.pathTitle') }),
      el('p', { class: 'artist-path-copy', text: t('artist.pathBody') }),
    ),
    el('div', { class: 'artist-path-steps' }, steps.map(([icon, titleKey, copyKey, illustration], index) => el('article', { class: 'artist-step' },
      el('div', {
        class: `artist-step-illustration artist-step-illustration-${illustration}`,
        'data-testid': 'artist-illustration',
        'data-illustration': illustration,
        'aria-hidden': 'true',
        html: artistIllustrations[illustration],
      }),
      el('div', { class: 'artist-step-top' },
        el('span', { class: 'artist-step-icon', 'aria-hidden': 'true', text: icon }),
        el('span', { class: 'artist-step-number', text: `0${index + 1}` }),
      ),
      el('strong', { text: t(titleKey) }),
      el('span', { class: 'artist-step-copy', text: t(copyKey) }),
    ))),
    el('div', { class: 'artist-example' },
      el('div', { class: 'artist-example-label', text: t('artist.exampleLabel') }),
      el('code', { class: 'artist-example-prompt', text: t('artist.examplePrompt') }),
      el('div', { class: 'artist-example-variation' },
        el('span', { class: 'artist-example-pipe', 'aria-hidden': 'true', text: '|' }),
        el('span', { text: t('artist.exampleVariation') }),
      ),
      el('div', { class: 'artist-example-media' },
        el('span', { class: 'pill', text: t('artist.media.image') }),
        el('span', { class: 'pill', text: t('artist.media.video') }),
      ),
    ),
    el('div', { class: 'artist-path-actions' },
      button(t('artist.exploreButton'), {
        class: 'ghost-button small-button',
        'data-testid': 'artist-explore',
        onClick: () => ctx.onNavigate?.('variations'),
      }),
      button(t('artist.renderButton'), {
        class: 'primary-button small-button',
        'data-testid': 'artist-render',
        onClick: () => ctx.onNavigate?.('renderer'),
      }),
    ),
  );
}

export function renderLessonPane(node, ctx) {
  const { lesson, tasks, modified, celebrating, onReset, onSolution, onNext, nextReady, nextLabel } = ctx;
  node.classList.add('lesson-pane', 'glass', 'scroll-pane');
  node.classList.toggle('celebrate', celebrating);
  node.classList.toggle('sparkles', celebrating);
  clear(node).append(
    el('div', { class: 'lesson-hero', 'data-testid': 'lesson-pane' },
      el('div', { class: 'stage-line' },
        el('span', { class: 'pill', text: t('lesson.stage', { stage: lesson.stage }) }),
        el('span', { class: 'pill', text: t('lesson.lesson', { number: lesson.number ?? lesson.index ?? '?' }) }),
      ),
      el('div', { class: 'lesson-title' },
        el('span', { class: 'emoji' }, lesson.emoji || '✦'),
        el('div', { class: 'lesson-head-copy' },
          el('h2', { 'data-testid': 'lesson-title', text: lesson.title }),
          el('p', { class: 'tagline', text: lesson.tagline }),
        ),
      ),
      renderArtistPath(ctx),
      trusted(lesson.intro, 'lesson-copy'),
      el('section', { class: 'lesson-card syntax-card' },
        el('div', { class: 'card-label', text: t('lesson.syntax') }),
        el('pre', { class: 'syntax-pre', 'data-syntax-lines': lesson.syntax.join('\n') }, lesson.syntax.join('\n')),
      ),
      el('section', { class: 'lesson-card tips-card' },
        el('div', { class: 'card-label', text: t('lesson.goodToKnow') }),
        trusted(lesson.tips, 'tips-list'),
      ),
      el('section', { class: 'lesson-card task-card' },
        el('div', { class: 'task-header' },
          el('div', {}, el('h3', { text: t('lesson.yourTurn') }), el('div', { class: 'muted', text: t('lesson.taskChecks') })),
          el('span', { class: 'pill', text: t('lesson.done', { done: tasks.filter((task) => task.done).length, total: tasks.length }) }),
        ),
        el('div', { class: 'task-list' }, tasks.map((task) => el('article', {
          class: 'task-item',
          'data-testid': `task-${task.id}`,
          'data-done': String(task.done),
          dataset: { done: String(task.done) },
        },
        el('div', { class: 'task-top' },
          el('div', { class: 'task-state', 'aria-hidden': 'true' }, el('span', { text: task.done ? '✓' : '' })),
          el('div', { class: 'task-body', html: task.text }),
        ),
        el('details', { class: 'task-hint' },
          el('summary', { text: t('lesson.hint') }),
          el('div', { class: 'muted', html: task.hint }),
        )))),
        el('div', { class: 'task-actions' },
          button(modified ? t('lesson.resetStarter') : t('lesson.reset'), { 'data-testid': 'reset-code', onClick: onReset }),
          button(t('lesson.showSolution'), { 'data-testid': 'show-solution', onClick: onSolution }),
          button(nextLabel, { class: nextReady ? 'primary-button pulse-next' : 'primary-button', onClick: onNext, disabled: !nextLabel }),
        ),
      ),
    ),
  );
}
