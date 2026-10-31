# Deploying Hotwire Interactive

## Production destination

Canonical site: **https://hotwireinteractive.co.uk/**. For DirectAdmin, the usual document root is `/domains/hotwireinteractive.co.uk/public_html/`. Confirm the actual document root in your hosting panel.

The pages, social metadata, sitemap, and crawler configuration all use this origin. If changing the production domain, update those references together. The old `studio.hotwireinteractive.co.uk` hostname can redirect to the canonical site; its DNS, certificate, and virtual host must still be configured for visitors to reach the redirect.

## Build

Use Node.js 22 LTS (or Node 20.19+) and npm:

```sh
npm ci
npm run build
npm run test:unit
npm run test:browser:install
npm test
```

On Windows network shares, use a mapped drive. For example, when the share is mapped as `M:`, run `npm --prefix "M:\HotwireInteractiveWEBSITE" run build` and use the same prefix for the other npm commands. This avoids npm/Vite UNC working-directory issues.

The build produces:

```text
dist/
├── .htaccess
├── index.html
├── 404.html
├── privacy/index.html
├── terms/index.html
├── cookies/index.html
├── team/
│   ├── index.html
│   ├── dauphindm/index.html
│   └── liamvl/index.html
├── websites/
│   └── index.html
├── assets/                  # Fingerprinted CSS and JavaScript
├── favicon.svg
├── logo.svg
├── robots.txt
├── sitemap.xml
└── social-websites.png      # Plus editable SVG and legacy artwork
```

## Upload

### PHP contact service (required for sending inquiries)

Enable **PHP 8.2+** for this domain in DirectAdmin and upload the complete `dist/api/` directory. The form posts to `/api/contact.php`; Vite alone cannot execute PHP. Do not use a static-only host for this endpoint or expose PHP as downloadable source.

The endpoint retains the host's PHP `mail()` transport, fixed sender `website@hotwireinteractive.co.uk`, and studio recipient `contact@hotwireinteractive.co.uk`. The owner reports this setup is already configured: **preserve it**, do not redo credentials or send live tests without permission. The new flow submits an HTML/plain-text studio notification, then an HTML/plain-text confirmation to the validated visitor address. Replies to the notification go to the visitor; replies to the confirmation go to the studio. No SMTP password or new provider is introduced. PHP acceptance does not guarantee inbox delivery.

Upload **all four** current API files: `contact.php`, `contact-handler.php`, `contact-lib.php`, and `contact-mail.php`, plus fresh local `i18n/*.json` catalogues and assets. Deploy the complete fresh `dist/`, not just tracked changes: some built files are ignored despite older output being tracked. Template previews and test routers must never be uploaded.

PHP needs working sessions and a writable private system temporary directory for locked rate-limit files. Inquiry limits remain five attempts per IP per 15 minutes and 100 total per hour. Confirmation attempts are separately limited to one per recipient per 15 minutes, three per rolling 24 hours, 50 globally per hour, and 200 globally per rolling day. Those counts include rejected/unknown attempts. Studio/sender and common bounce/no-reply addresses are suppressed. `confirmations.json` stores keyed recipient hashes and timestamps, not raw addresses or inquiry text; its random HMAC key stays private. Expired entries are pruned on later checks; idle files need host cleanup if a strict physical deletion deadline is required. Review host-level abuse protection and retention. CSRF, consent, validation, a honeypot, and per-session receipts remain; no attachments are accepted.

Acceptance receipts are persisted before the confirmation attempt. Secondary failures still return inquiry success, with accurate confirmation feedback. Replays do not retry either email. This is not a durable mail queue or guaranteed exactly-once delivery across crashes, lost sessions, or the narrow mail-acceptance/receipt-write gap. Preserve session/rate storage and inspect generic host logs rather than resubmitting blindly. See `ai_here/email.md`.

For local PHP browsing after building, run `php -S 127.0.0.1:8080 -t dist` and open port 8080. **Do not submit successful inquiries on this production entrypoint unless real mail is authorized**; it uses `mail()`. `npm run test:php` instead uses fake transports and a test-only HTTP router outside deployed files, covering both emails, MIME, escaping, localization, receipts, retries, secondary failures, native success, and limits. `npm run test:emails` checks responsive/accessibility layouts and saves screenshots. `npm run preview:emails -- PRIVATE_OUTPUT_DIRECTORY` renders fictional HTML/plain-text samples. These commands never send real email. Set `PHP_BINARY` if PHP is not on PATH. Only an authorized live-host test verifies actual delivery/rendering.

Vite dev/preview intentionally returns a 503 JSON explanation for `/api/` rather than serving PHP source. This is expected: use the PHP server above to test actual form submissions. The backend rejects attachments and distinguishes a safe retry from a changed inquiry that accidentally reuses an old request ID.

1. Back up the currently deployed files and any server-specific `.htaccess` rules.
2. Enable HTTPS for `hotwireinteractive.co.uk` in DirectAdmin’s SSL settings. Enable certificates for any redirecting aliases too.
3. Upload the **contents** of `dist/` to the document root using SFTP or DirectAdmin File Manager. Include `.htaccess` (enable hidden-file visibility).
4. Upload new fingerprinted assets before the HTML that references them, or deploy the directory atomically. Retain prior hashed assets briefly for visitors with older HTML.
5. Merge any necessary hosting-specific rules into `.htaccess`. On TLS-terminating reverse proxies, use the host’s HTTPS redirect configuration to avoid redirect loops.

## Routing and caching

This is a **multi-page static site**, not a single-page application. Apache/LiteSpeed serves each directory’s `index.html`; do not rewrite arbitrary missing URLs to the homepage.

The supplied `.htaccess`:

- Redirects HTTP to HTTPS and the known `www`/`studio` aliases to the canonical hostname.
- Redirects legacy `/team.html` to `/team/`.
- Serves `/404.html` for missing URLs with a real HTTP 404 status.
- Revalidates HTML, caches fingerprinted CSS/JS for a year, and caches artwork for a day.
- Enables compression and basic response headers when the corresponding Apache modules are available.

Vite’s local preview does not execute Apache rules. If using another host, configure equivalent redirects, 404 handling, and cache headers in that host’s settings.

## Verify the deployment

- Complete the owner/legal checks in `LEGAL-REVIEW.md` before publishing the legal notices. Verify the live host's cookies, logs, providers, and retention against the published text.
- Open `/privacy/`, `/terms/`, and `/cookies/` directly; check all footer links and the notices beside the contact consent checkbox.

- Open `/`, `/team/`, and both profile pages directly and refresh each one.
- Check `/team.html` redirects and an unknown URL returns status 404 with the recovery page.
- Check `/robots.txt`, `/sitemap.xml`, and `/social-websites.png` load.
- Check keyboard navigation, the mobile menu, and the page at 320px width.
- With owner permission, send a single inquiry to an address you control; verify the HTML **and** plain-text studio mail, safe Reply-To, client confirmation in the selected language, matching reference, and inbox/spam placement. Check SPF/DKIM/DMARC results without replacing working configuration. Inspect Gmail/Outlook/Apple Mail where available. Retry the same request and confirm neither email is duplicated; an intentionally suppressed/unavailable confirmation must still show inquiry success. “Copy message” remains a plain-text fallback, not an HTML-send route.
- Complete the website-fit quiz, revise an answer, and attach the result to a contact inquiry. Confirm previously entered contact details are preserved.
- Test a social preview after publication; services may cache the old image or metadata.
- Verify live redirect, caching, and compression headers with your hosting tools. Local browser tests cannot verify the production web server configuration.
