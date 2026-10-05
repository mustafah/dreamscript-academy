/*
 * The Academy's small, dependency-free translation layer.
 *
 * Lesson code is deliberately not translated here.  The lesson catalog keeps
 * executable examples and task checks in English source objects, while this
 * module supplies the surrounding UI and data-driven prose translations.
 */
import { CATALOGS as CORE_CATALOGS } from './i18n-catalog-core.js';
import { CATALOGS as LATIN_CATALOGS } from './i18n-catalog-latin.js';
import { CATALOGS as EAST_CATALOGS } from './i18n-catalog-east.js';
import { COMPLEMENTS as CORE_COMPLEMENTS } from './i18n-complements-core.js';
import { COMPLEMENTS as EAST_COMPLEMENTS } from './i18n-complements-east.js';
import { COMPLEMENTS as FINAL_COMPLEMENTS } from './i18n-complements-final.js';
import { lessonTranslation, localizeStage } from './i18n-lessons.js';
export const SUPPORTED_LOCALES = [
  'en', 'ar', 'ar-EG', 'ar-SA', 'fr', 'es', 'ko', 'de', 'pt-BR', 'ja', 'zh-CN', 'hi',
];

export const LOCALE_META = {
  en: { label: 'English', nativeLabel: 'English', dir: 'ltr' },
  ar: { label: 'Arabic', nativeLabel: 'العربية', dir: 'rtl' },
  'ar-EG': { label: 'Arabic (Egypt)', nativeLabel: 'العربية (مصر)', dir: 'rtl' },
  'ar-SA': { label: 'Arabic (Saudi Arabia)', nativeLabel: 'العربية (السعودية)', dir: 'rtl' },
  fr: { label: 'French', nativeLabel: 'Français', dir: 'ltr' },
  es: { label: 'Spanish', nativeLabel: 'Español', dir: 'ltr' },
  ko: { label: 'Korean', nativeLabel: '한국어', dir: 'ltr' },
  de: { label: 'German', nativeLabel: 'Deutsch', dir: 'ltr' },
  'pt-BR': { label: 'Portuguese (Brazil)', nativeLabel: 'Português (Brasil)', dir: 'ltr' },
  ja: { label: 'Japanese', nativeLabel: '日本語', dir: 'ltr' },
  'zh-CN': { label: 'Chinese (Simplified)', nativeLabel: '简体中文', dir: 'ltr' },
  hi: { label: 'Hindi', nativeLabel: 'हिन्दी', dir: 'ltr' },
};

const MESSAGES = { ...CORE_CATALOGS, ...LATIN_CATALOGS, ...EAST_CATALOGS };
for (const complements of [CORE_COMPLEMENTS, EAST_COMPLEMENTS, FINAL_COMPLEMENTS]) {
  for (const [locale, catalog] of Object.entries(complements)) {
    MESSAGES[locale] ||= {};
    for (const [key, value] of Object.entries(catalog)) {
      if (MESSAGES[locale][key] === undefined) MESSAGES[locale][key] = value;
    }
  }
}
const STORAGE_KEY = 'dreamscript-academy:locale';
let current = 'en';
const listeners = new Set();

function browserStorage() {
  try { return globalThis.localStorage; } catch { return null; }
}

export function normalizeLocale(value) {
  if (!value) return 'en';
  const raw = String(value).trim();
  const exact = SUPPORTED_LOCALES.find((locale) => locale.toLowerCase() === raw.toLowerCase());
  if (exact) return exact;
  const base = raw.split('-')[0].toLowerCase();
  return SUPPORTED_LOCALES.find((locale) => locale.toLowerCase() === base) || 'en';
}

function localeChain(locale = current) {
  const normalized = normalizeLocale(locale);
  const base = normalized.split('-')[0];
  return normalized === base ? [normalized, 'en'] : [normalized, base, 'en'];
}

function lookup(locale, key) {
  for (const candidate of localeChain(locale)) {
    const value = MESSAGES[candidate]?.[key];
    if (value !== undefined) return value;
  }
  return undefined;
}

function interpolate(value, vars = {}) {
  return String(value).replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, key) => {
    const result = key.split('.').reduce((object, part) => object?.[part], vars);
    return result == null ? '' : String(result);
  });
}

function pluralCategory(count, locale = current) {
  try { return new Intl.PluralRules(normalizeLocale(locale)).select(Number(count)); }
  catch { return Number(count) === 1 ? 'one' : 'other'; }
}

export function plural(key, count, vars = {}) {
  const value = lookup(current, key);
  const forms = value && typeof value === 'object' ? value : null;
  const category = pluralCategory(count);
  const selected = forms?.[category] ?? forms?.other ?? forms?.one ?? value ?? key;
  return interpolate(selected, { ...vars, count });
}

export function t(key, vars = {}) {
  const value = lookup(current, key);
  if (value && typeof value === 'object') return plural(key, vars.count ?? 0, vars);
  return interpolate(value ?? lookup('en', key) ?? key, vars);
}

export function getLocale() {
  return current;
}

export function getLocaleMeta(locale = current) {
  return LOCALE_META[normalizeLocale(locale)] || LOCALE_META.en;
}

export function applyDocumentLocale(locale = current) {
  if (typeof document === 'undefined') return;
  const normalized = normalizeLocale(locale);
  const meta = getLocaleMeta(normalized);
  document.documentElement.lang = normalized;
  document.documentElement.dir = meta.dir;
  document.documentElement.dataset.locale = normalized;
}

export function setLocale(locale, { persist = true } = {}) {
  current = normalizeLocale(locale);
  if (persist) {
    try { browserStorage()?.setItem(STORAGE_KEY, current); } catch { /* storage can be unavailable */ }
  }
  applyDocumentLocale(current);
  for (const listener of listeners) listener(current);
  return current;
}

export function initLocale() {
  let stored = '';
  try { stored = browserStorage()?.getItem(STORAGE_KEY) || ''; } catch { /* ignore */ }
  const browser = typeof navigator === 'undefined' ? '' : navigator.language;
  return setLocale(stored || browser || 'en', { persist: false });
}

export function onLocaleChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function localeOptions() {
  return SUPPORTED_LOCALES.map((locale) => ({ value: locale, label: LOCALE_META[locale].nativeLabel }));
}

export function localizeLesson(lesson, locale = current) {
  return lessonTranslation(lesson, normalizeLocale(locale));
}

export function localizeStages(stages, locale = current) {
  return stages.map((stage) => localizeStage(stage, normalizeLocale(locale)));
}

const DOC_TRANSLATIONS = {
  ar: { upper: 'حوّل النص إلى أحرف كبيرة.', lower: 'حوّل النص إلى أحرف صغيرة.', join: 'اجمع العناصر.', sort: 'رتّب قائمة.', filter: 'احتفظ بالعناصر المطابقة.', length: 'أرجع الطول.' },
  fr: { upper: 'Met le texte en majuscules.', lower: 'Met le texte en minuscules.', join: 'Assemble les éléments.', sort: 'Trie une liste.', filter: 'Garde les éléments qui correspondent.', length: 'Renvoie la longueur.' },
  es: { upper: 'Convierte el texto a mayúsculas.', lower: 'Convierte el texto a minúsculas.', join: 'Une los elementos.', sort: 'Ordena una lista.', filter: 'Conserva los elementos que coinciden.', length: 'Devuelve la longitud.' },
  de: { upper: 'Schreibt Text in Großbuchstaben.', lower: 'Schreibt Text in Kleinbuchstaben.', join: 'Verbindet Elemente.', sort: 'Sortiert eine Liste.', filter: 'Behält passende Elemente.', length: 'Gibt die Länge zurück.' },
  'pt-BR': { upper: 'Converte o texto para maiúsculas.', lower: 'Converte o texto para minúsculas.', join: 'Une os itens.', sort: 'Ordena uma lista.', filter: 'Mantém os itens correspondentes.', length: 'Retorna o tamanho.' },
  ja: { upper: 'テキストを大文字にします。', lower: 'テキストを小文字にします。', join: '要素を結合します。', sort: 'リストを並べ替えます。', filter: '条件に合う要素を残します。', length: '長さを返します。' },
  'zh-CN': { upper: '将文本转换为大写。', lower: '将文本转换为小写。', join: '连接各项。', sort: '对列表排序。', filter: '保留符合条件的项。', length: '返回长度。' },
  ko: { upper: '텍스트를 대문자로 바꿉니다.', lower: '텍스트를 소문자로 바꿉니다.', join: '항목을 연결합니다.', sort: '목록을 정렬합니다.', filter: '조건에 맞는 항목만 남깁니다.', length: '길이를 반환합니다.' },
  hi: { upper: 'टेक्स्ट को बड़े अक्षरों में बदलता है।', lower: 'टेक्स्ट को छोटे अक्षरों में बदलता है।', join: 'आइटम जोड़ता है।', sort: 'सूची क्रम में लगाता है।', filter: 'मेल खाते आइटम रखता है।', length: 'लंबाई लौटाता है।' },
};

export function localizeDocs(items = []) {
  const docs = DOC_TRANSLATIONS[current] || DOC_TRANSLATIONS[current.split('-')[0]] || {};
  return items.map((item) => {
    const groupKey = String(item.group || '').toLowerCase();
    return {
      ...item,
      group: t(`reference.group.${groupKey}`),
      doc: docs[item.name] || item.doc,
    };
  });
}

initLocale();
