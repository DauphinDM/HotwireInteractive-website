# Implementation Plan: Hotwire Interactive Coming-Soon Website

This document outlines the architecture, visual design system, file structure, component specifications, and execution phases for the official company website of **Hotwire Interactive** (`studio.hotwireinteractive.co.uk`), an independent studio based in Belgium.

---

## 1. Vision & Branding Guidelines

### 1.1 Brand Identity
* **Studio Name:** Hotwire Interactive
* **Location:** Belgium
* **Target Domain:** `studio.hotwireinteractive.co.uk` (Hosted via DirectAdmin)
* **Current Message:** *"Something New Is Coming Soon."*
* **Core Philosophy:** Pairing thoughtful digital work with a distinctive visual identity and clear, intentional communication.

### 1.2 Aesthetic & Visual Language (Refined Obsidian Tech Aesthetic)
* **Theme:** A focused industrial studio presence with a dark carbon base and hot red-orange accents.
* **Palette Principle:** Warm metal orange (`#FF5D1B`) against deep carbon surfaces, with restrained amber highlights and no purple or blue bias.
* **Layout:** Clean, spacious, responsive, and content-first, with subtle motion and a clear coming-soon message.

---

## 2. Architecture & File Structure

```
HotwireInteractiveWEBSITE/
├── public/
│   ├── favicon.svg               # Hotwire monogram studio favicon
│   ├── logo.svg                  # Full studio logo wordmark
│   ├── robots.txt                # Crawler access rules
│   ├── sitemap.xml               # Canonical site URL
│   ├── social-preview.png        # Discord/Open Graph preview image
│   └── social-preview.svg        # Editable social preview source
├── src/
│   ├── css/
│   │   └── style.css             # Tailwind base + custom glassmorphic utilities
│   ├── js/
│   │   ├── canvas-bg.js          # Subtle 60fps ambient particle atmosphere
│   │   └── main.js               # Core app initialization, navigation & contact form
├── index.html                    # Single-page application markup
├── team.html                     # Public team overview page
├── team-member-template.html     # Copy-and-edit profile template
├── tailwind.config.js            # Extended theme tokens
├── postcss.config.js             # PostCSS Tailwind + Autoprefixer
├── package.json                  # Vite & Tailwind dependency manifest
├── implementation_plan.md        # Architecture specification (this file)
└── DEPLOY.md                     # DirectAdmin deployment instructions
```

---

## 3. Website Section Breakdown

### 3.1 Sticky Navigation Bar
* **Branding:** Hotwire Interactive kinetic 'H' monogram + studio wordmark.
* **Navigation Links:** `Studio`, `Contact`.
* **Action:** Direct CTA button `Contact us` in the Hotwire accent.

### 3.2 Hero Section (`min-h-screen`)
* **Background:** Deep dark carbon backdrop with a restrained grid and optional ambient particle motion.
* **Headline:** *"Something New Is Coming Soon."*
* **Studio Premise:** Independent Belgian studio based in Belgium, currently in formation.
* **Dual Action CTAs:** "Stay in Contact" & "About the Studio".

### 3.3 Studio Status
* **Status:** Coming soon.
* **Public Details:** The studio will share more about its direction and first public release when ready.
* **Primary Action:** Direct visitors to `contact@hotwireinteractive.co.uk` for introductions and inquiries.

### 3.4 Studio Presence
* **Independent European Craft:** A focused studio rooted in Belgium.
* **Work in Formation:** New work is taking shape behind the scenes.
* **Clear Communication:** Updates will be shared directly when they are ready.

### 3.5 Team Page & Profile Template
* **Team Page:** Public roster page with honest placeholders until team details are ready.
* **Profile Template:** Noindex copy-and-edit page for adding individual team members.

### 3.6 Contact Section & Footer
* **Interactive Contact UI:** Accessible contact form for studio inquiries, introductions, press, and collaborations.
* **Footer Coordinates:** Hotwire Interactive • Belgium • `studio.hotwireinteractive.co.uk`.
