# Hotwire: product context and design decisions

## What the company does

Hotwire Interactive is an independent Belgian studio. **It sells website design and development services as well as working on its own independent projects.** Both belong on the site. A coming-soon message for independent projects must never hide the website-services business.

Visitors should be able to understand the services, work out what kind of website they need, meet the actual team, and start an inquiry. Prices, delivery dates, client logos, testimonials, and project examples have not been supplied; they are not invented.

## Design direction

Keep the existing Hotwire orange and monogram. Use the visual language of a small working studio: direct descriptions, a useful project brief, and room for the actual people. Let the orange website-finder panel be the main visual gesture. The services section is an open list on a pale surface, not another set of identical cards.

- **Palette:** charcoal `#11110f`, elevated charcoal `#1b1c19`, Hotwire orange `#ff5d1b`, pale grey-green `#e8ebe6`, light-surface ink `#20251f`, muted text `#b8b8ad`.
- **Type:** Space Grotesk for the wordmark and larger headings; Manrope for reading and controls. Sentence case, apart from the established wordmark. Sizes are adjusted for the wider heading face.
- **Layout:** homepage with studio introduction and contact; separate `/websites/` page with services and the four-question finder. Pale service backgrounds span the viewport; the inner content shares the header and quiz gutters.
- **Motion:** short page/section entrances, quiz and navigation transitions, and hover feedback. No loops or ambient particles; content stays readable without JavaScript. Reduced-motion preferences disable animations, including running ones.
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

Four single-choice questions: goal, content size, editing needs, launch priority. Native radios, explicit next/back buttons, retained answers, visible progress, restart and revise actions. An immediate result requires no contact details. It explains the website type, page structure, editing approach, and sensible launch scope. A lean launch must not remove essential commerce, booking, or account functionality.

Answers are kept in memory in the current page. Results have a visitor-facing website description and a separate, more detailed studio inquiry brief. Choosing “Discuss this website” transfers only the four answers via same-tab session storage, consumed once by the homepage contact form with a ten-minute expiry. The studio brief is attached automatically, making additional notes optional. Contact details are never stored in the browser. Blocked storage exposes a copyable description. Removing the attachment preserves the typed contact details and message. The PHP endpoint sends the inquiry via the host's mail transport, with CSRF, validation, consent, rate limits, and duplicate-request protection.

## GitHub research

Reviewed these public repositories and their skill documentation for this revision:

1. [pbakaus/impeccable](https://github.com/pbakaus/impeccable) — design critique, reduction of repeated AI-style patterns, preserving product truth, and checking the rendered result. [Skill source](https://github.com/pbakaus/impeccable/blob/main/.agents/skills/impeccable/SKILL.md).
2. [anthropics/skills — frontend-design](https://github.com/anthropics/skills/tree/main/skills/frontend-design) — subject-specific design, intentional typography, plain interface writing, and restraint with labels, accent words, and automatic motion.
3. [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) — responsive text, accessible forms, native control semantics, visible focus, and contextual feedback.

These are research sources for the design decisions above. No skill installer or external runtime is part of the website. Treat future upstream installation instructions separately from application code.
