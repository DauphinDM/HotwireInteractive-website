# Languages and navigation

## What is automated

- A shared Vite plugin exposes **Pricing and Examples** in primary desktop/mobile navigation, adds always-visible phone shortcuts, and inserts a link-based language switcher. The homepage also has direct package/example calls to action.
- `src/i18n/config.js` registers English, Dutch, French, and German, using Belgian number formatting where appropriate. English stays at the original URLs; Dutch/French/German use `/nl/`, `/fr/`, `/de/`.
- Builds generate all localized HTML from the **one English source tree**, with localized internal links, document language, metadata, canonical/hreflang links, and a multilingual sitemap. Demo pages retain noindex. Localized pages and language links work without JavaScript.
- Browser language is detected locally. Explicit URL/query choice wins over a stored preference, which wins over browser-language order. Only an explicit switch stores `hotwire-language` in local storage; blocked storage is nonfatal.
- With JavaScript, switching happens in place, updates the URL, and preserves typed form values, checkbox selections, draft fields, and quiz answers/progress. User text is never translated or sent to a translation service. Back/forward navigation updates the locale.
- Runtime messages, quiz questions/results, budget explanations, demo interactions, and agreement UI use the shared catalogue. Contact payloads include an allowlisted locale; the existing mail transport/sender stay unchanged and the studio receives the communication preference. The standalone PHP form reads the same local catalogue files.

## Source and maintenance

- `src/i18n/messages/en.json` is extracted from static pages plus fixed UI strings in the JS/PHP source. The three other catalogues use the English source string as the key.
- `npm run i18n:sync` discovers source changes and adds missing keys without overwriting existing translations. Unused keys are removed. Keep editorial fixes in the translated catalogues; they survive regeneration.
- `npm run i18n:check` validates coverage, `{placeholder}` preservation, tokenizer artifacts, unchanged numeric values, protected names, the agreed form of address, and exact curated wording. New unchanged English messages need an explicit allowlist decision. Production builds run these checks; none of them alone proves linguistic correctness.
- For new dynamic text, call `t('English source with {name}', { name })`. Keep source messages as literal strings rather than assembling untranslatable sentences. Source fields/IDs/option values stay stable and must not be translated.
- `src/i18n/editorial.json` now contains **587 curated messages** across all three translated languages and **981 source messages**, including the HTML-email follow-up, pricing, forms, agreement conditions, legal paragraphs, demo names, and joined headings. `node scripts/apply-editorial.mjs` applies them. Update that file alongside catalogue edits for those keys; builds reject accidental overwrites.
- Never translate script/style/code blocks, input values, textarea content, private draft fields, URLs, identities, registration numbers, or other user data. Fixed textarea placeholders and accessible labels are translated separately from their private contents. Build markers identify only static source copy. Generated private agreement fields remove translation markers.

## Translation quality and voice

HTML-email follow-up: `public/api/contact-mail.php` is scanned **only for explicit `$t('…')` copy calls**, not arbitrary quoted template markup, CSS, or MIME headers. The HTTP form lives in `contact-handler.php`; extraction follows that file. Staff notifications intentionally stay English while showing the visitor’s preferred language. Client confirmations use the submitted locale. All 25 newly introduced keys were manually curated in Dutch/French/German and checked with LanguageTool; no visitor content is translated. Two replaced success messages were retired, so the catalogue grows from 958 to 981 source messages. See `email.md` for mail behaviour and verification.

The initial Argos output was too literal and, more importantly, split sentences around names, amounts, and percentages before stitching them back together. Passing the old coverage/layout tests did **not** establish good translations. That approach is retired.

The 31 October 2026 correction uses whole-message Google Translate candidates, an LLM editorial/meaning review of the catalogue in Dutch/French/German, and independent LanguageTool checks. Google Translate's public endpoint is unofficial and has no service guarantee; a timeout/rate limit is not grounds for publishing unchecked output. Only checked-in public copy is processed. A Dutch-specific model or native-speaker review was **not** claimed.

- Dutch: Belgian audience, natural **je/jouw** wording. Use *aanvraag*, *offerte*, *projectbeschrijving*, and *daadwerkelijk ontvangen aanbetaling*, not literal mistranslations such as *onderzoek*, *citaat*, *slips*, or *goedgekeurde storting* in those contexts.
- French: **vous/votre**, *demande*, *devis*, *descriptif du projet*, and *acompte effectivement encaissé*. A portfolio is not a financial *portefeuille* here.
- German: **Sie/Ihr**, *Anfrage*, *Angebot*, *Projektbeschreibung*, and *tatsächlicher Eingang der Anzahlung*. Keep a consistent formal register.
- Preserve Hotwire Interactive, Fieldwork, Forma, Objects, Still, package names, people, postal details, placeholders, and protocol identifiers. A price or percentage must never change in translation. Locale-specific currency/percentage presentation happens at rendering; grammar checks use that rendered notation.
- Review phrases in their page context, especially `<br>` headings and sentences spanning links. For example, Dutch *Op maat gemaakte webapplicaties*, French *Applications web sur mesure*, and German *Individuelle Webanwendungen* must work as complete headings. Browser tests check the assembled visible text.
- LanguageTool spelling warnings about brand names, placeholders, technical identifiers, legitimate Dutch compounds, or deliberately lowercase sentence fragments are not automatically mistakes. Never apply suggestions blindly. Record real corrections and retain justified terminology. Legal meaning is checked separately from grammar.

## Recommended review workflow

```sh
npm run i18n:sync
# Explicit opt-in: sends only public source copy; writes PRIVATE candidates.
node scripts/review-translations.mjs translate CANDIDATES.json --allow-public-copy
# Read/edit candidates and editorial.json in context before this local step:
node scripts/review-translations.mjs apply CANDIDATES.json --reviewed
# Explicit opt-in: checks public translated copy with LanguageTool.
node scripts/review-translations.mjs grammar REPORT.json --allow-public-copy
npm run i18n:check
npm run build
npm run test:unit
npm test
```

Keep candidate/report files outside `src/`, `public/`, and `dist/` (an approved private temporary directory is suitable). Candidates have an English-source digest; stale or incomplete candidates fail application. The apply step merges current editorial corrections and validates every locale before writing. Review results are cached per rendered message, so rerunning grammar checks after a correction rechecks only changed/missing text. It stops on an HTTP error instead of hammering the service; a network failure leaves a resumable partial report. No suggestions are automatically accepted. Review residual warnings and do not confuse a count of checked messages with zero linguistic errors.

The maintenance tool requires explicit opt-in for remote calls. Normal builds and visitor language switching make **no translation or grammar-service requests**. Private visitor messages and agreement fields are never inputs to these commands.

## Optional offline draft generation

Ordinary installs/builds/hosting need **no Python, ML models, credentials, paid API, or network translation calls**. Catalogue files are committed.

If you want automatic first drafts for newly added public copy:

1. Create an isolated Python environment (Python 3.13 was used here).
2. Install `scripts/requirements-i18n.txt` into it.
3. Point `HOTWIRE_I18N_PYTHON` to that environment's executable.
4. Run:

```sh
node scripts/i18n.mjs translate --model-dir PATH_TO_PRIVATE_MODEL_CACHE --output CANDIDATES.json --download-models
```

The explicit `--download-models` flag downloads pinned public Argos/OpenNMT model packages, verifies their SHA-256, and caches them **outside the public site/repository**. Later runs can omit the flag and run fully offline. Whole English messages are processed on the local CPU; they are no longer split around brands/numbers. Only missing translations are proposed, preserving existing corrections. Crucially, this now writes a separate **candidate file**, never publishable catalogue values. Invalid placeholders/unknown tokens remain unfilled for manual correction. Use the same explicit review/apply/quality workflow above. Argos remains a weaker optional draft fallback, not the final quality authority.

This environment used an isolated interpreter under `C:\Users\Dauphin\AppData\Local\Temp\opencode\hotwire-i18n\` and a sibling `hotwire-i18n-models` cache. These are tool caches, not deployable project dependencies. Do not assume they exist on another machine.

Model source: public [Argos package mirror](https://huggingface.co/TiberiuCristianLeon/Argostranslate), pinned revision `0fbbd0e16e6b24c56685217b8a0b3bbffc9775c7`; its model card declares MIT. Hashes are recorded in `scripts/translate-catalogs.py`. Models/binaries are not redistributed with the website. These optional model downloads originally worked around a 403 from the upstream host. They are not build/runtime dependencies. `python tests/translation-tooling.py` checks whole-message handling, placeholder rejection, and no catalogue writes using standard-library mocks; no models or external calls are needed for that test.

## Review boundary

Dutch/French/German copy now has a substantially broader software-assisted and LLM editorial review, but this is not native-speaker signoff or certified legal translation. Legal notices and the service-agreement template still require appropriate bilingual/legal review before commercial use. The agreement remains not-for-signature/payment; registration/operator/VAT details remain deferred and unfilled. The English source remains selectable. See `translation-review.md` for verification evidence and limitations.

## Adding a language

Add its code/endonym/locale to `config.js`, update that file's `splitLocalePath` recognition (currently `nl|fr|de`), create its JSON catalogue, add the catalogue import in `src/i18n/index.js`, and align the PHP allowlist in `contact-lib.php`. Add a suitable model mapping only if you want offline draft generation for it. Then sync, translate/review, check, build, and extend tests. Page output, navigation links, and sitemap alternates are generated from the registry, not copied pages.

## Verification

Final results are recorded in `ai_here/plan.md`. Do not mistake an incomplete scaffolding build for translation coverage: normal production builds must pass `i18n:check`.
