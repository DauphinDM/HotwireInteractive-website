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

The endpoint uses the host's PHP `mail()` transport with a fixed sender `website@hotwireinteractive.co.uk` and recipient `contact@hotwireinteractive.co.uk`. Configure/authorize that sender with your host, enable SPF/DKIM and check DMARC alignment, then send one live test and verify inbox/spam delivery. No SMTP password is stored in this repository. Mail-server acceptance is not a guarantee of inbox delivery.

PHP needs working sessions and a writable system temporary directory for the locked rate-limit file. It stores hashed client identifiers and attempt times, not message content. Limits are five attempts per IP per 15 minutes and 100 total per hour. Add host-level abuse protection if needed. CSRF, consent, length/type validation, a honeypot, and per-session request IDs protect the endpoint; no attachments are accepted.

For local PHP testing after building, run `php -S 127.0.0.1:8080 -t dist` and open port 8080. Run `npm run test:php` to lint PHP, check server validation and simulated mail delivery, and exercise a real local HTTP endpoint (sessions, CSRF, errors, escaping, native-form recovery, and blocked uploads). These tests never send real email. PHP must be on PATH, or set `PHP_BINARY` to its executable. Browser tests mock mail API responses; only a live hosting test verifies delivery.

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
- Send an inquiry through PHP; verify receipt at the studio address, safe Reply-To, failure feedback, retained fields, and duplicate-submit protection. “Copy message” remains a fallback.
- Complete the website-fit quiz, revise an answer, and attach the result to a contact inquiry. Confirm previously entered contact details are preserved.
- Test a social preview after publication; services may cache the old image or metadata.
- Verify live redirect, caching, and compression headers with your hosting tools. Local browser tests cannot verify the production web server configuration.
