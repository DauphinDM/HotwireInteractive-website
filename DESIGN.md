# Hotwire: product context and design decisions

## What the company does

Hotwire Interactive is an independent Belgian studio. **It sells website design and development services as well as working on its own independent projects.** Both belong on the site. A coming-soon message for independent projects must never hide the website-services business.

Visitors should understand the services, get an indicative scope-led estimate from €500, inspect fictional design concepts, meet the actual team, and start an inquiry. Package ranges are planning budgets, not quotes. Do not invent client logos, testimonials, project outcomes, registration details, or guaranteed delivery dates. Demo brands and products must remain explicitly fictional.

## Design direction

Keep the existing Hotwire orange and monogram. Use the visual language of a small working studio: direct descriptions, a useful project brief, and room for the actual people. Let the orange website-finder panel be the main visual gesture. The services section is an open list on a pale surface, not another set of identical cards.

- **Palette:** charcoal `#11110f`, elevated charcoal `#1b1c19`, Hotwire orange `#ff5d1b`, pale grey-green `#e8ebe6`, light-surface ink `#20251f`, muted text `#b8b8ad`.
- **Type:** Space Grotesk for the wordmark and larger headings; Manrope for reading and controls. Sentence case, apart from the established wordmark. Sizes are adjusted for the wider heading face.
- **Layout:** homepage with studio introduction and contact; `/websites/` has services and the ten-question finder, with separate pricing, examples, and agreement pages. Pale service backgrounds span the viewport; inner content shares the header and quiz gutters.
- **Discoverability:** Pricing and Examples are first-level links, with persistent phone shortcuts and direct homepage actions—not only links at the bottom of services. A shared build-time shell keeps them consistent.
- **Languages:** English sources generate Dutch/French/German routes. A visible endonym-based switcher changes language in place, preserving form and quiz state; native links work without JavaScript. Detection uses browser languages, not IP geolocation. Only explicit language choices persist, as a language code. User text is never translated.
- **Motion:** short page/section entrances, quiz and navigation transitions, and hover feedback. No loops or ambient particles; content stays readable without JavaScript. Reduced-motion preferences disable animations, including running ones.
- **Pickers:** the owner's reference is native CSS `::picker(select)`, not a third-party library. The shared stylesheet progressively enables `appearance: base-select` on eligible selects and their pickers within `@supports`. Keep browser-managed positioning, keyboard selection, focus restoration, and the standard-select fallback. Radio-card questions remain native radios; do not convert them just to use this pseudo-element.
- **Copy:** name the work and explain next steps. Replace slogans such as “a new chapter, our own way” with concrete website and studio information.

```text
Brand                         Websites  Studio  Team  Contact
We design and build           What should yours do?
websites.                     [Inquiries] [Bookings] [Sales]

Independent studio            Website work + own projects + real team

Tell us about your project    Contact composer + optional quiz brief

/websites/
Website services              Clear, descriptive service rows

Which one fits me?            [Question → choice → recommendation]
```

## Quiz contract

Ten single-choice questions: goal, content size, editing, priority, commerce, bookings, accounts, content readiness, timing, and budget. Native radios, explicit next/back buttons, retained answers, visible progress, restart and revise actions. Results need no contact details and explain the website type, added workflows, package, price drivers, editing, and launch scope. Requirements independently set package floors. Budget does not change scope or inflate price; a shortfall is shown explicitly. Local picker styling must not hide inputs or replace native arrow-key behaviour.

Answers stay in page memory. Results have a visitor description and a separate studio brief. Choosing “Discuss this website” transfers only validated answer fields and an optional allowlisted design ID via same-tab session storage, consumed once with a ten-minute expiry. The brief is attached automatically; additional notes are optional. Contact details are never written to browser storage. Blocked storage exposes a copyable description. Removing the attachment preserves typed contact details and message. The existing configured PHP mail service is unchanged.

## Commercial boundary

Demo baskets, booking slots, and agreement drafting run locally and create no transaction. The agreement tool is a printable **review draft**, not an issued/signable agreement. A real kickoff requires manually verified signed agreement **and** cleared 50% deposit, followed by written studio confirmation. Do not implement a public “I paid” checkbox as verification. See `ai_here/` for evidence, remaining work, and the private-record checklist.

The owner has not registered the company yet. Registration, tax details, and approved final service terms remain deferred; keep working on the inquiry/planning interface without inventing a legal entity or enabling final commercial issuance. The appropriate actual operator/controller identification for any public site still needs confirmation.

## GitHub research

Reviewed these public repositories and their skill documentation for this revision:

1. [pbakaus/impeccable](https://github.com/pbakaus/impeccable) — design critique, reduction of repeated AI-style patterns, preserving product truth, and checking the rendered result. [Skill source](https://github.com/pbakaus/impeccable/blob/main/.agents/skills/impeccable/SKILL.md).
2. [anthropics/skills — frontend-design](https://github.com/anthropics/skills/tree/main/skills/frontend-design) — subject-specific design, intentional typography, plain interface writing, and restraint with labels, accent words, and automatic motion.
3. [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) — responsive text, accessible forms, native control semantics, visible focus, and contextual feedback.

These are research sources for the design decisions above. No skill installer or external runtime is part of the website. Treat future upstream installation instructions separately from application code.
