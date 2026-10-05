const KEY = 'dreamscript-academy:v1';
const read = (suffix, fallback) => {
  try { return JSON.parse(localStorage.getItem(`${KEY}:${suffix}`)) ?? fallback; }
  catch { return fallback; }
};
const write = (suffix, value) => {
  try { localStorage.setItem(`${KEY}:${suffix}`, JSON.stringify(value)); }
  catch { /* ignore */ }
};

export const cloneFiles = (files) => Object.fromEntries(Object.entries(files || {}).map(([k, v]) => [k, String(v)]));
export const firstFile = (files) => Object.keys(files || {})[0] || 'main.dream';
export const sameFiles = (a, b) => JSON.stringify(a) === JSON.stringify(b);
export const trimText = (text, n = 88) => text.length > n ? `${text.slice(0, n - 1)}…` : text;
export const parseHash = () => decodeURIComponent(location.hash.replace(/^#\/?/, '') || '');
export const setHash = (id) => {
  const hash = `#/${encodeURIComponent(id)}`;
  if (location.hash !== hash) location.hash = hash;
};

export const loadLessonFiles = (lesson) => read(`lesson:${lesson.id}:files`, cloneFiles(lesson.files));
export const saveLessonFiles = (lessonId, files) => write(`lesson:${lessonId}:files`, cloneFiles(files));
export const clearLessonFiles = (lessonId) => localStorage.removeItem(`${KEY}:lesson:${lessonId}:files`);

export const loadUi = () => read('ui', { outputTab: '', manualTab: false, mobilePane: 'lesson' });
export const saveUi = (patch) => write('ui', { ...loadUi(), ...patch });

export const loadDone = () => read('completed', {});
export const saveDone = (done) => write('completed', done);

export function doneByStage(stages, done) {
  return stages.map((stage) => {
    const total = stage.lessons.length || 1;
    const count = stage.lessons.filter((lesson) => done[lesson.id]).length;
    return { ...stage, total, count, ratio: count / total };
  });
}
