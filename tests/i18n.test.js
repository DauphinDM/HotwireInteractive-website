import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { LANGUAGE_CODES, LANGUAGES, chooseLanguage, supportedLanguage, splitLocalePath, localePath, localeHref, formatCopyPrices } from '../src/i18n/config.js';
import { t } from '../src/i18n/index.js';
import { recommendWebsite } from '../src/js/website-recommendation.js';
import { collectHtmlMessages, enhanceShell, localizeHtml } from '../scripts/i18n-html.mjs';
import { parseHTML } from 'linkedom';
import { isValidTranslation } from '../scripts/i18n.mjs';
import { numberTokens, translationIssues } from '../src/i18n/quality.js';
import { prepareCatalogues, digest, batches } from '../scripts/review-translations.mjs';

const base = { goal: 'leads', size: 'focused', updates: 'occasional', priority: 'lean', commerce: 'no', bookings: 'no', accounts: 'no', content: 'ready', timeline: 'normal', budget: 'unsure' };

test('locale selection respects explicit choices, stored preference, and browser order', () => {
  assert.equal(chooseLanguage({ explicit: 'fr-BE', stored: 'nl', browser: ['de-DE'] }), 'fr');
  assert.equal(chooseLanguage({ stored: 'nl', browser: ['fr-BE'] }), 'nl');
  assert.equal(chooseLanguage({ browser: ['es-ES', 'de-DE', 'nl-BE'] }), 'de');
  assert.equal(chooseLanguage({ explicit: '__proto__', stored: 'invalid', browser: ['es'] }), 'en');
  assert.equal(supportedLanguage('NL_be'), 'nl');
});

test('locale URLs preserve queries and fragments without translating assets or endpoints', () => {
  assert.equal(localeHref('/websites/?goal=shop&template=shop#website-quiz', 'fr'), '/fr/websites/?goal=shop&template=shop#website-quiz');
  assert.equal(localeHref('/de/websites/examples/', 'nl'), '/nl/websites/examples/');
  assert.equal(localeHref('/api/contact.php', 'de'), '/api/contact.php?lang=de');
  assert.equal(localeHref('/assets/style.css', 'nl'), '/assets/style.css');
  assert.equal(localeHref('https://example.com/', 'nl'), 'https://example.com/');
  assert.equal(localeHref('//example.com/', 'nl'), '//example.com/');
  assert.equal(localePath('/fr/', 'en'), '/');
  assert.deepEqual(splitLocalePath('/frank/'), { locale: 'en', path: '/frank/' });
});

test('all catalogues have identical keys, non-empty translations, and unchanged placeholders', async () => {
  const en = JSON.parse(await readFile(new URL('../src/i18n/messages/en.json', import.meta.url)));
  const tokens = (value) => (value.match(/\{\w+\}/g) || []).sort();
  for (const locale of LANGUAGE_CODES) {
    const translated = JSON.parse(await readFile(new URL(`../src/i18n/messages/${locale}.json`, import.meta.url)));
    assert.deepEqual(Object.keys(translated), Object.keys(en));
    for (const [key, value] of Object.entries(translated)) {
      assert.ok(value, `${locale}: ${key}`);
      assert.deepEqual(tokens(value), tokens(key), `${locale}: ${key}`);
      assert.ok(!/ZXQPH\d+ZXQ/.test(value));
      assert.ok(isValidTranslation(key, value), `${locale}: invalid translation or tokenizer artifact in ${key}`);
    }
  }
});

test('catalogue validation rejects unknown tokens, broken placeholders, and empty values', () => {
  assert.equal(isValidTranslation('Hello {name}', 'Hallo {name}'), true);
  for (const value of ['Hallo ▁{name}', 'Hallo �{name}', 'Hallo ⁇{name}', 'Hallo <unk>{name}', 'Hallo <UNK>{name}', 'Hallo {other}', '', '   ', null]) {
    assert.equal(isValidTranslation('Hello {name}', value), false, String(value));
  }
});

test('fidelity checks preserve prices, percentages, names, and deliberate language register', () => {
  assert.deepEqual(numberTokens('€1,200, €4.99, 50%, 21%'), numberTokens('1.200 €, 4,99 €, 50%, 21%'));
  assert.deepEqual(translationIssues('Starter · From €500', 'Starter · Vanaf €500', 'nl'), []);
  assert.ok(translationIssues('Starter · From €500', 'Voorgerecht · Vanaf €50', 'nl').some((issue) => issue.includes('numeric')));
  assert.ok(translationIssues('Choose Still', 'Kies Stil', 'nl').some((issue) => issue.includes('protected')));
  assert.ok(translationIssues('Your website', 'Uw website', 'nl').some((issue) => issue.includes('register')));
  assert.ok(translationIssues('Your website', 'Deine Website', 'de').some((issue) => issue.includes('register')));
  assert.ok(translationIssues('Your website', 'Ton site', 'fr').some((issue) => issue.includes('register')));
  assert.ok(translationIssues('Tell us about it', 'Tell us about it', 'fr').includes('unreviewed English fallback'));
  assert.deepEqual(translationIssues('Contact', 'Contact', 'fr'), []);
  assert.deepEqual(translationIssues('Requests', 'Requêtes', 'fr'), []);
  assert.ok(formatCopyPrices('50% · €1,200', 'fr').includes('50\u00a0%'));
  assert.ok(formatCopyPrices('50% · €1,200', 'de').includes('50\u00a0%'));
  assert.equal(formatCopyPrices('Wird gesendet…', 'de'), 'Wird gesendet\u00a0…');
  assert.equal(formatCopyPrices('Choisissez ‘Envoyer la demande’.', 'fr'), 'Choisissez «\u00a0Envoyer la demande\u00a0».');
});

test('every shipped translation passes fidelity rules and keeps curated corrections', async () => {
  const editorial = JSON.parse(await readFile(new URL('../src/i18n/editorial.json', import.meta.url)));
  for (const [index, locale] of ['nl', 'fr', 'de'].entries()) {
    const catalog = JSON.parse(await readFile(new URL(`../src/i18n/messages/${locale}.json`, import.meta.url)));
    for (const [key, value] of Object.entries(catalog)) {
      assert.deepEqual(translationIssues(key, value, locale), [], `${locale}: ${key}`);
      assert.deepEqual(numberTokens(formatCopyPrices(value, locale)), numberTokens(key), `${locale}: rendered numeric values in ${key}`);
      if (editorial[key]) assert.equal(value, editorial[key][index], `${locale}: curated ${key}`);
    }
  }
});

test('review candidates need matching source, complete locales, and preserved placeholders', () => {
  const source = { 'Hello {name}': 'Hello {name}' };
  const candidates = { sourceDigest: digest(JSON.stringify(source)), locales: {
    nl: { 'Hello {name}': 'Hallo {name}' }, fr: { 'Hello {name}': 'Bonjour {name}' }, de: { 'Hello {name}': 'Hallo {name}' },
  } };
  assert.equal(prepareCatalogues(source, candidates, {})['fr']['Hello {name}'], 'Bonjour {name}');
  assert.throws(() => prepareCatalogues(source, { ...candidates, sourceDigest: 'stale' }, {}), /digest/);
  assert.throws(() => prepareCatalogues(source, { ...candidates, locales: {} }, {}), /invalid/);
  assert.throws(() => prepareCatalogues(source, { ...candidates, locales: { ...candidates.locales, nl: { 'Hello {name}': 'Hallo' } } }, {}), /invalid/);
  assert.equal(batches([{ text: 'first' }, { text: 'second' }], 6).length, 2);
  const question = { 'Can you help?': 'Can you help?' };
  assert.equal(prepareCatalogues(question, { sourceDigest: digest(JSON.stringify(question)), locales: {
    nl: { 'Can you help?': 'Kunt u helpen?' }, fr: { 'Can you help?': 'Pouvez-vous aider ?' }, de: { 'Can you help?': 'Können Sie helfen?' },
  } }, {})['nl']['Can you help?'], 'Kun je helpen?');
  const possessive = { 'The site has your text.': 'The site has your text.' };
  assert.equal(prepareCatalogues(possessive, { sourceDigest: digest(JSON.stringify(possessive)), locales: {
    nl: { 'The site has your text.': 'De website heeft uw tekst.' }, fr: { 'The site has your text.': 'Le site contient vos textes.' }, de: { 'The site has your text.': 'Die Website enthält Ihre Texte.' },
  } }, {})['nl']['The site has your text.'], 'De website heeft je tekst.');
});

test('HTML localization is static, escaped, and never touches scripts or field values', () => {
  const html = '<!doctype html><html lang="en-GB"><head><title>Contact</title></head><body><p>Contact <a href="/websites/">Websites</a></p><input value="Client text" placeholder="Your name or studio"><textarea placeholder="Your name or studio">Private text</textarea><script type="application/ld+json">{"name":"Contact"}</script></body></html>';
  const rendered = localizeHtml(html, '/', 'fr', { Contact: 'Contact & <unsafe>', Websites: 'Sites web', 'Your name or studio': 'Votre nom' });
  const { document } = parseHTML(rendered);
  assert.equal(document.documentElement.lang, 'fr-BE');
  assert.equal(document.querySelector('input').value, 'Client text');
  assert.equal(document.querySelector('textarea').textContent, 'Private text');
  assert.equal(document.querySelector('textarea').getAttribute('placeholder'), 'Votre nom');
  assert.equal(document.querySelector('script').textContent, '{"name":"Contact"}');
  assert.equal(document.querySelector('input').placeholder, 'Votre nom');
  assert.equal(document.querySelector('a').getAttribute('href'), '/fr/websites/');
  assert.equal(document.querySelectorAll('unsafe').length, 0);
  assert.ok(document.querySelectorAll('[data-i18n]').length > 0);
  assert.ok(!rendered.includes('data-i1-8n'));
  assert.ok(collectHtmlMessages(html).has('Contact'));
  assert.ok(!collectHtmlMessages(html).has('Private text'));
  assert.ok(collectHtmlMessages('<html><body><p>View packages &amp; pricing</p></body></html>').has('View packages & pricing'));
});

test('shell always exposes pricing, examples, and a genuine link-based language switcher', async () => {
  const source = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const { document } = parseHTML(enhanceShell(source, '/'));
  for (const selector of ['.desktop-nav', '.mobile-nav', '.header-shortcuts']) {
    assert.ok(document.querySelector(`${selector} a[href="/websites/pricing/"]`));
    assert.ok(document.querySelector(`${selector} a[href="/websites/examples/"]`));
  }
  assert.equal(document.querySelectorAll('[data-language-choice]').length, 4);
});

test('localized recommendations preserve technical requirements and exact numeric budgets', () => {
  for (const locale of LANGUAGE_CODES) {
    const result = recommendWebsite({ ...base, accounts: 'portal', budget: 'starter' }, locale);
    assert.equal(result.estimate.from, 6500);
    assert.equal(result.estimate.tier.id, 'enterprise');
    assert.ok(result.estimate.budgetWarning);
    assert.equal(result.title, t('A focused landing page', {}, locale));
    if (locale !== 'en') assert.notEqual(result.title, 'A focused landing page');
    assert.ok(new Intl.NumberFormat(LANGUAGES[locale].intl, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(6500).includes(result.estimate.label.split('–')[0]));
  }
  assert.equal(t('Question {current} of {total}', { current: 2, total: 10 }, 'en'), 'Question 2 of 10');
});
