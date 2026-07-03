const TRACKING_PARAM_EXACT = new Set([
  'gclid', 'fbclid', 'msclkid', 'mc_cid', 'mc_eid', 'igshid', 'ref', 'ref_src',
]);

function normalizeUrl(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  url.hash = '';

  if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.slice(0, -1);
  }

  const keptParams = [];
  for (const [key, value] of url.searchParams.entries()) {
    if (key.startsWith('utm_') || TRACKING_PARAM_EXACT.has(key)) continue;
    keptParams.push([key, value]);
  }
  keptParams.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

  const query = keptParams.length
    ? '?' + keptParams.map(([k, v]) => `${k}=${v}`).join('&')
    : '';

  return `${url.protocol}//${url.host}${url.pathname}${query}`;
}

function isDedupeCandidate(tab) {
  if (tab.pinned) return false;
  if (!tab.url) return false;
  return tab.url.startsWith('http://') || tab.url.startsWith('https://');
}

// Groups of 2+ tabs that share a normalized URL. Each group is sorted by tab id.
function buildDuplicateGroups(tabs) {
  const groups = new Map();

  for (const tab of tabs) {
    if (!isDedupeCandidate(tab)) continue;
    const key = normalizeUrl(tab.url);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(tab);
  }

  return [...groups.values()]
    .filter((group) => group.length > 1)
    .map((group) => group.slice().sort((a, b) => a.id - b.id));
}

// Within a duplicate group, keep the active tab if exactly one dupe is
// active; otherwise keep the lowest tab id (oldest tab).
function pickKeeper(group) {
  const activeDupes = group.filter((t) => t.active);
  return activeDupes.length === 1
    ? activeDupes[0]
    : group.reduce((oldest, t) => (t.id < oldest.id ? t : oldest));
}

// Badge shows the count of tabs that WOULD be closed by a dedupe pass (every
// tab in a group except the one that'd be kept) — not the total duplicate
// tab count. Live/persistent: recomputed on every tab create/remove/load,
// not a "just closed N" flash.
async function updateBadge() {
  const tabs = await chrome.tabs.query({});
  const groups = buildDuplicateGroups(tabs);
  const dupeCount = groups.reduce((sum, g) => sum + g.length - 1, 0);

  chrome.action.setBadgeBackgroundColor({ color: '#d33' });
  chrome.action.setBadgeText({ text: dupeCount > 0 ? String(dupeCount) : '' });
}

// Clicking the toolbar icon is the only thing that closes duplicates — no
// automatic background dedupe. (chrome.action.onClicked only fires because
// manifest.json has no default_popup; adding one back would silently kill
// this listener.)
async function dedupeAll() {
  const tabs = await chrome.tabs.query({});
  for (const group of buildDuplicateGroups(tabs)) {
    const keeper = pickKeeper(group);
    for (const tab of group) {
      if (tab.id === keeper.id) continue;
      await chrome.tabs.remove(tab.id);
    }
  }
  updateBadge();
}

let scanDebounce = null;

function scheduleBadgeUpdate() {
  if (scanDebounce) clearTimeout(scanDebounce);
  scanDebounce = setTimeout(updateBadge, 250);
}

chrome.tabs.onCreated.addListener(scheduleBadgeUpdate);
chrome.tabs.onRemoved.addListener(scheduleBadgeUpdate);
chrome.tabs.onUpdated.addListener((_tabId, changeInfo) => {
  if (changeInfo.status === 'complete') scheduleBadgeUpdate();
});
chrome.action.onClicked.addListener(dedupeAll);

updateBadge();
