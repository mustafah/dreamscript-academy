import { clear, el, button } from './dom.js';
import { t } from './i18n.js';

const label = (lesson) => `${lesson.number ?? '?'} · ${lesson.emoji || '✦'} ${lesson.title || lesson.id || 'Untitled lesson'}`;

export function renderLessonMap(node, { open, stages, currentId, done, onClose, onSelect }) {
  node.classList.toggle('open', open);
  clear(node).append(
    el('div', { class: 'lesson-map-inner glass', 'data-testid': 'lesson-map' },
      el('div', { class: 'editor-header' }, el('strong', { text: t('map.title') }), button(t('map.close'), { onClick: onClose, 'aria-label': t('shell.closeMap') })),
      stages.map((stage) => {
        const total = stage.lessons.length || 1;
        const count = stage.lessons.filter((lesson) => done[lesson.id]).length;
        return el('section', { class: 'map-stage' },
          el('div', { class: 'map-stage-head' },
            el('div', {},
              el('h3', { text: `${stage.moon} ${t('map.stage', { stage: stage.id, name: stage.name })}` }),
              el('div', { class: 'muted', text: stage.blurb }),
            ),
            el('span', { class: 'pill', text: `${count}/${total}` }),
          ),
          el('div', { class: 'map-progress' }, el('div', { class: 'map-progress-fill', style: { width: `${(count / total) * 100}%` } })),
          stage.lessons.map((lesson) => button(label(lesson), {
            class: `map-lesson${lesson.id === currentId ? ' active' : ''}`,
            onClick: () => onSelect(lesson.id),
          }, el('span', { class: `map-mark${done[lesson.id] ? ' done' : lesson.id === currentId ? ' current' : ''}`, text: done[lesson.id] ? '✓' : lesson.id === currentId ? '●' : '○' }))),
        );
      }),
    ),
  );
}
