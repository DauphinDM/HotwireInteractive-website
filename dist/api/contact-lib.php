<?php
declare(strict_types=1);

const HOTWIRE_TO = 'contact@hotwireinteractive.co.uk';
const HOTWIRE_FROM = 'website@hotwireinteractive.co.uk';
const HOTWIRE_CATEGORIES = [
    'website' => 'Website project', 'studio' => 'Studio inquiry', 'press' => 'Press & media',
    'collaboration' => 'Creative collaboration', 'other' => 'General inquiry',
];

function contact_validate(array $input): array
{
    $limits = ['name' => 100, 'email' => 254, 'category' => 30, 'message' => 1500, 'brief' => 12000, 'consent' => 1, 'company_url' => 200, 'request_id' => 32];
    $clean = [];
    foreach ($limits as $key => $limit) {
        $value = $input[$key] ?? '';
        if (!is_string($value) || !preg_match('//u', $value) || preg_match_all('/./us', $value) > $limit || strpos($value, "\0") !== false) {
            return [null, 'One of the fields is invalid or too long. Please check your inquiry.'];
        }
        $clean[$key] = trim($value);
    }
    if ($clean['company_url'] !== '') return [null, 'We could not verify this inquiry. Please email the studio directly.'];
    if ($clean['name'] === '' || preg_match('/[\r\n\x00-\x1f\x7f]/', $clean['name'])) return [null, 'Please enter your name or studio on one line.'];
    if (!filter_var($clean['email'], FILTER_VALIDATE_EMAIL) || preg_match('/[\r\n]/', $clean['email'])) return [null, 'Please enter a valid email address.'];
    if (!isset(HOTWIRE_CATEGORIES[$clean['category']])) return [null, 'Please choose a valid inquiry type.'];
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
    foreach (['name', 'email', 'category', 'message', 'brief', 'consent'] as $field) $payload[$field] = $data[$field];
    return hash('sha256', json_encode($payload, JSON_THROW_ON_ERROR));
}

function contact_receipt_status(array $receipts, array $data, int $now): string
{
    $receipt = $receipts[$data['request_id']] ?? null;
    if (!is_array($receipt) || !is_int($receipt['at'] ?? null) || $receipt['at'] <= $now - 3600 || !is_string($receipt['hash'] ?? null)) return 'missing';
    return hash_equals($receipt['hash'], contact_payload_hash($data)) ? 'same' : 'changed';
}

function contact_deliver(array $data, callable $transport): bool
{
    $body = "Name / studio: {$data['name']}\r\nEmail: {$data['email']}\r\nInquiry type: " . HOTWIRE_CATEGORIES[$data['category']] . "\r\n\r\n" . $data['message'];
    if ($data['brief'] !== '') $body .= "\r\n\r\nWebsite quiz brief:\r\n" . $data['brief'];
    $body .= "\r\n\r\nThe visitor agreed to the use of their details to respond to this inquiry.";
    $headers = [
        'From' => 'Hotwire website <' . HOTWIRE_FROM . '>',
        'Reply-To' => $data['email'],
        'MIME-Version' => '1.0',
        'Content-Type' => 'text/plain; charset=UTF-8',
        'Content-Transfer-Encoding' => 'quoted-printable',
    ];
    return $transport(HOTWIRE_TO, 'Hotwire inquiry: ' . HOTWIRE_CATEGORIES[$data['category']], quoted_printable_encode($body), $headers);
}
