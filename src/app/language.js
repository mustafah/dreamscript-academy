let ready = false;

const KEYWORDS = '\\b(?:import|as|fn|assert|for|if|else|type|renderer|images|test|template|match|when|then|in|by|let|return|and|or|not|true|false|null)\\b';
const COLOR = '#(?:[\\da-fA-F]{3}|[\\da-fA-F]{6})\\b';
const MODEL = '[a-z][\\w-]+(?:\\/[\\w.-]+){1,}';
const INTERP = '~\\([^)]+\\)|\\([^)]*\\)~|[\\p{L}_][\\p{L}\\p{N}_.\\[\\]]*~|~[\\p{L}_][\\p{L}\\p{N}_.\\[\\]() ,=-]*';

export function setupDreamLanguage(monaco) {
  if (ready) return;
  ready = true;
  monaco.languages.register({ id: 'dreamscript' });
  monaco.languages.setLanguageConfiguration('dreamscript', {
    comments: { lineComment: '//', blockComment: ['/*', '*/'] },
    brackets: [['{', '}'], ['[', ']'], ['(', ')']],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ],
    onEnterRules: [
      {
        beforeText: /^\s*(?:~\(|~\s+(?:if|else(?:\s+if)?|for|fn)\b.*|[^\n]*:)\s*$/,
        action: { indentAction: monaco.languages.IndentAction.Indent },
      },
    ],
  });
  monaco.languages.setMonarchTokensProvider('dreamscript', {
    defaultToken: 'prose',
    tokenizer: {
      root: [
        [/^\s*\/\/\/.*$/, 'comment.doc'],
        [/^\s*\/\/.*$/, 'comment'],
        [/^\s*\/\*/, 'comment', '@comment'],
        [/^(\s*)([≈☽◊])/, ['', { token: 'keyword.channel', next: '@proseLine' }]],
        [/^(\s*)(<~|~\()/, ['', { token: 'keyword.control', next: '@codeLine' }]],
        [/^(\s*)(~)(?!\()/, ['', { token: 'keyword.control', next: '@codeLine' }]],
        [/^\s*[A-Za-z_][\w-]*(?:\s+[A-Za-z_][\w-]*)?\s*(?==)/, { token: 'identifier', next: '@codeLine' }],
        [/^\s*[a-z][\w-]*\/[\w.-]+/, { token: 'type.model', next: '@codeLine' }],
        [/^/, { token: '', next: '@proseLine' }],
      ],
      proseLine: [
        [new RegExp(INTERP, 'u'), 'prose.interp'],
        [/\b\d+%(?=\s*\|)/, 'operator.weight'],
        [/\|/, 'operator.alt'],
        [new RegExp(COLOR), 'constant.color'],
        [/\\~/, 'string.escape'],
        [/[^~|#\\]+/, 'prose'],
        [/$/, '', '@pop'],
        [/./, 'prose'],
      ],
      codeLine: [
        [/\/\*/, 'comment', '@comment'],
        [/\/\/\/.*$/, 'comment.doc', '@pop'],
        [/\/\/.*$/, 'comment', '@pop'],
        [/"/, 'string', '@string'],
        [/'[^']*'/, 'string'],
        [new RegExp(KEYWORDS, 'u'), 'keyword'],
        [new RegExp(MODEL), 'type.model'],
        [new RegExp(COLOR), 'constant.color'],
        [/\b\d+(?:\.\d+)?\b/, 'number'],
        [/\b\d+%(?=\s*\|)/, 'operator.weight'],
        [/[+\-*\/×÷%^!?=<>.?]+|\|>|\.\.<|\.\.|\|/, 'operator'],
        [/\.[\p{L}_][\p{L}\p{N}_]*/u, 'attribute'],
        [/['‘’`]/, 'string'],
        [/[^\S\r\n]+/, 'white'],
        [/[^\w\s]/, 'delimiter'],
        [/[$\p{L}_][\p{L}\p{N}_$ ]*/u, 'identifier'],
        [/$/, '', '@pop'],
      ],
      comment: [
        [/[^/*]+/, 'comment'],
        [/\/\*/, 'comment', '@push'],
        [/\*\//, 'comment', '@pop'],
        [/[/*]/, 'comment'],
      ],
      string: [
        [/[^"~\\]+/, 'string'],
        [/\\./, 'string.escape'],
        [new RegExp(INTERP, 'u'), 'string.interp'],
        [/"/, 'string', '@pop'],
      ],
    },
  });
  monaco.editor.defineTheme('dream-night', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'prose', foreground: 'e9e6ff' },
      { token: 'prose.interp', foreground: 'c9a7ff', fontStyle: 'bold' },
      { token: 'keyword', foreground: 'b362ff' },
      { token: 'keyword.control', foreground: 'ffc857', fontStyle: 'bold' },
      { token: 'keyword.channel', foreground: '5eead4', fontStyle: 'bold' },
      { token: 'identifier', foreground: '5eead4' },
      { token: 'attribute', foreground: '8af5ea' },
      { token: 'string', foreground: '7dffb3' },
      { token: 'string.interp', foreground: 'dec1ff' },
      { token: 'number', foreground: 'ff6b9d' },
      { token: 'operator', foreground: 'ffc857' },
      { token: 'operator.alt', foreground: 'ffc857', fontStyle: 'bold' },
      { token: 'operator.weight', foreground: 'ffd883' },
      { token: 'constant.color', foreground: 'ff9dc1' },
      { token: 'type.model', foreground: 'ffd883' },
      { token: 'comment', foreground: '7c76a8' },
      { token: 'comment.doc', foreground: '9d97c8', fontStyle: 'italic' },
      { token: 'delimiter', foreground: 'd6cfff' },
    ],
    colors: {
      'editor.background': '#14112b',
      'editor.foreground': '#e9e6ff',
      'editorLineNumber.foreground': '#6f6996',
      'editorLineNumber.activeForeground': '#b9b3de',
      'editorCursor.foreground': '#7dffb3',
      'editor.selectionBackground': '#6c42b83f',
      'editor.inactiveSelectionBackground': '#6c42b826',
      'editorIndentGuide.background1': '#ffffff10',
      'editorWidget.background': '#19153a',
    },
  });
}
