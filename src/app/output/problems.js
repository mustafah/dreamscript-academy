import { clear, el, button } from '../dom.js';
import { t } from '../i18n.js';

const ICON = { error: '⨯', warning: '⚠', info: 'ℹ' };

export function renderProblems(node, ctx) {
  clear(node);
  const diags = ctx.result?.diagnostics || [];
  const tests = ctx.result?.tests || [];
  const problems = diags.length
    ? el('section', { class: 'output-section' },
      el('strong', { text: t('tabs.problems') }),
      el('div', { class: 'diagnostic-list' }, diags.map((diag) => el('article', { class: 'diagnostic-item', 'data-severity': diag.severity },
        el('div', { class: 'diagnostic-head' },
          el('div', {}, el('div', {}, el('span', { class: 'problem-icon', text: ICON[diag.severity] || '•' }), diag.message), diag.hint ? el('div', { class: 'muted', text: diag.hint }) : null),
          button(`${diag.file}:${diag.line}`, { onClick: () => ctx.onReveal(diag.file, diag.line) }),
        ),
      ))),
    )
    : el('div', { class: 'empty-state', text: t('problems.empty') });
  const testList = tests.length
    ? el('div', { class: 'tests-list' }, tests.map((test) => el('article', { class: 'test-item' },
      el('div', { class: 'test-head' }, el('strong', { text: `${test.passed ? '✓' : '✗'} ${test.name}` }), button(`${test.file}:${test.line}`, { onClick: () => ctx.onReveal(test.file, test.line) })),
      (test.failures || []).map((failure) => el('div', { class: 'muted', text: failure.message })),
    )))
    : el('div', { class: 'empty-state', text: t('problems.noTests') });
  node.append(problems, el('section', { class: 'output-section' }, el('strong', { text: t('problems.tests') }), testList));
}
