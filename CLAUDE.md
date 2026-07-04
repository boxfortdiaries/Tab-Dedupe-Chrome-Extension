# Tabbler

Chrome extension (Manifest V3). One job: show how many duplicate tabs are
open across all windows as a badge on the toolbar icon, and close them —
keeping one original each — when the icon is clicked. No build step, no
dependencies, no framework, no popup UI. Just `background.js`.

## Stack

- Manifest V3, vanilla JS, no bundler, no npm dependencies.
- `permissions: ["tabs"]` only — no host permissions, no content scripts,
  no `default_popup` (that would swallow `chrome.action.onClicked` clicks —
  see Watch out for).

## Commands

- No install/build step.
- Test: `chrome://extensions` → enable Developer mode → "Load unpacked" →
  select this folder.
- After any edit to `background.js`: click the reload icon on the
  extension's card in `chrome://extensions` (service worker needs a fresh
  load to pick up code changes).

## Architecture

Everything lives in `background.js` — a single MV3 service worker:

- **Badge**: `updateBadge()` queries all tabs, groups duplicates, and sets
  the badge text to the count of tabs that *would* be closed by a dedupe
  pass (every tab in a group except the one that'd be kept — not the total
  duplicate tab count). Recomputed, debounced ~250ms, on `tabs.onCreated`,
  `tabs.onRemoved`, and `tabs.onUpdated` (status complete). This is a live,
  persistent count — not a "just closed N tabs" flash.
- **Click-to-dedupe**: `chrome.action.onClicked` is the *only* thing that
  closes duplicates. There is no automatic background dedupe — duplicates
  accumulate and sit in the badge count until you click the icon.
- **Dedupe logic**: URL normalization + grouping + keep/close rule, see
  Conventions below. No longer a separate `dedupe.js` module — that split
  existed only to share the rule with a popup UI that's since been removed;
  with one consumer, it's inlined directly in `background.js`.

## Conventions — dedup rules (why this exact logic, not something simpler/different)

**URL normalization** (two tabs are "duplicates" iff these match exactly):
strip hash fragment → strip trailing slash from path (unless path is `/`) →
drop tracking params (`utm_*`, `gclid`, `fbclid`, `msclkid`, `mc_cid`,
`mc_eid`, `igshid`, `ref`, `ref_src`) → sort remaining query params
alphabetically → rebuild as `protocol//host/path?sorted-query`.

**Keep/close rule**: within a duplicate group, keep the active tab if
exactly one dupe is active; otherwise keep the lowest tab id (oldest tab).
Pinned tabs are excluded from dedup entirely — never a keep/close candidate.

## Deliberate simplifications — don't "fix" these unprompted

- No in-memory `Map` of url→tabId. MV3 service workers get killed after
  ~30s idle, so any such map has to be rebuilt from `chrome.tabs.query({})`
  on wake anyway — it buys nothing at realistic tab counts. Every scan does
  a fresh full query. Only add a map if profiling ever shows the rescan
  itself is a measured cost.
- No `storage` permission — nothing persists across restarts, there are no
  settings.
- Badge text is set directly on every relevant tab event — no
  `chrome.alarms`, no batching beyond the 250ms debounce.

## Out of scope — do not build

- **Automatic background dedupe.** Explicitly rejected in favor of
  click-only — duplicates are meant to accumulate and show in the badge
  until the user acts.

## Watch out for

- MV3 service workers are non-persistent. An "it worked once, then
  stopped" bug is very likely a worker-lifecycle issue (the worker went
  idle and a listener didn't fire until Chrome woke it back up) rather than
  a logic bug in the dedup rule itself.
- If `manifest.json`'s `action` ever gets a `default_popup` added back,
  `chrome.action.onClicked` stops firing entirely and the icon just opens
  the (nonexistent) popup instead of deduping — this has bitten this
  project before during the popup→click-to-dedupe rewrite.
