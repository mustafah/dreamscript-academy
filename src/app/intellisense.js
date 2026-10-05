const KINDS = { fn: 'Function', template: 'Template', enum: 'Enum', type: 'Type', module: 'Module' };

import { t } from './i18n.js';

function snippet(label, text, docs, kind) {
  return { label, kind, insertText: text, insertTextRules: 4, documentation: docs, detail: kind || t('kind.snippet') };
}

export function registerIntellisense(monaco, getCtx) {
  monaco.languages.registerHoverProvider('dreamscript', {
    provideHover(model, pos) {
      const { result, stdlib } = getCtx();
      const word = model.getWordAtPosition(pos)?.word;
      if (!word) return null;
      const value = result?.values?.find((item) => item.name === word || item.name.toLowerCase() === word.toLowerCase());
      if (value) {
        const lines = [`**${value.name}** · ${kindLabel(value.kind)}`, value.type ? `\`${value.type}\`` : '', value.detail || '', value.doc || ''].filter(Boolean);
        return { range: new monaco.Range(pos.lineNumber, pos.column - word.length, pos.lineNumber, pos.column), contents: lines.map((v) => ({ value: v })) };
      }
      const std = stdlib.find((item) => item.name === word);
      return std ? { contents: [{ value: `**${std.sig}**\n\n${std.doc}` }] } : null;
    },
  });
  monaco.languages.registerCompletionItemProvider('dreamscript', {
    triggerCharacters: ['~', '.', '('],
    provideCompletionItems(model, pos) {
      const { result, stdlib } = getCtx();
      const values = (result?.values || []).map((value) => ({
        label: value.name,
        kind: monaco.languages.CompletionItemKind.Variable,
        insertText: value.name,
        detail: value.type || value.kind,
        documentation: value.doc || value.detail || '',
      }));
      const fns = stdlib.map((item) => ({
        label: item.name,
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: `${item.name}($1)`,
        insertTextRules: 4,
        detail: item.sig,
        documentation: item.doc,
      }));
      const words = ['import', 'fn', 'assert', 'for', 'if', 'else', 'type', 'renderer', 'images', 'test', 'template', 'match', 'when', 'return', 'let'];
      const keywords = words.map((label) => ({ label, kind: monaco.languages.CompletionItemKind.Keyword, insertText: label }));
      const snippets = [
        snippet('~ fn', '~ fn ${1:name}(${2:value}) = ${3:result}', t('intellisense.functionDeclaration')),
        snippet('~ for', '~ for ${1:item} in ${2:list}:\n    ${3:// body}', t('intellisense.loop')),
        snippet('~ if', '~ if ${1:condition}:\n    ${2:// body}\n~ else:\n    ${3:// fallback}', t('intellisense.conditional')),
        snippet('~( renderer', '~( renderer 🎬\n${1:image} = ${2:vendor/model/id}(prompt = "${3:~Subject}")\n)', t('intellisense.rendererBlock')),
        snippet('~( enum', '~( enum ${1:Name}\n${2:Value}\n)', t('intellisense.enumBlock')),
        snippet('~( template', '~( template ${1:name}(${2:item})\n${3:~item}\n)', t('intellisense.templateBlock')),
        snippet('~( test', '~( test "${1:name}"\nassert ${2:condition}, "${3:message}"\n)', t('intellisense.testBlock')),
        snippet('match', 'match ${1:value}\n    ${2:_} => ${3:result}', t('intellisense.match')),
      ];
      return { suggestions: [...fns, ...values, ...keywords, ...snippets] };
    },
  });
}

export const kindLabel = (kind) => {
  const fallback = KINDS[kind] || kind;
  const translated = t(`kind.${kind}`);
  return translated === `kind.${kind}` ? fallback : translated;
};
