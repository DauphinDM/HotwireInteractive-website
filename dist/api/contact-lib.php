<?php
declare(strict_types=1);

const HOTWIRE_TO = 'contact@hotwireinteractive.co.uk';
const HOTWIRE_FROM = 'website@hotwireinteractive.co.uk';
const HOTWIRE_CATEGORIES = [
    'website' => 'Website project', 'studio' => 'Studio inquiry', 'press' => 'Press & media',
    'collaboration' => 'Creative collaboration', 'other' => 'General inquiry',
];
const HOTWIRE_LANGUAGES = ['en' => 'English', 'nl' => 'Nederlands', 'fr' => 'Français', 'de' => 'Deutsch'];
const HOTWIRE_CONFIRMATION_MESSAGES = [
    'accepted' => 'Your inquiry has been accepted by our mail server. A confirmation email has also been accepted for delivery to your address.',
    'unavailable' => 'Your inquiry has been accepted by our mail server. A confirmation email may not arrive, but you do not need to send your inquiry again.',
    'suppressed' => 'Your inquiry has been accepted by our mail server. No additional confirmation email was sent for this address. You do not need to send your inquiry again.',
];

require_once __DIR__ . '/contact-mail.php';

function contact_locale($value): string
{
    return is_string($value) && isset(HOTWIRE_LANGUAGES[$value]) ? $value : 'en';
}

function contact_text(string $source, string $locale): string
{
    static $catalogues = [];
    $locale = contact_locale($locale);
    if ($locale === 'en') return $source;
    if (!isset($catalogues[$locale])) {
        // Only fixed, allowlisted locale codes reach this path. No network requests.
        $directory = getenv('HOTWIRE_TRANSLATION_DIR') ?: __DIR__ . '/../i18n';
        $file = $directory . '/' . $locale . '.json';
        $catalogues[$locale] = is_readable($file) ? (json_decode(file_get_contents($file), true) ?: []) : [];
    }
    return is_string($catalogues[$locale][$source] ?? null) && $catalogues[$locale][$source] !== '' ? $catalogues[$locale][$source] : $source;
}

function contact_path(string $path, string $locale): string
{
    return ($locale === 'en' ? '' : '/' . contact_locale($locale)) . $path;
}

function contact_validate(array $input): array
{
    $limits = ['name' => 100, 'email' => 254, 'category' => 30, 'message' => 1500, 'brief' => 12000, 'consent' => 1, 'company_url' => 200, 'request_id' => 32, 'locale' => 2];
    $clean = [];
    foreach ($limits as $key => $limit) {
        $value = $input[$key] ?? ($key === 'locale' ? 'en' : '');
        if (!is_string($value) || !preg_match('//u', $value) || preg_match_all('/./us', $value) > $limit || strpos($value, "\0") !== false) {
            return [null, 'One of the fields is invalid or too long. Please check your inquiry.'];
        }
        $clean[$key] = trim($value);
    }
    if ($clean['company_url'] !== '') return [null, 'We could not verify this inquiry. Please email the studio directly.'];
    if ($clean['name'] === '' || preg_match('/[\r\n\x00-\x1f\x7f]/', $clean['name'])) return [null, 'Please enter your name or studio on one line.'];
    if (!filter_var($clean['email'], FILTER_VALIDATE_EMAIL) || preg_match('/[\r\n]/', $clean['email'])) return [null, 'Please enter a valid email address.'];
    if (!isset(HOTWIRE_CATEGORIES[$clean['category']])) return [null, 'Please choose a valid inquiry type.'];
    if (!isset(HOTWIRE_LANGUAGES[$clean['locale']])) return [null, 'Please choose a supported language.'];
    if ($clean['message'] === '' && $clean['brief'] === '') return [null, 'Please enter a message or include your quiz brief.'];
    if ($clean['consent'] !== '1') return [null, 'Please agree to the use of your details so we can respond.'];
    if (!preg_match('/^[a-f0-9]{32}$/D', $clean['request_id'])) return [null, 'Please reload the form and try again.'];
    return [$clean, ''];
}

// One locked file outside the web root, shared across sessions. No raw IPs or messages are stored.
function contact_rate_limit(string $directory, string $client, int $now): bool
{
    if (!is_dir($directory) && !@mkdir($directory, 0700, true) && !is_dir($directory)) throw new RuntimeException('Rate storage unavailable');
    $handle = @fopen($directory . '/requests.json', 'c+');
    if (!$handle) throw new RuntimeException('Rate storage unavailable');
    try {
        if (!flock($handle, LOCK_EX)) throw new RuntimeException('Rate storage unavailable');
        $raw = stream_get_contents($handle);
        $state = $raw === '' ? [] : json_decode($raw, true, 32, JSON_THROW_ON_ERROR);
        if (!is_array($state)) throw new RuntimeException('Rate storage invalid');
        $state = array_filter($state, fn($times) => is_array($times));
        foreach ($state as $key => $times) {
            $state[$key] = array_values(array_filter($times, fn($time) => is_int($time) && $time > $now - 3600));
            if (!$state[$key]) unset($state[$key]);
        }
        $recent = array_filter($state[$client] ?? [], fn($time) => $time > $now - 900);
        $total = array_sum(array_map('count', $state));
        if (count($recent) >= 5 || $total >= 100) return false;
        $state[$client][] = $now;
        $encoded = json_encode($state, JSON_THROW_ON_ERROR);
        rewind($handle);
        if (!ftruncate($handle, 0) || fwrite($handle, $encoded) !== strlen($encoded) || !fflush($handle)) throw new RuntimeException('Rate storage unavailable');
        return true;
    } finally {
        flock($handle, LOCK_UN);
        fclose($handle);
    }
}

function contact_payload_hash(array $data): string
{
    $payload = [];
    foreach (['name', 'email', 'category', 'message', 'brief', 'consent', 'locale'] as $field) $payload[$field] = $data[$field] ?? ($field === 'locale' ? 'en' : '');
    return hash('sha256', json_encode($payload, JSON_THROW_ON_ERROR));
}

function contact_receipt_status(array $receipts, array $data, int $now): string
{
    $receipt = $receipts[$data['request_id']] ?? null;
    if (!is_array($receipt) || !is_int($receipt['at'] ?? null) || $receipt['at'] <= $now - 3600 || !is_string($receipt['hash'] ?? null)) return 'missing';
    return hash_equals($receipt['hash'], contact_payload_hash($data)) ? 'same' : 'changed';
}

// Reserve before attempting an automatic confirmation, even if transport later
// rejects it. HMACs use a private random key, not guessable plain email hashes.
// No recipient addresses, names, or messages are written to this shared file.
function contact_reserve_confirmation(string $directory, string $email, int $now): bool
{
    $email = strtolower($email);
    $local = explode('@', $email)[0];
    if (in_array($email, [strtolower(HOTWIRE_FROM), strtolower(HOTWIRE_TO)], true)
        || preg_match('/^(?:mailer-daemon|postmaster|no-reply|noreply|do-not-reply|donotreply|bounces?)(?:[+._-].*)?$/D', $local)) return false;
    if (!is_dir($directory) && !@mkdir($directory, 0700, true) && !is_dir($directory)) throw new RuntimeException('Confirmation storage unavailable');
    $handle = @fopen($directory . '/confirmations.json', 'c+');
    if (!$handle) throw new RuntimeException('Confirmation storage unavailable');
    try {
        if (!flock($handle, LOCK_EX)) throw new RuntimeException('Confirmation storage unavailable');
        $raw = stream_get_contents($handle);
        $state = $raw === '' ? ['secret' => bin2hex(random_bytes(32)), 'recipients' => []] : json_decode($raw, true, 32, JSON_THROW_ON_ERROR);
        if (!is_array($state) || !is_string($state['secret'] ?? null) || !preg_match('/^[a-f0-9]{64}$/D', $state['secret']) || !is_array($state['recipients'] ?? null)) throw new RuntimeException('Confirmation storage invalid');
        foreach ($state['recipients'] as $key => $times) {
            $state['recipients'][$key] = is_array($times) ? array_values(array_filter($times, fn($time) => is_int($time) && $time > $now - 86400)) : [];
            if (!$state['recipients'][$key]) unset($state['recipients'][$key]);
        }
        $key = hash_hmac('sha256', $email, $state['secret']);
        $times = $state['recipients'][$key] ?? [];
        $daily = array_sum(array_map('count', $state['recipients']));
        $hourly = array_sum(array_map(fn($items) => count(array_filter($items, fn($time) => $time > $now - 3600)), $state['recipients']));
        $allowed = !array_filter($times, fn($time) => $time > $now - 900) && count($times) < 3 && $hourly < 50 && $daily < 200;
        if ($allowed) $state['recipients'][$key][] = $now;
        // Save pruning even when a reservation is refused. Idle files contain
        // expired timestamps until the next request or a host cleanup job.
        $encoded = json_encode($state, JSON_THROW_ON_ERROR);
        rewind($handle);
        if (!ftruncate($handle, 0) || fwrite($handle, $encoded) !== strlen($encoded) || !fflush($handle)) throw new RuntimeException('Confirmation storage unavailable');
        return $allowed;
    } finally {
        flock($handle, LOCK_UN);
        fclose($handle);
    }
}

function contact_confirmation_result(string $state): array
{
    $state = isset(HOTWIRE_CONFIRMATION_MESSAGES[$state]) ? $state : 'unavailable';
    return ['status' => 200, 'ok' => true, 'message' => HOTWIRE_CONFIRMATION_MESSAGES[$state], 'confirmation' => $state];
}

// One orchestration path for both native and JavaScript forms. The checkpoint
// durably records studio acceptance BEFORE attempting the secondary email.
function contact_submit(array $data, array &$receipts, string $directory, string $client, int $now, callable $transport, ?callable $checkpoint = null): array
{
    $receipts = array_filter($receipts, fn($receipt) => is_array($receipt) && is_int($receipt['at'] ?? null) && $receipt['at'] > $now - 3600);
    $status = contact_receipt_status($receipts, $data, $now);
    if ($status === 'same') return contact_confirmation_result($receipts[$data['request_id']]['confirmation'] ?? 'unavailable');
    if ($status === 'changed') return ['status' => 409, 'ok' => false, 'message' => 'This form was already sent with different contents. Please reload the form before sending a new inquiry.'];
    if (!contact_rate_limit($directory, $client, $now)) return ['status' => 429, 'ok' => false, 'message' => 'Too many inquiries have been sent recently. Please wait 15 minutes or email the studio directly.'];
    $reference = strtoupper(bin2hex(random_bytes(6)));
    $receipt = ['at' => $now, 'hash' => contact_payload_hash($data), 'reference' => $reference, 'confirmation' => 'unavailable'];
    if (!contact_deliver($data, $transport, $reference)) return ['status' => 503, 'ok' => false, 'message' => 'The mail server could not accept your inquiry. Please try again later or email us directly.'];
    $receipts[$data['request_id']] = $receipt;
    try {
        if ($checkpoint) $checkpoint($data['request_id'], $receipt);
    } catch (Throwable $error) {
        error_log('Hotwire contact: inquiry accepted; receipt persistence unavailable.');
        return contact_confirmation_result('unavailable');
    }
    // All secondary failures remain successful inquiries. Never retry either
    // email on a receipt replay, including when confirmation delivery is unknown.
    try {
        $state = contact_reserve_confirmation($directory, $data['email'], $now)
            ? (contact_deliver_confirmation($data, $transport, $reference) ? 'accepted' : 'unavailable')
            : 'suppressed';
    } catch (Throwable $error) {
        $state = 'unavailable';
    }
    if ($state === 'unavailable') error_log('Hotwire contact: inquiry accepted; confirmation unavailable.');
    $receipt['confirmation'] = $state;
    $receipts[$data['request_id']] = $receipt;
    try {
        if ($checkpoint) $checkpoint($data['request_id'], $receipt);
    } catch (Throwable $error) {
        // The first checkpoint already records acceptance; a replay may report
        // an unknown confirmation rather than falsely guaranteeing delivery.
        error_log('Hotwire contact: confirmation status could not be stored.');
    }
    return contact_confirmation_result($state);
}
