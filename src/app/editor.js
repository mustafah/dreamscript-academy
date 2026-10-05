import { el } from './dom.js';
import { firstFile, cloneFiles } from './state.js';
import { loadMonaco } from './monaco-loader.js';
import { setupDreamLanguage } from './language.js';
import { registerIntellisense } from './intellisense.js';
import { markers, noteDecorations, colorDecorations, ensureSwatchStyles } from './decorations.js';
import { t } from './i18n.js';

function textareaAdapter(host, opts) {
  const area = el('textarea', { 'aria-label': t('editor.ariaLabel'), spellcheck: 'false' });
  let files = {};
  let active = 'main.dream';
  let silent = false;
  host.append(area);
  area.addEventListener('input', () => {
    if (silent) return;
    files[active] = area.value;
    opts.onChange(cloneFiles(files), active);
  });
  area.addEventListener('keyup', () => opts.onCursor({ file: active, line: area.value.slice(0, area.selectionStart).split('\n').length }));
  return {
    mode: 'textarea',
    refreshLocale() { area.setAttribute('aria-label', t('editor.ariaLabel')); },
    setFiles(next, nextActive = firstFile(next)) { files = cloneFiles(next); active = nextActive; silent = true; area.value = files[active] || ''; silent = false; },
    getFiles: () => cloneFiles(files),
    setActiveFile(name) { active = name; silent = true; area.value = files[active] || ''; silent = false; },
    updateFile(name, text) { files[name] = text; if (active === name) area.value = text; },
    setMarkers() {}, setNotes() {},
    reveal(line) { area.focus(); const lines = area.value.split('\n'); const pos = lines.slice(0, Math.max(0, line - 1)).join('\n').length + (line > 1 ? 1 : 0); area.setSelectionRange(pos, pos); },
    focus() { area.focus(); },
    layout() {},
  };
}

function monacoAdapter(host, monaco, getCtx, opts) {
  setupDreamLanguage(monaco);
  registerIntellisense(monaco, getCtx);
  monaco.editor.setTheme('dream-night');
  const mount = el('div');
  host.append(mount);
  const editor = monaco.editor.create(mount, {
    language: 'dreamscript', automaticLayout: true, theme: 'dream-night', minimap: { enabled: false },
    ariaLabel: t('editor.ariaLabel'),
    fontFamily: 'ui-monospace, "JetBrains Mono", Menlo, monospace', fontSize: 15, lineHeight: 24,
    tabSize: 4, scrollBeyondLastLine: false, smoothScrolling: true, wordWrap: 'on', roundedSelection: true,
  });
  const models = new Map();
  let files = {};
  let active = 'main.dream';
  let quiet = false;
  let decorations = [];
  let current = { diagnostics: [], notes: [] };

  const syncDecorations = () => {
    const model = editor.getModel();
    if (!model) return;
    const notes = noteDecorations(monaco, model, current.notes || []);
    const swatches = colorDecorations(monaco, model);
    ensureSwatchStyles(host, swatches.map((s) => s.color));
    decorations = editor.deltaDecorations(decorations, [...notes, ...swatches]);
  };

  const syncMarkers = () => {
    for (const model of models.values()) monaco.editor.setModelMarkers(model, 'dreamscript', []);
    const model = models.get(active);
    if (model) monaco.editor.setModelMarkers(model, 'dreamscript', markers(monaco, current.diagnostics || []));
  };

  const modelFor = (name) => {
    if (!models.has(name)) {
      const uri = monaco.Uri.parse(`inmemory://dreamscript/${encodeURIComponent(name)}`);
      models.set(name, monaco.editor.createModel(files[name] || '', 'dreamscript', uri));
    }
    return models.get(name);
  };

  editor.onDidChangeModelContent(() => {
    if (quiet) return;
    files[active] = editor.getValue();
    opts.onChange(cloneFiles(files), active);
  });
  editor.onDidChangeCursorPosition((e) => opts.onCursor({ file: active, line: e.position.lineNumber }));

  return {
    mode: 'monaco',
    refreshLocale() { editor.updateOptions({ ariaLabel: t('editor.ariaLabel') }); },
    setFiles(next, nextActive = firstFile(next)) {
      files = cloneFiles(next);
      active = nextActive;
      for (const name of [...models.keys()]) {
        if (!(name in files)) { models.get(name).dispose(); models.delete(name); }
      }
      quiet = true;
      for (const [name, text] of Object.entries(files)) {
        const model = modelFor(name);
        if (model.getValue() !== text) model.setValue(text);
      }
      editor.setModel(modelFor(active));
      quiet = false;
      syncMarkers();
      syncDecorations();
    },
    getFiles: () => cloneFiles(files),
    setActiveFile(name) { active = name; editor.setModel(modelFor(name)); syncMarkers(); syncDecorations(); },
    updateFile(name, text) { files[name] = text; const model = modelFor(name); if (model.getValue() !== text) { quiet = true; model.setValue(text); quiet = false; } if (name === active) syncDecorations(); },
    setMarkers(diags) { current.diagnostics = diags; syncMarkers(); },
    setNotes(notes) { current.notes = notes; syncDecorations(); },
    reveal(line) { editor.revealLineInCenter(line); editor.setPosition({ lineNumber: line, column: 1 }); editor.focus(); },
    focus() { editor.focus(); },
    layout() { editor.layout(); },
  };
}

export async function createEditor(host, opts, getCtx) {
  const { monaco } = await loadMonaco();
  return monaco ? monacoAdapter(host, monaco, getCtx, opts) : textareaAdapter(host, opts);
}
