# Peer-feedback design revision — 1 November 2026

## Request and decisions

The owner supplied Dutch feedback from a web-designing friend: the heading font, familiar layout, and decorative eyebrows felt generic; swap the finder button/language control; stop using homepage sections as top-level destinations; prefer projects to examples; make the four pricing packages easier to compare without scrolling.

- Keep Hotwire's orange/charcoal identity and actual monogram, not a new brand. Use **Barlow Condensed** headings with **Manrope** reading/control/wordmark text. A large open headline and enlarged monogram/wire drawing replace the filled orange hero card; the finder becomes a paper-coloured horizontal strip. Open project rows and actual studio information replace decorative marketing labels. Factual team roles and own-project labels remain where they explain what something is.
- Move language before the finder CTA in the actual DOM and visual order. Primary desktop/mobile navigation now opens `/websites/`, `/websites/pricing/`, `/projects/`, `/studio/`, `/team/`, `/contact/`, not homepage fragments. Mobile keeps readable Pricing/Projects shortcuts and the original keyboard-operable disclosure. The monogram still links home; the finder still opens the quiz.
- Add real **Studio**, **Contact**, and **Projects** pages in all four languages. The project collection contains the studio's **own website** and explicitly unpublished client/independent-project slots. There are no fabricated client names, completed commissions, permissions, metrics, launch claims, or testimonials. The orange project artwork is a brand illustration, not a claimed client-site screenshot.
- Retain the four fictional examples as separately labelled **design studies** at their original URLs. Their demos, selections, local baskets/bookings, and disclaimers remain functional. Header Projects stays the section entry point when exploring studies.
- Pricing uses four summary columns from 1024px; each has its unchanged range, a short description, native scope/exclusion disclosure, and action. All four summaries fit together at **1280×800 in EN/NL/FR/DE** in the checked Chromium layout. Phones have a readable four-row price overview and ordinary stacked cards, not undersized four-column cards or horizontal carousels. Full descriptions, best-fit notes, inclusions, and exclusions remain in the document and can be opened without JavaScript. Tax/recurring-cost/nonbinding-estimate warnings remain visible. Large zoom/small screens may naturally require scrolling; accessibility is not sacrificed to a universal no-scroll promise.

The visual direction is a taste-based response to feedback, not a measurable guarantee that nobody will recognise AI assistance. Native-speaking design/copy review is still welcome.

## Implementation and maintenance

- `scripts/i18n-html.mjs`: shared header, font request, destinations, control order, and contact-fragment injection. The shared font request replaces older per-page font links during Vite dev/build, ensuring output loads Barlow Condensed/Manrope consistently.
- `src/css/style.css`: typography, open hero, monogram treatment, finder strip, project/studio/contact layouts, responsive behaviour. `src/css/services.css`: compact pricing and native disclosures. Demo/preview tracking was relaxed for the new narrower heading face.
- `studio/index.html`, `contact/index.html`, `projects/index.html`: English source pages; registered in Vite, extraction, Tailwind, and the shared static localisation pipeline. The build now contains **76 HTML documents** (19 English sources × four languages).
- `src/fragments/contact-composer.html`: one English composer reused by the dedicated contact page and the homepage. Heading levels adapt to the page context. Edit consent/help/validation markup here, not in two copies; the Vite watcher reloads the affected pages. It is injected **before** translation, leaving complete static fallbacks in the build.
- Preserve `/#contact`, quiz handoffs, template selections, and existing private state rather than introducing a redirect that loses data. New primary/footer destinations use `/contact/`; the existing quiz/demo handoff deliberately continues to the compatible homepage form. The dedicated page also uses the same JavaScript/validated API.
- The active PHP mail code, sender/recipient, existing HTML confirmations, native API form, and mail transport settings are **unchanged** in this revision. No real mail was sent. Registration/VAT details and the not-for-signature/payment agreement remain deferred; signed agreement + independently cleared deposit + written kickoff still apply.
- Google Fonts remains the existing external provider. The privacy notice names **Barlow Condensed and Manrope**, with update date **1 November 2026**. No analytics, trackers, cookie, paid service, or new provider was added; self-hosting/provider/legal review remains separate work.

## Copy review

- Added/replaced **39 source keys**, retired eight unused source keys, and deliberately updated seven affected curated entries: **1,012 current catalogue keys**, **619 curated keys**. All new copy has hand-curated Dutch/French/German values using je/jouw, vous/votre, and Sie/Ihr.
- Titles genuinely unchanged in spelling (Studio in all three languages; Contact in Dutch/French) have explicit allowlist decisions, not silent English fallbacks. Font names are protected alongside brands, names, numbers, and placeholders.
- Opt-in LanguageTool cache/digests match **1,012/1,012 formatted catalogue entries per language**. Residual totals: **285 nl**, **195 fr**, **216 de**, not zero warnings. New suggestions were reviewed: Hotwire, personal/font names, valid Dutch compounds such as *studiowebsite*/*websitekiezer*, lowercase inline fragments after the Google Fonts label, and conventional plain-text French *1er novembre* are retained. Do not apply spelling substitutions that change identity/meaning. No private visitor fields or the friend's private message were sent; only checked-in public copy was checked.

## Verification

- Production preparation/build and catalogue fidelity checks passed.
- Node unit suite: **27 passed**. Includes shared form equivalence with deliberate heading-level differences, genuine route destinations, header control order, and font-source checks.
- PHP lint/library/HTTP capture tests passed, including **143 mail assertions**. No real transport was called.
- Focused feedback tests: **15 passed**, including all-language desktop package fit, truthful project labels, native no-JS scope disclosures, and a mocked dedicated-contact submission/language change retaining private fields and accepted state.
- Initial layout sweep caught a project illustration's intrinsic minimum width causing phone overflow. Fixed its actual sizing (`min-width:0`, no aspect-ratio-forced minimum height), not by hiding page overflow. The shared-form unit comparison was adjusted to normalise the intentionally different heading level while still checking identical controls/content and explicit semantic levels.
- Final full website suite: **367 passed (3.2 minutes)**, including responsive layouts, accessibility, languages, quiz/demo handoffs, private form state, and fixed-header clearance. Final email layout/accessibility suite: **18 passed**, including inline-only fallbacks and no external requests; this does not certify Outlook/Gmail rendering or inbox delivery. Python tooling regression: **1 passed**.
- Audited all **76 built HTML documents** for current shared fonts (including navbar-free 404 pages), document languages, and completed form injection. Built API files and catalogues match source; initial robots/social-SVG bytes and every existing sitemap destination are preserved, with **12 additional sitemap destinations**. Reviewed final desktop homepage, Dutch pricing, and mobile Projects screenshots. Final whitespace check passed.

Existing working-tree changes at the start were limited to built `robots.txt`, `sitemap.xml`, and `social-preview.svg` (line endings/generated order). They were inspected and copied to the approved private temporary directory before rebuilding. No source changes were reset or discarded. No commit, push, deployment, actual client approval, signature/payment verification, or inbox-delivery test was performed.

## Handover

Build and upload the **complete** `dist/` directory, including the three new routes, translations, fingerprinted assets, and all existing API files. Newly generated output may be ignored despite older output being tracked; a tracked-file-only upload is incomplete. See `DEPLOY.md`.

Next content step: replace the clearly labelled pending project slots with actual approved project details and licensed images when available. Keep demonstrations separate from commissioned work and do not infer missing details from the placeholders.
