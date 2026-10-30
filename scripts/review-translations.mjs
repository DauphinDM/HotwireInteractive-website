// Opt-in maintenance tools for PUBLIC checked-in copy, never visitor input.
// Results are review candidates/reports, not automatically published catalogues.
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { isValidTranslation } from './i18n.mjs';
import { translationIssues } from '../src/i18n/quality.js';
import { formatCopyPrices } from '../src/i18n/config.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const locales = ['nl', 'fr', 'de'];
const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const save = (path, value) => writeFile(path, JSON.stringify(value, null, 2) + '\n', 'utf8');
export const digest = (text) => createHash('sha256').update(text).digest('hex');
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

export function batches(entries, maxCharacters) {
  const result = [];
  let batch = [], size = 0;
  for (const entry of entries) {
    if (size + entry.text.length > maxCharacters && batch.length) {
      result.push(batch); batch = []; size = 0;
    }
    batch.push(entry); size += entry.text.length + 24;
  }
  if (batch.length) result.push(batch);
  return result;
}

export function prepareCatalogues(source, candidates, editorial) {
  if (candidates.sourceDigest !== digest(JSON.stringify(source))) throw new Error('Candidate source digest does not match the current English copy.');
  const result = {};
  for (const [index, locale] of locales.entries()) {
    const catalog = result[locale] = {};
    for (const key of Object.keys(source)) {
      let value = editorial[key]?.[index] ?? candidates.locales[locale]?.[key];
      if (!isValidTranslation(key, value)) throw new Error(`Missing or invalid ${locale} candidate: ${key}`);
      value = value.normalize('NFC').replaceAll('\u200b', '');
      if (locale === 'nl') {
        // One consistent visitor register. This does not replace semantic review.
        // Handle inversion only for the original subject "u", never a possessive
        // "je" ("de mailserver heeft je aanvraag" must keep "heeft").
        value = value.replace(/\b(kunt|bent|hebt|heeft|wilt|zult|wordt) u\b/gi, (_, verb) => {
          const stem = { kunt: 'kun', bent: 'ben', hebt: 'heb', heeft: 'heb', wilt: 'wil', zult: 'zul', wordt: 'word' }[verb.toLowerCase()];
          return (verb[0] === verb[0].toUpperCase() ? stem[0].toUpperCase() + stem.slice(1) : stem) + ' je';
        });
        value = value.replace(/\bU heeft\b/g, 'Je hebt').replace(/\bu heeft\b/g, 'je hebt')
          .replace(/\bU zal\b/g, 'Je zult').replace(/\bu zal\b/g, 'je zult')
          .replace(/\bUw\b/g, 'Je').replace(/\buw\b/g, 'je').replace(/\bU\b/g, 'Je').replace(/\bu\b/g, 'je');
      }
      const issues = translationIssues(key, value, locale);
      if (issues.length) throw new Error(`${locale}: ${key}: ${issues.join(', ')}. Add a deliberate editorial correction before applying.`);
      catalog[key] = value;
    }
  }
  return result;
}

async function apply(input) {
  const source = await readJson(resolve(root, 'src/i18n/messages/en.json'));
  const editorial = await readJson(resolve(root, 'src/i18n/editorial.json'));
  const catalogs = prepareCatalogues(source, await readJson(input), editorial);
  // Validate every locale before writing any of them. This is an explicit review
  // step, not part of translation generation or ordinary builds.
  for (const locale of locales) await save(resolve(root, `src/i18n/messages/${locale}.json`), catalogs[locale]);
  console.log('Applied reviewed candidates plus editorial corrections. Run grammar, fidelity, build, and browser checks before publishing.');
}

async function translate(output) {
  const source = await readJson(resolve(root, 'src/i18n/messages/en.json'));
  const editorial = await readJson(resolve(root, 'src/i18n/editorial.json'));
  let result;
  try { result = await readJson(output); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  result ||= { provider: 'Google Translate public endpoint (unofficial; no SLA)', sourceDigest: digest(JSON.stringify(source)), locales: {} };
  if (result.sourceDigest !== digest(JSON.stringify(source))) throw new Error('Source changed; use a new review-candidate file.');
  for (const [localeIndex, locale] of locales.entries()) {
    const catalog = result.locales[locale] ||= {};
    // Existing editorial decisions are retained; whole sentences stay together.
    for (const [key, values] of Object.entries(editorial)) catalog[key] = values[localeIndex];
    await save(output, result);
    const missing = Object.keys(source).filter((key) => !catalog[key]);
    for (const batch of batches(missing.map((key) => ({ key, text: key })), 2600)) {
      const protectedValues = [];
      const protect = (text) => text.replace(/\{\w+\}|https?:\/\/\S+|[\w.+-]+@[\w.-]+\.[A-Za-z]+|Hotwire Interactive|Hotwire|Dauphin de Moulin|Liam van Looveren|Fieldwork|Forma|Objects|Still|Starter|Growth|Scale|Enterprise|Webhero|JouwWeb|Google Fonts|SameSite=Strict|HttpOnly|HTTPS|Secure|PHPSESSID/g, (value) => {
        const token = `ZXQPH${protectedValues.length}ZXQ`;
        protectedValues.push([token, value]); return token;
      });
      const query = batch.map(({ text }, index) => `[[${index}]] ${protect(text)}`).join('\n');
      const url = new URL('https://translate.googleapis.com/translate_a/single');
      url.search = new URLSearchParams({ client: 'gtx', sl: 'en', tl: locale, dt: 't', q: query });
      const response = await fetch(url, { signal: AbortSignal.timeout(45000) });
      if (!response.ok) throw new Error(`Translation service returned ${response.status}; stopped without retrying. Saved candidates remain at ${output}.`);
      const data = await response.json();
      let translated = data[0].map((part) => part[0] || '').join('');
      for (const [token, value] of protectedValues) translated = translated.replaceAll(token, value);
      const matches = [...translated.matchAll(/\[\[\s*(\d+)\s*\]\]\s*([\s\S]*?)(?=\[\[\s*\d+\s*\]\]|$)/g)];
      if (matches.length !== batch.length) throw new Error('Translation service lost segment markers; no entries in this batch accepted.');
      const values = matches.map((match) => [batch[Number(match[1])]?.key, match[2].trim()]);
      for (const [key, value] of values) {
        if (!key || !isValidTranslation(key, value) || /ZXQPH\d+ZXQ/.test(value)) throw new Error(`Invalid candidate/placeholder: ${key}. No entries in this batch accepted.`);
      }
      Object.assign(catalog, Object.fromEntries(values));
      await save(output, result);
      console.log(`${locale}: ${Object.keys(catalog).length}/${Object.keys(source).length} review candidates cached.`);
      await sleep(1500);
    }
  }
}

async function grammar(output) {
  let previous = {};
  try { previous = await readJson(output); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const report = { provider: 'LanguageTool public API', checkedAt: new Date().toISOString(), locales: {} };
  const languages = { nl: 'nl', fr: 'fr', de: 'de-DE' };
  for (const locale of locales) {
    const catalog = await readJson(resolve(root, `src/i18n/messages/${locale}.json`));
    const old = previous.locales?.[locale];
    const catalogueDigest = digest(JSON.stringify(catalog));
    // Migrate a complete older report while its catalogue still matches, then
    // cache per-message rendered text so corrections need only targeted rechecks.
    const checkedTexts = { ...(old?.checkedTexts || (old?.catalogueDigest === catalogueDigest && old.messagesChecked === Object.keys(catalog).length ? catalog : {})) };
    const entries = Object.entries(catalog).map(([key, text]) => ({ key, text: formatCopyPrices(text, locale) }));
    for (const key of Object.keys(checkedTexts)) if (!Object.hasOwn(catalog, key)) delete checkedTexts[key];
    const pending = entries.filter(({ key, text }) => checkedTexts[key] !== text);
    const pendingKeys = new Set(pending.map(({ key }) => key));
    for (const key of pendingKeys) delete checkedTexts[key];
    const findings = report.locales[locale] = { catalogueDigest, checkedTexts, messagesChecked: Object.keys(checkedTexts).length,
      matches: (old?.matches || []).filter((match) => Object.hasOwn(checkedTexts, match.key) && !pendingKeys.has(match.key)) };
    for (const batch of batches(pending, 9000)) {
      let text = '';
      const ranges = batch.map((entry) => {
        const start = text.length;
        text += entry.text + '\n\n';
        return { ...entry, start, end: text.length - 2 };
      });
      const response = await fetch('https://api.languagetool.org/v2/check', {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ language: languages[locale], text }), signal: AbortSignal.timeout(60000),
      });
      if (!response.ok) throw new Error(`LanguageTool returned ${response.status}; stopped without retrying. Partial report: ${output}.`);
      const data = await response.json();
      if (data.warnings?.incompleteResults) throw new Error('LanguageTool returned an incomplete check; report is not complete.');
      for (const match of data.matches) {
        const entry = ranges.find((range) => match.offset >= range.start && match.offset < range.end);
        if (!entry) continue;
        findings.matches.push({ key: entry.key, text: entry.text, message: match.message, rule: match.rule.id,
          category: match.rule.category.id, offset: match.offset - entry.start, length: match.length,
          suggestions: match.replacements.slice(0, 5).map((item) => item.value) });
      }
      for (const entry of batch) checkedTexts[entry.key] = entry.text;
      findings.messagesChecked = Object.keys(checkedTexts).length;
      await save(output, report);
      console.log(`${locale}: LanguageTool checked ${findings.messagesChecked}/${Object.keys(catalog).length} messages; ${findings.matches.length} findings for review.`);
      // Stay below the public API's request/character limits. No retry on 429.
      await sleep(20000);
    }
    await save(output, report);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [action, output, consent] = process.argv.slice(2);
  if (!['translate', 'grammar', 'apply'].includes(action) || !output || consent !== (action === 'apply' ? '--reviewed' : '--allow-public-copy')) {
    throw new Error('Opt-in only: translate|grammar OUTPUT.json --allow-public-copy, or apply CANDIDATES.json --reviewed. translate/grammar send checked-in public website copy to the named service, never visitor input. Keep reports outside public/dist.');
  }
  const destination = resolve(output);
  if (['src', 'public', 'dist'].map((path) => resolve(root, path)).some((directory) => destination.toLowerCase() === directory.toLowerCase() || destination.toLowerCase().startsWith(directory.toLowerCase() + '\\') || destination.toLowerCase().startsWith(directory.toLowerCase() + '/'))) {
    throw new Error('Keep review candidates/reports outside src/public/dist.');
  }
  if (action === 'translate') await translate(destination);
  else if (action === 'grammar') await grammar(destination);
  else await apply(destination);
}
