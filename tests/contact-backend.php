<?php
declare(strict_types=1);
require __DIR__ . '/../public/api/contact-lib.php';
function check(bool $value, string $label): void { if (!$value) throw new RuntimeException($label); echo "PASS: $label\n"; }
$valid = ['name' => 'Zoë & Studio', 'email' => 'zoe@example.com', 'category' => 'website', 'message' => 'A new site 🎮', 'brief' => '', 'consent' => '1', 'company_url' => '', 'request_id' => str_repeat('a', 32)];
[$clean] = contact_validate($valid);
check($clean !== null, 'Unicode inquiry accepted');
check($clean['locale'] === 'en', 'Existing clients default to English');
check(contact_validate(array_replace($valid, ['locale' => 'fr']))[0]['locale'] === 'fr', 'French communication preference accepted');
check(contact_validate(array_replace($valid, ['locale' => 'xx']))[0] === null, 'Reject unsupported language');
foreach ([['email', "a@example.com\r\nBcc: victim@example.com"], ['name', "Name\nBcc: injected"], ['consent', ''], ['category', 'invalid'], ['company_url', 'spam'], ['message', str_repeat('x', 1501)], ['email', ['bad']], ['brief', str_repeat('x', 12001)]] as [$key, $value]) {
    check(contact_validate(array_replace($valid, [$key => $value]))[0] === null, 'Reject invalid ' . $key);
}
check(contact_validate(array_replace($valid, ['message' => '', 'brief' => 'Automatically generated project brief']))[0] !== null, 'Quiz brief needs no additional message');
check(contact_validate(array_replace($valid, ['message' => '']))[0] === null, 'Empty inquiry rejected');
$captured = [];
check(contact_deliver($clean, function (...$args) use (&$captured) { $captured = $args; return true; }, 'A1B2C3D4E5F6'), 'Transport acceptance returned');
check($captured[0] === HOTWIRE_TO && $captured[3]['From'] === 'Hotwire website <' . HOTWIRE_FROM . '>', 'Recipient and sender cannot be supplied by visitor');
check($captured[3]['Reply-To'] === $valid['email'] && str_contains(quoted_printable_decode($captured[2]), '🎮'), 'Safe reply-to and UTF-8 content');
check(!contact_deliver($clean, fn() => false, 'A1B2C3D4E5F6'), 'Transport rejection is not success');
$receipts = [$clean['request_id'] => ['at' => 10000, 'hash' => contact_payload_hash($clean)]];
check(contact_receipt_status($receipts, $clean, 10001) === 'same', 'Identical retry reuses an existing receipt');
check(contact_receipt_status($receipts, array_replace($clean, ['message' => 'A different inquiry']), 10001) === 'changed', 'Edited retry is not acknowledged as the old inquiry');
check(contact_receipt_status($receipts, array_replace($clean, ['locale' => 'de']), 10001) === 'changed', 'Language change is not acknowledged as a different payload');
check(contact_receipt_status($receipts, $clean, 14000) === 'missing', 'Old receipts expire');
check(contact_receipt_status([$clean['request_id'] => 10000], $clean, 10001) === 'missing', 'Legacy receipt cannot acknowledge unverified content');
$dir = sys_get_temp_dir() . '/hotwire-backend-test-' . bin2hex(random_bytes(8));
try {
    for ($i = 0; $i < 5; $i++) check(contact_rate_limit($dir, 'client', 10000 + $i), 'Rate slot ' . $i);
    check(!contact_rate_limit($dir, 'client', 10005), 'Sixth attempt blocked across sessions');
    check(contact_rate_limit($dir, 'client', 11000), 'Rate limit expires');
    check(contact_rate_limit($dir, 'other', 11000), 'Independent visitor accepted');
} finally { if (is_file($dir . '/requests.json')) unlink($dir . '/requests.json'); if (is_dir($dir)) rmdir($dir); }
