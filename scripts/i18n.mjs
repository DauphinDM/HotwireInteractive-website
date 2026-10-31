import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'acorn';
import { spawn } from 'node:child_process';
import { collectHtmlMessages, enhanceShell } from './i18n-html.mjs';
import { LANGUAGE_CODES } from '../src/i18n/config.js';
import { isTranslatable } from '../src/i18n/protected.js';
import { translationIssues } from '../src/i18n/quality.js';

const root = fileURLToPath(new URL('../', import.meta.url));
export const pageFiles = ['index.html', 'websites/index.html', 'websites/pricing/index.html', 'websites/examples/index.html', 'websites/agreement/index.html',
  ...['local', 'portfolio', 'shop', 'booking'].map((id) => `websites/examples/${id}/index.html`),
  'team/index.html', 'team/dauphindm/index.html', 'team/liamvl/index.html', 'privacy/index.html', 'terms/index.html', 'cookies/index.html', '404.html'];
const dynamicFiles = ['website-recommendation', 'website-quiz', 'pricing', 'contact', 'main', 'templates', 'agreement', 'demo', 'site'].map((name) => `src/js/${name}.js`);
const catalogueFile = (locale) => resolve(root, `src/i18n/messages/${locale}.json`);
const order = (object) => Object.fromEntries(Object.entries(object).sort(([a], [b]) => a.localeCompare(b, 'en')));
const placeholders = (text) => (text.match(/\{\w+\}/g) || []).sort().join('|');

export function isValidTranslation(source, value) {
  return typeof value === 'string' && Boolean(value.trim()) &&
    placeholders(source) === placeholders(value) && !/[▁�⁇]|<unk>/i.test(value);
}

export async function sourceMessages() {
  const messages = new Set(['Choose language', 'Language selection', 'Website shortcuts', 'Packages from €500', 'See examples', 'Pricing', 'Examples', 'Preferred language', 'Please choose a supported language.']);
  for (const file of pageFiles) {
    const html = enhanceShell(await readFile(resolve(root, file), 'utf8'), '/' + file.replace(/index\.html$/, ''));
    for (const key of collectHtmlMessages(html)) messages.add(key);
  }
  for (const file of dynamicFiles) {
    const ast = parse(await readFile(resolve(root, file), 'utf8'), { ecmaVersion: 'latest', sourceType: 'module' });
    const visit = (node) => {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'Literal' && typeof node.value === 'string' && isTranslatable(node.value) &&
          !/^(?:\(|nav\[|input\[|select\[|[.#])/.test(node.value) &&
          (/\s/.test(node.value) || /^[A-Z][a-z]/.test(node.value))) messages.add(node.value);
      for (const value of Object.values(node)) if (Array.isArray(value)) value.forEach(visit); else if (value && typeof value === 'object') visit(value);
    };
    visit(ast);
  }
  // PHP's fixed validation/response strings also use the same public catalogues.
  for (const file of ['public/api/contact-handler.php', 'public/api/contact-lib.php']) {
    const source = await readFile(resolve(root, file), 'utf8');
    for (const match of source.matchAll(/'((?:[^'\\]|\\.)*)'/g)) {
      const key = match[1].replace(/\\'/g, "'");
      if (isTranslatable(key) && /\s/.test(key) && !/[<>={};]|\\[rnt]/.test(key)) messages.add(key);
    }
  }
  // Email templates contain substantial HTML/CSS. Extract only explicit copy
  // calls, not arbitrary quoted attributes, MIME headers, or style declarations.
  const emailSource = await readFile(resolve(root, 'public/api/contact-mail.php'), 'utf8');
  for (const match of emailSource.matchAll(/\$t\(\s*'((?:[^'\\]|\\.)*)'/g)) messages.add(match[1].replace(/\\'/g, "'"));
  return [...messages].sort((a, b) => a.localeCompare(b, 'en'));
}

export async function syncCatalogs() {
  const keys = await sourceMessages();
  for (const locale of LANGUAGE_CODES) {
    let existing = {}; try { existing = JSON.parse(await readFile(catalogueFile(locale), 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    const catalog = Object.fromEntries(keys.map((key) => [key, locale === 'en' ? key : existing[key] || '']));
    await mkdir(resolve(root, 'src/i18n/messages'), { recursive: true });
    await writeFile(catalogueFile(locale), JSON.stringify(order(catalog), null, 2) + '\n', 'utf8');
    console.log(`${locale}: ${keys.length} source messages; ${Object.values(catalog).filter((value) => !value).length} untranslated.`);
  }
}

export async function checkCatalogs() {
  const keys = await sourceMessages();
  const editorial = JSON.parse(await readFile(resolve(root, 'src/i18n/editorial.json'), 'utf8'));
  for (const locale of LANGUAGE_CODES) {
    const catalog = JSON.parse(await readFile(catalogueFile(locale), 'utf8'));
    const invalid = keys.filter((key) => !isValidTranslation(key, catalog[key]));
    if (invalid.length) throw new Error(`${locale}: ${invalid.length} missing/invalid translations. Run npm run i18n:sync, then fill or explicitly translate the catalogue. First: ${invalid.slice(0, 3).join('; ')}`);
    if (locale === 'en') continue;
    const localeIndex = ['nl', 'fr', 'de'].indexOf(locale);
    const issues = keys.flatMap((key) => {
      const problems = translationIssues(key, catalog[key], locale);
      if (editorial[key] && catalog[key] !== editorial[key][localeIndex]) problems.push('curated translation changed; update editorial.json deliberately');
      return problems.map((problem) => `${key}: ${problem}`);
    });
    if (issues.length) throw new Error(`${locale}: ${issues.length} translation-quality issues. ${issues.slice(0, 5).join('; ')}`);
  }
  console.log(`All ${LANGUAGE_CODES.length} catalogues cover ${keys.length} messages and preserve placeholders, numeric values, protected names, register, and curated wording.`);
}

async function seedTranslations() {
  await syncCatalogs();
  await new Promise((done, reject) => {
    const child = spawn(process.env.HOTWIRE_I18N_PYTHON || 'python', [resolve(root, 'scripts/translate-catalogs.py'), ...process.argv.slice(3)], { stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code) => code === 0 ? done() : reject(new Error(`Offline translator exited ${code}. See ai_here/languages.md for isolated-environment setup.`)));
  });
  console.log('Offline draft candidates only. Review their meaning and wording, then apply explicitly and run i18n:check. Public catalogue values were not filled automatically.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const action = process.argv[2];
  if (action === 'sync') await syncCatalogs();
  else if (action === 'check') await checkCatalogs();
  else if (action === 'translate') await seedTranslations();
  else throw new Error('Use sync, check, or translate --model-dir PATH --output CANDIDATES.json [--download-models].');
}
