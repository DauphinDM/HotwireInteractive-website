<?php
declare(strict_types=1);
putenv('HOTWIRE_TRANSLATION_DIR=' . __DIR__ . '/../src/i18n/messages');
require __DIR__ . '/../public/api/contact-lib.php';
$checks = 0;
function check(bool $value, string $label): void { global $checks; if (!$value) throw new RuntimeException($label); $checks++; }
function parts(array $mail): array {
    check((bool)preg_match('/boundary="([^"\r\n]+)"/', $mail[3]['Content-Type'], $match), 'Multipart boundary declared');
    check(!preg_match('/(?<!\r)\n|\r(?!\n)/', $mail[2]), 'MIME uses CRLF consistently');
    $chunks = explode('--' . $match[1], $mail[2]);
    check(count($chunks) === 4 && $chunks[3] === "--\r\n", 'Exactly two MIME parts and a closing boundary');
    $result = [];
    foreach (['text/plain', 'text/html'] as $index => $type) {
        [$headers, $body] = explode("\r\n\r\n", ltrim($chunks[$index + 1], "\r\n"), 2);
        check(str_contains($headers, 'Content-Type: ' . $type . '; charset=UTF-8') && str_contains($headers, 'Content-Transfer-Encoding: quoted-printable'), 'Alternative ' . $type . ' is UTF-8 quoted-printable, in preference order');
        foreach (explode("\r\n", $body) as $line) if (strlen($line) > 76) throw new RuntimeException('Quoted-printable line exceeds 76 bytes');
        $result[$type] = quoted_printable_decode(substr($body, 0, -2));
    }
    return $result;
}
function subject(string $value): string {
    if (!str_starts_with($value, '=?UTF-8?B?')) return $value;
    preg_match_all('/=\?UTF-8\?B\?([^?]+)\?=/', $value, $matches);
    foreach ($matches[0] as $word) check(strlen($word) <= 75, 'RFC 2047 word length');
    return implode('', array_map('base64_decode', $matches[1]));
}
$data = ['name' => 'Zoë <Studio> & Co', 'email' => 'zoe+studio@example.com', 'category' => 'website', 'message' => "Private text <img src=x onerror=alert(1)> & \"quotes\"\r\nSecond line — €500 🎮", 'brief' => "Private brief </td><script>alert(1)</script>\n" . str_repeat('VeryLongUnbrokenWord', 80), 'consent' => '1', 'company_url' => '', 'request_id' => str_repeat('a', 32), 'locale' => 'en'];
$captured = [];
$capture = function (...$args) use (&$captured) { $captured[] = $args; return true; };
check(contact_deliver($data, $capture, 'A1B2C3D4E5F6'), 'Studio HTML mail accepted by fake transport');
$studio = parts($captured[0]);
check(str_contains($studio['text/plain'], $data['name']) && str_contains($studio['text/plain'], '<img src=x') && str_contains($studio['text/plain'], '€500 🎮'), 'Plain alternative preserves visitor text and Unicode');
check(str_contains($studio['text/html'], 'Zoë &lt;Studio&gt; &amp; Co') && str_contains($studio['text/html'], '&lt;img') && str_contains($studio['text/html'], '&lt;script&gt;'), 'Every HTML visitor field is escaped');
check(!preg_match('/<(?:script|img|iframe|object)\b/i', $studio['text/html']) && str_contains($studio['text/html'], '<br>'), 'Visitor markup is inert and line breaks are retained');
check(str_contains($studio['text/html'], 'HW-A1B2-C3D4-E5F6') && str_contains($studio['text/html'], 'English'), 'Studio mail contains reference and preferred language');
check($captured[0][0] === HOTWIRE_TO && $captured[0][3]['Reply-To'] === $data['email'], 'Studio destination fixed, reply goes to visitor');
check(!isset($captured[0][3]['Content-Transfer-Encoding']) && $captured[0][3]['Auto-Submitted'] === 'auto-generated', 'Multipart has per-part encoding and automatic-notification header');
foreach (HOTWIRE_LANGUAGES as $locale => $label) {
    $localized = array_replace($data, ['locale' => $locale]);
    check(contact_deliver_confirmation($localized, $capture, 'A1B2C3D4E5F6'), $locale . ' confirmation accepted by fake transport');
    $mail = $captured[array_key_last($captured)];
    $alternatives = parts($mail);
    check($mail[0] === $data['email'] && $mail[3]['Reply-To'] === HOTWIRE_TO && str_contains($mail[3]['From'], HOTWIRE_FROM), $locale . ' confirmation uses fixed studio sender and reply-to');
    check($mail[3]['Auto-Submitted'] === 'auto-replied' && $mail[3]['X-Auto-Response-Suppress'] === 'All', $locale . ' automatic-response loop suppression');
    check($mail[3]['Content-Language'] === $locale && str_contains($alternatives['text/html'], 'lang="' . $locale . '"'), $locale . ' language declared in headers and HTML');
    $title = contact_text('Thanks for getting in touch.', $locale);
    if ($locale !== 'en') check($title !== 'Thanks for getting in touch.', $locale . ' has real localized copy, not an English fallback');
    check(str_contains($alternatives['text/html'], contact_mail_escape($title)) && str_contains($alternatives['text/plain'], $title), $locale . ' confirmation copy localized in both alternatives');
    check(subject($mail[1]) === contact_text('Your inquiry | Hotwire Interactive', $locale), $locale . ' correctly encoded subject');
    check(str_contains($alternatives['text/html'], 'https://hotwireinteractive.co.uk' . contact_path('/privacy/', $locale)), $locale . ' absolute localized privacy link');
    check(!str_contains($alternatives['text/html'] . $alternatives['text/plain'], 'Private') && !str_contains($alternatives['text/html'], 'Zoë') && !str_contains($alternatives['text/plain'], $data['email']), $locale . ' unverified address gets no reflected visitor content');
    check(!preg_match('/<(?:img|script|link|iframe|form)\b/i', $alternatives['text/html']), $locale . ' no external resources, tracking, scripts, or forms');
}
$briefOnly = contact_mail_studio(array_replace($data, ['message' => '']), 'A1B2C3D4E5F6');
check(!str_contains($briefOnly['html'], '>Your message<') && str_contains($briefOnly['html'], 'Website quiz brief:'), 'Brief-only inquiry has no empty message section');
$messageOnly = contact_mail_studio(array_replace($data, ['brief' => '']), 'A1B2C3D4E5F6');
check(!str_contains($messageOnly['html'], 'Website quiz brief:'), 'Message-only inquiry has no empty brief section');
$longSubject = str_repeat('Été — Grüße 🎮 ', 12);
check(subject(contact_mail_subject($longSubject)) === $longSubject, 'Long Unicode subject folds without splitting characters');
foreach (["Injected\r\nBcc: target@example.com", "Injected\tvalue"] as $bad) {
    try { contact_mail_subject($bad); throw new RuntimeException('Unsafe subject accepted'); } catch (InvalidArgumentException $expected) { check(true, 'Header control characters rejected'); }
}
try { contact_mail_send("a@example.com\r\nBcc: b@example.com", ['subject' => 'Test'], HOTWIRE_TO, 'en', true, $capture); throw new RuntimeException('Unsafe address accepted'); }
catch (InvalidArgumentException $expected) { check(true, 'Mail envelope independently rejects header injection'); }

$root = sys_get_temp_dir() . '/hotwire-mail-test-' . bin2hex(random_bytes(8));
mkdir($root, 0700, true);
$directories = [];
$directory = function (string $name) use ($root, &$directories): string { $path = $root . '/' . $name; mkdir($path, 0700); $directories[] = $path; return $path; };
try {
    foreach (['accepted', 'rejected', 'throws', 'suppressed', 'storage', 'checkpoint', 'final-checkpoint'] as $scenario) {
        $dir = $directory($scenario);
        $receipts = []; $calls = []; $saved = [];
        if ($scenario === 'storage') file_put_contents($dir . '/confirmations.json', '{broken');
        $submission = $scenario === 'suppressed' ? array_replace($data, ['email' => 'no-reply@example.com']) : $data;
        $transport = function (...$args) use (&$calls, &$saved, $scenario): bool {
            $calls[] = $args;
            if (count($calls) === 1) return true;
            check(count($saved) >= 1 && $saved[0]['confirmation'] === 'unavailable', 'Acceptance checkpoint precedes confirmation attempt');
            if ($scenario === 'throws') throw new RuntimeException('Fake transport exception');
            return $scenario !== 'rejected';
        };
        $checkpoint = function ($id, $receipt) use (&$saved, $scenario): void {
            $saved[] = $receipt;
            if ($scenario === 'checkpoint' || ($scenario === 'final-checkpoint' && count($saved) === 2)) throw new RuntimeException('Fake persistence failure');
        };
        $result = contact_submit($submission, $receipts, $dir, 'visitor', 100000, $transport, $checkpoint);
        $state = in_array($scenario, ['accepted', 'final-checkpoint'], true) ? 'accepted' : ($scenario === 'suppressed' ? 'suppressed' : 'unavailable');
        check($result['ok'] && $result['status'] === 200 && $result['confirmation'] === $state, $scenario . ' secondary outcome never rejects an accepted inquiry');
        $count = count($calls);
        check($count === (in_array($scenario, ['storage', 'checkpoint', 'suppressed'], true) ? 1 : 2), $scenario . ' sends only the permitted emails');
        $retry = contact_submit($submission, $receipts, $dir, 'visitor', 100001, $transport, $checkpoint);
        check($retry['ok'] && count($calls) === $count, $scenario . ' identical retry sends neither email again');
        $changed = contact_submit(array_replace($submission, ['message' => 'Changed']), $receipts, $dir, 'visitor', 100002, $transport, $checkpoint);
        check(!$changed['ok'] && $changed['status'] === 409 && count($calls) === $count, $scenario . ' changed payload cannot reuse receipt');
        check((bool)preg_match('/^[A-F0-9]{12}$/D', $receipts[$data['request_id']]['reference']) && $receipts[$data['request_id']]['reference'] !== strtoupper(substr($data['request_id'], 0, 12)), 'Reference is server generated, not a reflected request ID');
    }
    $dir = $directory('studio-reject'); $receipts = []; $calls = 0;
    $rejected = contact_submit($data, $receipts, $dir, 'visitor', 100000, function () use (&$calls) { $calls++; return false; });
    check(!$rejected['ok'] && $rejected['status'] === 503 && !$receipts && $calls === 1 && !file_exists($dir . '/confirmations.json'), 'Rejected studio mail creates no receipt or confirmation');
    $dir = $directory('recipient');
    check(contact_reserve_confirmation($dir, 'Visitor@EXAMPLE.COM', 100000), 'First recipient reservation accepted');
    check(!contact_reserve_confirmation($dir, 'visitor@example.com', 100001), 'Recipient cap is case insensitive and shared across sessions/IPs');
    check(contact_reserve_confirmation($dir, 'visitor@example.com', 100900) && contact_reserve_confirmation($dir, 'visitor@example.com', 101800), 'Recipient cooldown expires');
    check(!contact_reserve_confirmation($dir, 'visitor@example.com', 102700), 'At most three confirmations per recipient per rolling day');
    check(contact_reserve_confirmation($dir, 'visitor@example.com', 188200), 'Recipient daily cap expires');
    check(!str_contains(file_get_contents($dir . '/confirmations.json'), 'visitor@'), 'Shared storage contains no raw recipient email');
    foreach ([HOTWIRE_TO, HOTWIRE_FROM, 'postmaster@example.com', 'mailer-daemon@example.com', 'no-reply+tag@example.com', 'bounces-test@example.com'] as $address) check(!contact_reserve_confirmation($dir, $address, 188201), 'Suppress loop-prone recipient ' . $address);
    $dir = $directory('global');
    for ($hour = 0; $hour < 4; $hour++) {
        for ($i = 0; $i < 50; $i++) if (!contact_reserve_confirmation($dir, "person-$hour-$i@example.com", 100000 + $hour * 3600)) throw new RuntimeException('Global allowance too small');
        check(!contact_reserve_confirmation($dir, "extra-$hour@example.com", 100001 + $hour * 3600), 'Global hourly cap at hour ' . $hour);
    }
    check(!contact_reserve_confirmation($dir, 'extra-day@example.com', 120000), 'Global daily cap bounds distinct recipients and file size');
    check(contact_reserve_confirmation($dir, 'next-day@example.com', 197200), 'Global daily cap and stale entries expire');
    check(count(json_decode(file_get_contents($dir . '/confirmations.json'), true)['recipients']) === 1, 'Expired recipient entries pruned on the next check');
} finally {
    foreach ($directories as $dir) {
        foreach (['requests.json', 'confirmations.json'] as $file) if (is_file($dir . '/' . $file)) unlink($dir . '/' . $file);
        rmdir($dir);
    }
    rmdir($root);
}
echo "PASS: $checks HTML-mail checks — localized confirmations, MIME, safe content, checkpoints, retries, and abuse limits. Fake transports only.\n";
