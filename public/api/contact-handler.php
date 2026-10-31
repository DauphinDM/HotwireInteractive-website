<?php
declare(strict_types=1);
require_once __DIR__ . '/contact-lib.php';

// Transport/storage injection is server-side only. The production entrypoint
// always uses PHP mail(); local HTTP tests supply a capture-only transport.
function contact_handle(callable $transport, ?string $storageDirectory = null): void
{
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: same-origin');
    header('X-Frame-Options: DENY');
    header("Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'");
    ini_set('display_errors', '0');
    ini_set('session.use_strict_mode', '1');
    session_name('hotwire_contact');
    session_set_cookie_params(['lifetime' => 0, 'path' => '/api/', 'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off', 'httponly' => true, 'samesite' => 'Strict']);
    $wantsJson = strpos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false;
    $input = [];
    $csrf = '';
    $locale = contact_locale($_POST['locale'] ?? $_GET['lang'] ?? 'en');

    $reply = function (int $status, bool $ok, string $message, ?string $confirmation = null) use ($wantsJson, &$input, &$csrf, &$locale): void {
        http_response_code($status);
        if ($wantsJson) {
            header('Content-Type: application/json; charset=UTF-8');
            echo json_encode(['ok' => $ok, 'message' => $message, 'confirmation' => $confirmation, 'csrf' => $csrf, 'request_id' => bin2hex(random_bytes(16))]);
            exit;
        }
        header('Content-Type: text/html; charset=UTF-8');
        $e = fn($value) => htmlspecialchars(is_string($value) ? $value : '', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $tr = fn(string $text) => $e(contact_text($text, $locale));
        $path = fn(string $value) => $e(contact_path($value, $locale));
        // Repair an invalid or previously-used ID in the native form, so retrying
        // after a validation/conflict error never traps the visitor in an error loop.
        $requestId = $input['request_id'] ?? '';
        if ($status === 409 || !is_string($requestId) || !preg_match('/^[a-f0-9]{32}$/D', $requestId)) $requestId = bin2hex(random_bytes(16));
        ?>
    <!doctype html><html lang="<?= $e($locale) ?>"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title><?= $tr('Contact') ?> | Hotwire Interactive</title>
    <style>body{margin:0;background:#11110f;color:#f5f5f5;font:16px/1.7 system-ui,sans-serif}main{max-width:42rem;margin:auto;padding:3rem 1.5rem}h1{line-height:1.15}a{color:#ff905f}label{display:block;margin-top:1.25rem}input,textarea,select{box-sizing:border-box;display:block;width:100%;padding:.8rem;background:#1b1c19;color:inherit;border:1px solid #808080;font:inherit}input[type=checkbox]{display:inline;width:auto}button{margin-top:1.5rem;padding:1rem 1.5rem;background:#ff5d1b;color:#11110f;border:0;font:600 1rem system-ui;cursor:pointer}.trap{position:absolute;left:-10000px}p{overflow-wrap:anywhere}:focus-visible{outline:3px solid #ffaa00;outline-offset:4px}</style>
    <main><a href="<?= $path('/') ?>">Hotwire Interactive</a><h1><?= $tr($ok ? 'Thank you for your inquiry.' : 'Contact the studio') ?></h1><p role="status"><?= $tr($message) ?></p>
    <?php if (!$ok): ?>
    <form action="/api/contact.php" method="post">
      <input type="hidden" name="csrf" value="<?= $e($csrf) ?>"><input type="hidden" name="request_id" value="<?= $e($requestId) ?>">
      <input type="hidden" name="locale" value="<?= $e($locale) ?>">
      <input type="hidden" name="brief" value="<?= $e($input['brief'] ?? '') ?>">
      <?php if (!empty($input['brief']) && is_string($input['brief'])): ?><details><summary><?= $tr('Attached project brief') ?></summary><p style="white-space:pre-line"><?= $e($input['brief']) ?></p></details><?php endif; ?>
      <div class="trap" aria-hidden="true"><label><?= $tr('Leave empty') ?><input name="company_url" tabindex="-1" autocomplete="off"></label></div>
      <label><?= $tr('Your name or studio') ?><input name="name" autocomplete="name" maxlength="100" required value="<?= $e($input['name'] ?? '') ?>"></label>
      <label><?= $tr('Email address') ?><input type="email" name="email" autocomplete="email" maxlength="254" required value="<?= $e($input['email'] ?? '') ?>"></label>
      <label><?= $tr('Inquiry type') ?><select name="category"><?php foreach (HOTWIRE_CATEGORIES as $key => $label): ?><option value="<?= $key ?>" <?= ($input['category'] ?? 'website') === $key ? 'selected' : '' ?>><?= $tr($label) ?></option><?php endforeach; ?></select></label>
      <label><?= $tr(!empty($input['brief']) ? 'Your message (optional)' : 'Your message') ?><textarea name="message" rows="6" maxlength="1500" <?= empty($input['brief']) ? 'required' : '' ?>><?= $e($input['message'] ?? '') ?></textarea></label>
      <p><?= $tr('After acceptance, we’ll also try to email you a confirmation. It will not include your message or project brief. Delivery and response times are not guaranteed.') ?></p>
      <p id="contact-privacy"><?= $tr('Read our') ?> <a href="<?= $path('/privacy/') ?>"><?= $tr('Privacy notice') ?></a> <?= $tr('for how we handle your inquiry. Our') ?> <a href="<?= $path('/terms/') ?>"><?= $tr('Terms of Use') ?></a> <?= $tr('cover this website, not a contract for paid work.') ?></p>
      <label><input type="checkbox" name="consent" value="1" required aria-describedby="contact-privacy" <?= ($input['consent'] ?? '') === '1' ? 'checked' : '' ?>> <?= $tr('I agree to Hotwire using my details and message to respond to this inquiry.') ?></label>
      <button type="submit"><?= $tr('Send inquiry') ?></button>
    </form><?php endif; ?><p><?= $tr('You can also email') ?> <a href="mailto:contact@hotwireinteractive.co.uk">contact@hotwireinteractive.co.uk</a>.</p><nav aria-label="<?= $tr('Legal navigation') ?>"><a href="<?= $path('/privacy/') ?>"><?= $tr('Privacy') ?></a> · <a href="<?= $path('/terms/') ?>"><?= $tr('Terms of Use') ?></a> · <a href="<?= $path('/cookies/') ?>"><?= $tr('Cookies & Storage') ?></a></nav><a href="<?= $path('/#contact') ?>"><?= $tr('Back to the website') ?></a></main></html>
        <?php
        exit;
    };

    try {
        if (!session_start()) throw new RuntimeException('Session unavailable');
        if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32));
        $csrf = $_SESSION['csrf'];
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        if ($method === 'GET') $reply(200, false, 'Tell us about your project. Your information will be emailed to the studio when you send this form.');
        if ($method !== 'POST') {
            header('Allow: GET, POST');
            $reply(405, false, 'This form accepts GET and POST requests only.');
        }
        if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 24000) $reply(413, false, 'Your inquiry is too large. Please email us directly for longer briefs.');
        $input = $_POST;
        if (!is_string($input['csrf'] ?? null) || !hash_equals($csrf, $input['csrf'])) $reply(403, false, 'Please reload the secure form and try again. Your information has not been sent.');
        if (!empty($_FILES)) $reply(422, false, 'Attachments are not supported here. Please email the studio directly for files.');
        [$data, $error] = contact_validate($input);
        if (!$data) $reply(422, false, $error);
        ignore_user_abort(true);
        $directory = $storageDirectory ?? rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . '/hotwire-contact-' . substr(hash('sha256', __DIR__), 0, 16);
        $client = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . __DIR__);
        $receipts = $_SESSION['receipts'] ?? [];
        $checkpoint = function (string $id, array $receipt): void {
            if (session_status() !== PHP_SESSION_ACTIVE && !session_start()) throw new RuntimeException('Session unavailable');
            // Merge, rather than overwrite any other inquiry submitted while the
            // session was unlocked for the confirmation transport.
            $_SESSION['receipts'] = array_filter($_SESSION['receipts'] ?? [], fn($item) => is_array($item) && is_int($item['at'] ?? null) && $item['at'] > time() - 3600);
            $_SESSION['receipts'][$id] = $receipt;
            if (!session_write_close()) throw new RuntimeException('Session unavailable');
        };
        $result = contact_submit($data, $receipts, $directory, $client, time(), $transport, $checkpoint);
        if ($result['status'] === 429) header('Retry-After: 900');
        $reply($result['status'], $result['ok'], $result['message'], $result['confirmation'] ?? null);
    } catch (Throwable $error) {
        // Do not expose paths, addresses, message contents, or hosting errors to visitors.
        error_log('Hotwire contact endpoint: request could not be processed.');
        $reply(503, false, 'The contact service is temporarily unavailable. Please email the studio directly.');
    }
}
