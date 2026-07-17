# DESIGN.md — Mason Homes

## Visual Theme & Atmosphere

Refined residential luxury with architectural credibility. Warm, editorial, confident — but technically grounded. The aesthetic bridges a high-end contractor's print collateral and a licensed general contractor's credentials wall. Editorial serif display type carries the warmth. Monospace eyebrows and license numbers carry the credibility.

Tone: quiet confidence, not shouted. Premium materials implied through restraint — ivory backgrounds, deep charcoal, saturated copper accent. The copper is the one warm moment in an otherwise disciplined palette. No gradients. No purple. No emoji.

## Color Palette & Roles

| Semantic Name | Hex       | Role |
|---------------|-----------|------|
| Ivory         | `#f7f2e8` | Primary background (warm off-white) |
| Cream         | `#efe7d4` | Secondary background (section alternation) |
| Warm White    | `#faf6ed` | Card surfaces on cream sections |
| Bone          | `#e6dcc6` | Tertiary surfaces |
| Charcoal      | `#1a1814` | Primary text, dark-mode sections, nav solid |
| Graphite      | `#3a3732` | Body prose text |
| Muted         | `#8a8276` | Eyebrow labels, captions, meta |
| **Copper**    | `#c8623c` | **Primary accent — italic highlights, buttons, mono eyebrows, links** |
| Copper-Dark   | `#a44e2d` | Button hover states, link default |
| Copper-Light  | `#d88a62` | Accent on dark backgrounds |
| Line          | `rgba(31,29,26,.14)` | Dividers, borders |

Hierarchy: ivory 60% / cream 25% / charcoal dark sections 10% / copper accent 5%.

The CSS variables are still named `--bronze`, `--bronze-dk`, `--bronze-lt` for backwards compatibility, but their values are the copper hex codes above.

## Typography Rules

Three font families:
- **Cormorant Garamond** — display headings, card titles, italic accents
- **Inter** — body copy, navigation, buttons
- **JetBrains Mono** — eyebrows, credentials, numbers, technical metadata

H1 on the homepage scales from 44px to 100px (clamp 44px, 7vw, 100px). Interior pages scale from 42px to 94px. Section H2s scale from 32px to 52px. Cards, body, eyebrows all follow the table below.

Italic accent rule: H1 and H2 always contain exactly one italic word in copper. Choose the key action/object word (Remodeling, Custom, Extraordinary, designed, catalogued). Never italicize stopwords.

Eyebrow rule: Always mono, always uppercase, always with a leading 28–32px horizontal rule (`::before { content:''; width:32px; height:1px; background:copper; }`). On centered eyebrows, add a matching rule after with `::after`.

Never use: Inter for display, sans-serif at body weight 400 (use 300), all-caps on body text, text-shadow, Cormorant for mono-style technical data.

## Component Stylings

Buttons are copper background with ivory text, 2px border-radius, uppercase 11px letter-spacing .22em. Hover lifts 2px with a diffuse copper shadow.

Cards come in four shapes:
- Service card (homepage) — 3:4 photo aspect, dark overlay, mono "— 01 · Kitchen" label, H3 title, hover-reveal description.
- Capability card (service page) — mono "— 01" label with horizontal rule, Cormorant H3, body copy.
- Location card — photo + overlay + mono county eyebrow.
- Blog/insight card — 16:10 photo, mono category eyebrow, H3, excerpt, copper "Read article →".

Forms use border-bottom only with copper focus state. Form card has 3px copper left border, 2px outer radius.

Nav is fixed top, transparent over hero, scrolls to ivory with backdrop blur. Dropdowns use 2px copper border-left on hover.

## Layout Principles

Max container width: 1280px (1180px for CTA bands, 920px for prose-heavy pages, 760px for blog posts). Section padding 110–130px desktop / 70–80px mobile / 40px horizontal. Alternating ivory → cream → ivory → charcoal section backgrounds. Gap rhythm: 22–26px between cards, 60–90px between sections internally, 130px between major sections.

Grids: 4-column for service/location cards, 3-column for capability grids and blog posts, 2-column for split hero+sidebar layouts. All collapse to 1-column on mobile.

## Depth & Elevation

No drop shadows by default. Depth comes from color (cream inset, charcoal dark band, border lines) and from borders, not shadows. On hover, cards get translateY(-2px) and a long diffuse shadow. Never sharp shadows. Dark sections use decorative copper-outline circles (1px border, 500–600px diameter) for atmosphere. Corner radius: 2px on buttons and form cards. 0px everywhere else.

## Do's and Don'ts

Do: Cormorant Garamond for every display heading, italicize exactly one word per H1/H2 in copper, JetBrains Mono for every eyebrow and license number and technical metadata (prices, lead times, dimensions), cite sources inline for every price, use em-dashes for rhythm, keep copper to 5% of visual weight.

Don't: gradients (except hero overlay), box shadows in rest state, emoji or decorative icons in body copy, marketing language like "dream space," "serene oasis," "bespoke," "curated," "elevate your home" (see full ban list), purple or neon, sans-serif headings, all-caps H1/H2, Cormorant italic for numeric eyebrows (that's mono now).

## Responsive Behavior

Breakpoints: 1024px (tablet), 960px (collapse nav), 640px (full mobile). Mobile nav: hamburger → full-screen dropdown with collapsible sub-menus. Touch targets minimum 44×44px. Multi-column grids collapse to single column, not stacked-half. Hero H1 scales proportionally with vw — on mobile, drops to ~36–38px; on 4K desktop reaches 100px.

## Agent Prompt Guide

Quick reference for new sections: ivory or cream background, Cormorant Garamond 400 heading with italic copper word, JetBrains Mono 11px .22em eyebrow with 32px horizontal rule prefix, Inter 300 body in graphite, copper #c8623c accent, 110–130px section padding, 1280px container max-width, 2px corner radius on buttons and form cards.

Ready-to-use prompt: "Build a [component type] using the Mason Homes design system: Cormorant Garamond for headings with one italic copper word, JetBrains Mono for eyebrows and technical data, Inter 300 for body, ivory/cream/charcoal palette, copper (#c8623c) accent, no shadows in rest state, no gradients, 110–130px section padding, 2px button radius."
