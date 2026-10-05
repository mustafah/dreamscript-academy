import { compile, stdDocs, simplifyAst } from '../core/index.js';
import { STAGES, LESSONS, lessonById } from '../lessons/index.js';
import { clear, el } from './dom.js';
import { createEditor } from './editor.js';
import { renderLessonPane } from './lesson-pane.js';
import { renderLessonMap } from './lesson-map.js';
import { renderOutput } from './output/index.js';
import { renderProgress } from './progress.js';
import { createShell, refreshShell } from './shell.js';
import {
  getLocale,
  localizeDocs,
  localizeLesson,
  localizeStages,
  onLocaleChange,
  plural,
  setLocale,
  t,
} from './i18n.js';
import {
  cloneFiles,
  doneByStage,
  firstFile,
  loadDone,
  loadLessonFiles,
  loadUi,
  parseHash,
  sameFiles,
  saveDone,
  saveLessonFiles,
  saveUi,
  setHash,
} from './state.js';

const DOCS = stdDocs();
const state = {
  lesson: null,
  files: {},
  activeFile: 'main.dream',
  result: null,
  variantIndex: 0,
  rolled: null,
  tasks: [],
  cursorLine: 1,
  activeTab: '',
  manualTab: false,
  mobilePane: 'lesson',
  mapOpen: false,
  done: loadDone(),
  celebrating: false,
  referenceOpen: false,
};
Object.assign(state, loadUi());

let compileTimer = 0;
let editor;
let refs;
let readyResolve;
const ready = new Promise((resolve) => { readyResolve = resolve; });

function currentIndex() {
  return LESSONS.findIndex((lesson) => lesson.id === state.lesson?.id);
}

function stageProgress() {
  return doneByStage(STAGES, state.done);
}

function currentVariant() {
  return state.rolled || state.result?.variants?.[state.variantIndex] || state.result?.variants?.[0] || null;
}

function modified() {
  return state.lesson ? !sameFiles(state.files, state.lesson.files) : false;
}

function lessonFiles(lesson) {
  const stored = cloneFiles(loadLessonFiles(lesson));
  return Object.fromEntries(Object.keys(lesson.files).map((name) => [name, stored[name] ?? lesson.files[name]]));
}

function summaryStats() {
  const errors = (state.result?.diagnostics || []).filter((item) => item.severity === 'error').length;
  const warnings = (state.result?.diagnostics || []).filter((item) => item.severity === 'warning').length;
  const dreams = state.result?.exact
    ? plural('status.dreams', state.result?.total || 0)
    : plural('status.approxDreams', state.result?.total || 0);
  const duration = state.result?.stats?.ms
    ? t('time.milliseconds', { count: Math.round(state.result.stats.ms) })
    : t('status.ready');
  return t('status.summary', {
    dreams,
    errors: plural('status.errors', errors),
    warnings: plural('status.warnings', warnings),
    duration,
  });
}

function setTab(id, manual = false) {
  state.activeTab = id;
  if (manual) state.manualTab = true;
  saveUi({ outputTab: state.activeTab, manualTab: state.manualTab, mobilePane: state.mobilePane });
  renderOutputPane();
}

function renderReference() {
  refs.reference.classList.toggle('hidden', !state.referenceOpen);
  if (!state.referenceOpen) return;
  const groups = localizeDocs(DOCS).reduce((map, item) => {
    (map[item.group] ||= []).push(item);
    return map;
  }, {});
  clear(refs.reference).append(
    el('div', { class: 'reference-groups' },
      el('strong', { class: 'reference-title', text: t('reference.title') }),
      Object.entries(groups).map(([group, items]) => el('section', {},
        el('strong', { text: group }),
        items.map((item) => el('div', { class: 'reference-item' }, el('code', { text: item.sig }), el('div', { class: 'muted', text: item.doc }))),
      )),
    ),
  );
}

function colorizeSyntaxCard() {
  const pre = refs.lesson.querySelector('.syntax-pre');
  if (!pre || !window.monaco?.editor?.colorize) return;
  const source = pre.dataset.syntaxLines || pre.textContent || '';
  const stamp = `${state.lesson.id}:${source}`;
  pre.dataset.colorizeStamp = stamp;
  window.monaco.editor.colorize(source, 'dreamscript', {}).then((html) => {
    if (pre.dataset.colorizeStamp === stamp) pre.innerHTML = html;
  }).catch(() => {
    pre.textContent = source;
  });
}

function applyDecorations() {
  editor.setMarkers((state.result?.diagnostics || []).filter((item) => item.file === state.activeFile));
  editor.setNotes((state.result?.notes || []).filter((item) => item.file === state.activeFile));
}

function evaluateTasks() {
  state.tasks = state.lesson.tasks.map((task) => {
    try { return { ...task, done: !!task.check(state.result, state.files) }; }
    catch { return { ...task, done: false }; }
  });
  const complete = state.tasks.length > 0 && state.tasks.every((task) => task.done);
  if (complete && !state.done[state.lesson.id]) {
    state.done[state.lesson.id] = true;
    state.celebrating = true;
    saveDone(state.done);
    setTimeout(() => {
      state.celebrating = false;
      renderLesson();
      renderHeader();
    }, 950);
  }
}

function compileSafe() {
  try {
    return compile({ files: state.files, main: firstFile(state.files) });
  } catch (error) {
    return {
      ok: false,
      total: 0,
      exact: true,
      stats: { ms: 0 },
      variants: [],
      diagnostics: [{
        severity: 'error',
        message: t('errors.internal', { message: error.message }),
        hint: t('errors.crashHint'),
        file: firstFile(state.files),
        line: 1,
        col: 1,
        endLine: 1,
        endCol: 1,
      }],
      values: [],
      notes: [],
      tests: [],
      ast: Object.fromEntries(Object.keys(state.files).map((name) => [name, []])),
    };
  }
}

function renderHeader() {
  const index = currentIndex();
  const lesson = localizeLesson(state.lesson);
  refs.breadcrumb.textContent = `${lesson.stageName} › ${lesson.title}`;
  refs.prev.disabled = index <= 0;
  refs.next.disabled = index >= LESSONS.length - 1;
  refs.next.classList.toggle('pulse-next', state.tasks.every((task) => task.done));
  renderProgress(refs.progress, localizeStages(stageProgress()), state.lesson.stage, () => {
    state.mapOpen = true;
    renderMap();
  });
}

function renderFileTabs() {
  clear(refs.fileTabs).append(...Object.keys(state.files).map((name) => el('button', {
    type: 'button',
    class: `file-tab${name === state.activeFile ? ' active' : ''}`,
    onClick: () => activateFile(name),
  }, name)));
  refs.fileTabs.classList.toggle('hidden', Object.keys(state.files).length < 2);
}

function renderMap() {
  refs.backdrop.classList.toggle('open', state.mapOpen);
  renderLessonMap(refs.map, {
    open: state.mapOpen,
    stages: localizeStages(stageProgress()),
    currentId: state.lesson.id,
    done: state.done,
    onClose: closeMap,
    onSelect: (id) => goTo(id),
  });
}

function renderMobile() {
  Object.entries(refs.mobilePanes).forEach(([name, pane]) => pane.classList.toggle('mobile-active', state.mobilePane === name));
  refs.mobileButtons.forEach((button) => button.classList.toggle('active', button.dataset.pane === state.mobilePane));
}

function renderOutputPane() {
  renderOutput(refs.output, {
    result: state.result,
    variant: currentVariant(),
    variantIndex: state.rolled ? 0 : state.variantIndex,
    activeFile: state.activeFile,
    activeTab: state.activeTab,
    cursorLine: state.cursorLine,
    ast: simplifyAst(state.result?.ast?.[state.activeFile] || []),
    onTab: (id) => setTab(id, true),
    onSelectVariant: (index) => { state.rolled = null; state.variantIndex = index; renderOutputPane(); },
    onRoll: rollVariant,
    onReveal: reveal,
  });
}

function renderLesson() {
  const next = LESSONS[currentIndex() + 1];
  const lesson = localizeLesson({ ...state.lesson, tasks: state.tasks });
  const nextLessonLabel = next ? localizeLesson(next).title : '';
  renderLessonPane(refs.lesson, {
    lesson,
    tasks: lesson.tasks,
    modified: modified(),
    celebrating: state.celebrating,
    nextReady: state.tasks.every((task) => task.done),
    nextLabel: next ? t('lesson.next', { title: nextLessonLabel }) : t('lesson.youMadeIt'),
    onReset: resetLesson,
    onSolution: showSolution,
    onNext: next ? nextLesson : () => {},
    onNavigate: goTo,
  });
  colorizeSyntaxCard();
}

function renderEditorStatus() {
  refs.editorStatus.textContent = summaryStats();
}

function renderAll() {
  refreshShell(refs);
  editor?.refreshLocale?.();
  renderHeader();
  renderFileTabs();
  renderLesson();
  renderMap();
  renderMobile();
  renderReference();
  renderOutputPane();
  renderEditorStatus();
}

function compileNow() {
  state.result = compileSafe();
  state.variantIndex = Math.min(state.variantIndex, Math.max(0, (state.result?.variants?.length || 1) - 1));
  state.rolled = null;
  evaluateTasks();
  applyDecorations();
  renderAll();
}

function scheduleCompile() {
  clearTimeout(compileTimer);
  compileTimer = setTimeout(compileNow, 120);
}

function activateFile(name) {
  state.activeFile = name;
  editor.setActiveFile(name);
  applyDecorations();
  renderFileTabs();
  renderOutputPane();
}

function updateFiles(files, active = firstFile(files), persist = true) {
  state.files = cloneFiles(files);
  state.activeFile = state.files[active] != null ? active : firstFile(state.files);
  editor.setFiles(state.files, state.activeFile);
  if (persist) saveLessonFiles(state.lesson.id, state.files);
  scheduleCompile();
  renderFileTabs();
}

function reveal(file, line) {
  if (file && file !== state.activeFile && state.files[file] != null) activateFile(file);
  state.cursorLine = line || 1;
  editor.reveal(state.cursorLine);
  if (state.activeTab === 'hood') renderOutputPane();
}

function rollVariant() {
  const seed = Math.floor((performance.now() + Math.random() * 1e6) % 1e9);
  try {
    state.rolled = compile({ files: state.files, main: firstFile(state.files) }, { mode: 'sample', seed }).variants[0] || null;
  } catch {
    state.rolled = null;
  }
  renderOutputPane();
}

function closeMap() {
  state.mapOpen = false;
  renderMap();
}

function prevLesson() {
  const previous = LESSONS[currentIndex() - 1];
  if (previous) goTo(previous.id);
}

function nextLesson() {
  const next = LESSONS[currentIndex() + 1];
  if (next) goTo(next.id);
}

function resetLesson() {
  if (modified() && !confirm(t('confirm.reset'))) return;
  updateFiles(cloneFiles(state.lesson.files), firstFile(state.lesson.files), true);
}

function showSolution() {
  if (!confirm(t('confirm.solution'))) return;
  updateFiles(cloneFiles(state.lesson.solution), firstFile(state.lesson.solution), true);
}

function goTo(id, updateRoute = true) {
  const lesson = lessonById(id) || LESSONS[0];
  state.lesson = lesson;
  state.files = lessonFiles(lesson);
  state.activeFile = firstFile(state.files);
  state.variantIndex = 0;
  state.cursorLine = 1;
  state.rolled = null;
  state.mapOpen = false;
  if (!state.manualTab) state.activeTab = lesson.focus;
  if (updateRoute) setHash(lesson.id);
  editor.setFiles(state.files, state.activeFile);
  compileNow();
}

function bindGlobalShortcuts() {
  window.addEventListener('hashchange', () => {
    const id = parseHash();
    if (id && id !== state.lesson?.id) goTo(id, false);
  });
  window.addEventListener('keydown', (event) => {
    if (event.altKey && event.key === 'ArrowRight') { event.preventDefault(); nextLesson(); }
    if (event.altKey && event.key === 'ArrowLeft') { event.preventDefault(); prevLesson(); }
  });
}

function exposeApi() {
  window.__academy = {
    ready,
    locale: () => getLocale(),
    setLocale: (locale) => setLocale(locale),
    getFiles: () => cloneFiles(state.files),
    setFiles(files) { updateFiles(files, firstFile(files)); },
    lastResult: () => state.result,
    goTo: (id) => goTo(id),
    activeTab: () => state.activeTab,
  };
}

async function init() {
  refs = createShell({
    onToggleMap: () => { state.mapOpen = true; renderMap(); },
    onCloseMap: closeMap,
    onPrev: prevLesson,
    onNext: nextLesson,
    onMobilePane: (pane) => { state.mobilePane = pane; saveUi({ outputTab: state.activeTab, manualTab: state.manualTab, mobilePane: pane }); renderMobile(); },
    onLocaleChange: (locale) => { setLocale(locale); },
    onToggleReference: () => { state.referenceOpen = !state.referenceOpen; renderReference(); },
    onReset: resetLesson,
    onCopy: async () => {
      await navigator.clipboard?.writeText(Object.entries(state.files).map(([name, text]) => `// ${name}\n${text}`).join('\n\n'));
      refs.copyNote.textContent = t('shell.copied');
      setTimeout(() => { refs.copyNote.textContent = ''; }, 1200);
    },
  });
  editor = await createEditor(refs.editorHost, {
    onChange(files) {
      state.files = files;
      saveLessonFiles(state.lesson.id, files);
      scheduleCompile();
      renderLesson();
      renderFileTabs();
    },
    onCursor({ file, line }) {
      state.activeFile = file;
      state.cursorLine = line;
      if (state.activeTab === 'hood') renderOutputPane();
    },
  }, () => ({ result: state.result, stdlib: localizeDocs(DOCS) }));
  onLocaleChange(() => { if (refs) renderAll(); });
  bindGlobalShortcuts();
  exposeApi();
  goTo(parseHash() || LESSONS[0].id, !parseHash());
  readyResolve();
}

init();
