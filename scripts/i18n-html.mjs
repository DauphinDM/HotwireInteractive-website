import { parseHTML } from 'linkedom';
import { LANGUAGES, LANGUAGE_CODES, ORIGIN, localePath, localeHref, formatCopyPrices } from '../src/i18n/config.js';
import { isTranslatable } from '../src/i18n/protected.js';

export const normalize = (text) => text.replace(/\s+/g, ' ').trim();
const ignored = new Set(['SCRIPT', 'STYLE', 'CODE', 'PRE', 'TEXTAREA']);
const attributes = ['aria-label', 'aria-description', 'placeholder', 'alt', 'title'];
const translatedMeta = new Set(['description', 'og:title', 'og:description', 'og:image:alt', 'twitter:title', 'twitter:description', 'twitter:image:alt']);

function parseDocument(html) {
  const { document } = parseHTML(html);
  // linkedom may split entity references (&amp; etc.) into adjacent text nodes.
  // Merge them before extraction so a sentence/link remains one translation unit.
  function mergeText(node) {
    let previous;
    for (const child of [...(node.childNodes || [])]) {
      if (previous?.nodeType === 3 && child.nodeType === 3) { previous.data += child.data; child.remove(); }
      else { mergeText(child); previous = child; }
    }
  }
  mergeText(document);
  return document;
}

function visit(node, onText, onAttribute) {
  if (node.nodeType === 1) {
    if (node.getAttribute('translate') === 'no') return;
    for (const name of attributes) if (node.hasAttribute(name)) onAttribute(node, name);
    if (node.tagName === 'META' && translatedMeta.has(node.getAttribute('name') || node.getAttribute('property'))) onAttribute(node, 'content');
    // Translate fixed labels/placeholders, but never the contents of private fields or code.
    if (ignored.has(node.tagName)) return;
  }
  // Snapshot children: rendering may replace a text node with a marked span.
  for (const child of [...(node.childNodes || [])]) {
    if (child.nodeType === 3) onText(child);
    else visit(child, onText, onAttribute);
  }
}

export function collectHtmlMessages(html) {
  const document = parseDocument(html);
  const result = new Set();
  const collect = (value) => { const key = normalize(value); if (isTranslatable(key)) result.add(key); };
  visit(document, (node) => collect(node.data), (node, name) => collect(node.getAttribute(name)));
  return result;
}

export function enhanceShell(html, path) {
  const document = parseDocument(html);
  const header = document.getElementById('navbar');
  if (!header) return html;
  header.querySelector('.brand-name')?.setAttribute('translate', 'no');
  const links = [
    ['/websites/', 'Websites'], ['/websites/pricing/', 'Pricing'], ['/websites/examples/', 'Examples'],
    ['/#about', 'Studio'], ['/team/', 'Team'], ['/#contact', 'Contact'],
  ];
  for (const nav of header.querySelectorAll('.desktop-nav, .mobile-nav')) {
    nav.replaceChildren(...links.map(([href, label]) => {
      const link = document.createElement('a'); link.href = href; link.textContent = label;
      if (href === path) link.setAttribute('aria-current', 'page');
      return link;
    }));
  }
  const tools = document.createElement('div'); tools.className = 'header-tools';
  const languages = document.createElement('details'); languages.className = 'language-menu';
  const summary = document.createElement('summary'); summary.setAttribute('aria-label', 'Choose language');
  summary.innerHTML = '<span data-language-code translate="no">EN</span><span aria-hidden="true">⌄</span>';
  const nav = document.createElement('nav'); nav.setAttribute('aria-label', 'Language selection');
  for (const [code, language] of Object.entries(LANGUAGES)) {
    const link = document.createElement('a'); link.href = localePath(path, code);
    link.lang = language.html; link.hreflang = code; link.dataset.languageChoice = code;
    link.setAttribute('translate', 'no'); link.textContent = language.name;
    nav.append(link);
  }
  languages.append(summary, nav); tools.append(languages);
  const toggle = document.getElementById('mobile-menu-btn');
  header.querySelector('.navbar-inner').append(tools);
  if (toggle) tools.append(toggle);
  const shortcuts = document.createElement('nav'); shortcuts.className = 'header-shortcuts page-shell';
  shortcuts.setAttribute('aria-label', 'Website shortcuts');
  shortcuts.innerHTML = '<a href="/websites/pricing/">Packages from €500 <span aria-hidden="true">↗</span></a><a href="/websites/examples/">See examples <span aria-hidden="true">↗</span></a>';
  // Keep the disclosure immediately before its menu in keyboard order.
  header.append(shortcuts);
  return document.toString().replace(/[\t ]+$/gm, '');
}

export function localizeHtml(html, path, locale, catalog = {}) {
  const document = parseDocument(html);
  const translate = (key) => formatCopyPrices(locale === 'en' ? key : catalog[key] || key, locale);
  document.documentElement.lang = LANGUAGES[locale].html;
  document.documentElement.dataset.locale = locale;
  visit(document, (node) => {
    const key = normalize(node.data);
    if (!isTranslatable(key) && !/€\d/.test(key)) return;
    const leading = node.data.match(/^\s*/)[0], trailing = node.data.match(/\s*$/)[0];
    const value = leading + translate(key) + trailing;
    const parent = node.parentElement;
    if (parent.childNodes.length === 1) {
      parent.setAttribute('data-i18n', key); node.data = value;
    } else {
      const span = document.createElement('span'); span.setAttribute('data-i18n', key); span.textContent = value;
      node.replaceWith(span);
    }
  }, (node, name) => {
    const key = normalize(node.getAttribute(name));
    if (!isTranslatable(key)) return;
    const keys = JSON.parse(node.getAttribute('data-i18n-attrs') || '{}'); keys[name] = key;
    node.setAttribute('data-i18n-attrs', JSON.stringify(keys)); node.setAttribute(name, translate(key));
  });
  for (const link of document.querySelectorAll('a[href]:not([data-language-choice])')) {
    link.setAttribute('href', localeHref(link.getAttribute('href'), locale));
  }
  const canonical = ORIGIN + localePath(path, locale);
  document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((node) => node.remove());
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', canonical);
  document.querySelector('meta[property="og:url"]')?.setAttribute('content', canonical);
  document.querySelector('meta[property="og:locale"]')?.setAttribute('content', LANGUAGES[locale].og);
  for (const code of LANGUAGE_CODES) {
    const alternate = document.createElement('link'); alternate.rel = 'alternate'; alternate.hreflang = code;
    alternate.href = ORIGIN + localePath(path, code); document.head.append(alternate);
  }
  const defaultLink = document.createElement('link'); defaultLink.rel = 'alternate'; defaultLink.hreflang = 'x-default'; defaultLink.href = ORIGIN + path; document.head.append(defaultLink);
  for (const link of document.querySelectorAll('[data-language-choice]')) {
    if (link.dataset.languageChoice === locale) link.setAttribute('aria-current', 'true');
  }
  for (const code of document.querySelectorAll('[data-language-code]')) code.textContent = locale.toUpperCase();
  return document.toString().replace(/[\t ]+$/gm, '');
}
