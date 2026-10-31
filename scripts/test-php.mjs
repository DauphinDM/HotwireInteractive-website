import { spawnSync } from 'node:child_process';

const php = process.env.PHP_BINARY || 'php';
const commands = [
  [php, ['-l', 'public/api/contact.php']],
  [php, ['-l', 'public/api/contact-lib.php']],
  [php, ['-l', 'public/api/contact-mail.php']],
  [php, ['-l', 'public/api/contact-handler.php']],
  [php, ['-l', 'tests/contact-router.php']],
  [php, ['-l', 'tests/render-mail-previews.php']],
  [php, ['tests/contact-backend.php']],
  [php, ['tests/contact-mail.php']],
  [process.execPath, ['tests/contact-endpoint.mjs']],
];

for (const [command, args] of commands) {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.error) {
    console.error('PHP 8.2+ is required. Add php to PATH or set PHP_BINARY to its executable.');
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status || 1);
}
