import { $, button, el } from './dom.js';
import { getLocale, getLocaleMeta, localeOptions, t } from './i18n.js';

function displayLocaleCode(locale) {
  return String(locale || 'en').replace('-', '·').toUpperCase();
}

function setLanguageMenuOpen(refs, open) {
  refs.languageMenu.classList.toggle('open', open);
  refs.languagePicker.classList.toggle('open', open);
  refs.languageButton.classList.toggle('open', open);
  refs.languageButton.setAttribute('aria-expanded', String(open));
}

export function createShell(actions) {
  const refs = { app: $('#app') };
  const mobileButtons = ['lesson', 'code', 'result'].map((pane) => button(t(`mobile.${pane}`), {
    class: 'mobile-switch',
    dataset: { pane },
    onClick: () => actions.onMobilePane(pane),
  }));
  refs.mobileButtons = mobileButtons;
  refs.languageOptions = localeOptions().map(({ value, label }) => {
    const option = button('', {
      class: 'language-option',
      role: 'option',
      'aria-selected': 'false',
      dataset: { locale: value },
      onClick: (event) => {
        event.stopPropagation();
        setLanguageMenuOpen(refs, false);
        actions.onLocaleChange(value);
      },
    },
    el('span', { class: 'language-option-mark', 'aria-hidden': 'true', text: displayLocaleCode(value) }),
    el('span', { class: 'language-option-copy' },
      el('span', { class: 'language-option-name', text: label }),
      el('span', { class: 'language-option-code', text: value }),
    ),
    el('span', { class: 'language-option-check', 'aria-hidden': 'true', text: '✓' }));
    return option;
  });
  refs.languageMenu = el('div', {
    class: 'language-menu',
    role: 'listbox',
    tabindex: '-1',
    'aria-label': t('language.select'),
  },
  refs.languageMenuHeader = el('div', { class: 'language-menu-header' },
    refs.languageMenuTitle = el('span', { class: 'language-menu-title', text: t('language.select') }),
    refs.languageMenuCurrent = el('span', { class: 'language-menu-current', 'aria-hidden': 'true' }),
  ),
  el('div', { class: 'language-options' }, refs.languageOptions));
  refs.languageButton = button('', {
    class: 'language-trigger',
    'aria-expanded': 'false',
    'aria-haspopup': 'listbox',
    'aria-label': t('language.select'),
    onClick: (event) => {
      event.stopPropagation();
      setLanguageMenuOpen(refs, !refs.languageMenu.classList.contains('open'));
    },
  },
  el('span', { class: 'language-trigger-icon', 'aria-hidden': 'true' }),
  el('span', { class: 'language-trigger-copy' },
    refs.languageName = el('span', { class: 'language-trigger-name' }),
    refs.languageCode = el('span', { class: 'language-trigger-code' }),
  ),
  refs.languageChevron = el('span', { class: 'language-trigger-chevron', 'aria-hidden': 'true' }, '⌄'));
  const header = el('header', { class: 'topbar glass' },
    el('div', { class: 'brand' },
      refs.mapToggle = button('☰', {
        class: 'icon-button ghost-button',
        'data-testid': 'lesson-map-toggle',
        'aria-label': t('shell.openMap'),
        onClick: actions.onToggleMap,
      }),
      el('div', { class: 'brand-mark' }, '☾'),
      el('div', {},
        refs.title = el('h1', { text: t('app.title') }),
        refs.breadcrumb = el('div', { class: 'breadcrumb' }),
      ),
    ),
    el('div', { class: 'topbar-meta' },
      refs.progress = el('div', { class: 'stage-progress' }),
      el('div', { class: 'nav-buttons' },
        refs.prev = button(t('shell.prev'), { 'data-testid': 'prev-lesson', onClick: actions.onPrev }),
        refs.next = button(t('shell.next'), { 'data-testid': 'next-lesson', onClick: actions.onNext }),
      ),
      refs.languagePicker = el('div', { class: 'language-picker' },
        refs.languageLabel = el('span', { text: t('language.label') }),
        el('div', { class: 'language-control' }, refs.languageButton, refs.languageMenu),
      ),
    ),
  );
  const editorShell = el('div', { class: 'glass editor-shell' },
    el('div', { class: 'editor-toolbar' },
      el('div', { class: 'editor-titlebar' },
        refs.editorLabel = el('strong', { class: 'editor-label', text: t('shell.code') }),
        refs.fileTabs = el('div', { class: 'file-tabs' }),
      ),
      el('div', { class: 'editor-tools' },
        refs.copyNote = el('span', { class: 'copy-note' }),
        refs.referenceButton = button(t('shell.reference'), { class: 'ghost-button small-button', onClick: actions.onToggleReference }),
        refs.resetButton = button(t('shell.reset'), { class: 'ghost-button small-button', onClick: actions.onReset }),
        refs.copyButton = button(t('shell.copy'), { class: 'ghost-button small-button', onClick: actions.onCopy }),
      ),
    ),
    refs.reference = el('aside', { class: 'reference-pop glass hidden' }),
    el('div', { class: 'editor-body' }, refs.editorHost = el('div', { class: 'editor-host', 'data-testid': 'editor' })),
    refs.editorStatus = el('div', { class: 'editor-status muted' }),
  );
  const workspace = el('main', { class: 'workspace' },
    refs.lesson = el('section', { class: 'pane lesson-pane mobile-active', dataset: { pane: 'lesson' } }),
    refs.editorPane = el('section', { class: 'pane', dataset: { pane: 'code' } }, editorShell),
    refs.output = el('section', { class: 'pane output-pane', dataset: { pane: 'result' } }),
  );
  refs.mobileButtons = mobileButtons;
  refs.mobilePanes = { lesson: refs.lesson, code: refs.editorPane, result: refs.output };
  refs.backdrop = el('div', { class: 'map-backdrop', onClick: actions.onCloseMap });
  refs.map = el('aside', { class: 'lesson-map' });
  refs.app.append(
    el('div', { class: 'app-shell' },
      header,
      refs.topbarHint = el('div', { class: 'topbar-hint muted', text: t('shell.topbarHint') }),
      el('div', { class: 'mobile-switcher' }, mobileButtons),
      workspace,
      refs.backdrop,
      refs.map,
    ),
  );
  document.addEventListener('click', (event) => {
    if (!refs.languagePicker.contains(event.target)) setLanguageMenuOpen(refs, false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && refs.languageMenu.classList.contains('open')) {
      setLanguageMenuOpen(refs, false);
      refs.languageButton.focus();
    }
  });
  refreshShell(refs);
  return refs;
}

export function refreshShell(refs) {
  refs.title.textContent = t('app.title');
  refs.mapToggle.setAttribute('aria-label', t('shell.openMap'));
  refs.prev.textContent = t('shell.prev');
  refs.next.textContent = t('shell.next');
  refs.languageLabel.textContent = t('language.label');
  refs.languageButton.setAttribute('aria-label', t('language.select'));
  refs.languageMenu.setAttribute('aria-label', t('language.select'));
  refs.languageMenuTitle.textContent = t('language.select');
  const locale = getLocale();
  const meta = getLocaleMeta(locale);
  refs.languageName.textContent = meta.nativeLabel;
  refs.languageCode.textContent = displayLocaleCode(locale);
  refs.languageMenuCurrent.textContent = displayLocaleCode(locale);
  refs.languageOptions.forEach((option) => {
    const selected = option.dataset.locale === locale;
    option.classList.toggle('selected', selected);
    option.setAttribute('aria-selected', String(selected));
  });
  refs.editorLabel.textContent = t('shell.code');
  refs.referenceButton.textContent = t('shell.reference');
  refs.resetButton.textContent = t('shell.reset');
  refs.copyButton.textContent = t('shell.copy');
  refs.topbarHint.textContent = t('shell.topbarHint');
  refs.mobileButtons.forEach((node) => { node.textContent = t(`mobile.${node.dataset.pane}`); });
}
