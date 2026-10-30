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
- `npm run i18n:check` validates coverage, `{placeholder}` preservation, and tokenizer artifacts (`▁`, `�`, `⁇`, `<unk>`). Production `npm run build` runs this check before generating pages; invalid translations fail rather than quietly shipping broken copy under a foreign-language URL.
- For new dynamic text, call `t('English source with {name}', { name })`. Keep source messages as literal strings rather than assembling untranslatable sentences. Source fields/IDs/option values stay stable and must not be translated.
- `src/i18n/editorial.json` contains curated core translations. `node scripts/apply-editorial.mjs` applies them; update that file alongside catalogue edits for those keys. Non-core machine-assisted paragraphs still need fluent review. Tokenizer artifacts and missing/changed placeholders fail the catalogue checks.
- Never translate script/style/code blocks, input values, textarea content, private draft fields, URLs, identities, registration numbers, or other user data. Fixed textarea placeholders and accessible labels are translated separately from their private contents. Build markers identify only static source copy. Generated private agreement fields remove translation markers.

## Optional offline draft generation

Ordinary installs/builds/hosting need **no Python, ML models, credentials, paid API, or network translation calls**. Catalogue files are committed.

If you want automatic first drafts for newly added public copy:

1. Create an isolated Python environment (Python 3.13 was used here).
2. Install `scripts/requirements-i18n.txt` into it.
3. Point `HOTWIRE_I18N_PYTHON` to that environment's executable.
4. Run:

```sh
node scripts/i18n.mjs translate --model-dir PATH_TO_PRIVATE_MODEL_CACHE --download-models
```

The explicit `--download-models` flag downloads pinned public Argos/OpenNMT model packages, verifies their SHA-256, and caches them **outside the public site/repository**. Subsequent runs can omit the flag and run fully offline. English copy is processed on the local CPU; it is not uploaded. Only empty catalogue entries are filled, preserving editorial corrections. Title separators are protected, and unknown-token output stops generation for manual correction. Review the results and run the checks/build/tests.

This environment used an isolated interpreter under `C:\Users\Dauphin\AppData\Local\Temp\opencode\hotwire-i18n\` and a sibling `hotwire-i18n-models` cache. These are tool caches, not deployable project dependencies. Do not assume they exist on another machine.

Model source: public [Argos package mirror](https://huggingface.co/TiberiuCristianLeon/Argostranslate), pinned revision `0fbbd0e16e6b24c56685217b8a0b3bbffc9775c7`; its model card declares MIT. The selected model hashes are recorded in `scripts/translate-catalogs.py`. Models and runtime binaries are not redistributed with the website. The original Argos download host returned 403 here; the pinned public mirror is used instead. A public online translation endpoint also rate-limited the environment, so it is **not a runtime or maintenance dependency**.

## Review boundary

Initial Dutch/French/German copy is machine-assisted draft translation, not certified translation. Navigation, key actions, quiz labels, and critical warnings should be editorially reviewed. Legal notices and the service-agreement review template especially require appropriate bilingual/legal review; language coverage does not make them legally approved. The agreement remains not-for-signature/payment, and registration/operator/VAT details remain deferred and unfilled. The English source remains selectable.

## Adding a language

Add its code/endonym/locale to `config.js`, update that file's `splitLocalePath` recognition (currently `nl|fr|de`), create its JSON catalogue, add the catalogue import in `src/i18n/index.js`, and align the PHP allowlist in `contact-lib.php`. Add a suitable model mapping only if you want offline draft generation for it. Then sync, translate/review, check, build, and extend tests. Page output, navigation links, and sitemap alternates are generated from the registry, not copied pages.

## Verification

Final results are recorded in `ai_here/plan.md`. Do not mistake an incomplete scaffolding build for translation coverage: normal production builds must pass `i18n:check`.
