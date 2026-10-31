// Private, fictional previews. No sendmail, SMTP, API, or live delivery calls.
import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = process.argv[2];
if (!output) throw new Error('Use npm run preview:emails -- PRIVATE_OUTPUT_DIRECTORY. Requires PHP 8.2+ or PHP_BINARY.');
const destination = resolve(output);
if (/^(src|public|dist)(?:[\\/]|$)/i.test(relative(root, destination))) throw new Error('Keep email previews outside src/public/dist.');
const rendered = spawnSync(process.env.PHP_BINARY || 'php', [resolve(root, 'tests/render-mail-previews.php')], { encoding: 'utf8' });
if (rendered.error) throw new Error('PHP 8.2+ is required. Set PHP_BINARY or add php to PATH.', { cause: rendered.error });
if (rendered.status !== 0) throw new Error(rendered.stderr);
const messages = JSON.parse(rendered.stdout);
await mkdir(destination, { recursive: true });
for (const [name, message] of Object.entries(messages)) {
  await writeFile(resolve(destination, name + '.html'), message.html + '\n', 'utf8');
  await writeFile(resolve(destination, name + '.txt'), message.plain + '\n', 'utf8');
}
console.log(`Rendered ${Object.keys(messages).length} fictional email previews to ${destination}. No emails sent.`);
