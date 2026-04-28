# Booking Everywhere Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current 4-noleggio-cards model with a single canonical product catalog (variants/add-ons declared per-product), make the detail and booking bottom sheets work on every page, and re-anchor the existing static yacht.html cards to real products — so booking works end-to-end on `index.html`, `yacht.html`, and any future page that loads `app.js`.

**Architecture:** Single declarative product catalog in `EXPERIENCES` (canonical products + marketing aliases). Pure functions (`computeTotal`, `validateRequiredVariants`, `resolveAlias`, `parseDeepLink`) exposed on `window.JSA` for testability. UI logic stays inside the existing IIFE in `assets/js/app.js`. Detail/booking/meteo/backdrop sheets become a JS template injected on init via `injectSheets()`, replacing the inline HTML in `index.html`. Variant rendering is data-driven (chips for single-select, checkboxes for multi-select). Required-variant validation gates the "Prenota" button with a shake-on-click affordance.

**Tech Stack:** Vanilla JS (no build, no framework), CSS (no preprocessor), pure-HTML pages. Tests live in `tests/tests.html` + `tests/tests.js` using `console.assert` style — runnable in any browser, no framework. Chrome DevTools MCP used for visual verification (`mcp__chrome-devtools__*`). Static asset, served via any HTTP server (Python `http.server`, `npx serve`, or directly).

**Spec reference:** `docs/superpowers/specs/2026-04-28-booking-everywhere-design.md`

---

## File structure

**Modified:**
- `assets/js/app.js` — main work (catalog, pure functions, sheet injection, variant rendering)
- `assets/css/app.css` — additive (variant chips, shake keyframe, recap pane)
- `index.html` — remove inline sheet markup (now injected)
- `yacht.html` — add `<script src="assets/js/app.js"></script>`

**Created:**
- `tests/tests.html` — minimal test runner page
- `tests/tests.js` — pure-function tests (computeTotal, validate, resolveAlias, parseDeepLink)
- `tests/run.sh` — convenience launcher (starts a local server + opens tests.html)

**Conventions:**
- Every commit message uses `feat:` / `fix:` / `refactor:` / `test:` / `docs:` prefix matching existing repo style.
- No co-author lines, no Claude attribution (per user CLAUDE.md).
- Pure functions live at the top of `app.js`, attached to `window.JSA = {...}` so tests can import them.
- Run the local server before any browser verification: `cd /Users/alberto/repositories/gestiscilo-it/jetskiadriatic && python3 -m http.server 8765` (the user keeps the server running themselves per CLAUDE.md — do **not** start it from agent code).

---

## Task 1: Bootstrap test harness

**Files:**
- Create: `tests/tests.html`
- Create: `tests/tests.js`
- Create: `tests/run.sh`

- [ ] **Step 1: Create tests/tests.html**

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>JSA tests</title>
<style>
  body{font:14px/1.5 ui-monospace,Menlo,monospace;background:#0f1417;color:#e8eaec;padding:24px}
  h1{font-size:18px;margin:0 0 16px}
  .pass{color:#7CDB8F}
  .fail{color:#FF7A7A;font-weight:700}
  .summary{padding:8px 12px;border-radius:6px;margin-bottom:16px}
  .summary.ok{background:rgba(124,219,143,.15)}
  .summary.bad{background:rgba(255,122,122,.15)}
  ol{padding-left:20px}
  li{margin:2px 0}
</style>
</head>
<body>
<h1>JSA test runner</h1>
<div id="summary" class="summary">running…</div>
<ol id="results"></ol>
<script src="../assets/js/app.js"></script>
<script src="tests.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create tests/tests.js scaffold**

```js
(function(){
  'use strict';
  const results = document.getElementById('results');
  const summary = document.getElementById('summary');
  let passed = 0, failed = 0;

  function test(name, fn){
    try{
      fn();
      results.insertAdjacentHTML('beforeend', `<li class="pass">✓ ${name}</li>`);
      passed++;
    }catch(err){
      results.insertAdjacentHTML('beforeend', `<li class="fail">✗ ${name} — ${err.message}</li>`);
      console.error(name, err);
      failed++;
    }
  }
  function eq(a, b, msg){
    const sa = JSON.stringify(a), sb = JSON.stringify(b);
    if(sa !== sb) throw new Error(`${msg || ''} expected ${sb}, got ${sa}`);
  }

  // Wait for app.js to attach window.JSA
  function run(){
    if(!window.JSA){ summary.textContent = 'window.JSA not found — app.js did not export pure functions'; summary.className = 'summary bad'; return; }

    // Tests will be added below in subsequent tasks.

    summary.textContent = `${passed} passed, ${failed} failed`;
    summary.className = failed ? 'summary bad' : 'summary ok';
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
```

- [ ] **Step 3: Create tests/run.sh**

```bash
#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.."; pwd)"
echo "Open http://localhost:8765/tests/tests.html in your browser."
echo "Run a server in $ROOT (e.g. python3 -m http.server 8765) if not already running."
```

- [ ] **Step 4: Make run.sh executable and verify the harness loads**

Run: `chmod +x tests/run.sh && ls -la tests/`
Open `http://localhost:8765/tests/tests.html` in a browser (server must be already running per CLAUDE.md — user runs the server, not the agent).
Expected: page shows "window.JSA not found — app.js did not export pure functions" (red summary). This confirms harness wiring; we'll fix the export in Task 2.

- [ ] **Step 5: Commit**

```bash
git add tests/
git commit -m "test: bootstrap test harness for pure-function tests"
```

---

## Task 2: Expose pure-function namespace on window.JSA

**Files:**
- Modify: `assets/js/app.js:1-7` (add namespace export at the top of the file)

- [ ] **Step 1: Write the failing test (append inside `run()` in tests/tests.js, before the summary line)**

```js
test('window.JSA exists and exposes computeTotal', () => {
  if(typeof window.JSA !== 'object') throw new Error('JSA not exported');
  if(typeof window.JSA.computeTotal !== 'function') throw new Error('computeTotal missing');
});
```

- [ ] **Step 2: Reload tests.html in the browser**

Expected: `✗ window.JSA exists and exposes computeTotal — JSA not exported`

- [ ] **Step 3: Add the namespace export at the top of app.js**

Edit `assets/js/app.js`. Replace the first 7 lines:

```js
/* =====================================================
   JET SKI ADRIATIC — APP SHELL
   ===================================================== */

(function(){
  'use strict';
```

with:

```js
/* =====================================================
   JET SKI ADRIATIC — APP SHELL
   ===================================================== */

// Pure-function namespace — exposed for tests in /tests/tests.js
// and for any future inline scripts that need pricing or validation logic.
window.JSA = window.JSA || {};

// Stub — replaced in Task 3 with the real pricing function.
window.JSA.computeTotal = function(){ return 0; };

(function(){
  'use strict';
```

- [ ] **Step 4: Reload tests.html**

Expected: `✓ window.JSA exists and exposes computeTotal` (green).

- [ ] **Step 5: Commit**

```bash
git add assets/js/app.js tests/tests.js
git commit -m "feat: expose pure-function namespace on window.JSA"
```

---

## Task 3: Pure function — computeTotal

The pricing function: takes a canonical product + selections + people count, returns total in EUR.

**Files:**
- Modify: `assets/js/app.js` — replace the `computeTotal` stub
- Modify: `tests/tests.js` — add table tests

- [ ] **Step 1: Write failing tests (append inside `run()` in tests/tests.js)**

```js
test('computeTotal — base price only, no variants', () => {
  const product = { id: 'p', basePrice: 100, perPerson: false };
  eq(window.JSA.computeTotal(product, {}, 1), 100);
});

test('computeTotal — replace variant overrides base', () => {
  const product = {
    basePrice: 50, perPerson: false,
    variantGroups: [{
      id: 'durata', selection: 'single', required: true,
      options: [
        { id: '15', priceMode: 'replace', price: 50 },
        { id: '45', priceMode: 'replace', price: 105 }
      ]
    }]
  };
  eq(window.JSA.computeTotal(product, { durata: '45' }, 1), 105);
});

test('computeTotal — add variants stack on top of replace', () => {
  const product = {
    basePrice: 50, perPerson: false,
    variantGroups: [
      { id: 'durata', selection: 'single', required: true,
        options: [{ id: '45', priceMode: 'replace', price: 105 }] },
      { id: 'media', selection: 'multi', required: false,
        options: [
          { id: 'drone', priceMode: 'add', price: 99 },
          { id: 'gopro', priceMode: 'add', price: 15 }
        ] }
    ]
  };
  eq(window.JSA.computeTotal(product, { durata: '45', media: ['drone','gopro'] }, 1), 105 + 99 + 15);
});

test('computeTotal — per-person multiplies basePrice and replaces, but adds are flat', () => {
  const product = {
    basePrice: 289, perPerson: true,
    variantGroups: [{
      id: 'media', selection: 'multi', required: false,
      options: [{ id: 'drone', priceMode: 'add', price: 99 }]
    }]
  };
  // 2 people * 289 + 99 drone (flat, not per-person)
  eq(window.JSA.computeTotal(product, { media: ['drone'] }, 2), 2*289 + 99);
});

test('computeTotal — single optional add picked', () => {
  const product = {
    basePrice: 690, perPerson: false,
    variantGroups: [{
      id: 'catering', selection: 'single', required: false,
      options: [
        { id: 'standard', priceMode: 'add', price: 0 },
        { id: 'premium',  priceMode: 'add', price: 120 }
      ]
    }]
  };
  eq(window.JSA.computeTotal(product, { catering: 'premium' }, 1), 690 + 120);
});

test('computeTotal — Set as multi value works (booking sheet uses Set)', () => {
  const product = {
    basePrice: 50, perPerson: false,
    variantGroups: [{ id: 'media', selection: 'multi', required: false,
      options: [{ id: 'drone', priceMode: 'add', price: 99 }, { id: 'gopro', priceMode: 'add', price: 15 }] }]
  };
  eq(window.JSA.computeTotal(product, { media: new Set(['drone','gopro']) }, 1), 50 + 99 + 15);
});
```

- [ ] **Step 2: Reload tests.html**

Expected: 6 failing tests (`computeTotal — ...` all fail because stub returns 0).

- [ ] **Step 3: Replace the stub in app.js**

Find the line `window.JSA.computeTotal = function(){ return 0; };` and replace with:

```js
window.JSA.computeTotal = function(product, selections, people){
  if(!product) return 0;
  const sel = selections || {};
  const pp  = Math.max(1, people || 1);
  const groups = product.variantGroups || [];

  // Find the active "replace" variant if any. Only the first one wins
  // (only one group ever uses replace per product — durata, by convention).
  let base = product.basePrice || 0;
  for(const g of groups){
    if(g.selection !== 'single') continue;
    const optId = sel[g.id];
    if(!optId) continue;
    const opt = (g.options || []).find(o => o.id === optId);
    if(opt && opt.priceMode === 'replace'){ base = opt.price || 0; break; }
  }

  let total = product.perPerson ? base * pp : base;

  // Sum all "add" options across groups (single + multi, with Set support).
  for(const g of groups){
    const raw = sel[g.id];
    if(raw == null) continue;
    const ids = (raw instanceof Set) ? [...raw] : (Array.isArray(raw) ? raw : [raw]);
    for(const id of ids){
      const opt = (g.options || []).find(o => o.id === id);
      if(opt && opt.priceMode === 'add') total += (opt.price || 0);
    }
  }

  return total;
};
```

- [ ] **Step 4: Reload tests.html**

Expected: 6 ✓ green tests for `computeTotal — ...`.

- [ ] **Step 5: Commit**

```bash
git add assets/js/app.js tests/tests.js
git commit -m "feat: computeTotal pure function with replace/add semantics + per-person mode"
```

---

## Task 4: Pure function — validateRequiredVariants

Returns array of group IDs that are `required: true` but have no selection.

**Files:**
- Modify: `assets/js/app.js` — add new function next to `computeTotal`
- Modify: `tests/tests.js`

- [ ] **Step 1: Write failing tests (append inside `run()`)**

```js
test('validateRequiredVariants — no required groups returns []', () => {
  const product = { variantGroups: [{ id: 'media', required: false, options: [] }] };
  eq(window.JSA.validateRequiredVariants(product, {}), []);
});

test('validateRequiredVariants — required + missing returns the id', () => {
  const product = { variantGroups: [{ id: 'durata', required: true, selection: 'single', options: [] }] };
  eq(window.JSA.validateRequiredVariants(product, {}), ['durata']);
});

test('validateRequiredVariants — required + filled returns []', () => {
  const product = { variantGroups: [{ id: 'durata', required: true, selection: 'single', options: [] }] };
  eq(window.JSA.validateRequiredVariants(product, { durata: '45' }), []);
});

test('validateRequiredVariants — multi required with empty Set is missing', () => {
  const product = { variantGroups: [{ id: 'm', required: true, selection: 'multi', options: [] }] };
  eq(window.JSA.validateRequiredVariants(product, { m: new Set() }), ['m']);
});

test('validateRequiredVariants — multi required with one selection is filled', () => {
  const product = { variantGroups: [{ id: 'm', required: true, selection: 'multi', options: [] }] };
  eq(window.JSA.validateRequiredVariants(product, { m: new Set(['x']) }), []);
});
```

- [ ] **Step 2: Reload tests.html**

Expected: 5 failing tests for `validateRequiredVariants`.

- [ ] **Step 3: Add the function in app.js (immediately after `computeTotal`)**

```js
window.JSA.validateRequiredVariants = function(product, selections){
  const sel = selections || {};
  const missing = [];
  for(const g of (product.variantGroups || [])){
    if(!g.required) continue;
    const raw = sel[g.id];
    if(raw == null){ missing.push(g.id); continue; }
    if(raw instanceof Set){ if(raw.size === 0) missing.push(g.id); continue; }
    if(Array.isArray(raw)){ if(raw.length === 0) missing.push(g.id); continue; }
    if(raw === '') missing.push(g.id);
  }
  return missing;
};
```

- [ ] **Step 4: Reload tests.html**

Expected: 5 ✓ green for validate tests.

- [ ] **Step 5: Commit**

```bash
git add assets/js/app.js tests/tests.js
git commit -m "feat: validateRequiredVariants pure function"
```

---

## Task 5: Pure function — resolveAlias and applyClears

Resolves alias entries to their canonical product + preselects, and applies cross-group `clears` rules.

**Files:**
- Modify: `assets/js/app.js` — add functions
- Modify: `tests/tests.js`

- [ ] **Step 1: Write failing tests**

```js
test('resolveAlias — non-alias returns same product', () => {
  const catalog = [{ id: 'p1', basePrice: 100 }];
  const r = window.JSA.resolveAlias(catalog, 'p1');
  eq(r.product.id, 'p1');
  eq(r.preselect, {});
});

test('resolveAlias — alias resolves to canonical with preselect', () => {
  const catalog = [
    { id: 'noleggio-sportender', basePrice: 50 },
    { id: 'classic', aliasOf: 'noleggio-sportender', preselect: { durata: '45' } }
  ];
  const r = window.JSA.resolveAlias(catalog, 'classic');
  eq(r.product.id, 'noleggio-sportender');
  eq(r.preselect, { durata: '45' });
  eq(r.aliasId, 'classic');
});

test('resolveAlias — unknown id returns null', () => {
  eq(window.JSA.resolveAlias([], 'nope'), null);
});

test('applyClears — selecting an option whose group has clears wipes the cleared group', () => {
  const product = {
    variantGroups: [
      { id: 'media', selection: 'multi', options: [{id:'drone'},{id:'gopro'}] },
      { id: 'bundle', selection: 'single', clears: ['media'], options: [{id:'social-star'}] }
    ]
  };
  const sel = { media: new Set(['drone','gopro']), bundle: 'social-star' };
  const out = window.JSA.applyClears(product, sel, 'bundle');
  eq([...out.media], []);
  eq(out.bundle, 'social-star');
});

test('applyClears — selecting in cleared group does NOT clear the bundle group', () => {
  const product = {
    variantGroups: [
      { id: 'media', selection: 'multi', options: [{id:'drone'}] },
      { id: 'bundle', selection: 'single', clears: ['media'], options: [{id:'social-star'}] }
    ]
  };
  const sel = { media: new Set(['drone']), bundle: 'social-star' };
  const out = window.JSA.applyClears(product, sel, 'media');
  // bundle stays — clears is one-way (bundle clears media, not the other way)
  eq(out.bundle, 'social-star');
});
```

- [ ] **Step 2: Reload tests.html**

Expected: 5 failing.

- [ ] **Step 3: Add the functions in app.js**

```js
window.JSA.resolveAlias = function(catalog, id){
  if(!Array.isArray(catalog)) return null;
  const entry = catalog.find(p => p.id === id);
  if(!entry) return null;
  if(!entry.aliasOf){
    return { product: entry, preselect: {}, aliasId: null };
  }
  const canonical = catalog.find(p => p.id === entry.aliasOf);
  if(!canonical) return null;
  return { product: canonical, preselect: { ...(entry.preselect || {}) }, aliasId: entry.id };
};

// Apply cross-group `clears` rule: if the just-changed group declares
// `clears: ['otherId']`, wipe selections of those other groups.
// Returns a new selections object (input is not mutated).
window.JSA.applyClears = function(product, selections, changedGroupId){
  const out = {};
  for(const k of Object.keys(selections || {})){
    const v = selections[k];
    out[k] = (v instanceof Set) ? new Set(v) : (Array.isArray(v) ? [...v] : v);
  }
  const group = (product.variantGroups || []).find(g => g.id === changedGroupId);
  if(!group || !group.clears) return out;
  for(const targetId of group.clears){
    const target = (product.variantGroups || []).find(g => g.id === targetId);
    if(!target) continue;
    if(target.selection === 'multi') out[targetId] = new Set();
    else delete out[targetId];
  }
  return out;
};
```

- [ ] **Step 4: Reload tests.html**

Expected: 5 ✓ green.

- [ ] **Step 5: Commit**

```bash
git add assets/js/app.js tests/tests.js
git commit -m "feat: resolveAlias and applyClears pure functions"
```

---

## Task 6: Pure function — parseDeepLink

Parses URL hash like `#p=classic&durata=45&media=drone,gopro` into `{id, preselect}`.

**Files:**
- Modify: `assets/js/app.js`
- Modify: `tests/tests.js`

- [ ] **Step 1: Write failing tests**

```js
test('parseDeepLink — empty hash returns null', () => {
  eq(window.JSA.parseDeepLink(''), null);
  eq(window.JSA.parseDeepLink('#'), null);
});

test('parseDeepLink — only product id', () => {
  eq(window.JSA.parseDeepLink('#p=classic'), { id: 'classic', preselect: {} });
});

test('parseDeepLink — id + single + multi (csv)', () => {
  const r = window.JSA.parseDeepLink('#p=noleggio-sportender&durata=45&media=drone,gopro');
  eq(r.id, 'noleggio-sportender');
  eq(r.preselect.durata, '45');
  eq([...r.preselect.media].sort(), ['drone','gopro']);
});

test('parseDeepLink — non-p hash returns null', () => {
  eq(window.JSA.parseDeepLink('#meteo'), null);
});
```

- [ ] **Step 2: Reload tests.html**

Expected: 4 failing.

- [ ] **Step 3: Add the function in app.js**

```js
window.JSA.parseDeepLink = function(hashStr){
  const h = (hashStr || '').replace(/^#/, '');
  if(!h) return null;
  const parts = h.split('&').map(s => s.split('=')).filter(p => p.length === 2);
  const map = Object.fromEntries(parts.map(([k,v]) => [decodeURIComponent(k), decodeURIComponent(v)]));
  if(!map.p) return null;
  const preselect = {};
  for(const k of Object.keys(map)){
    if(k === 'p') continue;
    preselect[k] = map[k].includes(',') ? new Set(map[k].split(',')) : map[k];
  }
  return { id: map.p, preselect };
};
```

- [ ] **Step 4: Reload tests.html**

Expected: 4 ✓ green.

- [ ] **Step 5: Commit**

```bash
git add assets/js/app.js tests/tests.js
git commit -m "feat: parseDeepLink hash parser"
```

---

## Task 7: Catalog migration — canonical noleggio products

Replace the four standalone noleggio cards (`fast-fun`, `sprint`, `classic`, `sunset-hour`) with one canonical `noleggio-sportender` + four marketing alias entries. Keep `vallugola-gold` and `kids-academy` as separate canonical products.

**Files:**
- Modify: `assets/js/app.js:9-345` — replace the noleggio entries in `EXPERIENCES`

- [ ] **Step 1: Read the current EXPERIENCES array**

Run: `grep -n "EXPERIENCES = \[" assets/js/app.js`
Confirm the array starts at line 9 (current state). The five existing noleggio products are: `fast-fun` (15min), `sprint` (30min), `classic` (45min), `sunset-hour` (1h), `vallugola-gold` (4h), `kids-academy`.

- [ ] **Step 2: Replace `fast-fun`, `sprint`, `classic`, `sunset-hour` blocks with one canonical + four aliases**

Find the block beginning with `// ============ NOLEGGIO ============` and ending with the `vallugola-gold` entry's closing `},`. Replace the four product literals (`fast-fun`, `sprint`, `classic`, `sunset-hour`) with this single canonical product followed by alias entries (keep `vallugola-gold` and `kids-academy` unchanged below). Insert before `vallugola-gold`:

```js
    // ============ NOLEGGIO — canonical ride product ============
    {
      id: 'noleggio-sportender',
      tab: 'noleggio',
      cat: 'veloci',
      title: 'Noleggio <em>Sportender</em>',
      loc: 'Cattolica · pontile',
      img: 'https://images.unsplash.com/photo-1583008585590-c4ed0010bed6?q=85&w=1400&auto=format&fit=crop',
      imgs: [
        'https://images.unsplash.com/photo-1583008585590-c4ed0010bed6?q=85&w=1400&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1641075298538-afccb186b6e1?q=85&w=1400&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1564633351631-e85bd59a91af?q=85&w=1400&auto=format&fit=crop'
      ],
      badge: 'Best seller',
      meta: '15/30/45/60 min',
      duration: 'Tu scegli la durata · da 15 minuti a 2 ore',
      basePrice: 50,
      priceUnit: 'a moto',
      perPerson: false,
      minPeople: 1,
      maxPeople: 3,
      rating: 4.94,
      reviews: 572,
      includes: [
        'Briefing di sicurezza · 10 minuti',
        'Sportender JST-30 · senza patente',
        'Giubbotto in tutte le taglie',
        'Tempo effettivo in mare (timer parte fuori dal porto)'
      ],
      tags: ['senza patente', 'sportender JST-30', 'best seller'],
      lead: 'Sali, accendi, vai. Scegli la durata che vuoi: 15 minuti per provare, 45 per il tour costiero, 1 ora per il tramonto.',
      variantGroups: [
        {
          id: 'durata', label: 'Durata', selection: 'single', required: true,
          options: [
            { id: '15',  label: '15 min',     priceMode: 'replace', price: 50 },
            { id: '30',  label: '30 min',     priceMode: 'replace', price: 85 },
            { id: '45',  label: '45 min',     priceMode: 'replace', price: 105, default: true, sublabel: 'best seller' },
            { id: '60',  label: '1 ora',      priceMode: 'replace', price: 145, sublabel: 'tramonto' },
            { id: '120', label: '2 ore',      priceMode: 'replace', price: 245, sublabel: '1h + Extra Hour' }
          ]
        },
        {
          id: 'media', label: 'Media a bordo', selection: 'multi', required: false,
          options: [
            { id: 'gopro', label: 'GoPro POV',         priceMode: 'add', price: 15, sublabel: '4K · file via AirDrop' },
            { id: 'photo', label: 'Photo Kit Staff',   priceMode: 'add', price: 50, sublabel: 'scatti dallo staff' },
            { id: 'drone', label: 'Drone VIP Movie',   priceMode: 'add', price: 99, sublabel: 'reel 4K · IG/TikTok ready' }
          ]
        },
        {
          id: 'bundle', label: 'Bundle media', selection: 'single', required: false, clears: ['media'],
          options: [
            { id: 'social-star', label: 'Social Star', priceMode: 'add', price: 100, sublabel: 'Drone + GoPro · risparmi 14€' }
          ]
        },
        {
          id: 'accessori', label: 'Accessori', selection: 'multi', required: false,
          options: [
            { id: 'kasko',   label: 'Kasko Light',     priceMode: 'add', price: 10, sublabel: 'graffi/scocca coperti' },
            { id: 'refresh', label: 'VIP Refresh Kit', priceMode: 'add', price: 15, sublabel: 'sacca stagna + acqua + crema' },
            { id: 'glasses', label: 'Occhiali Floating', priceMode: 'add', price: 20, sublabel: 'polarizzati Wave Bros' }
          ]
        },
        {
          id: 'relax-bundle', label: 'Bundle accessori', selection: 'single', required: false, clears: ['accessori'],
          options: [
            { id: 'total-relax', label: 'Total Relax', priceMode: 'add', price: 20, sublabel: 'Kasko + Refresh' }
          ]
        }
      ]
    },

    // ============ NOLEGGIO — marketing aliases (point to canonical) ============
    { id: 'fast-fun',   tab: 'noleggio', cat: 'veloci', aliasOf: 'noleggio-sportender', preselect: { durata: '15' },
      title: 'Fast <em>& Fun</em>', loc: 'Cattolica · pontile',
      img: 'https://images.unsplash.com/photo-1641075298538-afccb186b6e1?q=85&w=1400&auto=format&fit=crop',
      badge: '15 min', meta: '15 min', priceFromOverride: 50,
      tags: ['15 min', 'entry', 'senza patente'],
      lead: 'Adrenalina pura, in 15 minuti effettivi. Il tempo parte fuori dal porto, +10 minuti regalati per il rientro.' },

    { id: 'sprint',     tab: 'noleggio', cat: 'veloci', aliasOf: 'noleggio-sportender', preselect: { durata: '30' },
      title: 'Sprint <em>30</em>', loc: 'Cattolica · pontile',
      img: 'https://images.unsplash.com/photo-1564633351631-e85bd59a91af?q=85&w=1400&auto=format&fit=crop',
      badge: '30 min', meta: '30 min', priceFromOverride: 85,
      tags: ['30 min', 'divertimento'],
      lead: 'La sessione ideale per chi vuole divertirsi senza pensieri. 30 minuti effettivi, dal pontile al largo.' },

    { id: 'classic',    tab: 'noleggio', cat: 'veloci', aliasOf: 'noleggio-sportender', preselect: { durata: '45' },
      title: 'Classic <em>45</em>', loc: 'Cattolica · pontile',
      img: 'https://images.unsplash.com/photo-1583008585590-c4ed0010bed6?q=85&w=1400&auto=format&fit=crop',
      badge: '45 min · best seller', meta: '45 min', priceFromOverride: 105,
      tags: ['45 min', 'best seller'],
      lead: 'Il miglior rapporto qualità/prezzo. 45 minuti effettivi: il tempo giusto per arrivare al largo e tornare con calma.' },

    { id: 'sunset-hour',tab: 'noleggio', cat: 'tour',   aliasOf: 'noleggio-sportender', preselect: { durata: '60' },
      title: 'Sunset <em>Hour</em>', loc: 'Cattolica → Gabicce',
      img: 'https://images.unsplash.com/photo-1714526393543-6fb24e5a68b7?q=85&w=1400&auto=format&fit=crop',
      badge: '1 ora', meta: '1 ora', priceFromOverride: 145,
      tags: ['1 ora', 'tramonto', 'premium'],
      lead: 'L\'esperienza premium. Un\'ora effettiva, perfetta al tramonto o per un tour lungo costa.' },
```

- [ ] **Step 3: Update `vallugola-gold` and `kids-academy` to new shape**

Find `vallugola-gold` and add `basePrice` (rename `priceFrom`), `perPerson: true`, `minPeople: 2`, `maxPeople: 3`, and `variantGroups: [<media>, <accessori>]` mirroring those defined on `noleggio-sportender` (copy the same options). Apply analogous changes to `kids-academy` with `perPerson: false`, `maxPeople: 2`, and only the `media` group (no GoPro option — Photo + Drone only).

Replace `priceFrom: 289` in `vallugola-gold` with `basePrice: 289` and add the new fields. Same pattern for `kids-academy` (basePrice: 75).

- [ ] **Step 4: Reload index.html in the browser (server already running)**

Use Chrome DevTools MCP: `mcp__chrome-devtools__navigate_page` to `http://localhost:8765/`. Expected: home feed still shows 4 noleggio cards (fast-fun / sprint / classic / sunset-hour) with their original titles. Clicking a card opens the detail sheet (still the OLD detail sheet — variants haven't been wired yet, so chips don't show; this is fine for now).

- [ ] **Step 5: Commit**

```bash
git add assets/js/app.js
git commit -m "feat: collapse noleggio products into canonical + 4 marketing aliases"
```

---

## Task 8: Render alias cards using priceFromOverride

The home feed today reads `e.priceFrom` — alias entries don't have it (they have `priceFromOverride` so the price ladder stays right). Wire the renderer to fall back.

**Files:**
- Modify: `assets/js/app.js` (inside `renderCards`, the line `<p class="card-price"><b>da ${e.priceFrom}€</b> · ${e.priceUnit}</p>`)

- [ ] **Step 1: Find the line in app.js**

Run: `grep -n "card-price" assets/js/app.js`
Locate the `<p class="card-price">` template inside `renderCards`.

- [ ] **Step 2: Update the price-resolution logic**

Just before `grid.innerHTML = items.map(e => {` (inside `renderCards`), add a helper:

```js
    const priceFor = (e) => {
      if(typeof e.priceFromOverride === 'number') return e.priceFromOverride;
      if(typeof e.basePrice === 'number') return e.basePrice;
      if(typeof e.priceFrom === 'number') return e.priceFrom; // legacy
      // Resolve aliases
      if(e.aliasOf){
        const canon = EXPERIENCES.find(p => p.id === e.aliasOf);
        if(canon) return priceFor(canon);
      }
      return 0;
    };
    const unitFor = (e) => e.priceUnit || (e.aliasOf ? (EXPERIENCES.find(p => p.id === e.aliasOf) || {}).priceUnit : '') || '';
```

Then change the price line in the card template from:

```js
            <p class="card-price"><b>da ${e.priceFrom}€</b> · ${e.priceUnit}</p>
```

to:

```js
            <p class="card-price"><b>da ${priceFor(e)}€</b> · ${unitFor(e)}</p>
```

- [ ] **Step 3: Reload home page in browser**

Expected: home feed shows 4 noleggio cards each with its tier price (50€ / 85€ / 105€ / 145€). Vallugola Gold shows 289€/persona. Kids Academy shows 75€.

- [ ] **Step 4: Commit**

```bash
git add assets/js/app.js
git commit -m "feat: alias cards display priceFromOverride / canonical fallback"
```

---

## Task 9: Catalog migration — love experiences

Migrate the five love experiences (`secret-romance`, `the-proposal`, `sinfonia-amore`, `midday-brunch`, `vallugola-diamond`, `blind-date`) to the new shape with their `variantGroups`.

**Files:**
- Modify: `assets/js/app.js` — replace the `// ============ EXPERIENCE ============` block

- [ ] **Step 1: Replace each experience product with the new shape**

For each existing experience entry, rename `priceFrom` → `basePrice`, add `perPerson` (false unless noted), `minPeople` / `maxPeople` (1/2 by default; 1/8 for blind-date), and append `variantGroups`. Use this concrete data per the spec §2.3:

For `secret-romance` (after the existing fields):
```js
      perPerson: false, minPeople: 1, maxPeople: 2,
      variantGroups: [
        { id: 'champagne-upgrade', label: 'Champagne', selection: 'single', required: false,
          options: [
            { id: 'piccolo', label: 'Champagne piccolo', priceMode: 'add', price: 0, sublabel: 'incluso', default: true },
            { id: '750ml',   label: 'Champagne 750ml',   priceMode: 'add', price: 30, sublabel: '+30€' }
          ] },
        { id: 'media-extra', label: 'Media extra', selection: 'multi', required: false,
          options: [
            { id: 'drone',     label: 'Drone VIP Movie', priceMode: 'add', price: 99 },
            { id: 'paparazzo', label: 'Paparazzo',       priceMode: 'add', price: 50 }
          ] },
        { id: 'drink-delivery', label: 'Drink delivery', selection: 'multi', required: false,
          options: [
            { id: 'moet',         label: 'Moët & Chandon Brut',     priceMode: 'add', price: 230 },
            { id: 'veuve',        label: 'Veuve Clicquot',          priceMode: 'add', price: 240 },
            { id: 'ruinart',      label: 'Ruinart Blanc de Blancs', priceMode: 'add', price: 290 },
            { id: 'dom-perignon', label: 'Dom Pérignon Vintage',    priceMode: 'add', price: 550 },
            { id: 'corona',       label: 'Bucket 6 Corona',         priceMode: 'add', price: 160 },
            { id: 'soft',         label: 'Soft Drinks Kit',         priceMode: 'add', price: 140 }
          ] }
      ]
```

For `the-proposal`:
```js
      perPerson: false, minPeople: 1, maxPeople: 2,
      variantGroups: [
        { id: 'champagne-upgrade', label: 'Champagne (default 750ml incluso)', selection: 'single', required: false,
          options: [
            { id: 'incluso',      label: 'Champagne 750ml incluso', priceMode: 'add', price: 0,   default: true },
            { id: 'moet',         label: 'Upgrade Moët',             priceMode: 'add', price: 100 },
            { id: 'veuve',        label: 'Upgrade Veuve Clicquot',   priceMode: 'add', price: 110 },
            { id: 'ruinart',      label: 'Upgrade Ruinart',          priceMode: 'add', price: 160 },
            { id: 'dom-perignon', label: 'Upgrade Dom Pérignon',     priceMode: 'add', price: 420 }
          ] },
        { id: 'extras', label: 'Extra', selection: 'multi', required: false,
          options: [
            { id: 'musicista', label: 'Musicista dal vivo', priceMode: 'add', price: 250, sublabel: 'chitarrista o violinista — upsell verso Sinfonia' }
          ] }
      ]
```

For `sinfonia-amore`:
```js
      perPerson: false, minPeople: 1, maxPeople: 2,
      variantGroups: [
        { id: 'drone-add', label: 'Drone VIP', selection: 'single', required: false,
          options: [
            { id: 'no',  label: 'No drone', priceMode: 'add', price: 0, default: true },
            { id: 'yes', label: 'Drone VIP Movie', priceMode: 'add', price: 99 }
          ] },
        { id: 'drink-delivery', label: 'Drink delivery', selection: 'multi', required: false,
          options: [/* same 6 as secret-romance, copy verbatim */] }
      ]
```

For `midday-brunch`:
```js
      perPerson: false, minPeople: 1, maxPeople: 2,
      variantGroups: [
        { id: 'media', label: 'Media a bordo', selection: 'multi', required: false,
          options: [
            { id: 'drone',     label: 'Drone VIP Movie', priceMode: 'add', price: 99 },
            { id: 'paparazzo', label: 'Paparazzo',       priceMode: 'add', price: 50 }
          ] },
        { id: 'drink-delivery', label: 'Drink delivery', selection: 'multi', required: false,
          options: [/* same 6 */] }
      ]
```

For `vallugola-diamond`:
```js
      perPerson: false, minPeople: 1, maxPeople: 2,
      variantGroups: [
        { id: 'media-extra', label: 'Media extra (drone già incluso)', selection: 'multi', required: false,
          options: [
            { id: 'paparazzo', label: 'Paparazzo', priceMode: 'add', price: 50 }
          ] },
        { id: 'drink-delivery', label: 'Drink delivery', selection: 'multi', required: false,
          options: [/* same 6 */] }
      ]
```

For `blind-date`:
```js
      perPerson: true, minPeople: 1, maxPeople: 8,
      variantGroups: [
        { id: 'media', label: 'Media a bordo', selection: 'multi', required: false,
          options: [
            { id: 'gopro', label: 'GoPro POV',       priceMode: 'add', price: 15 },
            { id: 'drone', label: 'Drone VIP Movie', priceMode: 'add', price: 99 }
          ] },
        { id: 'accessori', label: 'Accessori', selection: 'multi', required: false,
          options: [
            { id: 'kasko',   label: 'Kasko Light',     priceMode: 'add', price: 10 },
            { id: 'refresh', label: 'VIP Refresh Kit', priceMode: 'add', price: 15 }
          ] }
      ]
```

For `kids-academy` (already canonical from Task 7 — verify it has these fields):
```js
      perPerson: false, minPeople: 1, maxPeople: 2,
      variantGroups: [
        { id: 'media', label: 'Media a bordo', selection: 'multi', required: false,
          options: [
            { id: 'photo', label: 'Photo Kit Staff', priceMode: 'add', price: 50 },
            { id: 'drone', label: 'Drone VIP Movie', priceMode: 'add', price: 99 }
          ] }
      ]
```

- [ ] **Step 2: Reload tests.html and home page**

Expected: existing tests still pass; home page experience cards still render (no visual change yet — variants don't render until Task 11).

- [ ] **Step 3: Commit**

```bash
git add assets/js/app.js
git commit -m "feat: love + experience products migrated to variantGroups shape"
```

---

## Task 10: Catalog migration — yacht products

Add the 4 yacht products to the catalog so `data-detail` IDs on yacht.html resolve.

**Files:**
- Modify: `assets/js/app.js` — append yacht products at the end of `EXPERIENCES`

- [ ] **Step 1: Add yacht products before the closing `]` of `EXPERIENCES`**

```js
    // ============ YACHT ============
    {
      id: 'yacht-sunset',
      tab: 'yacht', cat: 'sunset',
      title: 'Sunset <em>Cruise</em>',
      loc: 'Cattolica · al largo',
      img: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?q=85&w=1600&auto=format&fit=crop',
      imgs: ['https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?q=85&w=1600&auto=format&fit=crop'],
      badge: '2 ore', meta: '2 ore · skipper · aperitivo',
      duration: '2 ore al tramonto',
      basePrice: 690, priceUnit: 'a barca', perPerson: false,
      minPeople: 1, maxPeople: 8,
      slots: ['18:30'],
      rating: 4.95, reviews: 0,
      includes: ['Skipper a bordo', 'Aperitivo standard (taglieri + bollicine)', 'Carburante incluso', 'Fino a 8 ospiti'],
      tags: ['2 ore', 'fino a 8 px', 'aperitivo', 'skipper'],
      lead: 'Due ore al tramonto, aperitivo a bordo con bollicine e taglieri, fino a 8 ospiti. Partenza 18:30, rientro al buio sotto Cattolica illuminata.',
      variantGroups: [
        { id: 'catering-aperitivo', label: 'Aperitivo', selection: 'single', required: false,
          options: [
            { id: 'standard', label: 'Aperitivo standard', priceMode: 'add', price: 0, sublabel: 'incluso', default: true },
            { id: 'premium',  label: 'Aperitivo premium',  priceMode: 'add', price: 120, sublabel: 'crudo + ostriche + champagne' }
          ] },
        { id: 'drink-delivery', label: 'Drink delivery', selection: 'multi', required: false,
          options: [/* same 6 — copy from love */] }
      ]
    },
    {
      id: 'yacht-day-charter',
      tab: 'yacht', cat: 'day',
      title: 'Day <em>Charter</em>',
      loc: 'Cattolica → Vallugola → Gabicce',
      img: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?q=85&w=1600&auto=format&fit=crop',
      imgs: ['https://images.unsplash.com/photo-1540541338287-41700207dee6?q=85&w=1600&auto=format&fit=crop'],
      badge: 'full day', meta: '8 ore · 10 px · pranzo',
      duration: '8 ore di mare aperto',
      basePrice: 1890, priceUnit: 'a barca', perPerson: false,
      minPeople: 1, maxPeople: 10,
      slots: ['09:00', '10:00'],
      rating: 4.95, reviews: 0,
      includes: ['Skipper + hostess', 'Tender a bordo per le calette', 'Set snorkeling', 'Carburante incluso', 'Fino a 10 ospiti'],
      tags: ['full day', 'fino a 10 px', 'pranzo', 'tender + snorkel'],
      lead: 'Otto ore tra Cattolica, Vallugola e Gabicce. Pranzo a bordo o al Falco, snorkeling, tender per le calette.',
      variantGroups: [
        { id: 'pranzo', label: 'Pranzo', selection: 'single', required: true,
          options: [
            { id: 'a-bordo', label: 'Pranzo a bordo', priceMode: 'add', price: 0, sublabel: 'incluso', default: true },
            { id: 'falco',   label: 'Pranzo al Ristorante Falco (Vallugola)', priceMode: 'add', price: 0, sublabel: 'a consumo · da confermare' }
          ] },
        { id: 'snorkel-set', label: 'Extra acquatici', selection: 'multi', required: false,
          options: [
            { id: 'tender-extra', label: 'Tender extra time', priceMode: 'add', price: 80 }
          ] },
        { id: 'drink-delivery', label: 'Drink delivery', selection: 'multi', required: false,
          options: [/* same 6 */] }
      ]
    },
    {
      id: 'yacht-private-event',
      tab: 'yacht', cat: 'event',
      title: 'Private <em>Event</em>',
      loc: 'Cattolica · al largo',
      img: 'https://images.unsplash.com/photo-1605281317010-fe5ffe798166?q=85&w=1600&auto=format&fit=crop',
      imgs: ['https://images.unsplash.com/photo-1605281317010-fe5ffe798166?q=85&w=1600&auto=format&fit=crop'],
      badge: '4 ore', meta: '4 ore · 12 px · catering',
      duration: '4 ore con ponte allestito',
      basePrice: 1490, priceUnit: 'a barca', perPerson: false,
      minPeople: 1, maxPeople: 12,
      rating: 5.0, reviews: 0,
      includes: ['Skipper + hostess', 'Catering standard', 'Ponte allestito', 'Fino a 12 ospiti'],
      tags: ['4 ore', 'fino a 12 px', 'catering', 'DJ opzionale'],
      lead: 'Compleanni, addii al celibato, brindisi aziendali. Catering on demand, DJ opzionale, ponte allestito.',
      variantGroups: [
        { id: 'catering', label: 'Catering', selection: 'single', required: true,
          options: [
            { id: 'standard', label: 'Catering standard', priceMode: 'add', price: 0, sublabel: 'incluso', default: true },
            { id: 'premium',  label: 'Catering premium',  priceMode: 'add', price: 400 },
            { id: 'chef',     label: 'Chef a bordo',      priceMode: 'add', price: 800 }
          ] },
        { id: 'dj', label: 'DJ', selection: 'single', required: false,
          options: [
            { id: 'no',  label: 'Senza DJ',     priceMode: 'add', price: 0, default: true },
            { id: 'yes', label: 'DJ a bordo',  priceMode: 'add', price: 250 }
          ] },
        { id: 'drink-delivery', label: 'Drink delivery', selection: 'multi', required: false,
          options: [/* same 6 */] }
      ]
    },
    {
      id: 'yacht-weekend',
      tab: 'yacht', cat: 'weekend',
      title: 'Riviera <em>Weekend</em>',
      loc: 'Marche · Emilia',
      img: 'https://images.unsplash.com/photo-1599582909646-2ca06ad65bd1?q=85&w=1600&auto=format&fit=crop',
      imgs: ['https://images.unsplash.com/photo-1599582909646-2ca06ad65bd1?q=85&w=1600&auto=format&fit=crop'],
      badge: '2 gg · 1 notte', meta: 'cabina · colazione',
      duration: '2 giorni, 1 notte a bordo',
      basePrice: 2490, priceUnit: 'a coppia', perPerson: false,
      minPeople: 2, maxPeople: 2,
      rating: 5.0, reviews: 0,
      includes: ['Cabina privata', 'Colazione continental a bordo', 'Skipper', 'Rotta libera tra Marche ed Emilia'],
      tags: ['2 gg · 1 notte', 'coppia', 'cabina', 'colazione'],
      lead: 'Due giorni, una notte. Cabina privata, colazione a bordo, rotta libera tra le coste delle Marche e dell\'Emilia.',
      variantGroups: [
        { id: 'colazione', label: 'Colazione', selection: 'single', required: false,
          options: [
            { id: 'continental', label: 'Continental', priceMode: 'add', price: 0, sublabel: 'inclusa', default: true },
            { id: 'specialty',   label: 'Specialty',   priceMode: 'add', price: 60 }
          ] },
        { id: 'drink-delivery', label: 'Drink delivery', selection: 'multi', required: false,
          options: [/* same 6 */] }
      ]
    },

    // Yacht hero CTA on yacht.html — alias to sunset cruise
    { id: 'yacht', tab: 'yacht', aliasOf: 'yacht-sunset', preselect: {} },
```

For each `drink-delivery` group placeholder `/* same 6 */` paste these options (DRY: copy verbatim each time — see CLAUDE.md "three similar lines is better than a premature abstraction"):

```js
            { id: 'moet',         label: 'Moët & Chandon Brut',     priceMode: 'add', price: 230 },
            { id: 'veuve',        label: 'Veuve Clicquot',          priceMode: 'add', price: 240 },
            { id: 'ruinart',      label: 'Ruinart Blanc de Blancs', priceMode: 'add', price: 290 },
            { id: 'dom-perignon', label: 'Dom Pérignon Vintage',    priceMode: 'add', price: 550 },
            { id: 'corona',       label: 'Bucket 6 Corona',         priceMode: 'add', price: 160 },
            { id: 'soft',         label: 'Soft Drinks Kit',         priceMode: 'add', price: 140 }
```

- [ ] **Step 2: Reload home page in browser**

Expected: home feed unchanged (yacht products use `tab: 'yacht'`, not visible in noleggio/experience filter). The `EXPERIENCES.find(p => p.id === 'yacht-sunset')` call returns a real product.

Verify in DevTools console: open `http://localhost:8765/`, run `JSA.resolveAlias(EXPERIENCES, 'yacht')` — wait, `EXPERIENCES` is closure-private. Verify by clicking a noleggio card and confirming nothing crashes. We'll verify yacht specifically in Task 17.

- [ ] **Step 3: Commit**

```bash
git add assets/js/app.js
git commit -m "feat: yacht products in catalog (sunset / day / event / weekend) + yacht alias"
```

---

## Task 11: Detail sheet — render variant groups

Add data-driven variant rendering to the detail sheet, between the tags row and the "Cosa è incluso" block.

**Files:**
- Modify: `assets/js/app.js` — `openDetail` function and add `renderVariantGroups`
- Modify: `assets/css/app.css` — add `.bk-vgroup`, `.bk-vchip`, `.bk-vrow` styles

- [ ] **Step 1: Add the renderer near the top of the IIFE (after `state` declaration)**

```js
  // Render variant groups for either the detail sheet (mode='full', shows all groups)
  // or the booking sheet pane 2 (mode='upsell-only', shows only multi+optional).
  // Returns the HTML string. Selection state is read from state.booking.variants.
  function renderVariantGroups(product, mode){
    const groups = (product.variantGroups || []).filter(g => {
      if(mode === 'upsell-only') return g.selection === 'multi' && !g.required;
      return true;
    });
    if(!groups.length) return '';
    return groups.map(g => {
      const selected = state.booking.variants[g.id];
      const isReq = !!g.required;
      const reqBadge = isReq ? `<span class="bk-vgroup-req">obbligatorio</span>` : `<span class="bk-vgroup-opt">opzionali</span>`;
      const opts = (g.options || []).map(o => {
        const priceLabel = o.priceMode === 'replace'
          ? `${o.price}€`
          : (o.price > 0 ? `+${o.price}€` : 'incluso');
        if(g.selection === 'single'){
          const isOn = selected === o.id;
          return `<button type="button" class="bk-vchip${isOn?' is-active':''}" data-vgroup="${g.id}" data-vopt="${o.id}">
            <span class="bk-vchip-l">${o.label}</span>
            ${o.sublabel ? `<small>${o.sublabel}</small>` : ''}
            <span class="bk-vchip-p">${priceLabel}</span>
          </button>`;
        }
        // multi
        const isOn = selected instanceof Set && selected.has(o.id);
        return `<label class="bk-vrow${isOn?' is-active':''}">
          <input type="checkbox" data-vgroup="${g.id}" data-vopt="${o.id}" ${isOn?'checked':''} />
          <span class="bk-vrow-c">
            <b>${o.label}</b>
            ${o.sublabel ? `<small>${o.sublabel}</small>` : ''}
          </span>
          <span class="bk-vrow-p">${priceLabel}</span>
        </label>`;
      }).join('');
      return `<div class="bk-vgroup${isReq?' bk-vgroup--required':''}" data-vgroup-container="${g.id}">
        <div class="bk-vgroup-h"><b>${g.label}</b>${reqBadge}</div>
        <div class="bk-vgroup-opts bk-vgroup-opts--${g.selection}">${opts}</div>
      </div>`;
    }).join('');
  }
```

- [ ] **Step 2: Modify `openDetail(id)` to handle aliases and render variants**

Find the `openDetail(id)` function. Replace its first line:

```js
  function openDetail(id){
    const e = EXPERIENCES.find(x => x.id === id);
    if(!e) return;
```

with:

```js
  function openDetail(id){
    // Resolve aliases. If id is an alias, get the canonical product + preselect.
    const resolved = window.JSA.resolveAlias(EXPERIENCES, id);
    if(!resolved) return;
    const e = resolved.product;
    state.booking.expId = e.id;
    state.booking.aliasId = resolved.aliasId;

    // Initialise selections: defaults from each group, then alias preselect overlays.
    state.booking.variants = {};
    for(const g of (e.variantGroups || [])){
      if(g.selection === 'multi'){
        state.booking.variants[g.id] = new Set();
      }else{
        const def = (g.options || []).find(o => o.default);
        if(def) state.booking.variants[g.id] = def.id;
      }
    }
    for(const k of Object.keys(resolved.preselect || {})){
      const v = resolved.preselect[k];
      state.booking.variants[k] = (v instanceof Set) ? new Set(v) : v;
    }
```

(Keep the rest of the function — but note that `e` is now the canonical product, so the existing references to `e.priceFrom` need updating in Step 3.)

- [ ] **Step 3: Update the rest of `openDetail` to read from `basePrice` (canonical) and inject variant groups in the sheet body**

Inside `openDetail`, find this block:

```js
    $('#detailPrice').textContent = `da ${e.priceFrom}€`;
    $('#detailPriceUnit').textContent = e.priceUnit;
```

Replace with:

```js
    $('#detailPrice').textContent = `${window.JSA.computeTotal(e, state.booking.variants, 1)}€`;
    $('#detailPriceUnit').textContent = e.priceUnit;
```

Find the line in the template literal:

```js
        <div class="dt-tags">
          ${(e.tags || []).map(t => `<span class="dt-tag">${t}</span>`).join('')}
        </div>
```

Append directly after that closing `</div>`:

```js

        <div class="dt-variants" id="dtVariants">${renderVariantGroups(e, 'full')}</div>
```

- [ ] **Step 4: Wire variant interactions (after `$('#detailHeart').onclick = ...`)**

Add inside `openDetail` just before the `openSheet('detailSheet');` line:

```js
    // Wire variant chips (single)
    $$('#dtVariants .bk-vchip').forEach(btn => {
      btn.addEventListener('click', () => {
        const gid = btn.dataset.vgroup;
        const oid = btn.dataset.vopt;
        state.booking.variants[gid] = oid;
        // Apply cross-group clears
        state.booking.variants = window.JSA.applyClears(e, state.booking.variants, gid);
        // Re-render variants and recompute price
        $('#dtVariants').innerHTML = renderVariantGroups(e, 'full');
        $('#detailPrice').textContent = `${window.JSA.computeTotal(e, state.booking.variants, 1)}€`;
        wireVariantHandlers(e); // re-wire
      });
    });
    // Wire variant rows (multi)
    $$('#dtVariants .bk-vrow input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        const gid = cb.dataset.vgroup;
        const oid = cb.dataset.vopt;
        const set = state.booking.variants[gid] instanceof Set ? state.booking.variants[gid] : new Set();
        if(cb.checked) set.add(oid); else set.delete(oid);
        state.booking.variants[gid] = set;
        state.booking.variants = window.JSA.applyClears(e, state.booking.variants, gid);
        $('#dtVariants').innerHTML = renderVariantGroups(e, 'full');
        $('#detailPrice').textContent = `${window.JSA.computeTotal(e, state.booking.variants, 1)}€`;
        wireVariantHandlers(e);
      });
    });

    function wireVariantHandlers(prod){
      $$('#dtVariants .bk-vchip').forEach(btn => {
        btn.onclick = () => {
          state.booking.variants[btn.dataset.vgroup] = btn.dataset.vopt;
          state.booking.variants = window.JSA.applyClears(prod, state.booking.variants, btn.dataset.vgroup);
          $('#dtVariants').innerHTML = renderVariantGroups(prod, 'full');
          $('#detailPrice').textContent = `${window.JSA.computeTotal(prod, state.booking.variants, 1)}€`;
          wireVariantHandlers(prod);
        };
      });
      $$('#dtVariants .bk-vrow input[type="checkbox"]').forEach(cb => {
        cb.onchange = () => {
          const gid = cb.dataset.vgroup, oid = cb.dataset.vopt;
          const set = state.booking.variants[gid] instanceof Set ? state.booking.variants[gid] : new Set();
          if(cb.checked) set.add(oid); else set.delete(oid);
          state.booking.variants[gid] = set;
          state.booking.variants = window.JSA.applyClears(prod, state.booking.variants, gid);
          $('#dtVariants').innerHTML = renderVariantGroups(prod, 'full');
          $('#detailPrice').textContent = `${window.JSA.computeTotal(prod, state.booking.variants, 1)}€`;
          wireVariantHandlers(prod);
        };
      });
    }
```

- [ ] **Step 5: Add CSS for variant chips and rows**

Append to `assets/css/app.css`:

```css
/* ============ VARIANT GROUPS (detail sheet + booking pane 2) ============ */
.dt-variants{ display:flex; flex-direction:column; gap:18px; margin:18px 0 8px }
.bk-vgroup{ display:flex; flex-direction:column; gap:10px }
.bk-vgroup-h{ display:flex; align-items:baseline; gap:10px; font-size:14px }
.bk-vgroup-h b{ font-weight:600 }
.bk-vgroup-req{ font-size:11px; letter-spacing:.08em; text-transform:uppercase; color:var(--tramonto); font-weight:600 }
.bk-vgroup-opt{ font-size:11px; letter-spacing:.08em; text-transform:uppercase; color:var(--ink-3); font-weight:500 }
.bk-vgroup-opts--single{ display:flex; flex-wrap:wrap; gap:8px }
.bk-vgroup-opts--multi{ display:flex; flex-direction:column; gap:8px }
.bk-vchip{
  appearance:none; border:1px solid var(--border); background:#fff; padding:10px 14px; border-radius:var(--r-pill);
  display:inline-flex; align-items:center; gap:8px; font:inherit; cursor:pointer;
  transition:border-color .18s var(--ease), background .18s var(--ease), color .18s var(--ease);
}
.bk-vchip small{ font-size:11px; color:var(--ink-3) }
.bk-vchip-p{ font-weight:600; margin-left:4px }
.bk-vchip.is-active{ border-color:var(--tramonto); background:rgba(31,182,216,.08); color:var(--abisso) }
.bk-vrow{
  display:grid; grid-template-columns:auto 1fr auto; gap:12px; align-items:center;
  border:1px solid var(--border); padding:12px 14px; border-radius:var(--r-md); cursor:pointer;
  transition:border-color .18s var(--ease), background .18s var(--ease);
}
.bk-vrow input{ accent-color:var(--tramonto) }
.bk-vrow-c b{ font-weight:600; font-size:14.5px; display:block }
.bk-vrow-c small{ font-size:12.5px; color:var(--ink-3); display:block; margin-top:2px }
.bk-vrow-p{ font-weight:600; color:var(--abisso); font-size:14px }
.bk-vrow.is-active{ border-color:var(--tramonto); background:rgba(31,182,216,.04) }

/* Required-state shake */
@keyframes bk-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}
.bk-shake{ animation: bk-shake .42s var(--ease) }
.bk-vgroup--required[aria-invalid="true"]{ border-left:3px solid #FF7A7A; padding-left:10px; border-radius:6px }
```

- [ ] **Step 6: Verify in browser**

Reload home page. Click "Classic 45" card. Detail sheet opens. Confirm:
- A `Durata` chip group is visible, with `45 min` highlighted as active.
- A `Media a bordo` checkbox group below.
- A `Bundle media` chip group with `Social Star`.
- An `Accessori` checkbox group.
- Footer price shows `105€`.
- Click `30 min` chip → footer price changes to `85€`.
- Click `Drone VIP Movie` checkbox → footer price changes to `184€` (85+99).
- Click `Social Star` chip → Drone checkbox is unchecked (cleared), price goes to `185€` (85+100).

Use `mcp__chrome-devtools__navigate_page` to load the page and `mcp__chrome-devtools__click` to drive interactions; `mcp__chrome-devtools__take_screenshot` between steps to verify.

- [ ] **Step 7: Commit**

```bash
git add assets/js/app.js assets/css/app.css
git commit -m "feat: detail sheet renders variant groups (chips + rows) with live total"
```

---

## Task 12: Disabled Prenota button + shake on missing required

**Files:**
- Modify: `assets/js/app.js` — `openDetail` to wire the validation feedback
- Modify: `assets/css/app.css` — `.btn.is-disabled` muted state

- [ ] **Step 1: Add updatePrenotaState() inside openDetail**

Add inside `openDetail`, right after `wireVariantHandlers(e);` is defined (still inside `openDetail`):

```js
    function updatePrenotaState(){
      const missing = window.JSA.validateRequiredVariants(e, state.booking.variants);
      const btn = $('#detailBook');
      if(missing.length){
        btn.classList.add('is-disabled');
        btn.setAttribute('aria-disabled', 'true');
      }else{
        btn.classList.remove('is-disabled');
        btn.setAttribute('aria-disabled', 'false');
      }
      return missing;
    }

    function shakeMissing(missing){
      const sheet = $('#detailSheet');
      const first = missing[0] && sheet.querySelector(`[data-vgroup-container="${missing[0]}"]`);
      missing.forEach(gid => {
        const el = sheet.querySelector(`[data-vgroup-container="${gid}"]`);
        if(!el) return;
        el.classList.remove('bk-shake');
        // Force reflow so the animation restarts
        // eslint-disable-next-line no-unused-expressions
        el.offsetHeight;
        el.classList.add('bk-shake');
        el.setAttribute('aria-invalid', 'true');
        setTimeout(() => el.removeAttribute('aria-invalid'), 1500);
      });
      if(first) first.scrollIntoView({behavior:'smooth', block:'center'});
    }

    updatePrenotaState();
```

In every place we re-render variants (chip click, row change, wireVariantHandlers), call `updatePrenotaState()` after updating the price.

Replace each `$('#detailPrice').textContent = ...` line in the chip/row handlers and `wireVariantHandlers` with:

```js
          $('#detailPrice').textContent = `${window.JSA.computeTotal(prod, state.booking.variants, 1)}€`;
          updatePrenotaState();
```

(Replace `prod` with `e` in the outer-scope handlers as appropriate; both refer to the same canonical product.)

- [ ] **Step 2: Update detailBook click to handle disabled state**

Find `$('#detailBook').onclick = () => {` in `openDetail`. Replace its body with:

```js
    $('#detailBook').onclick = () => {
      const missing = updatePrenotaState();
      if(missing.length){
        shakeMissing(missing);
        return;
      }
      closeSheet('detailSheet');
      setTimeout(() => openBooking(state.booking.expId), 280);
    };
```

- [ ] **Step 3: Add CSS for the disabled state**

Append to `assets/css/app.css`:

```css
.btn.is-disabled{
  background:rgba(31,182,216,.35);
  color:rgba(255,255,255,.7);
  box-shadow:none;
  cursor:pointer; /* stays clickable for shake feedback */
}
.btn.is-disabled:hover{ background:rgba(31,182,216,.4) }
```

- [ ] **Step 4: Verify in browser**

Reload the home page. Click `Classic 45` → Prenota active (durata default 45 is set). Click `Sprint 30` card directly → Durata 30 is preset, button active. Now create a product with no default to test missing flow: in DevTools console, manually clear the `durata` default — but easier — open `Vallugola Gold` if any required variant: it has none required (only optional groups). For a test, use yacht-day-charter via deep link (Task 17). For now, manually verify:
- In DevTools console with a Classic detail sheet open, run `state.booking.variants.durata = null; document.querySelector('#detailBook').click()` — expected: shake animation on the durata group, sheet stays open.

- [ ] **Step 5: Commit**

```bash
git add assets/js/app.js assets/css/app.css
git commit -m "feat: disabled Prenota with shake-on-click for missing required variants"
```

---

## Task 13: Sheet injection — move sheet markup out of index.html into JS

The four bottom sheets become a JS template literal. Removed from `index.html`, injected on init.

**Files:**
- Modify: `assets/js/app.js` — add `injectSheets()` function, called in `init()`
- Modify: `index.html:741-978` — remove the `<!-- DETAIL SHEET -->` through `<!-- BACKDROP -->` blocks

- [ ] **Step 1: Add injectSheets() inside the IIFE (before `init()`)**

```js
  function injectSheets(){
    if(document.getElementById('sheetBackdrop')) return; // already present
    const html = `
<!-- ============ DETAIL SHEET ============ -->
<div class="sheet" id="detailSheet" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="detailTitle">
  <button type="button" class="sheet-grab" aria-label="Trascina giù per chiudere"><span class="sheet-handle" aria-hidden="true"></span></button>
  <div class="sheet-body" id="detailBody"></div>
  <div class="sheet-footbar">
    <div class="sheet-footbar-l"><b id="detailPrice">—</b><span id="detailPriceUnit">—</span></div>
    <button type="button" class="btn btn-primary" id="detailBook">Prenota
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
    </button>
  </div>
</div>

<!-- ============ BOOKING SHEET ============ -->
<div class="sheet" id="bookingSheet" role="dialog" aria-modal="true" aria-hidden="true" aria-label="Prenota la tua uscita">
  <button type="button" class="sheet-grab" aria-label="Trascina giù per chiudere"><span class="sheet-handle" aria-hidden="true"></span></button>
  <div class="sheet-body">
    <section class="bk-pane is-active" data-bk-pane="1">
      <div class="bk-summary-strip">
        <span class="ssl-thumb" id="bkThumb" aria-hidden="true"></span>
        <div><small>Pacchetto</small><b id="bkExpName">—</b></div>
        <button type="button" class="ssl-edit" id="bkEditExp">cambia</button>
      </div>
      <h3 class="bk-q">Quando vuoi <em>uscire</em>?</h3>
      <div class="bk-field"><label for="bkDate">Data</label><input type="date" id="bkDate" /></div>
      <div class="bk-field"><label>Orario preferito</label><div class="bk-times" id="bkTimes"></div></div>
      <div class="bk-field"><label>Persone</label>
        <div class="bk-stepper">
          <button type="button" data-step="-" aria-label="Meno persone">−</button>
          <span id="bkPeople">2</span>
          <button type="button" data-step="+" aria-label="Più persone">+</button>
        </div>
        <small class="bk-hint" id="bkPeopleHint"></small>
      </div>
    </section>
    <section class="bk-pane" data-bk-pane="2">
      <div class="bk-recap" id="bkRecap"></div>
      <h3 class="bk-q">Vuoi <em>aggiungere</em> qualcosa?</h3>
      <p class="bk-pane-lead">Tutti gli extra sono opzionali. Li paghi al check-in insieme all'uscita.</p>
      <div class="bk-extras-dyn" id="bkExtrasDyn"></div>
    </section>
    <section class="bk-pane" data-bk-pane="3">
      <h3 class="bk-q">Ti <em>ricontattiamo</em> noi.</h3>
      <p class="bk-pane-lead">Conferma su WhatsApp in 5 minuti. Nessun acconto online.</p>
      <div class="bk-field"><label for="bkName">Nome</label><input type="text" id="bkName" placeholder="Mario Rossi" autocomplete="name" /></div>
      <div class="bk-field"><label for="bkPhone">WhatsApp</label><input type="tel" id="bkPhone" placeholder="+39 ..." autocomplete="tel" inputmode="tel" /></div>
      <div class="bk-field"><label for="bkEmail">Email <small>(opzionale · per il voucher)</small></label><input type="email" id="bkEmail" placeholder="ciao@esempio.it" autocomplete="email" inputmode="email" /></div>
      <div class="bk-field"><label for="bkNotes">Note <small>(opzionale)</small></label><textarea id="bkNotes" rows="3"></textarea></div>
      <label class="bk-consent"><input type="checkbox" id="bkConsent" checked /><span>Accetto la <a href="#" tabindex="-1">privacy policy</a>.</span></label>
    </section>
  </div>
  <footer class="sheet-footbar">
    <div class="sheet-footbar-l"><b id="bkTotal">— €</b><span id="bkTotalUnit">stima · al check-in</span></div>
    <div class="sheet-footbar-r">
      <button type="button" class="btn btn-ghost" id="bkBack" hidden>Indietro</button>
      <button type="button" class="btn btn-primary" id="bkNext">Avanti</button>
    </div>
  </footer>
</div>

<!-- ============ METEO SHEET ============ -->
<div class="sheet" id="meteoSheet" role="dialog" aria-modal="true" aria-hidden="true" aria-label="Meteo Cattolica">
  <button type="button" class="sheet-grab" aria-label="Trascina giù per chiudere"><span class="sheet-handle" aria-hidden="true"></span></button>
  <div class="sheet-body sheet-body--meteo">
    <header class="sheet-section-head"><h2>Meteo <em>Cattolica</em></h2></header>
    <div class="meteo-now is-loading" id="meteoNow" aria-busy="true"></div>
    <div class="meteo-grid" id="meteoGrid"></div>
    <ul class="meteo-legend"><li><i data-v="go"></i>Esci sereno</li><li><i data-v="caution"></i>Verifica</li><li><i data-v="no"></i>Sconsigliato</li></ul>
    <p class="meteo-foot">Fonte: Servizio Meteorologico dell'<a href="https://www.meteoam.it/it/home" target="_blank" rel="noopener">Aeronautica Militare</a> · 43.96°N 12.74°E</p>
  </div>
</div>

<!-- ============ BACKDROP ============ -->
<div class="sheet-backdrop" id="sheetBackdrop" aria-hidden="true"></div>
`;
    const wrap = document.createElement('div');
    wrap.innerHTML = html;
    while(wrap.firstChild) document.body.appendChild(wrap.firstChild);
  }
```

- [ ] **Step 2: Call injectSheets() at the very start of init()**

Inside `init()`, make the first line:

```js
  function init(){
    injectSheets();
    document.body.dataset.activeTab = state.activeTab;
    // ...rest unchanged...
```

- [ ] **Step 3: Remove the inline sheet markup from index.html**

Open `index.html`. Find the section comment `<!-- ============ DETAIL SHEET (bottom drawer) ============ -->`. Delete from that comment line through (and including) the `<div class="sheet-backdrop" id="sheetBackdrop" aria-hidden="true"></div>` block — i.e. all four sheets and the backdrop. Keep the `<script src="assets/js/app.js"></script>` line that follows.

Run: `grep -n "DETAIL SHEET\|sheetBackdrop" index.html` — expected: zero hits after the deletion.

- [ ] **Step 4: Reload home page in browser**

Expected: page loads identically. Click any card → detail sheet opens (now injected). Click "Prenota" → booking sheet opens. Click meteo icon (cloud) in topbar → meteo sheet opens. Backdrop closes correctly.

- [ ] **Step 5: Commit**

```bash
git add assets/js/app.js index.html
git commit -m "refactor: inject detail/booking/meteo/backdrop sheets from JS (cross-page portable)"
```

---

## Task 14: Booking sheet pane 1 — When + Who

Repurpose `bk-summary-strip` to show product + selected variants. Time slots come from product `slots` field. People stepper respects `minPeople`/`maxPeople`.

**Files:**
- Modify: `assets/js/app.js` — `openBooking` function

- [ ] **Step 1: Replace the body of `openBooking(expId)`**

Find the existing `function openBooking(expId){` block and replace it entirely with:

```js
  function openBooking(expId){
    const e = expId
      ? (EXPERIENCES.find(x => x.id === expId && !x.aliasOf)
         || (window.JSA.resolveAlias(EXPERIENCES, expId) || {}).product)
      : (EXPERIENCES.find(x => x.tab === state.activeTab && !x.aliasOf) || EXPERIENCES[0]);
    if(!e) return;

    state.booking.expId = e.id;
    state.bkStep = 1;

    // Recap strip — title + selected variants summary
    $('#bkExpName').textContent = e.title.replace(/<[^>]+>/g, '');
    $('#bkThumb').style.backgroundImage = `url('${e.img}')`;

    // Default date = tomorrow
    const t = new Date();
    t.setDate(t.getDate() + 1);
    $('#bkDate').value = t.toISOString().slice(0,10);
    $('#bkDate').min = new Date().toISOString().slice(0,10);
    state.booking.date = $('#bkDate').value;

    // Render time slots
    const slots = e.slots && e.slots.length
      ? e.slots
      : ['09:00','11:00','14:00','16:00','18:30'];
    $('#bkTimes').innerHTML = slots.map(s => `
      <label><input type="radio" name="bkTime" value="${s}" /><span>${s === '18:30' ? 'tramonto' : s}</span></label>
    `).join('');
    $$('input[name="bkTime"]').forEach(r => r.addEventListener('change', () => { state.booking.time = r.value; updateBookingTotal(); }));
    state.booking.time = '';

    // People stepper bounds
    const minP = e.minPeople || 1;
    const maxP = e.maxPeople || 3;
    state.booking.people = Math.max(minP, Math.min(maxP, 2));
    $('#bkPeople').textContent = String(state.booking.people);
    $('#bkPeopleHint').textContent = `Capienza: ${minP === maxP ? minP : `${minP}–${maxP}`} persone`;
    state.booking._peopleBounds = [minP, maxP];

    // Render dynamic upsell on pane 2 (only multi+optional groups)
    $('#bkExtrasDyn').innerHTML = renderVariantGroups(e, 'upsell-only');
    wireBookingPaneTwoHandlers(e);

    // Recap (read-only) — required + single-select group selections
    $('#bkRecap').innerHTML = renderBookingRecap(e);
    wireRecapEdit();

    updateBookingStep();
    updateBookingTotal();
    openSheet('bookingSheet');
  }

  function renderBookingRecap(e){
    const groups = (e.variantGroups || []).filter(g => g.required || g.selection === 'single');
    const lines = groups.map(g => {
      const optId = state.booking.variants[g.id];
      if(!optId) return null;
      const opt = (g.options || []).find(o => o.id === optId);
      if(!opt) return null;
      return `<div class="bk-recap-row"><b>${g.label}:</b> ${opt.label}</div>`;
    }).filter(Boolean);
    if(!lines.length) return '';
    return `${lines.join('')}<button type="button" class="bk-recap-edit" id="bkRecapEdit">modifica</button>`;
  }

  function wireRecapEdit(){
    const btn = document.getElementById('bkRecapEdit');
    if(!btn) return;
    btn.onclick = () => {
      const id = state.booking.expId;
      closeSheet('bookingSheet');
      setTimeout(() => openDetail(id), 280);
    };
  }

  function wireBookingPaneTwoHandlers(e){
    $$('#bkExtrasDyn .bk-vchip').forEach(btn => {
      btn.onclick = () => {
        const gid = btn.dataset.vgroup;
        state.booking.variants[gid] = btn.dataset.vopt;
        state.booking.variants = window.JSA.applyClears(e, state.booking.variants, gid);
        $('#bkExtrasDyn').innerHTML = renderVariantGroups(e, 'upsell-only');
        wireBookingPaneTwoHandlers(e);
        updateBookingTotal();
      };
    });
    $$('#bkExtrasDyn .bk-vrow input[type="checkbox"]').forEach(cb => {
      cb.onchange = () => {
        const gid = cb.dataset.vgroup, oid = cb.dataset.vopt;
        const set = state.booking.variants[gid] instanceof Set ? state.booking.variants[gid] : new Set();
        if(cb.checked) set.add(oid); else set.delete(oid);
        state.booking.variants[gid] = set;
        state.booking.variants = window.JSA.applyClears(e, state.booking.variants, gid);
        $('#bkExtrasDyn').innerHTML = renderVariantGroups(e, 'upsell-only');
        wireBookingPaneTwoHandlers(e);
        updateBookingTotal();
      };
    });
  }
```

- [ ] **Step 2: Replace `updateBookingTotal()` to use the pure function**

Find the existing `function updateBookingTotal(){` block and replace its body with:

```js
  function updateBookingTotal(){
    const e = getCurrentExp();
    const total = window.JSA.computeTotal(e, state.booking.variants, state.booking.people);
    // Add-ons subtotal for the "+X extra" subline
    let extras = 0;
    for(const g of (e.variantGroups || [])){
      const raw = state.booking.variants[g.id];
      if(raw == null) continue;
      const ids = raw instanceof Set ? [...raw] : (Array.isArray(raw) ? raw : [raw]);
      for(const id of ids){
        const opt = (g.options || []).find(o => o.id === id);
        if(opt && opt.priceMode === 'add' && opt.price > 0) extras += opt.price;
      }
    }
    $('#bkTotal').textContent = `${total} €`;
    $('#bkTotalUnit').textContent = `stima · al check-in${extras ? ` · +${extras} extra` : ''}`;
  }
```

`getCurrentExp` already exists; ensure it returns the canonical product (if `state.booking.expId` is now a canonical id, the existing `EXPERIENCES.find(x => x.id === state.booking.expId)` works).

- [ ] **Step 3: Update people stepper to respect bounds**

Find the existing handler:

```js
  $$('.bk-stepper button').forEach(b => {
    b.addEventListener('click', () => {
      const dir = b.dataset.step === '+' ? 1 : -1;
      let next = state.booking.people + dir;
      next = Math.max(1, Math.min(3, next));
```

Replace `Math.max(1, Math.min(3, next))` with:

```js
      const [minP, maxP] = state.booking._peopleBounds || [1, 3];
      next = Math.max(minP, Math.min(maxP, next));
```

This handler currently lives outside `openBooking` (top-level inside the IIFE). It will not work for sheets injected on init — it's wired before the markup exists. Move the entire `$$('.bk-stepper button').forEach(...)` block AND the radio listener block AND the `bkEditExp` handler INSIDE `openBooking` (they only need to fire when the booking sheet is open). Or use event delegation. Cleanest is delegation: replace the top-level `$$('.bk-stepper button')...` block with delegated listeners on the booking sheet element, set up once after `injectSheets()`:

Add inside `init()` right after `injectSheets()`:

```js
    // Delegated handlers for the dynamically-injected booking sheet
    document.addEventListener('click', (ev) => {
      const stepBtn = ev.target.closest('.bk-stepper button');
      if(stepBtn){
        const dir = stepBtn.dataset.step === '+' ? 1 : -1;
        let next = state.booking.people + dir;
        const [minP, maxP] = state.booking._peopleBounds || [1, 3];
        next = Math.max(minP, Math.min(maxP, next));
        state.booking.people = next;
        if(document.getElementById('bkPeople')) document.getElementById('bkPeople').textContent = String(next);
        updateBookingTotal();
      }
    });
    document.addEventListener('change', (ev) => {
      if(ev.target && ev.target.id === 'bkDate'){
        state.booking.date = ev.target.value;
      }
    });
```

Delete the now-replaced top-level `$$('.bk-stepper button').forEach(...)`, `$$('input[name="bkTime"]').forEach(...)`, `$('#bkDate').addEventListener(...)`, `$$('.bk-extra input').forEach(...)`, and `$('#bkEditExp').addEventListener(...)` blocks (they're no longer valid because the markup is JS-injected).

- [ ] **Step 4: Update bkBack / bkNext handlers to use delegated listeners**

Replace `$('#bkBack').addEventListener(...)` and `$('#bkNext').addEventListener(...)` with delegated handlers in `init()`:

```js
    document.addEventListener('click', (ev) => {
      if(ev.target && ev.target.id === 'bkBack'){
        if(state.bkStep > 1){ state.bkStep--; updateBookingStep(); }
      }
      if(ev.target && ev.target.id === 'bkNext'){
        handleBookingNext();
      }
    });
```

Add a `handleBookingNext()` function (move/extract the existing `bkNext` body):

```js
  function handleBookingNext(){
    if(state.bkStep === 1){
      // Validation: date + time
      const missing = [];
      if(!state.booking.date) missing.push('bkDate');
      if(!state.booking.time) missing.push('bkTimes');
      if(missing.length){
        missing.forEach(id => {
          const el = document.getElementById(id) || document.querySelector(`[id="${id}"]`);
          if(el && el.parentElement){
            el.parentElement.classList.remove('bk-shake');
            el.parentElement.offsetHeight;
            el.parentElement.classList.add('bk-shake');
          }
        });
        return;
      }
      // Step 2 — skip if no optional multi groups
      const e = getCurrentExp();
      const upsellHtml = renderVariantGroups(e, 'upsell-only');
      if(upsellHtml.trim() === ''){
        state.bkStep = 3;
      }else{
        state.bkStep = 2;
      }
      updateBookingStep();
      return;
    }
    if(state.bkStep === 2){
      state.bkStep = 3;
      updateBookingStep();
      return;
    }
    // Step 3 — submit
    state.booking.name = $('#bkName').value.trim();
    state.booking.phone = $('#bkPhone').value.trim();
    state.booking.email = $('#bkEmail').value.trim();
    state.booking.notes = $('#bkNotes').value.trim();
    if(!state.booking.name || !state.booking.phone){
      const target = !state.booking.name ? $('#bkName') : $('#bkPhone');
      if(target && target.parentElement){
        target.parentElement.classList.remove('bk-shake');
        target.parentElement.offsetHeight;
        target.parentElement.classList.add('bk-shake');
      }
      return;
    }
    submitBooking();
  }
```

(`submitBooking()` is added in Task 15.)

- [ ] **Step 5: Update updateBookingStep() to handle pane 2 skip**

Existing:
```js
  function updateBookingStep(){
    const step = state.bkStep;
    $$('.bk-pane').forEach(p => p.classList.toggle('is-active', Number(p.dataset.bkPane) === step));
    $('#bkBack').hidden = step === 1;
    $('#bkNext').textContent = step === 3 ? 'Conferma prenotazione' : 'Avanti';
  }
```

Replace with:

```js
  function updateBookingStep(){
    const step = state.bkStep;
    $$('.bk-pane').forEach(p => p.classList.toggle('is-active', Number(p.dataset.bkPane) === step));
    $('#bkBack').hidden = step === 1;
    $('#bkNext').textContent = step === 3 ? 'Conferma prenotazione' : 'Avanti';
  }
```

(unchanged — but making sure it stays correct).

- [ ] **Step 6: Add CSS for recap pane**

Append to `assets/css/app.css`:

```css
.bk-recap{
  background:rgba(31,182,216,.06);
  border:1px solid rgba(31,182,216,.18);
  border-radius:var(--r-md);
  padding:14px 16px;
  margin-bottom:18px;
  display:flex; flex-direction:column; gap:6px;
  font-size:14px;
}
.bk-recap-row b{ font-weight:600; color:var(--abisso) }
.bk-recap-edit{
  appearance:none; background:none; border:none;
  font:inherit; color:var(--tramonto); font-weight:600; cursor:pointer;
  text-decoration:underline; padding:4px 0; align-self:flex-start;
  margin-top:4px;
}
```

- [ ] **Step 7: Verify in browser**

Reload home. Click `Classic 45` → detail sheet → Prenota → booking sheet pane 1.
- Confirm date is tomorrow, people stepper bounds 1–3.
- Click `tramonto` → state.booking.time updates.
- Click "Avanti" with no time selected → shake on bkTimes parent.
- Click `09:00` then "Avanti" → pane 2.
- Pane 2 shows recap with "Durata: 45 min" and "modifica" link, plus dynamic checkbox/chip groups for media/bundle/accessori.
- Click "modifica" → reopens detail sheet with current variants preserved.
- Tick `Drone VIP` in pane 2 → footer total updates to 105+99=204€.
- Click "Avanti" → pane 3.
- Click "Conferma" with empty Nome → shake on Nome row.

- [ ] **Step 8: Commit**

```bash
git add assets/js/app.js assets/css/app.css
git commit -m "feat: 3-step booking sheet with dynamic pane 2 upsell + delegated handlers"
```

---

## Task 15: Submit message format with canonical id + variant breakdown

**Files:**
- Modify: `assets/js/app.js` — add `submitBooking()`

- [ ] **Step 1: Add submitBooking() inside the IIFE (replaces existing submit code in the old bkNext handler)**

```js
  function submitBooking(){
    const e = getCurrentExp();
    const total = window.JSA.computeTotal(e, state.booking.variants, state.booking.people);
    const lines = [
      `Ciao Jet Ski Adriatic! Vorrei prenotare:`,
      ``,
      `• Pacchetto: ${e.title.replace(/<[^>]+>/g, '')} (id: ${e.id}${state.booking.aliasId ? ` · alias: ${state.booking.aliasId}` : ''})`
    ];
    for(const g of (e.variantGroups || [])){
      const raw = state.booking.variants[g.id];
      if(raw == null) continue;
      const ids = raw instanceof Set ? [...raw] : (Array.isArray(raw) ? raw : [raw]);
      if(!ids.length) continue;
      const labels = ids.map(id => {
        const opt = (g.options || []).find(o => o.id === id);
        return opt ? `${opt.label}${opt.price ? ` (+${opt.price}€)` : ''}` : id;
      });
      lines.push(`• ${g.label}: ${labels.join(', ')}`);
    }
    lines.push(`• Data: ${state.booking.date || '—'}${state.booking.time ? ' · ' + state.booking.time : ''}`);
    lines.push(`• Persone: ${state.booking.people}`);
    lines.push(`• Totale stimato: ${total}€`);
    lines.push(`• Nome: ${state.booking.name}`);
    if(state.booking.email) lines.push(`• Email: ${state.booking.email}`);
    if(state.booking.notes) lines.push(``, `Note: ${state.booking.notes}`);
    const text = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/390000000000?text=${text}`, '_blank', 'noopener');
    closeSheet('bookingSheet');
  }
```

- [ ] **Step 2: Verify the submit flow**

In browser: complete a booking for Classic 45 with Drone selected, name "Test", phone "+39123". Click Conferma. Expected: a new tab opens to `https://wa.me/390000000000?text=...` with a URL-encoded message containing `id: noleggio-sportender · alias: classic`, `Durata: 45 min (+105€)`, `Media a bordo: Drone VIP Movie (+99€)`, etc.

- [ ] **Step 3: Commit**

```bash
git add assets/js/app.js
git commit -m "feat: WhatsApp submit message includes canonical id + variant breakdown"
```

---

## Task 16: Hash deep-link parser on init

**Files:**
- Modify: `assets/js/app.js` — `init()` reads `location.hash` for `#p=...` links

- [ ] **Step 1: Add deep-link logic at the end of init()**

Find the existing block in `init()`:

```js
    // pre-set deep link
    if(location.hash === '#experience' || location.hash === '#love'){ setTab('experience'); }
    if(location.hash === '#meteo'){ openMeteo(); }
```

Replace with:

```js
    // pre-set deep link
    if(location.hash === '#experience' || location.hash === '#love'){ setTab('experience'); }
    else if(location.hash === '#meteo'){ openMeteo(); }
    else {
      const dl = window.JSA.parseDeepLink(location.hash);
      if(dl){
        // Defer slightly so injected sheets are available
        setTimeout(() => {
          const resolved = window.JSA.resolveAlias(EXPERIENCES, dl.id);
          if(!resolved) return;
          // Apply preselect into state.booking.variants BEFORE opening detail
          openDetail(dl.id);
          // Apply hash-level preselects (override defaults)
          for(const k of Object.keys(dl.preselect || {})){
            state.booking.variants[k] = dl.preselect[k];
          }
          // Re-render with overridden selections
          if(document.getElementById('dtVariants')){
            document.getElementById('dtVariants').innerHTML = renderVariantGroups(resolved.product, 'full');
          }
        }, 80);
      }
    }
```

- [ ] **Step 2: Verify**

Open `http://localhost:8765/#p=classic` — expected: detail sheet for Noleggio Sportender opens with Classic (45 min) preselected.
Open `http://localhost:8765/#p=noleggio-sportender&durata=60&media=drone,gopro` — expected: detail sheet opens with `60` chip active and Drone+GoPro both ticked, footer price 145+99+15=259€.

- [ ] **Step 3: Commit**

```bash
git add assets/js/app.js
git commit -m "feat: hash deep-link parser opens detail with preselected variants"
```

---

## Task 17: Wire yacht.html

**Files:**
- Modify: `yacht.html` — add `<script src="assets/js/app.js"></script>` before `</body>`

- [ ] **Step 1: Find the right insertion point**

Run: `grep -n "</body>" yacht.html`. Expected: one match near end of file.

- [ ] **Step 2: Add the script tag**

Edit `yacht.html`. Find the line `</body>` and insert directly before it:

```html
<script src="assets/js/app.js"></script>
```

- [ ] **Step 3: Verify yacht detail/booking flow**

Open `http://localhost:8765/yacht.html` in the browser.
- Click "Sunset Cruise" card (data-detail="yacht-sunset") → detail sheet opens with `Aperitivo` (single, optional, default standard) and `Drink delivery` (multi) variant groups. Footer price 690€.
- Click `premium` aperitivo chip → price 810€.
- Tick `Veuve Clicquot` drink → price 1050€.
- Click "Prenota" → booking sheet pane 1.
- Step through to confirmation; submit message includes `id: yacht-sunset`.
- Test the hero CTA "Richiedi un preventivo" (data-book="yacht") → opens booking sheet for `yacht-sunset` (alias).
- Test "Day Charter" card (yacht-day-charter) — has `pranzo` required group; click Prenota → button shake if `pranzo` not selected (but default is `a-bordo`, so button is active immediately).

- [ ] **Step 4: Commit**

```bash
git add yacht.html
git commit -m "feat: yacht.html loads app.js — booking + detail sheets work end-to-end"
```

---

## Task 18: End-to-end verification + cleanup pass

- [ ] **Step 1: Run the test harness one more time**

Open `http://localhost:8765/tests/tests.html`. Expected: all green (computeTotal 6 + validateRequiredVariants 5 + resolveAlias/applyClears 5 + parseDeepLink 4 = 20 tests passing).

- [ ] **Step 2: Walk through each canonical product on home page**

Visit `http://localhost:8765/`. For each card visible (Fast & Fun / Sprint / Classic / Sunset Hour / Vallugola Gold / Kids Academy / Secret Romance / The Proposal / Sinfonia / Midday Brunch / Vallugola Diamond / Blind Date):
- Click the card — detail sheet opens
- Variants render correctly
- Default selections produce a sensible footer price
- "Prenota" enters booking sheet
- Booking sheet pane 2 shows ONLY the multi+optional groups not yet ticked from detail
- Submit produces a valid WhatsApp URL

Use `mcp__chrome-devtools__take_screenshot` to capture each detail sheet for visual sanity. If any product fails (variant misrendered, price wrong), open a fix step inline and commit per fix.

- [ ] **Step 3: Walk through yacht.html**

Visit `http://localhost:8765/yacht.html`. Test each of the 4 yacht cards + the hero CTA. Test the meteo button still works on yacht.html.

- [ ] **Step 4: Test hash deep-links**

Visit each of these and verify they preselect correctly:
- `http://localhost:8765/#p=fast-fun`
- `http://localhost:8765/#p=classic&media=drone`
- `http://localhost:8765/yacht.html#p=yacht-sunset&drink-delivery=ruinart`

- [ ] **Step 5: Final cleanup commit (if needed)**

If any issues were found in steps 2–4 that needed fixing, those went into individual commits. If everything passed unchanged, no further commit is required.

```bash
git status
# Expected: clean tree
git log --oneline | head -25
# Expected: clean linear history of feat: / refactor: / test: / docs: commits since spec commit a9e56f5
```

- [ ] **Step 6: Push (only with user permission per CLAUDE.md)**

If user approves: `git push origin master`. Otherwise leave for them to push.

---

## Self-review

**Spec coverage check:**
- §1 Architecture (data model, sheet injection, state, wiring) — Tasks 1–6 (pure functions), 13 (sheet injection), 11–14 (state extension and wiring). ✓
- §2 Catalog (canonical noleggio, aliases, vallugola-gold, kids-academy, love products, yacht products, drink-delivery shared options) — Tasks 7, 9, 10. ✓
- §3 Detail sheet UX (variant rendering, footer total, disabled Prenota with shake, cross-group clears) — Tasks 11 (rendering), 12 (disabled + shake), 5 (clears tested + applied in 11/14). ✓
- §4 Booking sheet UX (3-step, recap, dynamic pane 2, skip rule, contact, submit format) — Tasks 13 (markup), 14 (logic), 15 (submit). ✓
- §5 Marketing landing pages & deep-links (alias entries, anchor handler, deep-link hash) — Tasks 7 (aliases), 16 (hash parser). ✓
- §6 File changes (app.js, app.css, index.html, yacht.html) — Tasks 7–17 cover all four. ✓
- §6.2 Out of scope (Wave Card, food add-ons, OG metadata, API integration, analytics, meteo-aware slots) — explicitly deferred, no tasks. ✓

**Placeholder scan:**
- No "TBD", "TODO", "implement later" in any task. ✓
- No "add appropriate error handling" — every step shows the specific code. ✓
- No "Similar to Task N" — each task contains its own complete code. ✓
- The spec §6.3 client-confirmation prices (musicista +250€, Falco lunch, etc.) are encoded as concrete placeholders in the catalog — flagged in the spec, not the plan. ✓

**Type/name consistency:**
- `window.JSA` namespace is used consistently across all tests and runtime code.
- `state.booking.variants` is the single source of truth in detail sheet, booking sheet pane 1/2, recap, submit.
- Selection storage: `string` for single-select, `Set<string>` for multi-select — consistent across `computeTotal`, `validateRequiredVariants`, `applyClears`, `parseDeepLink`, render functions.
- Group property names (`id`, `label`, `selection`, `required`, `clears`, `options`) consistent in catalog and in renderers.
- Option property names (`id`, `label`, `sublabel`, `priceMode`, `price`, `default`) consistent in catalog and renderers.

No issues found.
