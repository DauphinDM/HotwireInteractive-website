import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { resolve } from 'node:path';

const socket = createServer();
socket.listen(0, '127.0.0.1');
await once(socket, 'listening');
const port = socket.address().port;
await new Promise((done) => socket.close(done));
const server = spawn(process.env.PHP_BINARY || 'php', ['-S', `127.0.0.1:${port}`, '-t', resolve('public')], { stdio: ['ignore', 'ignore', 'pipe'], env: { ...process.env, HOTWIRE_TRANSLATION_DIR: resolve('src/i18n/messages') } });
try {
  await Promise.race([
    once(server.stderr, 'data'),
    once(server, 'error').then(([error]) => { throw error; }),
    new Promise((_, reject) => { const timer = setTimeout(() => reject(new Error('PHP did not start')), 5000); timer.unref(); }),
  ]);
  const url = `http://127.0.0.1:${port}/api/contact.php`;
  const initial = await fetch(url, { headers: { Accept: 'application/json' } });
  assert.equal(initial.status, 200);
  assert.match(initial.headers.get('cache-control'), /no-store/);
  const cookie = initial.headers.get('set-cookie').split(';')[0];
  const token = await initial.json();
  assert.match(token.csrf, /^[a-f0-9]{64}$/);
  const post = (values, accept = 'application/json') => fetch(url, { method: 'POST', headers: { Accept: accept, Cookie: cookie }, body: new URLSearchParams(values) });
  assert.equal((await post({})).status, 403);
  const base = { csrf: token.csrf, request_id: token.request_id, name: 'Test', email: 'invalid', category: 'website', message: 'Test message', consent: '1' };
  assert.equal((await post(base)).status, 422);
  assert.equal((await post({ ...base, message: 'x'.repeat(25000) })).status, 413);
  const escaped = await post({ ...base, name: '<script>alert(1)</script>' }, 'text/html');
  const html = await escaped.text();
  assert.equal(escaped.status, 422);
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<script>alert'));
  const repaired = await (await post({ ...base, request_id: 'invalid' }, 'text/html')).text();
  assert.match(repaired, /name="request_id" value="[a-f0-9]{32}"/);
  const attachment = new FormData();
  Object.entries(base).forEach(([key, value]) => attachment.append(key, value));
  attachment.append('file', new Blob(['Not an accepted upload']), 'example.txt');
  const rejectedUpload = await fetch(url, { method: 'POST', headers: { Accept: 'application/json', Cookie: cookie }, body: attachment });
  assert.equal(rejectedUpload.status, 422);
  assert.match((await rejectedUpload.json()).message, /Attachments are not supported/);
  const native = await (await fetch(url)).text();
  assert.ok(native.includes('name="csrf"') && native.includes('Send inquiry'));
  assert.ok(native.includes('href="/privacy/"') && native.includes('href="/terms/"') && native.includes('href="/cookies/"'));
  assert.ok(native.includes('aria-describedby="contact-privacy"'));
  const french = await (await fetch(url + '?lang=fr')).text();
  const fr = JSON.parse(await (await import('node:fs/promises')).readFile(resolve('src/i18n/messages/fr.json'), 'utf8'));
  assert.ok(french.includes('lang="fr"') && french.includes(fr['Your name or studio']));
  assert.ok(french.includes('name="locale" value="fr"') && french.includes('href="/fr/privacy/"'));
  assert.equal((await fetch(url, { method: 'PUT', headers: { Accept: 'application/json' } })).status, 405);
  console.log('PASS: PHP HTTP endpoint — sessions, CSRF, validation, size limits, escaping, repaired request IDs, rejected uploads, native form, allowed methods. No mail sent.');
} finally { server.kill(); }
