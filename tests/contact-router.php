<?php
declare(strict_types=1);
// Test-only router, outside public/dist. Never calls mail() or an SMTP server.
if (parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) !== '/api/contact.php') { http_response_code(404); exit; }
require __DIR__ . '/../public/api/contact-handler.php';
$directory = getenv('HOTWIRE_TEST_DIRECTORY');
if (!$directory || !is_dir($directory)) { http_response_code(503); exit; }
$config = json_decode(file_get_contents($directory . '/config.json'), true, 32, JSON_THROW_ON_ERROR);
$transport = function ($to, $subject, $body, $headers) use ($directory, $config): bool {
    $kind = $to === HOTWIRE_TO ? 'studio' : 'confirmation';
    file_put_contents($directory . '/mail.jsonl', json_encode(compact('kind', 'to', 'subject', 'body', 'headers') + ['session_closed' => session_status() !== PHP_SESSION_ACTIVE], JSON_THROW_ON_ERROR) . "\n", FILE_APPEND | LOCK_EX);
    if (($config['mode'] ?? '') === 'throw-confirmation' && $kind === 'confirmation') throw new RuntimeException('Fake secondary failure');
    return ($config['mode'] ?? '') !== 'reject-' . $kind;
};
contact_handle($transport, $directory . '/limits-' . preg_replace('/[^a-z0-9-]/', '', $config['scenario']));
