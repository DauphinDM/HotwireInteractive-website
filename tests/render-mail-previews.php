<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
putenv('HOTWIRE_TRANSLATION_DIR=' . __DIR__ . '/../src/i18n/messages');
require __DIR__ . '/../public/api/contact-lib.php';

// Fictional fixtures only. This renders strings and never calls a transport.
$data = ['name' => 'Zoë & Example Studio', 'email' => 'zoe@example.com', 'category' => 'website', 'locale' => 'nl',
    'message' => "Hello Hotwire,\n\nWe’re planning a new website for our independent studio. We’d like a clear way to show our work and help new clients get in touch.\n\nCould we discuss the next steps?",
    'brief' => "Website recommendation\nBusiness website · Growth\n4–8 pages, with a CMS for occasional updates.\nIndicative build budget: €1,200–€2,500.\nDesign direction: Forma.\nScope and a final quote still need a conversation."];
$messages = ['studio-en' => contact_mail_studio($data, 'A1B2C3D4E5F6')];
foreach (array_keys(HOTWIRE_LANGUAGES) as $locale) $messages['confirmation-' . $locale] = contact_mail_confirmation($locale, 'A1B2C3D4E5F6');
$stress = array_replace($data, ['name' => str_repeat('VeryLongStudioName', 5), 'email' => str_repeat('long', 12) . '@example.com',
    'message' => "<img src=x onerror=alert(1)> & \"quotes\"\n" . str_repeat('LongWord', 180), 'brief' => str_repeat("Private brief with Unicode — €500 🎮\n", 150)]);
$messages['studio-stress'] = contact_mail_studio($stress, 'A1B2C3D4E5F6');
echo json_encode($messages, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
