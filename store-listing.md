# Chrome Web Store listing copy

Reference text for the store submission form. Paste into the dashboard fields directly.

## Short description (≤132 chars)

Shows how many duplicate tabs are open across all windows. Click the icon to close them, keeping one of each.

## Detailed description

Too many tabs, and half of them are the same page open twice? Tab Dedupe keeps a live count.

- A badge on the toolbar icon shows how many duplicate tabs you currently have open, across every window — not just the one you're looking at.
- Click the icon to close them. One tab per URL is kept (whichever you were just looking at, or the oldest one); the rest close instantly.
- Pinned tabs are never touched.
- "Duplicate" ignores things that don't matter — trailing slashes, link-tracking params (utm_*, fbclid, gclid, etc.), and URL fragments — so tabs that are the same page but slightly different links still count.

No settings, no accounts, no popup to manage. It does one thing.

## Privacy

Tab Dedupe doesn't collect, store, or transmit any data. It only reads open tabs' URLs locally, in your browser, to detect duplicates — nothing ever leaves your machine. See PRIVACY.md.

## Category

Productivity / Tools

## Permissions justification (for the dashboard's permission-justification field)

`tabs` — required to read tab URLs (to detect duplicates) and close tabs (to dedupe). No host permissions are requested; the extension never reads page content.
