# Handover — actual D: checkout

Updated 31 October 2026. Working tree: `D:\_HotwireInteractiveWEBSITE`. Live email is configured according to the owner. Do not redo mail setup or send test inquiries without permission.

Owner clarification: the company is **not registered yet**; legal details will take time. Keep final commercial issuance/payment collection deferred and the public agreement as a review draft. Do not fabricate registration/VAT details. Separately confirm the actual operator/controller identity appropriate to a public inquiry website.

## Audit findings and corrections

- Prior eight-question completion claims did not match this checkout: the source still had four questions and no package estimator. The new implementation was written here, not copied from `M:`. No files on the other drive were changed.
- Prior pricing/examples pages loaded an export-only module, had unstyled layouts, and linked to a nonexistent contact fragment. They now initialize navigation, have responsive styles, and provide working previews/selection.
- Removed the duplicated unused public picker stylesheet; Vite correctly bundles the source stylesheet. Native radio inputs remain visible and retain browser arrow-key navigation.
- Earlier merge-marker removal in homepage/JS/CSS retained the website-services branch; the committed source itself contained both incompatible branches. This session retained those resolutions. README's remaining merge markers were resolved in favour of the detailed documentation; the other branch's unverified “LLC” claim was not adopted.
- `.gitignore` also contained merge markers. Removed the markers and duplicate node_modules entry while preserving the combined existing ignore rules, including `/dist` and `/DEPLOY.md`. Some legacy `dist/` files are tracked despite that ignore rule; newly generated assets/pages are ignored. Build fresh and deploy the entire directory; do not assume tracked output is complete.
- UTF-8 probes found no replacement characters or common mojibake in inspected HTML. Continue using explicit UTF-8/patch edits, not default Windows PowerShell Set-Content encoding.

## Implemented

1. Four one-off planning ranges: Starter €500–€1,200; Growth €1,200–€3,000; Scale €3,000–€6,500; Enterprise €6,500–€14,000+.
2. Ten-question quiz with explicit feature minimums, extra workflows, content/rush allowances, price-driver explanation, and budget mismatch warnings. Budget never discounts away features or raises the estimate by itself.
3. Four original fictional demos: local service, portfolio, shop, and appointments. Browsable static content works without JavaScript; basket/slot interactions are explicitly local simulations. Gallery and demo selections use allowlisted IDs in an inquiry. A selected direction can also accompany quiz answers.
4. A printable service-agreement **review draft**, with party/scope/schedule/cost/terms fields and safe integer-cent 50/25/25 calculations. Browser Print can save PDF. The persistent warning says not to sign or pay against this draft. No upload/signature/payment API was invented.
5. Public signing/postal/deposit instructions and a private operational kickoff checklist. Work is contingent on an independently verified signed agreement AND cleared 50% deposit, then written studio confirmation.
6. Sourced competitor comparison on pricing page; research notes in `pricing-research.md` retain model/scope/VAT/renewal differences.
7. Contact sender, recipient, transport configuration, and root legacy `contact.php` remain unchanged. The language follow-up adds validated locale handling and translated native-form rendering to the active `/api/` endpoint; do not redo live email setup.
8. Pricing and Examples are first-level links, visible mobile shortcuts, and direct homepage actions. A shared build shell keeps these consistent across pages.
9. English/Dutch/French/German catalogues cover 958 current messages. Localized HTML routes, metadata, internal links, and sitemap/hreflang entries are built automatically from English sources. Browser detection and a visible language switcher work without discarding typed contact/draft fields or quiz progress. Explicit choices persist only as a language code; blocked storage is nonfatal.
10. Optional offline draft-translation tooling uses locally cached, pinned/hash-checked Argos/OpenNMT models. Builds/hosting have no translation API, Python, model, or paid-service dependency. Read `languages.md` for source maintenance and setup. Visitor input is never translated or uploaded.

## Boundaries / unresolved requirements

- **Picker reference resolved:** the owner supplied [MDN `::picker()`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::picker). This is native CSS, not a missing library. `src/css/pickers.css` now progressively enhances single-value `.form-control` selects with `appearance: base-select` on both the control and `::picker(select)`, guarded by feature detection. Browser anchor/fallback positioning is retained; unsupported browsers and the PHP fallback keep normal native selects. Quiz radios keep native semantics. Do not resume npm/package searches or replace radios with fake selects.
- Package ranges are commercial planning choices, not a market-rate certification. The small supplier sample cannot establish a representative Belgian average. Enterprise pricing especially needs real discovery and effort estimates.
- Public ranges are not a tax-compliant issued quote. Registered operator details, VAT treatment, and reviewed terms still need owner/adviser confirmation. Do not invent a VAT number, LLC status, exemption, consumer waiver, or non-refundable-deposit policy.
- **No legally reviewed final contract is supplied.** The public template deliberately stays a review draft. Issue a complete reviewed agreement through the studio before collecting signatures or deposits.
- **No automated kickoff enforcement exists.** Manual process/checklist is implemented; actual mail arrival and bank/provider records cannot be verified by a static page. No gateway credentials, webhook verification, signing service, invoice ledger, or private admin system exists.
- Do not put real client records/signatures/payment evidence in this repository or `public/`/`dist/`. Use a secured private record with appropriate access and retention.
- Demo HTML is generated from `scripts/render-examples.mjs` by the `prebuild` script. Edit the source, not generated files. Fictional artwork is original CSS; no real work/testimonials are implied.
- Existing remote Google Fonts remain disclosed. Self-hosting and provider/retention review are separate improvements, not falsely marked complete.

## Verification

Baseline commercial/native-picker verification on 30 October 2026 (language follow-up below):

- `npm run build` passed (four generated demos plus all public pages).
- `npm run test:unit`: **15 passed**. Coverage includes every option and 1,000 deterministic mixed combinations, not every one of the 262,440 combinations.
- `npm test`: **247 passed** after the native-picker follow-up. Includes 320–1920px layouts, automated accessibility, native keyboard controls and picker fallback, no-JS navigation, demo selection, ten-step quiz, budget mismatch, local basket/booking flows, safe draft text rendering, print-only document layout, and PDF output.
- PHP library/HTTP checks passed using the available PHP 8.4.27 binary; **no real mail sent**. Mail source/configuration remains unchanged.
- Initial browser run caught four demo overflows at 320px caused by the square artwork's minimum sizing. Fixed the artwork/grid sizing; all four regression cases now pass.
- Reviewed generated gallery/phone screenshots. Test artifacts include a sample review PDF under `test-results/`, which is ignored and not deployed.

Native-picker follow-up: owner-provided MDN reference implemented in the shared stylesheet, with capability-gated `appearance: base-select` on both select and picker. A production build, four focused picker tests, and the full **247-test browser suite** passed (including 320px/1440px keyboard selection, open-picker accessibility/viewport checks, standard-select fallback with the enhancement block removed, and forced colors/reduced motion). No PHP, mail transport, or legal-document issuance behaviour was changed by this follow-up.

No commit, push, production deployment, real signature verification, or real payment verification was performed.

## Navigation and language follow-up

- Shared navigation and localized output are implemented in `scripts/i18n-vite-plugin.mjs` and `scripts/i18n-html.mjs`; edit the English source once, not four pages. The browser uses checked-in local dictionaries and maintains state during language changes.
- The first model download host returned 403 and an online translation endpoint returned 429 from the environment. The final tooling uses an explicitly downloaded, pinned public model mirror and performs translation locally. Neither service is a website/runtime dependency.
- Initial model output exposed SentencePiece spacing markers in some Dutch/French strings and unknown-token separators in 12 German titles. Existing entries were corrected; catalogue/unit checks now reject `▁`, `�`, `⁇`, and `<unk>`, with explicit negative regression cases. The offline translator protects title separators and rejects unknown-token output before writing a locale catalogue. Core navigation/actions, homepage headings, quiz labels, and draft warnings are curated in `src/i18n/editorial.json`. This is still machine-assisted copy, not certified native/legal review.
- Parser testing also caught entity-fragmented strings and linkedom's incorrect digit handling in `dataset.i18n` attribute names. Adjacent text nodes now merge before extraction, and marker attributes are set explicitly. Regression checks cover complete entities, marker naming, and actual visible text changes—not just changing `<html lang>`.
- The mobile disclosure keeps its menu next in keyboard order; always-visible shortcuts come after the menu in DOM order so opening navigation does not send the next Tab into unrelated shortcuts.
- Final verification on 30 October 2026: production preparation/build and catalogue checks passed; all four catalogues cover 958 source messages with intact placeholders and no flagged tokenizer artifacts. **22 unit tests**, the expanded PHP library/HTTP checks, and the final full **291-test browser suite (2.8 minutes)** passed after copy/placeholder/header cleanup. No real mail was sent. The offline translator's syntax, title protection, and artifact guards also passed a local no-write/no-network probe. All **64 generated HTML documents** have the expected document language and clean titles; **2,460 local asset/form/navigation targets** resolve to generated files. `git diff --check` passed.
- Reviewed Dutch/French/German phone and desktop screenshots. The final cleanup translates static textarea placeholders without touching private contents, improves fragmented homepage headings, and keeps mobile shortcuts in a two-column row so the longer Dutch labels do not cover the introduction. Browser assertions now check the introduction is below the header and the message placeholder actually changes language.
- PHP sender/recipient/transport settings remain unchanged. Only a supported locale code is added to validation, receipt hashing, the internal email preference line, and native-form presentation. Existing clients default to English.

The rough initial translations were subsequently corrected in the quality follow-up below. Professional/native-speaker and legal signoff remain separate. Registration, VAT details, approved final service terms, payments, and signatures remain deferred/manual exactly as before.

## Translation-quality follow-up — 31 October 2026

- Owner correctly reported rough copy despite passing structural tests. The root cause included sentence splitting around names, prices, and percentages plus literal mistranslations. Do not equate coverage/browser-test success with linguistic quality.
- Whole-message Google Translate candidates plus a main-assistant LLM editorial/meaning pass replaced the weak output across Dutch/French/German. All 958 source messages were revisited; 563 now have curated three-language wording. Values changed: nl 690, fr 701, de 680. This did not use or claim a separate Dutch-specific LLM or native-speaker signoff.
- LanguageTool independently checks public translated copy in each language, with local per-message caching for corrections/resumption. It receives checked-in public text only, never visitor fields. A connection timeout interrupted the first French run; the final status belongs in `translation-review.md`, not an unverified blanket claim of zero errors.
- `src/i18n/quality.js` and build checks now protect numeric values, identities, technical attributes, forms of address, intentional unchanged labels, and curated wording. Actual deposit receipt, draft-only warnings, postal details, and proposed payment stages were preserved; no legal or mail-transport behaviour changed.
- The optional offline generator no longer stitches fragments or directly fills publishable translations. Both local and remote generation now require separate candidate review and explicit application. Read `languages.md` for the updated commands; old commands without `--output` are intentionally refused.
- Final verification: build/fidelity checks, **25 Node tests**, **1 standard-library Python tooling test**, PHP checks, and the full **303-test browser suite (2.4 minutes)** passed. LanguageTool checked **958/958 current rendered messages per language**; final cached texts/digests match the catalogues. Residual suggestions were reviewed, not blindly applied or described as zero errors; details and counts are in `translation-review.md`. Long German team headings wrap at 320px, and assembled headings are tested in all three languages. Final phone/desktop screenshots were reviewed and `git diff --check` passed. No real mail, commit, push, or deployment was performed.

## Next improvements

1. Monitor native customizable-select browser support and preserve fallback, keyboard, touch, reduced-motion, and forced-colors behaviour. The requested reference has been resolved; no dependency is missing.
2. When the owner is ready after registration, confirm legal operator, VAT presentation, approved service terms, postal return arrangement, and invoice/payment instructions. Do not block unrelated frontend work on registration, or treat the current draft as an issued contract.
3. If automation is requested, design a private authenticated project ledger with auditable approval events. Gateway webhook signatures, amount/currency matching, idempotency, settlement/refund states, access control, and retention must precede any automated “ready to start” status.
4. Expand market sampling with independently priced one-off Belgian freelancers/agencies; compare scope, taxes, ownership, maintenance, renewal, and minimum terms rather than just headline prices.
5. Refine templates using client-approved real content and licensed original photography. Add demos for custom workflows only when they exist; do not sell descriptive cards as completed examples.
