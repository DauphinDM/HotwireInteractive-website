<?php
// contact.php — Hotwire Interactive contact form handler
// Sends form submissions to contact@hotwireinteractive.co.uk

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$name = filter_input(INPUT_POST, 'name', FILTER_SANITIZE_SPECIAL_CHARS);
$email = filter_input(INPUT_POST, 'email', FILTER_VALIDATE_EMAIL);
$category = filter_input(INPUT_POST, 'category', FILTER_SANITIZE_SPECIAL_CHARS);
$message = filter_input(INPUT_POST, 'message', FILTER_SANITIZE_SPECIAL_CHARS);

if (!$name || !$email || !$message) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Missing required fields']);
    exit;
}

$to = 'contact@hotwireinteractive.co.uk';
$subject = "Hotwire Interactive: {$category} from {$name}";
$body = "Name / studio: {$name}\nEmail: {$email}\nInquiry type: {$category}\n\n{$message}";
$headers = [
    "From: Hotwire Interactive <contact@hotwireinteractive.co.uk>",
    "Reply-To: {$email}",
    "Content-Type: text/plain; charset=UTF-8",
];

if (mail($to, $subject, $body, implode("\r\n", $headers))) {
    http_response_code(200);
    header('Content-Type: application/json');
    echo json_encode(['success' => true, 'message' => 'Message sent']);
} else {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Failed to send email']);
}
