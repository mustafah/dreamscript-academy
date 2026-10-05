import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LOCALE_META,
  SUPPORTED_LOCALES,
  getLocale,
  getLocaleMeta,
  initLocale,
  normalizeLocale,
  plural,
  setLocale,
  t,
} from '../src/app/i18n.js';
import { lessonTranslation } from '../src/app/i18n-lessons.js';
import { LESSONS } from '../src/lessons/index.js';

const CATALOG_KEYS = [
  'app.title', 'language.label', 'language.select', 'mobile.lesson', 'mobile.code', 'mobile.result',
  'shell.openMap', 'shell.closeMap', 'shell.topbarHint', 'shell.prev', 'shell.next', 'shell.code',
  'shell.reference', 'shell.reset', 'shell.copy', 'shell.copied', 'lesson.stage', 'lesson.lesson',
  'lesson.syntax', 'lesson.goodToKnow', 'lesson.yourTurn', 'lesson.taskChecks', 'lesson.done',
  'lesson.hint', 'lesson.resetStarter', 'lesson.reset', 'lesson.showSolution', 'lesson.next',
  'lesson.youMadeIt', 'artist.pathLabel', 'artist.pathTitle', 'artist.pathBody',
  'artist.step.describe.title', 'artist.step.describe.copy', 'artist.step.explore.title',
  'artist.step.explore.copy', 'artist.step.render.title', 'artist.step.render.copy',
  'artist.exampleLabel', 'artist.examplePrompt', 'artist.exampleVariation', 'artist.media.image',
  'artist.media.video', 'artist.exploreButton', 'artist.renderButton', 'map.title', 'map.close', 'map.stage', 'status.ready', 'status.summary',
  'status.dreams', 'status.approxDreams', 'status.errors', 'status.warnings', 'time.milliseconds',
  'tabs.dream', 'tabs.values', 'tabs.renders', 'tabs.problems', 'tabs.hood', 'dream.rolled',
  'dream.total', 'dream.approx', 'dream.showing', 'dream.previous', 'dream.next', 'dream.goTo',
  'dream.choices', 'dream.choice', 'dream.blank', 'dream.chance', 'dream.all', 'dream.empty', 'dream.roll',
  'values.empty', 'values.varies', 'values.null', 'values.true', 'values.false', 'values.list',
  'values.object', 'values.index', 'renders.empty', 'renders.promptFromDream', 'renders.preview',
  'renders.seed', 'renders.images', 'renders.alternatives', 'renders.jobMeta', 'problems.empty',
  'problems.tests', 'problems.noTests', 'hood.description', 'hood.empty', 'reference.title',
  'reference.group.text', 'reference.group.list', 'reference.group.math', 'reference.group.objects',
  'reference.group.color', 'reference.group.variation', 'editor.ariaLabel', 'confirm.reset',
  'confirm.solution', 'errors.internal', 'errors.crashHint', 'kind.fn', 'kind.template', 'kind.enum',
  'kind.type', 'kind.module', 'kind.var', 'kind.let', 'kind.value', 'kind.list', 'kind.object',
  'kind.struct', 'kind.renderer', 'kind.test', 'kind.snippet', 'intellisense.functionDeclaration',
  'intellisense.loop', 'intellisense.conditional', 'intellisense.rendererBlock',
  'intellisense.enumBlock', 'intellisense.templateBlock', 'intellisense.testBlock', 'intellisense.match',
];

const ARTIST_KEYS = [
  'artist.pathLabel', 'artist.pathTitle', 'artist.pathBody',
  'artist.step.describe.title', 'artist.step.describe.copy',
  'artist.step.explore.title', 'artist.step.explore.copy',
  'artist.step.render.title', 'artist.step.render.copy',
  'artist.exampleLabel', 'artist.examplePrompt', 'artist.exampleVariation',
  'artist.media.image', 'artist.media.video', 'artist.exploreButton', 'artist.renderButton',
];

test('supports every requested locale with complete UI catalog fallback', () => {
  assert.deepEqual(SUPPORTED_LOCALES, ['en', 'ar', 'ar-EG', 'ar-SA', 'fr', 'es', 'ko', 'de', 'pt-BR', 'ja', 'zh-CN', 'hi']);
  for (const locale of SUPPORTED_LOCALES) {
    setLocale(locale, { persist: false });
    for (const key of CATALOG_KEYS) assert.notEqual(t(key), key, `${locale} is missing ${key}`);
  }
  assert.equal(normalizeLocale('pt-br'), 'pt-BR');
  assert.equal(normalizeLocale('fr-CA'), 'fr');
  setLocale('en', { persist: false });
});

test('localizes the artist workflow instead of falling back to English', () => {
  setLocale('en', { persist: false });
  const english = Object.fromEntries(ARTIST_KEYS.map((key) => [key, t(key)]));
  for (const locale of SUPPORTED_LOCALES.filter((value) => value !== 'en')) {
    setLocale(locale, { persist: false });
    const translated = Object.fromEntries(ARTIST_KEYS.map((key) => [key, t(key)]));
    assert.notDeepEqual(translated, english, `${locale} should translate the artist workflow`);
  }
  setLocale('en', { persist: false });
});

test('uses برومبت terminology in Arabic artist copy', () => {
  setLocale('ar', { persist: false });
  for (const key of ['artist.pathBody', 'artist.step.describe.copy', 'artist.step.render.copy', 'artist.exampleLabel']) {
    assert.doesNotMatch(t(key), /موجه/, `${key} should not use the old Arabic prompt term`);
  }
  for (const key of ['artist.pathBody', 'artist.exampleLabel']) {
    assert.match(t(key), /برومبت/, `${key} should use Arabic prompt terminology`);
  }
  assert.equal(t('renders.promptFromDream'), 'البرومبت من الحلم');
  const prose = LESSONS.find((lesson) => lesson.id === 'prose');
  const translated = lessonTranslation(prose, 'ar');
  assert.match(translated.title, /برومبت/);
  assert.doesNotMatch(translated.title, /موجه/);
  setLocale('en', { persist: false });
});

test('interpolates and pluralizes translated messages', () => {
  setLocale('fr', { persist: false });
  assert.equal(t('lesson.next', { title: 'Les listes' }), 'Suivante : Les listes');
  assert.equal(plural('status.dreams', 1), '1 rêve');
  assert.equal(plural('status.dreams', 3), '3 rêves');
  setLocale('en', { persist: false });
});

test('applies language direction and document metadata', () => {
  const previousDocument = globalThis.document;
  globalThis.document = { documentElement: { dataset: {} } };
  setLocale('ar-EG', { persist: false });
  assert.equal(getLocaleMeta().dir, 'rtl');
  assert.equal(document.documentElement.lang, 'ar-EG');
  assert.equal(document.documentElement.dir, 'rtl');
  assert.equal(document.documentElement.dataset.locale, 'ar-EG');
  setLocale('en', { persist: false });
  assert.equal(document.documentElement.dir, 'ltr');
  if (previousDocument === undefined) delete globalThis.document;
  else globalThis.document = previousDocument;
});

test('persists and restores the selected locale when storage is available', () => {
  const previousStorage = globalThis.localStorage;
  const values = new Map();
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  };
  setLocale('ja');
  assert.equal(values.get('dreamscript-academy:locale'), 'ja');
  setLocale('en', { persist: false });
  initLocale();
  assert.equal(getLocale(), 'ja');
  setLocale('en', { persist: false });
  if (previousStorage === undefined) delete globalThis.localStorage;
  else globalThis.localStorage = previousStorage;
});

test('lesson localization only overlays presentation fields', () => {
  const lesson = LESSONS.find((item) => item.id === 'prose');
  const translated = lessonTranslation(lesson, 'fr');
  assert.notEqual(translated.title, lesson.title);
  assert.notDeepEqual(translated.construct, lesson.construct);
  assert.match(translated.intro[0], /Un fichier DreamScript/);
  assert.match(translated.tasks[0].text, /Ajoutez/);
  assert.deepEqual(translated.files, lesson.files);
  assert.deepEqual(translated.solution, lesson.solution);
  assert.deepEqual(translated.syntax, lesson.syntax);
  assert.equal(translated.tasks[0].check, lesson.tasks[0].check);
});

test('localizes every lesson presentation field and task for every supported locale', () => {
  const locales = SUPPORTED_LOCALES.filter((locale) => locale !== 'en');
  for (const locale of locales) {
    for (const lesson of LESSONS) {
      const translated = lessonTranslation(lesson, locale);
      assert.equal(translated.intro.length, lesson.intro.length, `${locale}/${lesson.id} intro shape`);
      assert.equal(translated.tips.length, lesson.tips.length, `${locale}/${lesson.id} tips shape`);
      assert.notDeepEqual(translated.intro, lesson.intro, `${locale}/${lesson.id} intro is localized`);
      assert.notDeepEqual(translated.tips, lesson.tips, `${locale}/${lesson.id} tips are localized`);
      assert.deepEqual(
        translated.tasks.map((task) => task.id),
        lesson.tasks.map((task) => task.id),
        `${locale}/${lesson.id} task IDs`,
      );
      for (const [index, task] of lesson.tasks.entries()) {
        const localizedTask = translated.tasks[index];
        assert.notEqual(localizedTask.text, task.text, `${locale}/${lesson.id}/${task.id} text`);
        assert.notEqual(localizedTask.hint, task.hint, `${locale}/${lesson.id}/${task.id} hint`);
      }
    }
  }
  setLocale('en', { persist: false });
});

test('fallback localization preserves every executable lesson field and task check', () => {
  const executable = (lesson) => ({
    files: lesson.files,
    syntax: lesson.syntax,
    solution: lesson.solution,
    tasks: lesson.tasks.map((task) => ({ id: task.id, check: task.check })),
  });
  const baseline = LESSONS.map(executable);
  for (const locale of SUPPORTED_LOCALES.filter((value) => value !== 'en')) {
    for (const [index, lesson] of LESSONS.entries()) {
      const translated = lessonTranslation(lesson, locale);
      assert.deepEqual(executable(translated), baseline[index], `${locale}/${lesson.id} executable data`);
    }
  }
});

test('fallback task copy preserves source requirements and decodes code once', () => {
  const lists = lessonTranslation(LESSONS.find((item) => item.id === 'lists'), 'fr');
  assert.match(lists.tasks.find((task) => task.id === 'index').text, /Palette\[2\]/);

  const capstone = lessonTranslation(LESSONS.find((item) => item.id === 'capstone'), 'fr');
  assert.match(capstone.tasks.find((task) => task.id === 'four-frames').text, /Places\.length == 4/);

  const tilde = lessonTranslation(LESSONS.find((item) => item.id === 'tilde'), 'fr');
  const emit = tilde.tasks.find((task) => task.id === 'emit');
  assert.match(emit.text, /<code>&lt;~ Weather = drifting snow<\/code>/);
  assert.doesNotMatch(emit.text, /&amp;lt;~/);
});

test('regional Arabic UI overlays remain distinct and lesson code stays literal', () => {
  setLocale('ar-EG', { persist: false });
  assert.equal(t('shell.prev'), '← اللي فات');
  assert.equal(plural('status.dreams', 2), '2 أحلام');
  setLocale('ar-SA', { persist: false });
  assert.equal(t('shell.prev'), '← السابق');
  assert.equal(plural('status.dreams', 2), '2 أحلام');
  const lesson = lessonTranslation(LESSONS.find((item) => item.id === 'prose'), 'ar-EG');
  assert.deepEqual(lesson.syntax, LESSONS[0].syntax);
  assert.deepEqual(lesson.files, LESSONS[0].files);
  const capstone = LESSONS.find((item) => item.id === 'capstone');
  const arabicContent = lessonTranslation(capstone, 'ar');
  const egyptianContent = lessonTranslation(capstone, 'ar-EG');
  const saudiContent = lessonTranslation(capstone, 'ar-SA');
  assert.notDeepEqual(egyptianContent.intro, arabicContent.intro);
  assert.notDeepEqual(saudiContent.tips, arabicContent.tips);
  assert.match(egyptianContent.intro[0], /هتتدرّب/);
  assert.match(saudiContent.intro[0], /تتدرّب/);
  setLocale('en', { persist: false });
});
