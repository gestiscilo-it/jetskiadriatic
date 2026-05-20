/* =====================================================
   JET SKI ADRIATIC — APP SHELL
   ===================================================== */

// Pure-function namespace — exposed for tests in /tests/tests.js
// and for any future inline scripts that need pricing or validation logic.
window.JSA = window.JSA || {};

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

(function(){
  'use strict';

  // 148-MIG-03: EXPERIENCES is populated at runtime by the SDK loader below.
  // Source: 148-CONTEXT.md D-C-03; 148-RESEARCH.md Code Example 2.
  let EXPERIENCES = [];

  // 148-MIG-03: SDK bootstrap — wirePhoneLinks + product catalogue loader.
  // Source: 148-CONTEXT.md D-C-01..07 + D-D-02; 148-RESEARCH.md Code Example 2.

  function mapProduct(p) {
    // Convert gestiscilo Product (numeric id, no slug, metadata blob) to
    // existing-jetskiadriatic-render shape. Stringify id for === comparisons (Pitfall 1).
    return Object.assign(
      { id: String(p.id), basePrice: (p.price_cents || 0) / 100 },
      p.metadata || {}
    );
  }

  function showEmptyCatalogueState() {
    var feed = document.getElementById('feed');
    if (!feed) return;
    feed.innerHTML =
      '<div style="min-height:160px;display:grid;place-items:center;color:var(--ink-3);padding:24px">' +
        '<p style="text-align:center;max-width:32ch">Catalogue in arrivo. ' +
        '<a href="tel:">Chiamaci</a> o ' +
        '<a href="https://wa.me/" target="_blank" rel="noopener">scrivici su WhatsApp</a> per info.' +
        '</p>' +
      '</div>';
    if (window.Gestiscilo && Gestiscilo.wirePhoneLinks) { Gestiscilo.wirePhoneLinks(feed); }
  }

  // 148-MIG-04: booking payload + WhatsApp-fallback message helpers.
  // Source: 148-CONTEXT.md D-E-02; Phase 146 D-B-02 (booking validator); RESEARCH Pitfall 6.
  function buildBookingPayload(s, exp) {
    // duration_minutes MUST come from the product, NEVER from a form field (Pitfall 6).
    // mapProduct() spreads p.metadata only; p.default_duration_minutes (top-level) is NOT
    // currently mirrored into the render shape — operator may set metadata.default_duration_minutes
    // to expose it. Fallback chain handles either case + a parsed metadata.duration string.
    var minutes = (typeof exp.default_duration_minutes === 'number' && exp.default_duration_minutes > 0)
      ? exp.default_duration_minutes
      : parseDurationLabel(exp.duration);
    return {
      booking_date:     s.date,
      booking_time:     s.time,
      duration_minutes: minutes,
      party_size:       Number(s.people) || 1,
      guest_name:       s.name,
      guest_email:      s.email,
      guest_phone:      s.phone,
    };
  }

  function parseDurationLabel(label) {
    // exp.duration is operator-authored free text like '30 min', '2h', '90 min', '1h 30m'.
    // Parse to integer minutes; fallback to 120 if unparseable (CONTEXT D-E-02 default).
    if (typeof label !== 'string') return 120;
    var hMatch = label.match(/(\d+)\s*h/i);
    var mMatch = label.match(/(\d+)\s*m(in)?/i);
    var hours   = hMatch ? Number(hMatch[1]) : 0;
    var minutes = mMatch ? Number(mMatch[1]) : 0;
    var total   = hours * 60 + minutes;
    return (total > 0) ? total : 120;
  }

  function composeWhatsappFallbackMessage(s, exp) {
    // Used by the network_error WhatsApp fallback. Compose a human-readable booking summary
    // that the operator can read on WhatsApp and replay manually.
    var title = (exp.title || exp.name || 'esperienza').replace(/<\/?em>/g, '');
    return [
      'Ciao! Vorrei prenotare:',
      title,
      'Data: ' + s.date + ' alle ' + s.time,
      'Persone: ' + s.people,
      'Nome: ' + s.name,
      'Telefono: ' + s.phone,
      s.email ? ('Email: ' + s.email) : null,
      s.notes ? ('Note: ' + s.notes) : null,
    ].filter(Boolean).join('\n');
  }

  // 148-MIG-04: inline success / error UI helpers. Warning #5 closed at plan time —
  // the success/toast surface helpers were verified absent on master HEAD, so these
  // helpers own the entire success/error surface (no upstream reach-throughs permitted).
  function showBookingSuccess(booking) {
    // Modal container in this repo is id="bookingSheet" (verified in index.html:935).
    // Plan-baseline id="bkModal" kept as a secondary fallback for resilience.
    var modal = document.getElementById('bookingSheet')
             || document.getElementById('bkModal')
             || document.querySelector('.bk-modal')
             || document.querySelector('[data-booking-modal]');
    var bookingIdLabel = (booking && booking.id != null) ? String(booking.id) : '—';
    var dateLabel      = (booking && booking.booking_date) ? String(booking.booking_date) : '';
    var timeLabel      = (booking && booking.booking_time) ? String(booking.booking_time) : '';
    var when           = (dateLabel && timeLabel) ? (dateLabel + ' alle ' + timeLabel) : '';

    var html =
      '<div class="bk-success-state" role="status" aria-live="polite" ' +
           'style="min-height:200px;display:grid;place-items:center;padding:32px;text-align:center;color:var(--ink-1)">' +
        '<div>' +
          '<p style="font-size:18px;font-weight:600;margin-bottom:8px">Prenotazione ricevuta!</p>' +
          '<p style="color:var(--ink-3);margin-bottom:12px">Numero: <code>' + bookingIdLabel + '</code></p>' +
          (when ? '<p style="color:var(--ink-3);margin-bottom:12px">' + when + '</p>' : '') +
          '<p style="color:var(--ink-3)">Ti contatteremo per la conferma.</p>' +
        '</div>' +
      '</div>';

    if (modal) {
      modal.innerHTML = html;
    } else {
      var slot = document.createElement('div');
      slot.innerHTML = html;
      document.body.insertBefore(slot, document.body.firstChild);
    }
  }

  function showBookingFieldError(field, message) {
    var selectorMap = {
      booking_date:     '#bkDate',
      booking_time:     null,           // bkTime is a radio-group name, not an id; cannot focus()
      duration_minutes: null,           // not user-facing
      party_size:       '#bkPeople',
      guest_name:       '#bkName',
      guest_email:      '#bkEmail',
      guest_phone:      '#bkPhone',
      product_id:       null,           // not user-facing
    };
    var sel = selectorMap[field];
    if (sel) {
      var el = document.querySelector(sel);
      if (el) {
        if (typeof el.focus === 'function') el.focus();
        el.setAttribute('aria-invalid', 'true');
        el.setAttribute('title', message || 'Campo non valido');
      }
    }
    showBookingGenericError(message || ('Campo non valido: ' + field));
  }

  function showBookingGenericError(message) {
    // Inline generic error surface — no upstream helper reach-through (warning #5).
    var text = message || 'Riprova tra qualche momento';
    var slot = document.getElementById('bkError');
    if (!slot) {
      var host = document.getElementById('bookingSheet')
              || document.getElementById('bkModal')
              || document.querySelector('.bk-modal')
              || document.querySelector('[data-booking-modal]')
              || document.body;
      slot = document.createElement('div');
      slot.id = 'bkError';
      slot.setAttribute('role', 'alert');
      slot.setAttribute('aria-live', 'assertive');
      slot.style.cssText =
        'min-height:40px;margin:12px 0;padding:10px 14px;' +
        'border:1px solid var(--ink-5, #e5e7eb);border-radius:6px;' +
        'background:var(--surface-2, #fef2f2);color:var(--ink-1, #111);' +
        'font-size:14px;text-align:center';
      host.appendChild(slot);
    }
    slot.textContent = text;
    slot.removeAttribute('hidden');
    if (slot._gestisciloHideTimer) clearTimeout(slot._gestisciloHideTimer);
    slot._gestisciloHideTimer = setTimeout(function () { slot.setAttribute('hidden', ''); }, 6000);
  }

  if (typeof window !== 'undefined' && window.Gestiscilo && Gestiscilo.ready) {
    // Async chain: ready -> wirePhoneLinks(document) -> products -> render.
    // Failure paths (rejection or empty rows) fall through to the empty-state placeholder.
    Gestiscilo.ready
      .then(function () { Gestiscilo.wirePhoneLinks(document); return Gestiscilo.products(); })
      .then(function (rows) {
        if (!Array.isArray(rows) || rows.length === 0) {
          showEmptyCatalogueState();
          return;
        }
        // Mutate EXPERIENCES in place so existing reads (lines 876, 891, 896, 1141, 1244, 1247, 1285) see populated data.
        EXPERIENCES.splice.apply(EXPERIENCES, [0, EXPERIENCES.length].concat(rows.map(mapProduct)));
        if (typeof init === 'function') {
          init();
        }
      })
      .catch(function (err) {
        if (window.console && console.warn) { console.warn('148-MIG-03 bootstrap failed:', err); }
        showEmptyCatalogueState();
      });
  } else {
    // SDK absent — empty-catalogue state, no crash.
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showEmptyCatalogueState);
    } else {
      showEmptyCatalogueState();
    }
  }

  const CATS = {
    moto: [
      { id: 'ride',    label: 'Ride',     icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h7l-1 8 10-12h-7z"/></svg>' },
      { id: 'tour',    label: 'Tour',     icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>' },
      { id: 'under12', label: 'Under 12', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="9" cy="7" r="3"/><circle cx="17" cy="7" r="2"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 14h2a3 3 0 0 1 3 3v2"/></svg>' }
    ],
    love: [
      { id: 'love-moto',  label: 'Moto d\'acqua', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 17c2 0 2-1.5 4-1.5S8 17 10 17s2-1.5 4-1.5S16 17 18 17s2-1.5 4-1.5"/><path d="M3 12l6-3 3 1 6-3 3 1"/></svg>' },
      { id: 'love-yacht', label: 'Yacht',          icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v10"/><path d="M12 4l6 10H6z"/><path d="M3 18h18l-2 3H5z"/></svg>' }
    ],
    party: [
      { id: 'day',   label: 'Day',   icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="14" r="3.5"/><path d="M12 6v2M5 14H3M21 14h-2M6.5 8.5L5 7M19 7l-1.5 1.5"/><path d="M3 19h18"/></svg>' },
      { id: 'night', label: 'Night', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>' }
    ],
    escursioni: [
      { id: 'esc-yacht', label: 'Yacht',        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v10"/><path d="M12 4l6 10H6z"/><path d="M3 18h18l-2 3H5z"/></svg>' },
      { id: 'esc-moto',  label: 'Moto d\'Acqua', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 17c2 0 2-1.5 4-1.5S8 17 10 17s2-1.5 4-1.5S16 17 18 17s2-1.5 4-1.5"/><path d="M3 12l6-3 3 1 6-3 3 1"/></svg>' }
    ]
  };

  // ============ STATE ============
  const state = {
    activeTab: 'moto',
    activeCat: 'ride',
    likes: new Set(JSON.parse(localStorage.getItem('jsa_likes') || '[]')),
    booking: {
      expId: null,
      date: '',
      time: '',
      people: 2,
      extras: new Set(),
      name: '',
      phone: '',
      email: '',
      notes: ''
    },
    bkStep: 1,
    cardCarousels: {}, // id -> currentIndex
    returnToDetail: null // when set, closing meteo reopens this detail id
  };

  // ============ HELPERS ============
  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const fmt = n => new Intl.NumberFormat('it-IT').format(n);

  function saveLikes(){
    try{ localStorage.setItem('jsa_likes', JSON.stringify([...state.likes])); }catch(e){}
  }

  // ============ RENDER ============
  function renderCats(){
    const cats = CATS[state.activeTab];
    const wrap = $('#cats');
    wrap.innerHTML = cats.map(c => `
      <button type="button" class="cat${state.activeCat === c.id ? ' is-active' : ''}" data-cat="${c.id}">
        ${c.icon}
        <span>${c.label}</span>
      </button>
    `).join('');
    wrap.querySelectorAll('.cat').forEach(btn => {
      btn.addEventListener('click', () => {
        state.activeCat = btn.dataset.cat;
        renderCats();
        renderCards();
      });
    });
  }

  function renderCards(){
    const grid = $('#cards');
    const empty = $('#emptyState');
    let items = EXPERIENCES.filter(e => e.tab === state.activeTab && e.cat === state.activeCat);

    if(!items.length){
      grid.innerHTML = '';
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

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

    grid.innerHTML = items.map(e => {
      const liked = state.likes.has(e.id);
      const isLove = e.tab === 'love';
      // Build the media list: video first (if any), then images.
      const media = [];
      if (e.video) media.push({ type: 'video', src: e.video });
      if (e.imgs && e.imgs.length) e.imgs.forEach(s => media.push({ type: 'image', src: s }));
      else if (e.img) media.push({ type: 'image', src: e.img });
      const idx = Math.min(state.cardCarousels[e.id] || 0, media.length - 1);
      const dotsCount = media.length;

      const mediaHtml = media.map((m, i) => {
        const active = i === idx ? ' is-active' : '';
        if (m.type === 'video') {
          return `<video class="card-media card-video${active}" data-media-idx="${i}" src="${m.src}" muted loop playsinline preload="${i === 0 ? 'metadata' : 'none'}" autoplay></video>`;
        }
        return `<div class="card-media card-img-slide${active}" data-media-idx="${i}" style="background-image:url('${m.src}')"></div>`;
      }).join('');

      const stars = (e.rating || 0).toFixed(2);
      return `
        <article class="card ${isLove ? 'card--love' : ''}" data-card="${e.id}">
          <div class="card-img" data-card-img="${e.id}">
            ${mediaHtml}
            <span class="card-badge ${isLove ? 'card-badge--love' : ''}">${e.badge}</span>
            <button type="button" class="card-heart ${liked ? 'is-liked' : ''}" data-heart="${e.id}" aria-label="Salva ${e.title.replace(/<[^>]+>/g, '')}">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>
            ${dotsCount > 1 ? `
              <div class="card-dots" data-dots="${e.id}">
                ${Array.from({length: dotsCount}).map((_,i) => `<i class="${i === idx ? 'is-on' : ''}"></i>`).join('')}
              </div>
            ` : ''}
          </div>
          <div class="card-body">
            <div class="card-row">
              <h3 class="card-title">${e.title}</h3>
              <span class="card-rating" aria-label="Voto ${stars}"><svg viewBox="0 0 24 24"><path d="M12 2l2.9 6.9L22 10l-5.5 4.8L18.2 22 12 18.2 5.8 22l1.7-7.2L2 10l7.1-1.1z"/></svg>${stars}</span>
            </div>
            <p class="card-loc">${e.loc}</p>
            <p class="card-meta">${e.meta}</p>
            <div class="card-foot">
              <p class="card-price"><b>da ${priceFor(e)}€</b><small>${unitFor(e)}</small></p>
              <span class="card-cta" aria-hidden="true">Scopri<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg></span>
            </div>
          </div>
        </article>
      `;
    }).join('');

    // wire up
    grid.querySelectorAll('[data-card]').forEach(card => {
      card.addEventListener('click', (ev) => {
        if(ev.target.closest('[data-heart]')) return;
        if(ev.target.closest('[data-dots]')) return;
        openDetail(card.dataset.card);
      });
    });

    grid.querySelectorAll('[data-heart]').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        toggleHeart(btn.dataset.heart, btn);
      });
    });

  }

  function toggleHeart(id, btn){
    if(state.likes.has(id)){
      state.likes.delete(id);
      btn.classList.remove('is-liked');
    }else{
      state.likes.add(id);
      btn.classList.add('is-liked');
    }
    saveLikes();
  }

  // ============ TAB SWITCHING ============
  function setTab(tab){
    state.activeTab = tab;
    state.activeCat = CATS[tab][0].id;
    document.body.dataset.activeTab = tab;
    let activeTabEl = null;
    $$('.tab').forEach(t => {
      const on = t.dataset.tab === tab;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      if(on) activeTabEl = t;
    });
    // Scroll the tab pill toward the left edge of the scroller so the
    // newly-selected chip leads the row and the chips to its right stay
    // in view. .topbar-row--main becomes a horizontal scroller on mobile
    // when chips overflow the viewport width; scroll-padding-left on the
    // scroller gives the active chip a small inset from the edge.
    if(activeTabEl && typeof activeTabEl.scrollIntoView === 'function'){
      activeTabEl.scrollIntoView({ inline: 'start', block: 'nearest', behavior: 'smooth' });
    }
    const FEED_COPY = {
      moto: {
        title: 'Prenota online, conferma in 5 minuti.',
        sub:   'Senza patente, tutta la velocità. Cattolica · Rimini'
      },
      love: {
        title: 'Prenota online, conferma in 5 minuti.',
        sub:   'Esperienze romantiche — moto d\'acqua e yacht.'
      },
      party: {
        title: 'Prenota online, conferma in 5 minuti.',
        sub:   'Feste in mare — dal tramonto aperitivo alla notte privé.'
      },
      escursioni: {
        title: 'Prenota online, conferma in 5 minuti.',
        sub:   'Escursioni guidate — yacht e moto d\'acqua verso Vallugola.'
      }
    };
    const t = FEED_COPY[tab] || FEED_COPY.moto;
    $('#feedTitle').textContent = t.title;
    $('#feedSub').textContent = t.sub;
    renderCats();
    renderCards();
    // Reset the cards row to its starting position so the user always
    // lands on the first card of the newly-selected tab.
    const cardsEl = $('#cards');
    if(cardsEl) cardsEl.scrollTo({ left: 0, behavior: 'instant' in cardsEl.scrollTo ? 'instant' : 'auto' });
  }

  // ============ SHEETS ============
  const backdrop = $('#sheetBackdrop');
  let openSheets = [];

  function openSheet(id){
    const sh = document.getElementById(id);
    if(!sh) return;
    sh.classList.add('is-open');
    sh.setAttribute('aria-hidden','false');
    backdrop.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    openSheets.push(id);
  }
  function closeSheet(id){
    const sh = id ? document.getElementById(id) : (openSheets.length ? document.getElementById(openSheets[openSheets.length-1]) : null);
    if(!sh) return;
    const closingId = sh.id;
    sh.classList.remove('is-open');
    sh.setAttribute('aria-hidden','true');
    openSheets = openSheets.filter(s => s !== closingId);

    // If meteo was opened from a product sheet, return to that product on close
    if(closingId === 'meteoSheet' && state.returnToDetail){
      const returnId = state.returnToDetail;
      state.returnToDetail = null;
      // wait for the close transition to finish, then reopen the detail
      setTimeout(() => openDetail(returnId), 280);
      return; // keep backdrop and body lock; openDetail will manage them
    }

    if(openSheets.length === 0){
      backdrop.classList.remove('is-open');
      document.body.style.overflow = '';
      // reset bottom nav to "esplora" when no sheets remain
      $$('.bn').forEach(b => b.classList.toggle('is-active', b.dataset.nav === 'esplora'));
    }
  }
  function closeAllSheets(){
    [...openSheets].forEach(id => closeSheet(id));
  }

  $$('[data-close-sheet]').forEach(b => {
    b.addEventListener('click', () => closeSheet(b.dataset.closeSheet));
  });
  backdrop.addEventListener('click', closeAllSheets);
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && openSheets.length){ closeSheet(); }
  });

  // ============ DRAG-TO-CLOSE (mobile only) ============
  function isMobileSheet(){ return window.matchMedia('(max-width: 959px)').matches; }
  function attachDragClose(sheetId){
    const sheet = document.getElementById(sheetId);
    if(!sheet) return;
    const grab = sheet.querySelector('.sheet-grab');
    if(!grab) return;

    let startY = 0;
    let dy = 0;
    let dragging = false;
    let startTime = 0;

    function onDown(e){
      if(!isMobileSheet()) return;
      startY = e.clientY;
      dy = 0;
      dragging = true;
      startTime = Date.now();
      sheet.style.transition = 'none';
      grab.classList.add('is-dragging');
      try{ grab.setPointerCapture(e.pointerId); }catch(_){}
    }
    function onMove(e){
      if(!dragging) return;
      dy = e.clientY - startY;
      if(dy > 0){
        sheet.style.transform = `translateY(${dy}px)`;
      }else{
        // small upward bounce: dampened
        sheet.style.transform = `translateY(${dy * 0.15}px)`;
      }
    }
    function onUp(){
      if(!dragging) return;
      dragging = false;
      grab.classList.remove('is-dragging');
      const elapsed = Date.now() - startTime;
      const velocity = dy / Math.max(elapsed, 1);
      // close if dragged past 100px or fast flick down
      if(dy > 100 || velocity > 0.7){
        // continue the gesture down to fully closed
        sheet.style.transition = 'transform .26s cubic-bezier(.32,.72,.24,1)';
        sheet.style.transform = 'translateY(100%)';
        setTimeout(() => {
          sheet.style.transform = '';
          sheet.style.transition = '';
          closeSheet(sheetId);
        }, 260);
      }else{
        // snap back
        sheet.style.transition = '';
        sheet.style.transform = '';
      }
      dy = 0;
    }

    grab.addEventListener('pointerdown', onDown);
    grab.addEventListener('pointermove', onMove);
    grab.addEventListener('pointerup', onUp);
    grab.addEventListener('pointercancel', onUp);
  }
  ['bookingSheet','meteoSheet','detailSheet'].forEach(attachDragClose);

  // ============ DETAIL SHEET ============
  function openDetail(id){
    const e = EXPERIENCES.find(x => x.id === id);
    if(!e) return;
    const liked = state.likes.has(id);
    const isLove = e.tab === 'love';

    $('#detailPrice').textContent = `da ${e.priceFrom}€`;
    $('#detailPriceUnit').textContent = e.priceUnit;
    $('#detailBook').onclick = () => {
      closeSheet('detailSheet');
      setTimeout(() => openBooking(id), 280);
    };

    const stars = (e.rating || 0).toFixed(2);

    $('#detailBody').innerHTML = `
      <div class="dt-hero" style="background-image:url('${e.imgs ? e.imgs[0] : e.img}')">
        ${e.video ? `<video class="dt-hero-video" src="${e.video}" muted loop playsinline preload="metadata" autoplay></video>` : ''}
        <div class="dt-hero-actions">
          <button type="button" class="dt-floating-btn" aria-label="Condividi" id="detailShare">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v14"/></svg>
          </button>
          <button type="button" class="dt-floating-btn${liked ? ' is-liked' : ''}" aria-label="Salva" id="detailHeart">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
        </div>
      </div>
      <div class="dt-body">
        <h1>${e.title}</h1>
        <p class="dt-meta">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="vertical-align:-2px"><path d="M12 2l2.9 6.9L22 10l-5.5 4.8L18.2 22 12 18.2 5.8 22l1.7-7.2L2 10l7.1-1.1z"/></svg>
          <b>${stars}</b> · ${e.reviews} recensioni · ${e.loc}
        </p>
        <p class="lead">${e.lead}</p>

        <div class="dt-tags">
          ${(e.tags || []).map(t => `<span class="dt-tag">${t}</span>`).join('')}
        </div>

        <div class="dt-includes">
          <h4>Cosa è incluso</h4>
          <ul>
            ${e.includes.map(i => `<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg><span>${i}</span></li>`).join('')}
          </ul>
        </div>

        <div class="dt-includes">
          <h4>Durata</h4>
          <p style="margin:0;font-size:14px">${e.duration}</p>
        </div>

        <div class="dt-includes">
          <h4>Politiche</h4>
          <ul>
            <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg><span>Paghi al check-in (carta · bancomat · contanti)</span></li>
            <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg><span>Cancellazione gratuita fino a 24 h prima</span></li>
            <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg><span>Riprogrammazione gratis se annulliamo per meteo</span></li>
          </ul>
        </div>

        <div class="dt-includes dt-meteo">
          <h4>Mare e meteo</h4>
          <p class="dt-meteo-note">L'uscita dipende dalle condizioni del mare. Riprogrammiamo gratis se non si esce.</p>
          <button type="button" class="dt-meteo-strip" id="dtMeteoStrip" data-open-meteo aria-label="Apri il meteo a 7 giorni"></button>
          <a class="dt-link" data-open-meteo href="#meteo">Vedi previsioni complete →</a>
        </div>
      </div>
    `;

    // open meteo from the disclaimer block (strip + link) — close detail, then open meteo
    // store the product id so closing meteo reopens this detail
    $$('#detailBody [data-open-meteo]').forEach(el => {
      el.onclick = (ev) => {
        ev.preventDefault();
        state.returnToDetail = id;
        closeSheet('detailSheet');
        setTimeout(() => openMeteo(), 280);
      };
    });

    // populate the compact meteo strip (uses cached data if available)
    loadCompactMeteo($('#dtMeteoStrip'));

    $('#detailHeart').onclick = () => {
      const btn = $('#detailHeart');
      if(state.likes.has(id)){
        state.likes.delete(id);
        btn.classList.remove('is-liked');
      }else{
        state.likes.add(id);
        btn.classList.add('is-liked');
      }
      saveLikes();
      const cardBtn = $(`[data-heart="${id}"]`);
      if(cardBtn){ cardBtn.classList.toggle('is-liked', state.likes.has(id)); }
    };

    openSheet('detailSheet');
  }

  // ============ BOOKING SHEET ============
  function openBooking(expId){
    let e;
    if(expId){
      e = EXPERIENCES.find(x => x.id === expId);
    }else{
      // default: first experience of currently active tab
      e = EXPERIENCES.find(x => x.tab === state.activeTab) || EXPERIENCES[0];
    }
    state.booking.expId = e.id;
    state.bkStep = 1;
    $('#bkExpName').textContent = e.title.replace(/<[^>]+>/g, '');
    $('#bkThumb').style.backgroundImage = `url('${e.img}')`;

    // default date = today + 1
    const t = new Date();
    t.setDate(t.getDate() + 1);
    const iso = t.toISOString().slice(0,10);
    $('#bkDate').value = iso;
    $('#bkDate').min = new Date().toISOString().slice(0,10);

    // reset radios + extras
    $$('input[name="bkTime"]').forEach(r => { r.checked = false; });
    $$('.bk-extra input').forEach(c => { c.checked = false; });
    state.booking.extras = new Set();
    state.booking.time = '';

    // people
    state.booking.people = 2;
    $('#bkPeople').textContent = '2';

    updateBookingStep();
    updateBookingTotal();
    openSheet('bookingSheet');
  }

  function updateBookingStep(){
    const step = state.bkStep;
    $$('.bk-pane').forEach(p => p.classList.toggle('is-active', Number(p.dataset.bkPane) === step));
    $('#bkBack').hidden = step === 1;
    // Single primary button — relabels on the final step
    $('#bkNext').textContent = step === 3 ? 'Conferma prenotazione' : 'Avanti';
  }

  function getCurrentExp(){
    return EXPERIENCES.find(x => x.id === state.booking.expId) || EXPERIENCES[0];
  }
  function updateBookingTotal(){
    const e = getCurrentExp();
    const people = state.booking.people;
    let base = e.priceFrom;
    // a rough estimation logic — multiply by people for some types
    const perPersonIds = ['vallugola-gold','blind-date'];
    const perCoupleIds = ['the-proposal','vallugola-diamond','secret-romance','midday-brunch','sinfonia-amore'];
    let total;
    if(perPersonIds.includes(e.id)){
      total = base * people;
    }else if(perCoupleIds.includes(e.id)){
      total = base; // already coppia
    }else{
      total = base;
    }
    let extras = 0;
    state.booking.extras.forEach(ext => {
      const cb = document.querySelector(`.bk-extra input[data-extra="${ext}"]`);
      if(cb) extras += Number(cb.dataset.price || 0);
    });
    total += extras;
    $('#bkTotal').textContent = `${fmt(total)} €`;
    $('#bkTotalUnit').textContent = `stima · al check-in${extras ? ` · +${fmt(extras)} extra` : ''}`;
  }

  // step interactions
  $('#bkDate').addEventListener('change', e => { state.booking.date = e.target.value; });
  $$('input[name="bkTime"]').forEach(r => r.addEventListener('change', () => { state.booking.time = r.value; }));
  $$('.bk-stepper button').forEach(b => {
    b.addEventListener('click', () => {
      const dir = b.dataset.step === '+' ? 1 : -1;
      let next = state.booking.people + dir;
      next = Math.max(1, Math.min(3, next));
      state.booking.people = next;
      $('#bkPeople').textContent = String(next);
      updateBookingTotal();
    });
  });
  $$('.bk-extra input').forEach(c => {
    c.addEventListener('change', () => {
      if(c.checked) state.booking.extras.add(c.dataset.extra);
      else state.booking.extras.delete(c.dataset.extra);
      updateBookingTotal();
    });
  });
  $('#bkEditExp').addEventListener('click', () => {
    closeSheet('bookingSheet');
    setTimeout(() => {
      // open a quick chooser — for now, just toggle tab and close
      window.scrollTo({top: 0, behavior:'smooth'});
    }, 250);
  });

  $('#bkBack').addEventListener('click', () => {
    if(state.bkStep > 1){ state.bkStep--; updateBookingStep(); }
  });
  $('#bkNext').addEventListener('click', () => {
    if(state.bkStep < 3){
      state.bkStep++;
      updateBookingStep();
      return;
    }
    // 148-MIG-04: final step → submit through SDK.
    // Source: 148-CONTEXT.md D-E-01..04; Phase 146 D-B-02 (booking validator).
    state.booking.name  = $('#bkName').value.trim();
    state.booking.phone = $('#bkPhone').value.trim();
    state.booking.email = $('#bkEmail').value.trim();
    state.booking.notes = $('#bkNotes').value.trim();

    // Required: name + phone + email (email is server-required per Phase 146 D-B-02).
    if(!state.booking.name){ $('#bkName').focus(); return; }
    if(!state.booking.phone){ $('#bkPhone').focus(); return; }
    if(!state.booking.email || state.booking.email.indexOf('@') < 0 || state.booking.email.indexOf('.') < 0){
      $('#bkEmail').focus();
      return;
    }

    var exp = getCurrentExp();
    if(!exp){ showBookingGenericError('Esperienza non disponibile.'); return; }
    var productId = Number(exp.id);
    if(!isFinite(productId)){ showBookingGenericError('Identificativo prodotto non valido.'); return; }

    var payload = buildBookingPayload(state.booking, exp);
    var bkNextBtn = $('#bkNext');
    bkNextBtn.disabled = true;
    Promise.resolve()
      .then(function () {
        if (!window.Gestiscilo || typeof Gestiscilo.book !== 'function') {
          return Promise.reject({ code: 'bootstrap_error', message: 'SDK non disponibile' });
        }
        return Gestiscilo.book(productId, payload);
      })
      .then(function (booking) {
        showBookingSuccess(booking);
      })
      .catch(function (err) {
        err = err || {};
        if (err.code === 'network_error') {
          var msg = composeWhatsappFallbackMessage(state.booking, exp);
          var waUrl = (window.Gestiscilo && Gestiscilo.contact && Gestiscilo.contact.waLink)
            ? Gestiscilo.contact.waLink(msg)
            : 'https://wa.me/?text=' + encodeURIComponent(msg);
          window.open(waUrl, '_blank', 'noopener');
          return;
        }
        if (err.code === 'validation_error' && err.field) {
          showBookingFieldError(err.field, err.message);
          return;
        }
        // unavailable, business_not_found, product_not_found,
        // idempotency_replay_conflict, internal_error, http_error, bootstrap_error
        showBookingGenericError(err.message || 'Riprova tra qualche momento');
      })
      .then(function () {
        bkNextBtn.disabled = false;
      });
  });


  // ============ TOPBAR DATA-NAV BUTTONS ============
  $$('[data-nav]').forEach(b => {
    b.addEventListener('click', () => {
      const which = b.dataset.nav;
      if(which === 'meteo'){ openMeteo(); }
    });
  });

  // ============ TABS ============
  $$('.tab').forEach(t => {
    t.addEventListener('click', () => setTab(t.dataset.tab));
  });

  // ============ METEO ============
  const WEATHER_ICONS = {
    sun:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.5 4.5l2 2M17.5 17.5l2 2M4.5 19.5l2-2M17.5 6.5l2-2"/></svg>',
    cloudy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M17.5 19a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.83 1.5A4 4 0 0 0 6 19h11.5z"/></svg>',
    rain:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M17.5 14a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.83 1.5A4 4 0 0 0 6 14"/><path d="M8 19l-1 2M12 19l-1 2M16 19l-1 2"/></svg>',
    storm:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M17.5 14a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.83 1.5A4 4 0 0 0 6 14"/><path d="M11 14l-2 4h3l-2 4"/></svg>'
  };

  function classifyWind(kmh){
    if(kmh < 18) return 'go';
    if(kmh < 30) return 'caution';
    return 'no';
  }
  function pickIcon(code){
    if(code == null) return WEATHER_ICONS.cloudy;
    if(code === 0) return WEATHER_ICONS.sun;
    if(code <= 3) return WEATHER_ICONS.cloudy;
    if(code >= 95) return WEATHER_ICONS.storm;
    if(code >= 51) return WEATHER_ICONS.rain;
    return WEATHER_ICONS.cloudy;
  }
  function dayShort(date){
    const d = new Date(date);
    return d.toLocaleDateString('it-IT', { weekday: 'short' });
  }
  function dayNum(date){
    const d = new Date(date);
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
  }
  function verdictFromCode(code, wind){
    const w = classifyWind(wind);
    const stormy = code >= 80;
    if(stormy) return 'no';
    if(w === 'no') return 'no';
    if(w === 'caution' || (code >= 51 && code < 80)) return 'caution';
    return 'go';
  }
  function meteoNowSkeleton(){
    return `
      <div class="meteo-now-ico"><span class="skel-dot"></span></div>
      <div class="meteo-now-c">
        <div class="meteo-now-temp"><span class="skel-bar skel-bar--temp"></span></div>
        <div class="meteo-now-meta"><span class="skel-bar skel-bar--meta"></span></div>
      </div>
      <div class="meteo-now-r">
        <small><span class="skel-bar skel-bar--xs"></span></small>
        <b><span class="skel-bar skel-bar--sm"></span></b>
      </div>
    `;
  }
  function meteoGridSkeleton(){
    return Array.from({length: 7}, () =>
      '<article class="md-day skel" aria-hidden="true"></article>'
    ).join('');
  }
  function showMeteoLoading(){
    const now  = $('#meteoNow');
    const grid = $('#meteoGrid');
    if(now){
      now.classList.add('is-loading');
      now.setAttribute('aria-busy', 'true');
      now.innerHTML = meteoNowSkeleton();
    }
    if(grid){
      grid.setAttribute('aria-busy', 'true');
      grid.innerHTML = meteoGridSkeleton();
    }
  }

  function vLabel(v){
    return v === 'go' ? 'Esci sereno' : (v === 'caution' ? 'Mare mosso' : 'Sconsigliato');
  }

  // Render targets — populate from a fetched data object
  function renderMeteoNow(data){
    const now = $('#meteoNow');
    if(!now || !data.current) return;
    now.innerHTML = `
      <div class="meteo-now-ico">${pickIcon(data.current.weather_code)}</div>
      <div class="meteo-now-c">
        <div class="meteo-now-temp">${Math.round(data.current.temperature_2m)}°</div>
        <div class="meteo-now-meta">Cattolica · ora</div>
      </div>
      <div class="meteo-now-r">
        <small>Vento</small>
        <b>${Math.round(data.current.wind_speed_10m)}<span> km/h</span></b>
      </div>
    `;
    now.classList.remove('is-loading');
    now.removeAttribute('aria-busy');
  }
  function renderMeteoGrid(data){
    const grid = $('#meteoGrid');
    if(!grid) return;
    const dates = data.daily.time;
    const codes = data.daily.weather_code;
    const tmax = data.daily.temperature_2m_max;
    const tmin = data.daily.temperature_2m_min;
    const wmax = data.daily.wind_speed_10m_max;
    grid.innerHTML = dates.map((dt,i) => {
      const v = verdictFromCode(codes[i], wmax[i]);
      return `
        <article class="md-day" data-v="${v}">
          <div class="md-dow">
            <b>${dayShort(dt).replace('.','')}</b>
            <small>${dayNum(dt)}</small>
          </div>
          <div class="md-icon">${pickIcon(codes[i])}</div>
          <div class="md-tx">
            <b>${Math.round(tmax[i])}° <span class="dim">/ ${Math.round(tmin[i])}°</span></b>
            <small>Vento ${Math.round(wmax[i])} km/h</small>
          </div>
          <span class="md-verdict" data-v="${v}" aria-label="${vLabel(v)}"></span>
        </article>
      `;
    }).join('');
    grid.removeAttribute('aria-busy');
  }
  function renderCompactMeteo(container, data){
    if(!container || !data || !data.daily) return;
    const dates = data.daily.time;
    const codes = data.daily.weather_code;
    const tmax = data.daily.temperature_2m_max;
    const wmax = data.daily.wind_speed_10m_max;
    container.innerHTML = dates.map((dt,i) => {
      const v = verdictFromCode(codes[i], wmax[i]);
      const day = new Date(dt).toLocaleDateString('it-IT', { weekday: 'short' })
        .replace('.','').slice(0,3);
      return `
        <article class="dt-md" data-v="${v}" aria-label="${day} · ${vLabel(v)}">
          <small>${day}</small>
          <span class="dt-md-ico">${pickIcon(codes[i])}</span>
          <b>${Math.round(tmax[i])}°</b>
          <span class="dt-md-verdict" aria-hidden="true"></span>
        </article>
      `;
    }).join('');
    container.removeAttribute('aria-busy');
  }
  function compactMeteoSkeleton(){
    return Array.from({length: 7}, () =>
      '<article class="dt-md skel" aria-hidden="true"></article>'
    ).join('');
  }

  // Single source of truth — fetch once, cache for the session
  let meteoData = null;
  let meteoFetchPromise = null;
  async function ensureMeteoData(){
    if(meteoData) return meteoData;
    if(meteoFetchPromise) return meteoFetchPromise;
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=43.96&longitude=12.74&current=temperature_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max&timezone=Europe%2FRome&forecast_days=7';
    meteoFetchPromise = (async () => {
      const r = await fetch(url);
      if(!r.ok) throw new Error('http ' + r.status);
      meteoData = await r.json();
      return meteoData;
    })();
    try {
      return await meteoFetchPromise;
    } finally {
      meteoFetchPromise = null;
    }
  }

  async function loadMeteo(){
    // If cached, paint immediately. Otherwise show skeleton and fetch.
    if(meteoData){
      renderMeteoNow(meteoData);
      renderMeteoGrid(meteoData);
      return;
    }
    showMeteoLoading();
    try{
      const data = await ensureMeteoData();
      renderMeteoNow(data);
      renderMeteoGrid(data);
    }catch(err){
      const now  = $('#meteoNow');
      const grid = $('#meteoGrid');
      if(now){ now.classList.remove('is-loading'); now.removeAttribute('aria-busy'); }
      if(grid){
        grid.removeAttribute('aria-busy');
        // 148-MIG-02: empty href; wirePhoneLinks patches it post-render. MIG-06 grep passes (no digit after wa.me/).
        grid.innerHTML = '<p style="text-align:center;color:var(--ink-3);font-size:13px">Impossibile caricare il meteo. <a href="https://wa.me/" style="color:var(--cyan-2);text-decoration:underline">Scrivici su WhatsApp</a> per il punto del giorno.</p>';
        if (window.Gestiscilo && Gestiscilo.wirePhoneLinks) { Gestiscilo.wirePhoneLinks(grid); }
      }
    }
  }

  async function loadCompactMeteo(container){
    if(!container) return;
    if(meteoData){
      renderCompactMeteo(container, meteoData);
      return;
    }
    container.setAttribute('aria-busy', 'true');
    container.innerHTML = compactMeteoSkeleton();
    try{
      const data = await ensureMeteoData();
      // Container may have been replaced if the user closed/reopened the sheet
      const live = $('#dtMeteoStrip');
      if(live) renderCompactMeteo(live, data);
    }catch(err){
      container.removeAttribute('aria-busy');
      container.innerHTML = '<p class="dt-md-fail">Meteo non disponibile in questo momento.</p>';
    }
  }

  function openMeteo(){
    openSheet('meteoSheet');
    loadMeteo();
  }

  // ============ STATUS ============
  function tickStatus(){
    const now = new Date();
    const h = now.getHours();
    const open = h >= 9 && h < 20;
    const wa  = (h >= 7 && h < 9) || (h >= 20 && h < 22);
    const status = open ? 'open' : (wa ? 'whatsapp' : 'closed');
    const pill = $('#statusPill');
    if(!pill) return;
    pill.dataset.status = status;
    const label = pill.querySelector('.status-label');
    if(label){
      label.textContent =
        status === 'open' ? 'Aperto' : (status === 'whatsapp' ? 'Solo WhatsApp' : 'Chiuso');
    }
  }

  // ============ SCROLL ELEVATION ============
  const topbar = document.querySelector('.topbar');
  let scrollTicking = false;
  function onScroll(){
    if(!scrollTicking){
      requestAnimationFrame(() => {
        if(topbar){
          topbar.classList.toggle('is-scrolled', window.scrollY > 8);
        }
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  // ============ INFO STRIP MARQUEE (mobile) ============
  function setupInfoStripMarquee(){
    if(window.innerWidth > 720) return;
    const wrap = document.querySelector('.info-strip-inner');
    if(!wrap || wrap.querySelector('.info-strip-marquee-inner')) return;

    const track = document.createElement('div');
    track.className = 'info-strip-track';

    // Move all existing children into the track, with · separators between them
    [...wrap.children].forEach((el, i) => {
      if(i > 0){
        const sep = document.createElement('span');
        sep.className = 'sep';
        sep.textContent = '·';
        track.appendChild(sep);
      }
      track.appendChild(el);
    });

    const clone = track.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');

    const inner = document.createElement('div');
    inner.className = 'info-strip-marquee-inner';
    inner.appendChild(track);
    inner.appendChild(clone);
    wrap.appendChild(inner);

    // tell CSS to switch the wrap into marquee layout
    wrap.classList.add('has-marquee');
  }

  // ============ HIDE TOPBAR + CAT-BAR WHEN OUTSIDE PRODUCTS ============
  // The chrome (top tabs + bottom filter bar) is product-context UI.
  // The hero now sits ABOVE the feed, so the cat-bar must hide both
  // before (hero) and after (other sections) the feed — not only past it.
  // Inset both top and bottom of the rootMargin so the feed only counts
  // as "in view" once it occupies the central band of the viewport.
  function setupChromeHideOnFooter(){
    if(!('IntersectionObserver' in window)) return;
    const feed = document.getElementById('feed');
    if(!feed) return;
    const obs = new IntersectionObserver((entries) => {
      const e = entries[0];
      document.body.classList.toggle('is-past-products', !e.isIntersecting);
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    obs.observe(feed);
  }

  // ============ FOOTER CATEGORY LINKS — switch tab/cat in-app ============
  function wireFooterCatLinks(){
    $$('.foot-col a[data-tab]').forEach(a => {
      a.addEventListener('click', (ev) => {
        const tab = a.dataset.tab;
        const cat = a.dataset.cat;
        if(!tab) return;
        ev.preventDefault();
        if(tab !== state.activeTab) setTab(tab);
        if(cat){
          state.activeCat = cat;
          renderCats();
          renderCards();
        }
        // Land on #feed (where the chips and cards are visible on mobile),
        // not at the top of the page where the cat-bar is hidden.
        const feedEl = $('#feed');
        if(feedEl) feedEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  // ============ INIT ============
  function init(){
    document.body.dataset.activeTab = state.activeTab;
    renderCats();
    renderCards();
    tickStatus();
    setInterval(tickStatus, 60_000);
    onScroll();
    setupInfoStripMarquee();
    setupChromeHideOnFooter();
    wireFooterCatLinks();
    wireBookCtas();
    wireDetailCtas();

    // pre-set deep link
    if(location.hash === '#love'){ setTab('love'); }
    if(location.hash === '#escursioni'){ setTab('escursioni'); }
    if(location.hash === '#party'){ setTab('party'); }
    if(location.hash === '#meteo'){ openMeteo(); }
  }

  // Delegated click handler: any element with [data-book] opens the booking
  // sheet. Empty value = default experience for the active tab; a non-empty
  // value selects a specific experience by id (e.g. data-book="classic").
  function wireBookCtas(){
    document.addEventListener('click', (ev) => {
      const trigger = ev.target.closest('[data-book]');
      if(!trigger) return;
      ev.preventDefault();
      const expId = trigger.getAttribute('data-book');
      openBooking(expId || null);
    });
  }

  // Delegated click handler: any element with [data-detail="<id>"] opens
  // the existing product detail sheet. Used by the standalone card sections
  // (Esperienze Standard / Love Flagship). A nested [data-book] wins —
  // clicking an inner Prenota CTA still goes to the booking sheet.
  function wireDetailCtas(){
    document.addEventListener('click', (ev) => {
      if(ev.target.closest('[data-book]')) return;
      const trigger = ev.target.closest('[data-detail]');
      if(!trigger) return;
      const expId = trigger.getAttribute('data-detail');
      if(!expId) return;
      ev.preventDefault();
      openDetail(expId);
    });
  }

  // 148-MIG-03: init() is now invoked by the SDK bootstrap loader above after
  // Gestiscilo.products() resolves and EXPERIENCES is populated. The previous
  // synchronous init() entry was removed so cards render only with data present.
})();


/* =====================================================
   MIGRATED-SECTIONS BEHAVIOURS
   Reveal-on-scroll, FAQ accordion, 7-day inline forecast.
   These power the manifesto / media / fleet / how /
   meteo-section / faq / gallery blocks added below the
   products feed.
   ===================================================== */
(function(){
  'use strict';

  /* ---- Reveal on scroll ---- */
  const revealEls = document.querySelectorAll('.reveal, .reveal-s');
  if (revealEls.length) {
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        }
      }, { rootMargin: '0px 0px -10% 0px', threshold: .06 });
      revealEls.forEach(el => io.observe(el));
    } else {
      revealEls.forEach(el => el.classList.add('in'));
    }
  }

  /* ---- FAQ accordion ---- */
  document.querySelectorAll('.faq .fa').forEach(it => {
    it.addEventListener('click', () => it.classList.toggle('open'));
  });

  /* ---- 7-day inline forecast (Open-Meteo, attribution: Aeronautica Militare in UI) ---- */
  (async function(){
    const grid = document.getElementById('fcastGrid');
    if (!grid) return;

    const lat = 43.9592, lon = 12.7431;
    const tz  = encodeURIComponent('Europe/Rome');
    const marineUrl  = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&daily=wave_height_max&timezone=${tz}&forecast_days=7`;
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,wind_speed_10m_max&timezone=${tz}&forecast_days=7`;

    const fetchJson = async (url) => {
      const r = await fetch(url);
      if (!r.ok) throw new Error(r.statusText);
      return r.json();
    };

    try {
      const [marine, weather] = await Promise.all([
        fetchJson(marineUrl),
        fetchJson(weatherUrl)
      ]);

      const days = marine.daily.time.map((d, i) => ({
        date: new Date(d + 'T00:00'),
        wave: marine.daily.wave_height_max[i],
        wind: weather.daily.wind_speed_10m_max[i],
        code: weather.daily.weather_code[i]
      }));

      grid.innerHTML = days.map((d, i) => renderDay(d, i === 0)).join('');
    } catch (err) {
      console.warn('Forecast unavailable:', err);
      grid.innerHTML = `
        <div class="fcast-empty">
          Le previsioni si stanno aggiornando. Se non le vedi, <a href="https://wa.me/">scrivici su WhatsApp</a> e ti diciamo le condizioni in tempo reale.
        </div>
      `;
      // 148-MIG-02: SITE 3 container not held in a local variable; pass document.body
      // (wirePhoneLinks is idempotent — re-scanning the body to patch newly inserted anchors is cheap).
      if (window.Gestiscilo && Gestiscilo.wirePhoneLinks) { Gestiscilo.wirePhoneLinks(document.body); }
    }

    function renderDay(d, isToday) {
      const v = verdict(d);
      const dow = d.date.toLocaleDateString('it-IT', { weekday: 'short' }).replace('.', '');
      const wave = (typeof d.wave === 'number') ? d.wave.toFixed(1) : '—';
      const wind = (typeof d.wind === 'number') ? Math.round(d.wind) : '—';
      return `
        <article class="fcast-day${isToday ? ' today' : ''}" data-verdict="${v.level}">
          <div class="fcast-date">
            <span class="fcast-dow">${dow}</span>
            <span class="fcast-num">${d.date.getDate()}</span>
          </div>
          <div class="fcast-icon">${weatherIcon(d.code)}</div>
          <div class="fcast-stats">
            <span><b>${wave}</b> m mare</span>
            <span><b>${wind}</b> km/h vento</span>
          </div>
          <span class="fcast-verdict">${v.label}</span>
        </article>
      `;
    }

    function verdict({ wave, wind, code }) {
      if (code >= 95) return { level: 'no', label: 'No' };
      if (code >= 71 && code <= 77) return { level: 'no', label: 'No' };
      if ((typeof wave === 'number' && wave > 0.8)
         || (typeof wind === 'number' && wind > 30)
         || (code >= 65 && code <= 67)
         || (code >= 82 && code <= 86)) return { level: 'no', label: 'Sconsigliato' };
      if ((typeof wave === 'number' && wave > 0.5)
         || (typeof wind === 'number' && wind > 22)
         || (code >= 51 && code <= 64)
         || (code >= 80 && code <= 81)
         || (code >= 45 && code <= 48)) return { level: 'caution', label: 'Mare mosso' };
      return { level: 'go', label: 'Perfetto' };
    }

    function weatherIcon(code) {
      const sun = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`;
      const partly = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="3"/><path d="M19 17a4 4 0 0 0-4-4h-1a5 5 0 0 0-9.5 1.5A4 4 0 0 0 7 20h12a3 3 0 0 0 0-6"/></svg>`;
      const cloud = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 18a4 4 0 0 0-4-4h-1a5 5 0 0 0-9.5 1.5A4 4 0 0 0 7 20h12a3 3 0 0 0 0-6"/></svg>`;
      const fog = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8h18M3 12h18M3 16h18M3 20h18"/></svg>`;
      const rain = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14a4 4 0 0 0-4-4h-1a5 5 0 0 0-9.5 1.5A4 4 0 0 0 7 16h12a3 3 0 0 0 0-6"/><path d="M8 19v3M12 19v3M16 19v3"/></svg>`;
      const snow = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14a4 4 0 0 0-4-4h-1a5 5 0 0 0-9.5 1.5A4 4 0 0 0 7 16h12a3 3 0 0 0 0-6"/><path d="M8 20l1 1M12 20l1 1M16 20l1 1"/></svg>`;
      const thunder = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14a4 4 0 0 0-4-4h-1a5 5 0 0 0-9.5 1.5A4 4 0 0 0 7 16h12a3 3 0 0 0 0-6"/><polyline points="13 14 9 19 12 19 11 22"/></svg>`;

      if (code === 0 || code === 1) return sun;
      if (code <= 3) return partly;
      if (code <= 48) return fog;
      if (code <= 67) return rain;
      if (code <= 77) return snow;
      if (code <= 82) return rain;
      if (code <= 86) return snow;
      return thunder;
    }
  })();

})();
