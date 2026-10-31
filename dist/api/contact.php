<?php
declare(strict_types=1);
require_once __DIR__ . '/contact-handler.php';

contact_handle(fn($to, $subject, $body, $headers) => @mail($to, $subject, $body, $headers));
