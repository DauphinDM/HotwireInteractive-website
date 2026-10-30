export const LANGUAGES = {
  en: { name: 'English', html: 'en-GB', intl: 'en-IE', og: 'en_GB' },
  nl: { name: 'Nederlands', html: 'nl-BE', intl: 'nl-BE', og: 'nl_BE' },
  fr: { name: 'Français', html: 'fr-BE', intl: 'fr-BE', og: 'fr_BE' },
  de: { name: 'Deutsch', html: 'de-BE', intl: 'de-BE', og: 'de_BE' },
};
export const LANGUAGE_CODES = Object.keys(LANGUAGES);
export const LANGUAGE_STORAGE_KEY = 'hotwire-language';
export const ORIGIN = 'https://hotwireinteractive.co.uk';

export function supportedLanguage(value) {
  const code = typeof value === 'string' ? value.toLowerCase().split(/[-_]/)[0] : '';
  return Object.hasOwn(LANGUAGES, code) ? code : null;
}

export function splitLocalePath(pathname) {
  const match = pathname.match(/^\/(nl|fr|de)(?=\/|$)/);
  return { locale: match?.[1] || 'en', path: match ? pathname.slice(match[0].length) || '/' : pathname };
}

export function localePath(pathname, locale = 'en') {
  locale = supportedLanguage(locale) || 'en';
  const { path } = splitLocalePath(pathname);
  return locale === 'en' ? path : `/${locale}${path}`;
}

// Source copy uses English EUR notation; use local currency/spacing conventions.
export function formatCopyPrices(text, locale = 'en') {
  const formatted = text.replace(/€(\d[\d,]*(?:\.\d{2})?)/g, (_, digits) => {
    const amount = Number(digits.replaceAll(',', ''));
    return new Intl.NumberFormat(LANGUAGES[locale].intl, { style: 'currency', currency: 'EUR',
      minimumFractionDigits: digits.includes('.') ? 2 : 0, maximumFractionDigits: digits.includes('.') ? 2 : 0,
    }).format(amount);
  });
  const spaced = ['fr', 'de'].includes(locale) ? formatted.replace(/(?<=\d)\s*%/g, '\u00a0%') : formatted;
  if (locale === 'de') return spaced.replace(/([\p{L}\d])…/gu, '$1\u00a0…');
  if (locale === 'fr') return spaced.replace(/‘([^’]+)’/g, '«\u00a0$1\u00a0»');
  return spaced;
}

export function localeHref(href, locale = 'en') {
  if (!href || !href.startsWith('/') || href.startsWith('//')) return href;
  const url = new URL(href, ORIGIN);
  if (url.pathname.startsWith('/api/')) {
    if (locale === 'en') url.searchParams.delete('lang'); else url.searchParams.set('lang', locale);
  } else if (url.pathname.endsWith('/') || url.pathname.endsWith('.html')) {
    url.pathname = localePath(url.pathname, locale);
  }
  return url.pathname + url.search + url.hash;
}

// Explicit URLs/choices outrank detection; never infer a country from an IP address.
export function chooseLanguage({ explicit, stored, browser = [] } = {}) {
  return supportedLanguage(explicit) || supportedLanguage(stored) ||
    browser.map(supportedLanguage).find(Boolean) || 'en';
}
