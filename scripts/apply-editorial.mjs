import { readFile, writeFile } from 'node:fs/promises';
const source = new URL('../src/i18n/', import.meta.url);
const editorial = JSON.parse(await readFile(new URL('editorial.json', source), 'utf8'));
for (const [index, locale] of ['nl', 'fr', 'de'].entries()) {
  const file = new URL(`messages/${locale}.json`, source);
  const catalog = JSON.parse(await readFile(file, 'utf8'));
  for (const [key, value] of Object.entries(catalog)) {
    if (value.includes('▁')) catalog[key] = value.replaceAll('▁', ' ').replace(/\s+/g, ' ').trim();
  }
  for (const [key, translations] of Object.entries(editorial)) {
    if (!Object.hasOwn(catalog, key)) throw new Error(`Editorial source changed or missing: ${key}`);
    catalog[key] = translations[index];
  }
  await writeFile(file, JSON.stringify(catalog, null, 2) + '\n', 'utf8');
}
console.log('Applied curated navigation, core journey, and critical-warning translations.');
