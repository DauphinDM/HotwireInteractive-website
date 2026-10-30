# Hotwire Interactive

A small, accessible, multi-page site for Hotwire’s **website design/development services and independent studio projects**. Built with semantic HTML, Tailwind CSS, vanilla JavaScript, and Vite. The canonical production origin is **https://hotwireinteractive.co.uk**.

## Local development

Use Node.js 22 LTS (or Node 20.19+) and npm.

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:5173`. To test on another device on your network, explicitly opt in with `npm run dev -- --host 0.0.0.0`.

Use the actual checkout, currently `D:\_HotwireInteractiveWEBSITE`. Do not substitute another drive based on an old handover note. For a future UNC network checkout, use its verified mapped drive because npm/Vite may not handle UNC working directories reliably.

## Build and verify

```sh
npm run build
npm run preview
npm run test:browser:install
npm run test:unit
npm run test:php    # Requires PHP 8.2+; no real email is sent
npm test
```

Browser tests serve the **built `dist/` site** on port 4173. They cover public pages and fictional demos, mobile layouts, keyboard navigation, accessibility, contact behaviour, quiz branches, template selection, print layout, copy fallbacks, reduced motion, and JavaScript-disabled browsing. Unit tests cover every quiz option, 1,000 deterministic mixed combinations, independent feature floors, budget mismatches, and payment rounding. Rebuild before running browser tests after changes. Screenshots, a sample draft PDF, and failure traces are saved in `test-results/`.

To test with an installed Chrome or Edge browser instead of downloading Chromium, set `PLAYWRIGHT_CHANNEL=chrome` or `PLAYWRIGHT_CHANNEL=msedge` in your shell before `npm test`.

## Structure

- `index.html` — hero, studio introduction, and contact composer
- `websites/index.html` — website services and the website-fit quiz
- `websites/pricing/index.html` — package tiers from €500
- `websites/examples/index.html` — template gallery
- `websites/examples/{local,portfolio,shop,booking}/index.html` — generated fictional design demos
- `scripts/render-examples.mjs` — source of the demo page content and shared shell; runs automatically before the production build
- `websites/agreement/index.html` — manual signing/deposit process and printable review draft
- `privacy/index.html`, `terms/index.html`, `cookies/index.html` — privacy, website-use terms, and cookies/storage notices
- `team/index.html` — team overview
- `team/dauphindm/index.html`, `team/liamvl/index.html` — public profiles
- `404.html` — recovery page for missing URLs
- `src/css/style.css` — shared responsive design and accessibility styles
- `src/js/site.js` — shared navigation and year display
- `src/i18n/` — language registry, local catalogues, in-place switching, and curated core translations
- `scripts/i18n-vite-plugin.mjs` — shared header enhancement, static translated routes, metadata, and sitemap generation
- `scripts/i18n.mjs` — extraction, translation checks, and optional offline draft generation
- `src/js/contact.js` — secure inquiry submission, local draft composition, and copy fallback
- `src/js/website-quiz.js` — accessible quiz state, navigation, and contact hand-off
- `src/js/websites.js` — services-page initialization
- `src/js/quiz-handoff.js` — one-use, same-tab transfer of quiz answers to the contact composer
- `src/js/website-recommendation.js` — questions, recommendation rules, pricing tiers, and brief generation
- `src/js/pricing.js` — four planning ranges, feature minimums, allowances, and budget warnings
- `src/js/templates.js` — allowlisted design IDs and inquiry text
- `src/js/payment-schedule.js` — integer-cent 50/25/25 arithmetic; no payment processing
- `src/css/pickers.css` — native `::picker(select)` enhancement and radio-card affordances, imported by the shared stylesheet
- `ai_here/` — implementation status, sourced market comparison, and manual kickoff checklist
- `DESIGN.md` — company offerings, design decisions, and reviewed GitHub skill sources
- `public/` — static branding, crawler files, and Apache/LiteSpeed configuration
- `tests/` — browser regressions, recommendation rules, and email-encoding checks

## Website-fit quiz

At `/websites/#website-quiz`, visitors answer ten questions: goal, page count, editing, launch priority, commerce, bookings, accounts, content readiness, timing, and budget. Results describe a landing page, business site, portfolio, shop, booking site, content-led site, or application, plus any additional selected workflows. They explain the package, range, pricing drivers, allowances, and any budget shortfall. A low budget never removes essential functionality.

The finder is deterministic and runs entirely in the browser. It needs no API key, email address, or sign-up. Answers are held in memory until the visitor chooses “Discuss this website”. That action transfers only allowlisted answer fields and an optional design ID through same-tab session storage, consumed once on the homepage. Transfers older than ten minutes are rejected. Contact details are never written to browser storage. Blocked storage exposes a copyable description. Removing the brief preserves typed contact details and message text.

Edit questions and recommendation copy in `src/js/website-recommendation.js` and ranges/rules in `src/js/pricing.js`; keep the static pricing page and gallery labels aligned. Native radios remain visible and keyboard-operable. The owner's “pickercss” reference is native CSS [`::picker(select)`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::picker), not an external dependency. The shared stylesheet imports `src/css/pickers.css`, which enables `appearance: base-select` on single-value `.form-control` selects and their pickers only inside a feature query. Unsupported browsers retain a normal select. The quiz's radios are deliberately not replaced; the standalone PHP fallback also retains its native controls. No picker library, polyfill, or new JavaScript control is required.

## Examples, pricing, and agreements

Four original fictional demos can be opened and selected. Their shop basket and booking slots are memory-only simulations, not payment or reservation services. Edit demo content in `scripts/render-examples.mjs`, then build; do not hand-edit generated demo HTML.

Packages are indicative one-off build ranges from €500, not binding offers. Content and rush allowances are transparent planning rules. Tax treatment, the total payable, recurring costs, and availability must be confirmed in a written proposal. See `ai_here/pricing-research.md` for checked competitor sources and comparison limits.

`/websites/agreement/` explains printing/signing the **studio-issued** agreement and postal return to **Max Hermanelei 55, Brasschaat 2930, Belgium**. Its browser tool prepares a **review draft only**, with a persistent not-for-signature/payment warning and Print / Save as PDF. It does not submit, store, issue, sign, or verify agreements. Unconfirmed legal identity, tax status, and service terms must not be invented.

The owner has confirmed the company is not registered yet. Registration/tax details and final commercial documents are deferred; the current site remains an inquiry/planning tool and its agreement stays a review draft. Do not invent registration numbers or describe this as a registered company. Confirm the actual operator/controller details applicable to any public inquiry site separately; lack of company registration does not establish that existing legal notices are complete.

No payment gateway or online signature verification is implemented. The operational gate is manual: verify the returned signed agreement and independently reconcile the cleared 50% deposit, then confirm kickoff in writing. Never accept a checkbox, client-side state, screenshot, or inquiry acceptance as payment evidence. Use `ai_here/kickoff-checklist.md` in a private project record, outside the public repository. The proposed remaining payments are 25% at an agreed milestone and 25% before launch/handover.

## Languages and easier navigation

Pricing and Examples are now top-level navigation links, visible shortcuts on phones, and direct homepage calls to action. The shared build plugin applies this navigation consistently to every full page.

English remains at `/`; Dutch, French, and German use `/nl/`, `/fr/`, and `/de/`. Localized HTML, internal links, metadata, hreflang alternates, and sitemap entries are generated automatically from the English sources. These pages work without JavaScript. With JavaScript, the language switcher changes language **without losing a typed inquiry, draft fields, or quiz progress**. It remembers only an explicit language choice; otherwise it detects the browser's supported language. Explicit localized URLs take priority.

The checked-in catalogues cover the current pages, interface, quiz/results, and standalone PHP form. Prices use locale-aware EUR display. User messages and draft fields are never translated or uploaded. Contact submissions include a validated communication-language preference; sender/recipient and mail transport settings are unchanged.

After editing English copy:

```sh
npm run i18n:sync
# Opt-in public-copy draft generation; keep files outside src/public/dist:
node scripts/review-translations.mjs translate CANDIDATES.json --allow-public-copy
# Review meaning, page context, and editorial.json before applying:
node scripts/review-translations.mjs apply CANDIDATES.json --reviewed
node scripts/review-translations.mjs grammar REPORT.json --allow-public-copy
npm run i18n:check
npm run build
```

The revised copy uses whole-message Google Translate drafts, LLM editorial/meaning review in all three languages, and LanguageTool checks—not the old sentence-fragment stitching. Dutch uses je/jouw; French vous/votre; German Sie/Ihr. `src/i18n/editorial.json` holds 563 curated messages. Build checks protect prices, percentages, names, placeholders, register, and curated wording. Grammar reports are cached for targeted rechecks; no suggestions are applied automatically. The public endpoints are opt-in maintenance aids, not guaranteed services or visitor-time dependencies.

An optional offline fallback still uses the isolated Python environment in `scripts/requirements-i18n.txt`, selected by `HOTWIRE_I18N_PYTHON`: `node scripts/i18n.mjs translate --model-dir PATH_TO_MODELS --output CANDIDATES.json --download-models`. It now translates whole messages and writes only private draft candidates, never publishable catalogue values. Ordinary builds/hosting need no models, Python, API keys, paid service, or translation requests. Setup, review steps, and adding languages: `ai_here/languages.md`; quality evidence: `ai_here/translation-review.md`.

Software checks and LLM review are **not certified legal translations** or native-speaker signoff. Obtain appropriate review of commercial/legal copy. Agreements remain review drafts and registration details remain pending.

## Social artwork

`public/social-websites.png` is the current 1200×630 social preview. Its editable source is `public/social-websites.svg`. After editing the SVG, run `npm run build:social` with a Playwright browser installed (or `PLAYWRIGHT_CHANNEL=msedge`/`chrome`), then rebuild the site. The generated PNG is included with the other public artwork, so ordinary builds do not need a browser.

## Contact behaviour

Pages are statically built, with a **PHP 8.2+ contact endpoint** at `public/api/contact.php` (copied to `dist/api/`). The form sends directly through the host's mail transport; no email app is required. It validates a session CSRF token, consent, field lengths/types, a honeypot, and rate limits. A successful response means the mail server accepted the inquiry, not guaranteed inbox delivery. Fields remain available, and copying is a fallback. Without JavaScript, the endpoint provides a server-rendered form. See `DEPLOY.md` for sender authorization and live-delivery checks.

The owner confirmed live email is already configured. Its sender, recipient, transport configuration, and legacy root `contact.php` are unchanged. The active `/api/` endpoint now validates the selected language, includes it in receipt matching and the studio email, and serves its native form from local translated catalogues. Tests send no real mail.

The quiz generates two separate outputs: a plain-language website description for the visitor and a detailed inquiry brief for the studio. “Discuss this website” attaches the latter automatically; only name, email, and consent are then required. Extra notes are optional. Names, email addresses, and messages are never written to browser storage.

Typography uses Space Grotesk headings and Manrope body text. Page/section entrances, quiz transitions, menu opening, and hover feedback use lightweight finite animations. Reduced-motion preferences disable them, and no content depends on animation or JavaScript to remain readable.

## Publishing

The legal pages are linked from every footer and from both contact-form variants. They describe the current PHP contact service, quiz storage, and remote font requests. **Review `LEGAL-REVIEW.md` before publishing:** verified operator registration/address details, provider arrangements, retention periods, and legal review are still owner tasks. Website-use terms do not replace a client service agreement.

See [DEPLOY.md](DEPLOY.md). Rebuild and upload the complete contents of `dist/`, including hidden `.htaccess`. Deployments belong at the domain root, not a subdirectory. Legacy build files are already tracked, but `.gitignore` ignores newly generated `dist/` files; a source-only checkout or `git commit -a` is not a complete deployment artifact. Always build from the sources before deploying rather than relying on partially tracked output.
