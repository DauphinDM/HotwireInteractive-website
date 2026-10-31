# HTML inquiry emails — 31 October 2026

## Implemented

- `public/api/contact-mail.php`: matching clean HTML templates for the **studio inquiry** and **client confirmation**. Dark Hotwire masthead, orange accents, quiet white content, a server-generated reference, and clear contact/privacy footer. Inline styling, presentation tables, 600px maximum width with mobile padding, and Outlook conditional wrapper. No JavaScript, external CSS/fonts/images, or tracking.
- Both messages are **UTF-8 `multipart/alternative`**, plain text first and HTML last, with independent quoted-printable encoding, CRLF line endings, random boundaries, and RFC 2047 encoding when the fixed subject needs it.
- Studio notifications remain English and include the visitor's name/email, allowlisted category, message/optional brief, preferred reply language, consent statement, and reference. All visitor content is HTML-escaped. Replies go to the validated visitor address.
- Confirmations use the submitted EN/NL/FR/DE locale and matching server-generated reference. They **do not echo the name, email, category, message, brief, or visitor links** to an unverified address. Replies go to the studio. They explain next steps, contain no deadline promise, and are explicitly not booking/agreement/payment/kickoff confirmation or marketing.
- The fixed sender `website@hotwireinteractive.co.uk`, studio recipient `contact@hotwireinteractive.co.uk`, and four-argument PHP `mail()` transport are retained. The client-facing sender display name is Hotwire Interactive. No SMTP credentials, provider, paid dependency, envelope-sender override, or DNS change was introduced. Root legacy `contact.php` is unchanged.

## Delivery and retries

`contact.php` is the production transport entrypoint. `contact-handler.php` holds the HTTP/session/native-form path; `contact-lib.php` validates and orchestrates both messages. The test router is **outside public/dist** and injects only fake transports; production has no HTTP/environment switch for fake delivery.

1. Preserve CSRF, consent, honeypot, length/type/category/locale validation, size limit, no attachments, per-IP/global inquiry limits, and receipt/payload checks.
2. A same-session, identical request ID + payload reuses the one-hour receipt. An altered payload using that receipt receives 409. It sends neither email again, even if the original confirmation status is unknown or failed.
3. Generate a fresh reference on the server and attempt the studio message. A false studio transport result returns failure; no confirmation or acceptance receipt is created.
4. On studio acceptance, checkpoint the receipt to the PHP session with conservative `unavailable` confirmation status **before** attempting the secondary email. Release the session lock while that email is attempted. Merge the final status back without overwriting other inquiry receipts.
5. Reserve a confirmation allowance before attempting transport; even a rejected/unknown attempt consumes it. Save the final `accepted`, `unavailable`, or `suppressed` status. Both JavaScript and native forms report inquiry acceptance separately from this secondary result. JavaScript keeps typed fields and disables duplicate sends; feedback still translates on a language switch.

No automatic secondary retries, queue, background worker, or inbox delivery check exists. PHP `mail() === true` means accepted for delivery, not delivered/read. If the first receipt checkpoint fails, keep inquiry success and skip confirmation; log only a generic message. If final status persistence fails, the first receipt still records acceptance with conservative unknown confirmation state.

**Crash/storage boundary:** this is not transactional exactly-once email. A process/host failure between studio acceptance and the first successful receipt write, lost/expired session storage, changed form/request IDs, or a new browser session can permit another studio inquiry. Confirmation limits are shared across sessions, but do not verify address ownership or fully replace host-level abuse protection. Do not blindly resend after an unknown result; check host logs and studio inbox. Preserve working sessions and private writable storage.

## Automatic-response protection and retention

- Inquiries: unchanged five attempts/IP/15 minutes and 100 total/hour.
- Confirmations: one attempt/address/15 minutes; three/address/rolling 24 hours; 50 globally/hour; 200 globally/rolling 24 hours. Lowercase recipient comparison is deliberately conservative. These are attempt bounds, not guaranteed deliveries.
- Never confirm to the studio/sender address or common postmaster, mailer-daemon, bounce, or no-reply local parts. Use `Auto-Submitted` and `X-Auto-Response-Suppress: All` headers; keep the existing host's envelope/bounce handling unchanged.
- `confirmations.json` is locked in the existing private temporary storage directory outside the web root. It contains keyed recipient hashes, timestamps, and a private random HMAC key, no raw emails, names, or messages. It is pseudonymised security data, not anonymous data. At most 200 daily allowed attempts bound ordinary active growth.
- Prune expired recipient entries on the next confirmation check, not a scheduler. An idle file can physically remain until host cleanup. PHP session expiry, mailbox/provider log retention, backups, and any stricter deletion schedule remain host/operator responsibilities. The updated privacy notice states these limits; no new browser cookie/storage is used.

## Copy and legal boundaries

All 25 new source keys have manually curated NL/FR/DE values (je/jouw, vous/votre, Sie/Ihr). Two replaced success keys were retired: **981 source messages**, **587 curated messages** now remain. The extractor reads only explicit copy calls in the HTML template, avoiding CSS/markup extraction. New copy received a meaning/register review and opt-in LanguageTool checks of public fixed text only; no private data was sent. This is not native-speaker or legal signoff.

The privacy notice's update date is 31 October 2026. It discloses transactional confirmation, omitted private content, keyed recipient records, and retention/cleanup limits. The original agreement remains a review draft. Registration/VAT/operator details are not fabricated; signing, cleared-deposit checks, and written project kickoff remain independent and manual.

## Verification and previews

- Production preparation/build and catalogue fidelity checks: passed.
- PHP lint/library/HTTP mock tests: passed. Includes both MIME alternatives, Unicode subjects, escaping, headers, locale/privacy URLs, optional/brief-only content, server references, accepted/rejected/throwing secondary transport, persisted receipts, rejected studio delivery, cooldown/daily/global caps, role suppression, and corruption/persistence failures. **No real mail sent.**
- Email layout run: **18 phone/desktop layout/accessibility checks** across six fictional fixtures (studio, four locale confirmations, and hostile/long input). Also tests removal of style blocks and zero external requests. Reviewed phone and desktop screenshots. This is Chromium evidence, not an Outlook/Gmail/Apple Mail certification.
- Final Node unit suite: **26 passed**. Full website browser regression: **307 passed (2.4 minutes)**, including confirmation feedback, language switching without losing accepted state/private fields, and the updated privacy date/disclosures. The first full run caught the old hard-coded privacy-date expectation; it was updated to match the intentionally revised notice, then the complete suite passed.
- PHP mail suite: **143 mail assertions passed**, alongside existing validation/rate tests, six PHP lint checks, and capture-only HTTP integration tests. Expected generic logs in forced-failure cases do not indicate live delivery attempts.
- Optional standard-library Python translation-tool regression: **1 passed**.
- LanguageTool: final cache/digests match **981/981 rendered messages per language**. Reviewed the new-copy findings: corrected the Dutch recipient-address compound and made the French marketing sentence gender-neutral. Remaining new suggestions concern the Hotwire brand. Current total residual suggestions are **268 nl**, **187 fr**, **205 de**; this is not a zero-warning claim.
- Fresh built copies of all four API files and all four dictionaries match source; no test router/preview assets enter the deployed API. `git diff --check` passed. No real mail, commit, push, or deployment.

```sh
# PHP 8.2+ on PATH, or set PHP_BINARY to its executable.
npm run preview:emails -- PRIVATE_OUTPUT_DIRECTORY
npm run test:php
npm run test:emails
```

The private preview directory receives fictional `.html`/`.txt` examples; never upload it. Layout screenshots are under ignored `test-results/emails/`. The fixture renderer never calls transport. `test:php` serves a local capture-only router on 127.0.0.1 and deletes only its own temporary test directory. Running the actual `dist/api/contact.php` under a PHP server is **not** capture-only: successful submissions use real `mail()`.

## Research and live-host follow-up

- [RFC 2046 §5.1.4](https://www.rfc-editor.org/rfc/rfc2046#section-5.1.4): alternative ordering and multipart structure.
- [RFC 3834 §3.1](https://www.rfc-editor.org/rfc/rfc3834#section-3.1): automatic-response identification, loops, bounded recipients, and avoiding reflected arbitrary content. A web inquiry is not an incoming mail message, so incoming-mail header checks are not a substitute for form/rate controls.
- [Gmail supported CSS](https://developers.google.com/workspace/gmail/design/css): unsupported styles may be ignored; conservative inline/table layout is intentional.
- [PHP `mail()`](https://www.php.net/manual/en/function.mail.php): header/subject safety and acceptance-versus-delivery distinction.

Upload the **complete fresh build**, including all four API files and local translations; see `DEPLOY.md`. Preserve the owner's working sender authorization/mail transport and verify SPF/DKIM/DMARC results rather than reconfiguring blindly. Only after authorization, submit a single inquiry to an address you control and inspect studio + client inbox/spam, matching reference, Reply-To behaviour, actual client rendering, and non-duplicating retry feedback. No commit, push, deployment, or live delivery test was performed here.
