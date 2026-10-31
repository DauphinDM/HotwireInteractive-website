import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { resolve } from 'node:path';
import { mkdtemp, mkdir, readFile, readdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { randomBytes } from 'node:crypto';

const socket = createServer();
socket.listen(0, '127.0.0.1');
await once(socket, 'listening');
const port = socket.address().port;
await new Promise((done) => socket.close(done));
const temporaryRoot = process.platform === 'win32' ? resolve(process.env.LOCALAPPDATA, 'Temp/opencode') : tmpdir();
const directory = await mkdtemp(resolve(temporaryRoot, 'hotwire-contact-http-'));
await mkdir(resolve(directory, 'sessions'));
const configure = (scenario, mode = 'accept') => writeFile(resolve(directory, 'config.json'), JSON.stringify({ scenario, mode }));
await configure('initial');
const captured = async () => {
  try { return (await readFile(resolve(directory, 'mail.jsonl'), 'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
};
const server = spawn(process.env.PHP_BINARY || 'php', ['-d', `session.save_path=${resolve(directory, 'sessions')}`, '-S', `127.0.0.1:${port}`, '-t', resolve('public'), resolve('tests/contact-router.php')], {
  stdio: ['ignore', 'ignore', 'pipe'], env: { ...process.env, HOTWIRE_TRANSLATION_DIR: resolve('src/i18n/messages'), HOTWIRE_TEST_DIRECTORY: directory },
});
// Drain the server log throughout the suite so a full pipe cannot stall PHP.
let log = '';
server.stderr.on('data', (chunk) => { log += chunk; });
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
  assert.equal((await captured()).length, 0, 'Invalid requests must call neither mail transport');

  const valid = { ...base, name: 'Private studio Zoë', email: 'zoe@example.com', message: 'Private message <script>alert(1)</script>', brief: 'Private project brief', locale: 'fr' };
  await configure('success');
  const accepted = await post(valid);
  assert.equal(accepted.status, 200);
  assert.equal((await accepted.json()).confirmation, 'accepted');
  let mails = await captured();
  assert.equal(mails.length, 2);
  assert.equal(mails[0].to, 'contact@hotwireinteractive.co.uk');
  assert.equal(mails[1].to, valid.email);
  assert.equal(mails[1].headers['Content-Language'], 'fr');
  assert.equal(mails[1].session_closed, true, 'Acceptance is checkpointed and session unlocked before secondary transport');
  assert.ok(!mails[1].body.includes('Private'), 'Client confirmation must not reflect private fields');
  assert.equal((await post(valid)).status, 200);
  assert.equal((await captured()).length, 2, 'Lost-response retry sends neither email twice');
  assert.equal((await post({ ...valid, message: 'Edited' })).status, 409);
  assert.equal((await captured()).length, 2);
  const sessionFiles = await readdir(resolve(directory, 'sessions'));
  const sessionData = (await Promise.all(sessionFiles.map((file) => readFile(resolve(directory, 'sessions', file), 'utf8')))).join('');
  assert.ok(sessionData.includes('confirmation') && !sessionData.includes('Private'), 'Session receipts contain status/hashes, not inquiry text');

  // A new session/IP cannot bypass the recipient-specific cooldown.
  const secondInitial = await fetch(url, { headers: { Accept: 'application/json' } });
  const secondCookie = secondInitial.headers.get('set-cookie').split(';')[0];
  const secondToken = await secondInitial.json();
  const duplicateRecipient = await fetch(url, { method: 'POST', headers: { Accept: 'application/json', Cookie: secondCookie }, body: new URLSearchParams({ ...valid, csrf: secondToken.csrf, request_id: secondToken.request_id }) });
  assert.equal((await duplicateRecipient.json()).confirmation, 'suppressed');
  assert.equal((await captured()).length, 3, 'Recipient cap suppresses only the client email, not studio inquiry');

  for (const mode of ['reject-studio', 'reject-confirmation', 'throw-confirmation']) {
    await configure(mode, mode);
    const inquiry = { ...valid, email: mode + '@example.com', request_id: randomBytes(16).toString('hex') };
    const before = (await captured()).length;
    const response = await post(inquiry);
    const result = await response.json();
    assert.equal(response.status, mode === 'reject-studio' ? 503 : 200);
    assert.equal(result.ok, mode !== 'reject-studio');
    if (mode !== 'reject-studio') {
      assert.equal(result.confirmation, 'unavailable');
      assert.equal((await post(inquiry)).status, 200);
    }
    assert.equal((await captured()).length, before + (mode === 'reject-studio' ? 1 : 2), mode + ' retry semantics');
  }

  await configure('native');
  const nativeSuccess = await post({ ...valid, email: 'native@example.com', request_id: randomBytes(16).toString('hex') }, 'text/html');
  const nativeSuccessHtml = await nativeSuccess.text();
  assert.equal(nativeSuccess.status, 200);
  assert.ok(nativeSuccessHtml.includes('lang="fr"') && nativeSuccessHtml.includes(fr['Your inquiry has been accepted by our mail server. A confirmation email has also been accepted for delivery to your address.']));
  assert.ok(!nativeSuccessHtml.includes('<form'), 'Native success cannot invite an accidental resubmit');

  await configure('rate');
  for (let i = 0; i < 5; i++) {
    const result = await post({ ...valid, email: 'rate@example.com', request_id: randomBytes(16).toString('hex') });
    assert.equal(result.status, 200);
  }
  const beforeRate = (await captured()).length;
  const limited = await post({ ...valid, request_id: randomBytes(16).toString('hex') });
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get('retry-after'), '900');
  assert.equal((await captured()).length, beforeRate);
  assert.ok(!log.includes('Fatal error') && !log.includes('Warning:'), 'PHP emitted no runtime warnings');
  console.log('PASS: PHP HTTP endpoint — secure forms, two captured HTML emails, localization, durable receipts, retries, confirmation failures/suppression, native success, and rate limits. No real mail sent.');
} finally {
  if (server.exitCode === null) { server.kill(); await once(server, 'exit'); }
  await rm(directory, { recursive: true, force: true }); // Only this test's mkdtemp directory.
}
