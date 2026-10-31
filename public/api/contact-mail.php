<?php
declare(strict_types=1);

// Email-safe HTML: inline styles, presentation tables, system fonts, no remote
// images, scripts, tracking, or dependency on the website's CSS/JavaScript.
function contact_mail_escape(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function contact_mail_lines(string $value): string
{
    return nl2br(contact_mail_escape(str_replace(["\r\n", "\r"], "\n", $value)), false);
}

function contact_mail_reference(string $reference): string
{
    if (!preg_match('/^[A-F0-9]{12}$/D', $reference)) throw new InvalidArgumentException('Invalid reference');
    return 'HW-' . implode('-', str_split($reference, 4));
}

function contact_mail_layout(string $title, string $preheader, string $eyebrow, string $content, string $locale): string
{
    $locale = contact_locale($locale);
    $e = fn(string $text) => contact_mail_escape($text);
    $t = fn(string $source) => contact_text($source, $locale);
    $home = 'https://hotwireinteractive.co.uk' . contact_path('/', $locale);
    $privacy = 'https://hotwireinteractive.co.uk' . contact_path('/privacy/', $locale);
    ob_start();
    ?>
<!doctype html>
<html lang="<?= $e($locale) ?>" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title><?= $e($title) ?></title>
  <style>
    body, table, td, a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
    table { border-collapse:collapse; }
    a:focus-visible { outline:3px solid #b93800; outline-offset:4px; }
    @media screen and (max-width:620px) {
      .email-outer { padding:16px 8px !important; }
      .email-pad { padding:24px 20px !important; }
      .email-title { font-size:28px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;width:100%;background-color:#f1f2ef;color:#222320;font-family:Arial,Helvetica,sans-serif;">
  <div aria-hidden="true" style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;"><?= $e($preheader) ?></div>
  <table role="presentation" width="100%" bgcolor="#f1f2ef" style="width:100%;background-color:#f1f2ef;">
    <tr><td class="email-outer" align="center" style="padding:40px 12px;">
      <!--[if mso]><table role="presentation" width="600" align="center"><tr><td><![endif]-->
      <table role="presentation" width="600" bgcolor="#ffffff" style="width:100%;max-width:600px;background-color:#ffffff;border:1px solid #dedfd9;">
        <tr><td class="email-pad" bgcolor="#111210" style="padding:28px 36px;background-color:#111210;border-top:4px solid #ff5d1b;">
          <a href="<?= $e($home) ?>" style="color:#ffffff;text-decoration:none;font-size:18px;line-height:1.5;font-weight:bold;letter-spacing:1px;"><span style="color:#ff905f;">HOTWIRE</span> INTERACTIVE</a>
          <p style="margin:6px 0 0;color:#c2c5bd;font-size:12px;line-height:1.6;"><?= $e($t('Independent studio · Belgium')) ?></p>
        </td></tr>
        <tr><td class="email-pad" style="padding:36px;word-break:break-word;overflow-wrap:anywhere;">
          <p style="margin:0 0 12px;color:#a33200;font-size:12px;line-height:1.6;letter-spacing:1.5px;font-weight:bold;text-transform:uppercase;"><?= $e($eyebrow) ?></p>
          <h1 class="email-title" style="margin:0 0 18px;color:#171814;font-size:34px;line-height:1.2;letter-spacing:-1px;font-weight:bold;"><?= $e($title) ?></h1>
          <?= $content ?>
        </td></tr>
        <tr><td class="email-pad" bgcolor="#f7f8f5" style="padding:22px 36px;background-color:#f7f8f5;border-top:1px solid #e4e6df;">
          <p style="margin:0;color:#50554b;font-size:12px;line-height:1.8;">Hotwire Interactive<br><a href="mailto:<?= $e(HOTWIRE_TO) ?>" style="color:#8b2c00;text-decoration:underline;word-break:break-all;"><?= $e(HOTWIRE_TO) ?></a></p>
          <p style="margin:10px 0 0;color:#50554b;font-size:12px;line-height:1.8;"><a href="<?= $e($home) ?>" style="color:#50554b;text-decoration:underline;">hotwireinteractive.co.uk</a> &nbsp;·&nbsp; <a href="<?= $e($privacy) ?>" style="color:#50554b;text-decoration:underline;"><?= $e($t('Privacy')) ?></a></p>
        </td></tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td></tr>
  </table>
</body>
</html>
    <?php
    return trim(ob_get_clean());
}

function contact_mail_field(string $label, string $html): string
{
    return '<tr><td style="padding:12px 16px;border-bottom:1px solid #e0e3db;word-break:break-word;overflow-wrap:anywhere;">'
        . '<p style="margin:0 0 4px;color:#565d50;font-size:12px;line-height:1.6;">' . contact_mail_escape($label) . '</p>'
        . '<p style="margin:0;color:#20251c;font-size:15px;line-height:1.7;">' . $html . '</p></td></tr>';
}

function contact_mail_studio(array $data, string $reference): array
{
    // Keep staff notifications in English; show the visitor's chosen reply language.
    $t = fn(string $source) => contact_text($source, 'en');
    $e = fn(string $value) => contact_mail_escape($value);
    $reference = contact_mail_reference($reference);
    $category = HOTWIRE_CATEGORIES[$data['category']];
    $language = HOTWIRE_LANGUAGES[contact_locale($data['locale'] ?? 'en')];
    $title = $t('A new inquiry.');
    $intro = $t('A new message from the website. Reply to this email to contact the visitor.');
    $consent = $t('The visitor agreed to the use of their details to respond to this inquiry.');
    $rows = contact_mail_field($t('Name / studio'), $e($data['name']));
    $rows .= contact_mail_field($t('Email address'), '<a href="mailto:' . $e(rawurlencode($data['email'])) . '" style="color:#8b2c00;text-decoration:underline;word-break:break-all;">' . $e($data['email']) . '</a>');
    $rows .= contact_mail_field($t('Inquiry type'), $e($category));
    $rows .= contact_mail_field($t('Preferred language'), $e($language));
    $rows .= contact_mail_field($t('Inquiry reference'), $e($reference));
    $content = '<p style="margin:0 0 24px;color:#50554b;font-size:15px;line-height:1.8;">' . $e($intro) . '</p>';
    $content .= '<table role="presentation" width="100%" bgcolor="#f3f5ef" style="width:100%;table-layout:fixed;background-color:#f3f5ef;border:1px solid #e0e3db;">' . $rows . '</table>';
    $plain = $title . "\n\n" . $intro . "\n\n" . $t('Name / studio') . ': ' . $data['name'] . "\n" . $t('Email address') . ': ' . $data['email'];
    $plain .= "\n" . $t('Inquiry type') . ': ' . $category . "\n" . $t('Preferred language') . ': ' . $language . "\n" . $t('Inquiry reference') . ': ' . $reference;
    foreach ([$t('Your message') => $data['message'], $t('Website quiz brief:') => $data['brief']] as $label => $value) {
        if ($value === '') continue;
        $content .= '<h2 style="margin:28px 0 12px;font-size:18px;line-height:1.4;color:#20251c;">' . $e($label) . '</h2>';
        $content .= '<p style="margin:0;font-size:15px;line-height:1.85;color:#353b2f;word-break:break-word;overflow-wrap:anywhere;">' . contact_mail_lines($value) . '</p>';
        $plain .= "\n\n" . $label . "\n" . $value;
    }
    $content .= '<p style="margin:28px 0 0;padding-top:18px;border-top:1px solid #e0e3db;color:#565d50;font-size:12px;line-height:1.8;">' . $e($consent) . '</p>';
    return ['subject' => $t('Hotwire inquiry: ') . $category, 'plain' => $plain . "\n\n" . $consent,
        'html' => contact_mail_layout($title, $intro, $t('Studio inquiry'), $content, 'en')];
}

function contact_mail_confirmation(string $locale, string $reference): array
{
    // No visitor name, message, brief, category, or links are reflected to an
    // unverified address. The reference is generated by the server, not the form.
    $locale = contact_locale($locale);
    $t = fn(string $source) => contact_text($source, $locale);
    $e = fn(string $value) => contact_mail_escape($value);
    $reference = contact_mail_reference($reference);
    $title = $t('Thanks for getting in touch.');
    $intro = $t('Your inquiry is on its way to our studio. Thank you for considering Hotwire Interactive.');
    $next = $t('We’ll review your request and reply by email. To add anything, simply reply to this message.');
    $notice = $t('This confirms an inquiry only, not a booking, agreement, or payment.');
    $automatic = $t('This automatic email follows a contact form submission. If you did not contact us, you can ignore it. You have not been subscribed to marketing.');
    $content = '<p style="margin:0 0 24px;color:#50554b;font-size:16px;line-height:1.8;">' . $e($intro) . '</p>';
    $content .= '<table role="presentation" width="100%" bgcolor="#f3f5ef" style="width:100%;table-layout:fixed;background-color:#f3f5ef;border:1px solid #e0e3db;">'
        . contact_mail_field($t('Inquiry reference'), '<strong style="font-family:Consolas,monospace;font-size:17px;letter-spacing:1px;">' . $e($reference) . '</strong>') . '</table>';
    $content .= '<h2 style="margin:28px 0 12px;color:#20251c;font-size:18px;line-height:1.4;">' . $e($t('What happens next')) . '</h2>';
    $content .= '<p style="margin:0;color:#353b2f;font-size:15px;line-height:1.85;">' . $e($next) . '</p>';
    $content .= '<p style="margin:24px 0;color:#565d50;font-size:13px;line-height:1.8;">' . $e($notice) . '</p>';
    $content .= '<p style="margin:0 0 28px;font-size:15px;line-height:1.8;"><a href="mailto:' . $e(HOTWIRE_TO) . '" style="display:inline-block;padding:12px 20px;background-color:#ff5d1b;border:1px solid #d34309;color:#171814;font-weight:bold;text-decoration:none;">' . $e($t('Contact the studio')) . '</a></p>';
    $content .= '<p style="margin:0;padding-top:18px;border-top:1px solid #e0e3db;color:#565d50;font-size:12px;line-height:1.8;">' . $e($automatic) . '</p>';
    $plain = $title . "\n\n" . $intro . "\n\n" . $t('Inquiry reference') . ': ' . $reference;
    $plain .= "\n\n" . $t('What happens next') . "\n" . $next . "\n\n" . $notice . "\n\n" . $t('Contact the studio') . ': ' . HOTWIRE_TO;
    $plain .= "\n\n" . $automatic . "\n\nHotwire Interactive\nhttps://hotwireinteractive.co.uk" . contact_path('/', $locale);
    $plain .= "\n" . $t('Privacy') . ': https://hotwireinteractive.co.uk' . contact_path('/privacy/', $locale);
    return ['subject' => $t('Your inquiry | Hotwire Interactive'), 'plain' => $plain,
        'html' => contact_mail_layout($title, $t('Thank you for contacting Hotwire Interactive. This is your inquiry confirmation.'), $t('Inquiry confirmation'), $content, $locale)];
}

function contact_mail_subject(string $subject): string
{
    if (preg_match('/[\x00-\x1f\x7f]/', $subject)) throw new InvalidArgumentException('Invalid subject');
    if (!preg_match('/[^\x20-\x7e]/', $subject)) return $subject;
    // RFC 2047 words stay below 75 bytes and never split a UTF-8 character.
    $words = [];
    $chunk = '';
    foreach (preg_split('//u', $subject, -1, PREG_SPLIT_NO_EMPTY) as $character) {
        if (strlen($chunk . $character) > 42) { $words[] = '=?UTF-8?B?' . base64_encode($chunk) . '?='; $chunk = ''; }
        $chunk .= $character;
    }
    if ($chunk !== '') $words[] = '=?UTF-8?B?' . base64_encode($chunk) . '?=';
    return implode("\r\n ", $words);
}

function contact_mail_send(string $to, array $message, string $replyTo, string $locale, bool $confirmation, callable $transport): bool
{
    foreach ([$to, $replyTo] as $address) {
        if (!filter_var($address, FILTER_VALIDATE_EMAIL) || preg_match('/[\x00-\x20\x7f]/', $address)) throw new InvalidArgumentException('Invalid address');
    }
    $boundary = '=_hotwire_' . bin2hex(random_bytes(18));
    $body = '';
    foreach (['text/plain' => $message['plain'], 'text/html' => $message['html']] as $type => $part) {
        $part = preg_replace('/\r\n|\r|\n/', "\r\n", $part);
        $body .= '--' . $boundary . "\r\nContent-Type: " . $type . "; charset=UTF-8\r\nContent-Transfer-Encoding: quoted-printable\r\n\r\n" . quoted_printable_encode($part) . "\r\n";
    }
    $body .= '--' . $boundary . "--\r\n";
    $headers = [
        'From' => ($confirmation ? 'Hotwire Interactive' : 'Hotwire website') . ' <' . HOTWIRE_FROM . '>',
        'Reply-To' => $replyTo,
        'MIME-Version' => '1.0',
        'Content-Type' => 'multipart/alternative; boundary="' . $boundary . '"',
        'Content-Language' => contact_locale($locale),
        'Auto-Submitted' => $confirmation ? 'auto-replied' : 'auto-generated',
        'X-Auto-Response-Suppress' => 'All',
    ];
    return $transport($to, contact_mail_subject($message['subject']), $body, $headers);
}

function contact_deliver(array $data, callable $transport, string $reference): bool
{
    return contact_mail_send(HOTWIRE_TO, contact_mail_studio($data, $reference), $data['email'], 'en', false, $transport);
}

function contact_deliver_confirmation(array $data, callable $transport, string $reference): bool
{
    $locale = contact_locale($data['locale'] ?? 'en');
    return contact_mail_send($data['email'], contact_mail_confirmation($locale, $reference), HOTWIRE_TO, $locale, true, $transport);
}
