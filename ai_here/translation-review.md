# Translation correction — 31 October 2026

## Scope and actual tools

- Revisited all **958 English source messages** and their Dutch, French, and German counterparts, including page fragments in context, quiz/results, demos, metadata, contact responses, and the agreement review copy.
- Generated whole-message candidates with **Google Translate** through its public endpoint. This is an unofficial maintenance interface with no SLA, not a production dependency. Previously curated decisions were retained, then expanded through an **LLM editorial/meaning pass by the main assistant**. No separate Dutch-specific model, native speaker, paid translation account, or professional legal reviewer was used or claimed.
- Independently checked translated text with **LanguageTool** (`nl`, `fr`, `de-DE`). Only checked-in public website copy was sent. Private visitor input, mail, agreement fields, models, and secrets were not sent.
- Curated **563 source messages × 3 languages** in `src/i18n/editorial.json`. Compared with the previous checked-in catalogues, **690 Dutch**, **701 French**, and **680 German** values changed. The rest were reviewed and retained where suitable.

## What went wrong and what changed

The old offline generator split sentences at brand names, amounts, and percentages, translated the remaining fragments separately, then joined them. It also shipped weak literal word choices. Completeness, placeholder, accessibility, and layout tests passed without assessing fluency or meaning. Those earlier passing tests should not have been presented as translation-quality evidence.

Examples of corrected meaning:

| Context | Dutch/French/German decision |
| --- | --- |
| Project brief | *projectbeschrijving* / *descriptif du projet* / *Projektbeschreibung*, not underwear, a legal memorandum, or a letter |
| Cleared deposit | Actual receipt/encashment is stated explicitly, not merely approval or initiation of payment |
| Quote | *offerte* / *devis* / *Angebot*, not a quotation/citation |
| Sample price | *voorbeeldprijs* / *prix fictif* / *Beispielpreis*, not a monster or a specimen price |
| Design/package names | Fieldwork, Forma, Objects, Still, Starter, Growth, Scale, Enterprise, and Hotwire Interactive remain unchanged |
| Web applications | Joined visible headings read *Op maat gemaakte webapplicaties*, *Applications web sur mesure*, and *Individuelle Webanwendungen* |
| Security attributes | HttpOnly, SameSite=Strict, Secure, GET/POST, and HTTP header identifiers are not translated |

Dutch uses **je/jouw**, French **vous/votre**, German **Sie/Ihr**. Dutch pronoun conversion explicitly distinguishes an inverted subject from a possessive: *Kunt u helpen? → Kun je helpen?*, but *de website heeft uw tekst → de website heeft je tekst*. A regression test covers that distinction. Names, amounts, percentages, and literal placeholders are checked independently of grammar.

## Safeguards and future maintenance

- The offline generator now translates whole messages and writes **review candidates only**, never publishable translated values. A standard-library mocked test checks whole-message handling, preservation of editorial work, placeholder rejection, and no catalogue writes. A real cached-model/no-missing-entry smoke run also produced a separate candidate file without modifying translations.
- `scripts/review-translations.mjs` provides explicit opt-in draft generation, explicit reviewed application, and LanguageTool reporting. Source digests reject stale candidates. All locales are validated before application; suggestions are never applied automatically.
- Builds reject changed numbers, brands/technical identifiers, missing placeholders, tokenizer artifacts, accidental English fallbacks, inconsistent forms of address, and edits that silently override curated wording.
- LanguageTool checks the displayed currency/percentage notation, not the source-style amount representation used in catalogue keys. Reports cache each rendered message for targeted rechecks after corrections. A connection timeout interrupted the first French run; completed checks were preserved and the check resumed rather than being described as complete.
- Grammar reports/candidates stay in the approved temporary directory, outside deployed assets. Site builds and visitor language switching need no translation service, grammar service, Python, model, paid account, or API key.

## Verification

- Build and catalogue fidelity checks: passed.
- Node unit tests: **25 passed**.
- Optional Python offline-tool regression: **1 passed**; no models/network required.
- PHP library/HTTP checks: passed; no real mail sent.
- Visible-copy regressions check complete headings, untranslated identities, postal details, and the actual-receipt meaning of the deposit condition.
- German team headings received language-aware hyphenation/wrapping after the longer natural wording exposed an overflow at 320px.
- Final full browser suite: **303 passed (2.4 minutes)**. Includes the original flows plus all-language portfolio/profile layouts and assembled service/team/demo headings.
- Final LanguageTool report: **958/958 current rendered messages checked in each language**. After the corrections and targeted rechecks, residual suggestions were **261 Dutch**, **183 French**, and **201 German**. These were examined rather than treated as automatic errors; see the interpretation notes below. The report's catalogue digests and every cached rendered string were verified against the final files. This is not a claim of zero warnings.
- Reviewed final phone/desktop screenshots; `git diff --check` passed. No real mail, commit, push, or deployment.

## Interpreting grammar findings

Do not equate a LanguageTool warning count with a count of actual errors. Brand names, named people, literal placeholders such as `{price}`, code/header identifiers, valid Dutch compounds, intentionally lowercase inline fragments, and official authority names can be flagged. French compound colours such as *vert sauge* are legitimate even when a style rule misclassifies them. Review these with context rather than accepting spelling or word-order suggestions that change meaning. Currency/percentage spacing is evaluated after locale formatting.

Specific residual examples: German *für wen* must not become *für wenn*; French *ou* expresses the intended alternative, not the location adverb *où*. The mixed-gender French subject *le paiement, la gestion des commandes et les informations clients* correctly takes masculine plural *essentiels*. UI headings do not require sentence-final full stops, and HTTP header syntax must not be changed to French punctuation. Style suggestions about repeated words or writing numbers out in words were not blindly adopted. Technical Dutch compounds such as *browseropslag* and official names such as *Gegevensbeschermingsautoriteit* are retained even if a spelling/readability rule does not know them.

This review materially improves the copy but is **not native-speaker signoff, certified legal translation, or legal approval**. Final commercial/legal terms still need appropriate bilingual/legal review. Registration/VAT details, final contract issuance, payment collection, and manual signature/deposit verification remain unchanged and deferred. No push or deployment was performed.

## Same-day HTML-email copy follow-up

The 958-message evidence above describes the translation-correction baseline. The later HTML-email request adds **25 manually curated keys** and retires two replaced success messages: **981 current source messages** and **587 curated messages**. This copy covers client confirmations, studio labels, accurate secondary-delivery feedback, form disclosures, and recipient-hash privacy wording. Staff notifications intentionally remain English while showing the visitor's language; client confirmations use that language.

All new copy received a main-assistant meaning/register pass and LanguageTool checking using the existing rendered-message cache. Corrected the Dutch compound *ontvangersadressen* and made the French marketing sentence gender-neutral. Remaining new spelling suggestions concern the Hotwire brand. Final report digests and cached strings match all **981/981 rendered messages per language**; current total residual suggestions are **268 Dutch**, **187 French**, **205 German**. These are reviewed suggestions, not a claim of zero linguistic errors. No new Google translation generation was needed and no private visitor data was processed. See `email.md` for mail implementation, verification, research, and limits.
