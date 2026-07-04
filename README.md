# Tabbler

A tiny Chrome extension that keeps track of duplicate tabs across all your open windows and closes them with one click.

## How it works

- The toolbar badge shows how many duplicate tabs you currently have open, counted across every window, not just the one in front of you.
- Click the icon to close them. One tab is kept per URL (whichever you were just looking at, or the oldest one); the rest close instantly.
- Pinned tabs are never touched.
- "Duplicate" ignores things that don't matter for identifying the same page: trailing slashes, link-tracking params (`utm_*`, `fbclid`, `gclid`, etc.), and URL fragments.

No settings, no accounts, no popup to manage. It does one thing.

## Install

Not yet on the Chrome Web Store. To try it now:

1. Download or clone this repo.
2. Go to `chrome://extensions`, enable **Developer mode** (top right).
3. Click **Load unpacked** and select this folder.

## Privacy

This extension collects nothing. It reads open tabs' URLs locally, in your browser, only to detect duplicates — nothing ever leaves your machine. See [PRIVACY.md](PRIVACY.md).

## License

MIT — see [LICENSE](LICENSE).
