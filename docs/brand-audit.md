# UpSwing Golf brand audit

Audit date: August 14, 2026. Source of truth: [upswinggolf.com](https://www.upswinggolf.com/) and its published Shopify Pipeline 7.5.0 theme assets.

## Typography

- Core family: Helvetica with Inter and Open Sans fallbacks. Published Inter assets include 400 and 500 weights.
- Body, heading, and accent defaults are largely 400; emphasized copy and controls use 500.
- Navigation, buttons, kickers, and footer labels are uppercase with `0.09em` letter spacing.
- Storefront type scale is fluid by breakpoint. Desktop theme headings range from 48px for a standard h1 into much larger campaign sizes; mobile starts around 32px for a standard h1. Custom campaign heroes use tighter line heights and heavier/larger display treatment.
- Visual personality comes from scale, spacing, and contrast rather than many weights or decorative typefaces.

## Color

- Foundation: white `#FFFFFF`, black `#000000`, near-black `#040404`/`#060606`.
- Primary theme accent: UpSwing blue `#347EE4` with hover `#0957C3`.
- Navigation: black with off-white `#F1F1F1`; divider `#282828`.
- Footer: `#040404`; subfooter `#060606`; muted footer text `#919191`.
- Red appears selectively in campaign modules, typically around `#D34B47`–`#D94A4A`. It is not a general UI fill.

## Layout, spacing, and responsive behavior

- Main maximum width: 1500px.
- Desktop outer gutter: 50px; theme gutter: 20px; navigation gutter: 15px.
- Breakpoints published by the theme: 480px, 768px, 1100px, and 1400px.
- Desktop header is an approximately 83px black/transparent bar with a 115px white logo, centered uppercase navigation, and thin icon strokes.
- Mobile/touch navigation switches to a hamburger drawer. Controls are at least 48–60px tall and drawer rows use full-width separators.
- Footer uses 50px main padding, uppercase section labels, accordion treatment below 768px, a large “Grow Like a Pro™” line, and a separate darker subfooter.

## Controls and component treatment

- Theme primary buttons use a square `0px` radius, uppercase tracking, compact line height, and strong black/white inversion. Some newer editorial campaign modules use rounded pill CTAs, so pills are an exception rather than the locator’s default.
- Standard inputs are square with a thin neutral border, compact inner padding, and a subtle focus shadow. Mobile inputs resolve to 16px to prevent unwanted browser zoom.
- Theme small/medium/large radius tokens are 3px, 12px, and 36px, but structural cards generally rely on crisp edges, imagery, and hairline borders.
- Icons are simple, single-color, approximately 2px strokes. The locator uses restrained text/symbol treatments and avoids a mismatched icon library.

## Photography and tone

- Photography is large, high-contrast, and edge-to-edge, often with dark overlays supporting bold white type.
- Brand voice is short, confident, athletic, parent-friendly, and product-led: “Grow Like a Pro,” “Find Your Fit,” and stage-based progression language.
- The locator mirrors this through a dark athletic hero, oversized type, restrained red/blue contour accents, crisp editorial panels, and minimal chrome rather than generic dashboard cards.
