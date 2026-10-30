import nl from './messages/nl.json' with { type: 'json' };
import fr from './messages/fr.json' with { type: 'json' };
import de from './messages/de.json' with { type: 'json' };
import { LANGUAGES, LANGUAGE_STORAGE_KEY, ORIGIN, supportedLanguage, chooseLanguage, splitLocalePath, localePath, localeHref, formatCopyPrices } from './config.js';

// English keys are already the source text; do not ship a redundant English dictionary.
const catalogs = { en: {}, nl, fr, de };
let activeLocale;
export function getLocale() {
  return activeLocale || (typeof document === 'undefined' ? 'en' : supportedLanguage(document.documentElement.dataset.locale || document.documentElement.lang)) || 'en';
}
export function t(source, values = {}, locale = getLocale()) {
  const text = formatCopyPrices(catalogs[locale]?.[source] || source, locale);
  return text.replace(/\{([\w]+)\}/g, (match, key) => Object.hasOwn(values, key) ? String(values[key]) : match);
}
export function localizedObject(value, locale = getLocale()) {
  if (Array.isArray(value)) return value.map((item) => localizedObject(item, locale));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) =>
    [key, ['id', 'value', 'type', 'goal'].includes(key) ? item : localizedObject(item, locale)]));
  return typeof value === 'string' ? t(value, {}, locale) : value;
}
export const localHref = (href) => localeHref(href, getLocale());
const normalize = (text) => text.replace(/\s+/g, ' ').trim();

function applyLocale(locale, { historyMode = 'replace' } = {}) {
  const previous = getLocale();
  for (const node of document.querySelectorAll('[data-i18n]')) {
    const source = node.dataset.i18n;
    // A changed draft/status may contain user data. Never overwrite it as page copy.
    if (![source, t(source, {}, previous)].map(normalize).includes(normalize(node.textContent))) continue;
    const leading = node.textContent.match(/^\s*/)[0], trailing = node.textContent.match(/\s*$/)[0];
    node.textContent = leading + t(source, {}, locale) + trailing;
  }
  for (const node of document.querySelectorAll('[data-i18n-attrs]')) {
    for (const [name, source] of Object.entries(JSON.parse(node.dataset.i18nAttrs))) {
      if ([source, t(source, {}, previous)].map(normalize).includes(normalize(node.getAttribute(name) || ''))) node.setAttribute(name, t(source, {}, locale));
    }
  }
  activeLocale = locale;
  document.documentElement.lang = LANGUAGES[locale].html;
  document.documentElement.dataset.locale = locale;
  const url = new URL(location.href);
  url.pathname = localePath(url.pathname, locale);
  url.searchParams.delete('lang');
  if (historyMode) history[historyMode === 'push' ? 'pushState' : 'replaceState'](null, '', url.pathname + url.search + url.hash);
  for (const link of document.querySelectorAll('a[href]:not([data-language-choice])')) link.setAttribute('href', localeHref(link.getAttribute('href'), locale));
  for (const link of document.querySelectorAll('[data-language-choice]')) {
    const choice = link.dataset.languageChoice;
    const target = new URL(url);
    target.pathname = localePath(url.pathname, choice);
    if (choice === 'en') target.searchParams.set('lang', 'en');
    link.href = target.pathname + target.search + target.hash;
    if (choice === locale) link.setAttribute('aria-current', 'true'); else link.removeAttribute('aria-current');
  }
  document.querySelectorAll('[data-language-code]').forEach((node) => { node.textContent = locale.toUpperCase(); });
  const canonical = ORIGIN + localePath(url.pathname, locale);
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', canonical);
  document.querySelector('meta[property="og:url"]')?.setAttribute('content', canonical);
  document.querySelector('meta[property="og:locale"]')?.setAttribute('content', LANGUAGES[locale].og);
  document.querySelectorAll('input[name="locale"]').forEach((input) => { input.value = locale; });
  window.dispatchEvent(new CustomEvent('hotwire:languagechange', { detail: { locale } }));
}

export function initLanguages() {
  const fromPath = splitLocalePath(location.pathname);
  const requested = new URL(location.href).searchParams.get('lang');
  let stored;
  try { stored = localStorage.getItem(LANGUAGE_STORAGE_KEY); } catch { /* Storage is optional. */ }
  const initial = chooseLanguage({ explicit: requested || (fromPath.locale !== 'en' ? fromPath.locale : undefined), stored, browser: navigator.languages || [navigator.language] });
  applyLocale(initial);
  document.addEventListener('click', (event) => {
    const link = event.target.closest('[data-language-choice]');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    const locale = supportedLanguage(link.dataset.languageChoice);
    if (!locale) return;
    try { localStorage.setItem(LANGUAGE_STORAGE_KEY, locale); } catch { /* Explicit URLs still work. */ }
    applyLocale(locale, { historyMode: 'push' });
    const menu = link.closest('details');
    if (menu) { menu.open = false; menu.querySelector('summary').focus(); }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const menu = document.querySelector('.language-menu[open]');
    if (menu) { menu.open = false; menu.querySelector('summary').focus(); }
  });
  document.addEventListener('click', (event) => {
    const menu = document.querySelector('.language-menu[open]');
    if (menu && !menu.contains(event.target)) menu.open = false;
  });
  window.addEventListener('popstate', () => applyLocale(splitLocalePath(location.pathname).locale, { historyMode: false }));
}
