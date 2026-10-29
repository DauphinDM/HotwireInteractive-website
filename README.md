# Hotwire Interactive

A small, accessible, multi-page site for Hotwire’s **website design/development services and independent studio projects**. Built with semantic HTML, Tailwind CSS, vanilla JavaScript, and Vite. The canonical production origin is **https://hotwireinteractive.co.uk**.

## Local development

Use Node.js 22 LTS (or Node 20.19+) and npm.

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:5173`. To test on another device on your network, explicitly opt in with `npm run dev -- --host 0.0.0.0`.

On Windows network shares, run from a mapped drive: npm’s default script shell and Vite do not handle UNC working directories reliably. If the share is already mapped as `M:`, use `npm --prefix "M:\HotwireInteractiveWEBSITE" run build` (and the same prefix for `ci`, `run dev`, or `test`).

## Build and verify

```sh
npm run build
npm run preview
npm run test:browser:install
npm run test:unit
npm run test:php    # Requires PHP 8.2+; no real email is sent
npm test
```

Browser tests serve the **built `dist/` site** on port 4173. They cover all public pages, mobile layouts, keyboard navigation, accessibility, contact drafts, quiz branches, answer revision, contact-brief attachment, copy fallbacks, reduced motion, and JavaScript-disabled browsing. Unit tests exercise all 162 quiz-answer combinations. Rebuild before running browser tests after changes. Screenshots and failure traces are saved in `test-results/`.

To test with an installed Chrome or Edge browser instead of downloading Chromium, set `PLAYWRIGHT_CHANNEL=chrome` or `PLAYWRIGHT_CHANNEL=msedge` in your shell before `npm test`.

## Structure

- `index.html` — hero, studio introduction, and contact composer
- `websites/index.html` — website services and the website-fit quiz
- `privacy/index.html`, `terms/index.html`, `cookies/index.html` — privacy, website-use terms, and cookies/storage notices
- `team/index.html` — team overview
- `team/dauphindm/index.html`, `team/liamvl/index.html` — public profiles
- `404.html` — recovery page for missing URLs
- `src/css/style.css` — shared responsive design and accessibility styles
- `src/js/site.js` — shared navigation and year display
- `src/js/contact.js` — local-only email draft composition and copy fallback
- `src/js/website-quiz.js` — accessible quiz state, navigation, and contact hand-off
- `src/js/websites.js` — services-page initialization
- `src/js/quiz-handoff.js` — one-use, same-tab transfer of quiz answers to the contact composer
- `src/js/website-recommendation.js` — questions, recommendation rules, and brief generation
- `DESIGN.md` — company offerings, design decisions, and reviewed GitHub skill sources
- `public/` — static branding, crawler files, and Apache/LiteSpeed configuration
- `tests/` — browser regressions, recommendation rules, and email-encoding checks

## Website-fit quiz

At `/websites/#website-quiz`, visitors answer four questions about their goal, content size, editing needs, and launch priority. Results cover a landing page, business site, portfolio, online shop, booking site, content-led site, or web application. Results explain the recommendation and provide a starting structure, editing approach, and launch scope.

The finder is deterministic and runs entirely in the browser. It needs no API key, email address, or sign-up. Answers are held in memory until the visitor chooses “Discuss this website”. That action transfers only the four answers through same-tab session storage to the homepage contact composer, then removes them from storage. Unused transfers expire after ten minutes. Names, email addresses, and messages are never stored. If storage is blocked, the quiz offers a selected, copyable brief rather than silently losing it. “Remove recommendation” detaches only the brief, keeping contact details and message text.

Edit questions and recommendation copy in `src/js/website-recommendation.js`. After changing rules, run both the unit tests and quiz browser tests. Quotes and timelines are intentionally left for an actual conversation.

## Social artwork

`public/social-websites.png` is the current 1200×630 social preview. Its editable source is `public/social-websites.svg`. After editing the SVG, run `npm run build:social` with a Playwright browser installed (or `PLAYWRIGHT_CHANNEL=msedge`/`chrome`), then rebuild the site. The generated PNG is included with the other public artwork, so ordinary builds do not need a browser.

## Contact behaviour

Pages are statically built, with a **PHP 8.2+ contact endpoint** at `public/api/contact.php` (copied to `dist/api/`). The form sends directly through the host's mail transport; no email app is required. It validates a session CSRF token, consent, field lengths/types, a honeypot, and rate limits. A successful response means the mail server accepted the inquiry, not guaranteed inbox delivery. Fields remain available, and copying is a fallback. Without JavaScript, the endpoint provides a server-rendered form. See `DEPLOY.md` for sender authorization and live-delivery checks.

The quiz generates two separate outputs: a plain-language website description for the visitor and a detailed inquiry brief for the studio. “Discuss this website” attaches the latter automatically; only name, email, and consent are then required. Extra notes are optional. Names, email addresses, and messages are never written to browser storage.

Typography uses Space Grotesk headings and Manrope body text. Page/section entrances, quiz transitions, menu opening, and hover feedback use lightweight finite animations. Reduced-motion preferences disable them, and no content depends on animation or JavaScript to remain readable.

## Publishing

The legal pages are linked from every footer and from both contact-form variants. They describe the current PHP contact service, quiz storage, and remote font requests. **Review `LEGAL-REVIEW.md` before publishing:** verified operator registration/address details, provider arrangements, retention periods, and legal review are still owner tasks. Website-use terms do not replace a client service agreement.

See [DEPLOY.md](DEPLOY.md). Upload the complete contents of `dist/`, including the hidden `.htaccess` file. Deployments belong at the domain root, not a subdirectory. The current repository tracks build output; rebuild `dist/` whenever publishing source changes.
