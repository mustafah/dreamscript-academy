/*
 * Translatable lesson metadata lives outside the executable curriculum.
 * `lessonTranslation` copies only presentation fields; files, syntax and
 * task.check functions always come from the original lesson object.
 */
import { STAGE_LABELS } from './i18n-lesson-stages.js';
import { LABELS as CORE_LABELS } from './i18n-lesson-labels-core.js';
import { LABELS as EAST_LABELS } from './i18n-lesson-labels-east.js';
import { CONTENT as CORE_CONTENT } from './i18n-lesson-content-core.js';
import { CONTENT as EAST_CONTENT } from './i18n-lesson-content-east.js';
import { fallbackLessonContent } from './i18n-lesson-content-fallback.js';
import { localizeConstructs as localizeCoreConstructs } from './i18n-lesson-constructs-core.js';
import { localizeConstructs as localizeEastConstructs } from './i18n-lesson-constructs-east.js';

const LABELS = { ...CORE_LABELS, ...EAST_LABELS };
const CONTENT = { ...CORE_CONTENT, ...EAST_CONTENT };
function chain(locale) {
  const normalized = String(locale || 'en');
  const base = normalized.split('-')[0];
  return normalized === base ? [normalized, 'en'] : [normalized, base, 'en'];
}

function find(map, locale, id) {
  for (const candidate of chain(locale)) {
    if (map[candidate]?.[id] !== undefined) return map[candidate][id];
  }
  return undefined;
}

function stageFor(locale, stage) {
  const values = find(STAGE_LABELS, locale, stage - 1);
  return values ? { name: values[0], blurb: values[1] } : null;
}

export function lessonTranslation(lesson, locale = 'en') {
  const labels = find(LABELS, locale, lesson.id);
  const stage = stageFor(locale, lesson.stage);
  const constructs = locale.startsWith('ja') || locale.startsWith('zh') || locale.startsWith('ko') || locale.startsWith('hi')
    ? localizeEastConstructs(lesson.construct, locale)
    : localizeCoreConstructs(lesson.construct, locale);
  const isRegionalArabic = locale === 'ar-EG' || locale === 'ar-SA';
  const detailedContent = isRegionalArabic ? undefined : find(CONTENT, locale, lesson.id);
  const fallbackContent = fallbackLessonContent(lesson, locale, constructs);
  const content = (fallbackContent || detailedContent)
    ? { ...fallbackContent, ...detailedContent }
    : null;
  const translatedTasks = content?.tasks
    ? lesson.tasks.map((task) => ({
      ...task,
      ...(fallbackContent?.tasks?.[task.id] || {}),
      ...(detailedContent?.tasks?.[task.id] || {}),
    }))
    : lesson.tasks;
  return {
    ...lesson,
    construct: constructs,
    ...(labels ? { title: labels[0], tagline: labels[1] } : {}),
    ...(stage ? { stageName: stage.name } : {}),
    ...(content?.intro ? { intro: content.intro } : {}),
    ...(content?.tips ? { tips: content.tips } : {}),
    ...(content?.tasks ? { tasks: translatedTasks } : {}),
  };
}

export function localizeStage(stage, locale = 'en') {
  const translated = stageFor(locale, stage.id);
  return {
    ...stage,
    ...(translated || {}),
    lessons: stage.lessons.map((lesson) => lessonTranslation(lesson, locale)),
  };
}
