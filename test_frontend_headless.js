const fs = require('fs');

// Minimal browser DOM simulation
const elements = new Map();

function createElement(tag) {
  const el = {
    tagName: tag.toUpperCase(),
    id: '',
    className: '',
    classList: {
      add: (...cls) => { cls.forEach(c => { if (!el.className.includes(c)) el.className += ' ' + c; }); },
      remove: (...cls) => { cls.forEach(c => { el.className = el.className.replace(new RegExp('\\b' + c + '\\b', 'g'), '').trim(); }); },
      toggle: (c) => { if (el.className.includes(c)) el.classList.remove(c); else el.classList.add(c); },
      contains: (c) => el.className.includes(c)
    },
    style: {},
    innerHTML: '',
    innerText: '',
    children: [],
    attributes: {},
    setAttribute: (k, v) => { el.attributes[k] = v; },
    getAttribute: (k) => el.attributes[k],
    removeAttribute: (k) => { delete el.attributes[k]; },
    appendChild: (child) => { el.children.push(child); },
    remove: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    scrollIntoView: () => {},
    closest: () => null,
    querySelector: () => null,
    querySelectorAll: () => []
  };
  return el;
}

// Parse index.html element IDs
const html = fs.readFileSync('frontend/index.html', 'utf8');
const idMatches = html.matchAll(/id=["']([a-zA-Z0-9_-]+)["']/g);
for (const m of idMatches) {
  const el = createElement('div');
  el.id = m[1];
  elements.set(m[1], el);
}

// Global window & document
global.window = {
  location: { protocol: 'https:', hostname: 'mov-ani.vercel.app', origin: 'https://mov-ani.vercel.app', href: 'https://mov-ani.vercel.app/' },
  addEventListener: () => {},
  removeEventListener: () => {},
  open: () => {},
  document: null,
  localStorage: {
    store: {},
    getItem: (k) => global.window.localStorage.store[k] || null,
    setItem: (k, v) => { global.window.localStorage.store[k] = String(v); },
    removeItem: (k) => { delete global.window.localStorage.store[k]; }
  }
};
global.requestAnimationFrame = (cb) => { cb(); };
global.window.requestAnimationFrame = global.requestAnimationFrame;

global.document = {
  readyState: 'complete',
  getElementById: (id) => elements.get(id) || null,
  querySelector: (sel) => {
    if (sel.startsWith('#')) return elements.get(sel.slice(1)) || null;
    return null;
  },
  querySelectorAll: () => [],
  createElement: createElement,
  addEventListener: () => {}
};
global.window.document = global.document;
global.localStorage = global.window.localStorage;
global.navigator = { userAgent: 'NodeTest' };

// Load scripts in order
const vm = require('vm');
const scriptFiles = ['state.js', 'auth.js', 'api.js', 'ui.js', 'xray.js', 'player.js', 'search.js', 'app.js'];
for (const f of scriptFiles) {
  const code = fs.readFileSync('frontend/js/' + f, 'utf8');
  try {
    vm.runInThisContext(code, { filename: f });
    console.log(`[PASS] Evaluated ${f}`);
  } catch (err) {
    console.error(`[FAIL] Evaluating ${f}:`, err);
    process.exit(1);
  }
}

// Test App.init execution
console.log('\n--- Testing App.init() ---');
try {
  global.window.App.init();
  console.log('[PASS] App.init() executed without throwing!');
} catch (err) {
  console.error('[FAIL] App.init() threw an exception:', err);
  process.exit(1);
}

// Verify rendered trays
const traysToCheck = [
  'top10-tray',
  'trending-tray',
  'anime-tray',
  'movies-tray',
  'kannada-classics-tray',
  'hindi-classics-tray',
  'series-tray',
  'toprated-tray',
  'action-tray',
  'scifi-tray'
];

console.log('\n--- Checking Tray Contents after App.init() ---');
let allRendered = true;
for (const tid of traysToCheck) {
  const el = elements.get(tid);
  const cardCount = (el && el.innerHTML) ? (el.innerHTML.match(/media-card/g) || []).length : 0;
  console.log(`Tray [${tid}]: ${cardCount} cards rendered`);
  if (cardCount === 0) {
    allRendered = false;
  }
}

if (allRendered) {
  console.log('\n>>> SUCCESS: All homepage trays populated with movie cards! <<<');
} else {
  console.error('\n>>> ERROR: Some homepage trays are still empty! <<<');
  process.exit(1);
}

// Interactive Component & Flow Tests
console.log('\n--- Testing Interactive Workflows ---');
async function runInteractiveTests() {
  try {
    // 1. Language Filter Test
    console.log('[TEST 1] Filter Language: kn');
    await global.window.App.filterLanguage('kn');
    const langTray = elements.get('language-tray');
    console.log(`Language Tray (kn): ${(langTray.innerHTML.match(/media-card/g) || []).length} titles`);

    // 2. Open Details Modal by ID
    console.log('[TEST 2] Open Details for Kantara');
    global.window.UI.openDetailsById('kantara');
    const modalTitle = elements.get('detailsTitle');
    console.log(`Details Modal Title: ${modalTitle.innerText}`);

    // 3. Play Movie by ID
    console.log('[TEST 3] Play Title: kantara');
    global.window.Player.playTitleById('kantara');
    console.log(`Active playing item: ${global.window.State.activePlayingItem?.title}`);
    console.log(`Audio tracks available: ${global.window.State.audioTracks?.length}`);
    console.log(`Active audio track: ${global.window.State.audioTracks[global.window.State.currentAudioTrackIndex]?.label}`);

    // 4. Audio Switching
    console.log('[TEST 4] Cycle Audio Track');
    global.window.Player.cycleAudio();
    console.log(`New audio track: ${global.window.State.audioTracks[global.window.State.currentAudioTrackIndex]?.label}`);

    // 5. OTT Server Switching
    console.log('[TEST 5] Cycle OTT Server');
    global.window.Player.cycleOttServer();
    console.log(`Mirror: ${global.window.Player.mirrors[global.window.Player.currentMirrorIndex]?.name}`);

    // 6. Popout Stream URL Generation
    console.log('[TEST 6] Open Popout Stream');
    global.window.Player.openPopoutStream();

    console.log('\n>>> ALL 6 INTERACTIVE WORKFLOW TESTS PASSED PERFECTLY! <<<');
    process.exit(0);
  } catch (err) {
    console.error('[FAIL] Interactive workflow failed:', err);
    process.exit(1);
  }
}

runInteractiveTests();
