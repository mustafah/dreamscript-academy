const trunc = (text, n = 72) => text.length > n ? `${text.slice(0, n - 1)}…` : text;

export function markers(monaco, diags = []) {
  const map = { error: monaco.MarkerSeverity.Error, warning: monaco.MarkerSeverity.Warning, info: monaco.MarkerSeverity.Info };
  return diags.map((d) => ({
    severity: map[d.severity] || monaco.MarkerSeverity.Info,
    message: d.hint ? `${d.message}\n${d.hint}` : d.message,
    startLineNumber: d.line || 1,
    startColumn: d.col || 1,
    endLineNumber: d.endLine || d.line || 1,
    endColumn: d.endCol || (d.col || 1) + 1,
  }));
}

export function noteDecorations(monaco, model, notes) {
  const lineCount = model.getLineCount();
  const maxCol = (line) => Math.max(1, model.getLineMaxColumn(line) - 1);
  return notes
    .filter((note) => note.text?.trim() && note.line >= 1 && note.line <= lineCount)
    .map((note) => ({
    range: new monaco.Range(note.line, maxCol(note.line), note.line, maxCol(note.line)),
    options: { after: { content: `  → ${trunc(note.text)}`, inlineClassName: 'monaco-line-note' } },
    }));
}

export function colorDecorations(monaco, model) {
  const text = model.getValue();
  const out = [];
  const re = /#(?:[\da-fA-F]{3}|[\da-fA-F]{6})\b/g;
  for (const m of text.matchAll(re)) {
    const start = model.getPositionAt(m.index);
    out.push({
      range: new monaco.Range(start.lineNumber, start.column, start.lineNumber, start.column),
      options: { before: { content: ' ', inlineClassName: `monaco-swatch swatch-${m[0].slice(1)}`, inlineClassNameAffectsLetterSpacing: true } },
      color: m[0],
    });
  }
  return out;
}

export function ensureSwatchStyles(container, colors) {
  const style = container.querySelector('style[data-swatches]') || container.appendChild(document.createElement('style'));
  style.dataset.swatches = 'true';
  style.textContent = [...new Set(colors)].map((color) => `.swatch-${color.slice(1)}{background:${color};display:inline-block}`).join('\n');
}
