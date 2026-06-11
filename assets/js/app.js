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

  // Phase 184 (V-184-13): test seam — expose updateBookingTotal + a minimal hook to
  // seed an experience so tests can drive renderQuoteEnvelope with a stubbed
  // window.Gestiscilo.quote. Production code paths do not call these. Hoisted to top
  // of IIFE so it lands before any DOM-dependent wiring that throws on a barebones
  // test page (which lacks the JSA booking-sheet DOM).
  window.JSA.updateBookingTotal = function () { return updateBookingTotal.apply(this, arguments); };
  window.JSA.__seedTestExperience = function (exp) {
    if (!exp || !exp.slug) return;
    EXPERIENCES.push(exp);
    state.booking.expId = exp.id != null ? exp.id : exp.slug;
  };

  function priceFor(e) {
    if (typeof e.price_cents === 'number') return e.price_cents / 100;
    if (e.aliasOf) {
      var canon = EXPERIENCES.find(function (p) { return p.id === e.aliasOf; });
      if (canon) return priceFor(canon);
    }
    return 0;
  }

  function unitFor(e) {
    if (e.per_person === true) return '/persona';
    if (e.aliasOf) {
      var canon = EXPERIENCES.find(function (p) { return p.id === e.aliasOf; });
      if (canon) return unitFor(canon);
    }
    return '';
  }

  // Narrow allow-list sanitizer for operator-sourced title strings rendered via innerHTML.
  // Escapes all HTML then restores only <em> and <b> tags (used for italic/bold in titles).
  function sanitizeTitle(s) {
    if (!s) return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
             .replace(/&lt;(\/?(?:em|b))&gt;/g, '<$1>');
  }

  // Fill .flagship-overview[data-active-tab] sections with N skeleton cards
  // filtered by metadata.tab. Runs BEFORE updateExpGrid so the enrichment pass
  // picks up the dynamically generated cards via their data-product-id.
  // Default N = 3, override via data-max on the .exp-grid element.
  // Sub-page hardcoded .exp-grid sections (not inside .flagship-overview) are
  // untouched — they continue to use the slug-based enrichment-only flow.
  // Operates on raw SDK rows (pre-mapProduct) so sort_order and metadata.tab
  // are first-class — mapProduct drops sort_order from its return shape.
  function fillCategoryGrids(rawRows) {
    var sections = document.querySelectorAll('.flagship-overview[data-active-tab]');
    sections.forEach(function (section) {
      var grid = section.querySelector('.exp-grid');
      if (!grid) return;
      var tab = section.getAttribute('data-active-tab');
      var max = parseInt(grid.getAttribute('data-max') || '3', 10) || 3;

      var filtered = rawRows
        .filter(function (p) { return p && p.metadata && p.metadata.tab === tab; })
        .sort(function (a, b) {
          var sa = (a.sort_order != null) ? a.sort_order : Infinity;
          var sb = (b.sort_order != null) ? b.sort_order : Infinity;
          if (sa !== sb) return sa - sb;
          return String(a.slug || a.id).localeCompare(String(b.slug || b.id));
        })
        .slice(0, max);

      if (filtered.length === 0) return;

      grid.innerHTML = filtered.map(function (p, i) {
        var slug = String(p.slug || (p.metadata && p.metadata.slug) || p.id);
        var safeSlug = slug.replace(/"/g, '&quot;');
        var nn = String(i + 1).padStart(2, '0');
        var titleFallback = p.name || '';
        return '' +
          '<article class="exp exp--love" data-detail="' + safeSlug + '" data-product-id="' + safeSlug + '">' +
            '<div class="exp-n">' + nn + '</div>' +
            '<div class="exp-illu"></div>' +
            '<h3>' + titleFallback.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</h3>' +
            '<p></p>' +
            '<ul class="exp-tags"></ul>' +
            '<div class="exp-foot">' +
              '<div class="exp-price"><b></b><span></span></div>' +
              '<span class="exp-go">Scopri <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg></span>' +
            '</div>' +
          '</article>';
      }).join('');
    });
  }

  function updateExpGrid(experiences) {
    var articles = document.querySelectorAll('article.exp[data-product-id]');
    articles.forEach(function (article) {
      var pid = article.getAttribute('data-product-id');
      var e = experiences.find(function (x) {
        return String(x.id) === pid
            || String(x.jsa_id || '') === pid
            || String(x.slug || '') === pid
            || String(x.detail_key || '') === pid;
      });
      if (!e) return; // Pitfall 2: flotta-only products with no EXPERIENCES match — skip silently, leave static fallback

      // Image: prefer e.img (sourced from p.media[0].url by mapProduct)
      var illu = article.querySelector('.exp-illu');
      if (illu) {
        illu.style.backgroundImage = e.img ? "url('" + e.img + "')" : '';
      }

      // Tags: repopulate from e.tags array; empty array = empty ul (CSS collapses)
      var tags = article.querySelector('.exp-tags');
      if (tags) {
        tags.innerHTML = '';
        (e.tags || []).forEach(function (t) {
          var li = document.createElement('li');
          li.textContent = t;
          tags.appendChild(li);
        });
      }

      // Price: textContent (XSS-safe) using module-scope priceFor/unitFor
      var priceB = article.querySelector('.exp-price b');
      var priceSpan = article.querySelector('.exp-price span');
      if (priceB) priceB.textContent = (e.per_person ? 'da ' : '') + priceFor(e) + '€';
      if (priceSpan) priceSpan.textContent = unitFor(e);
      var h3 = article.querySelector('h3');
      if (h3 && e.title) h3.innerHTML = sanitizeTitle(e.title);
      var pEl = article.querySelector('p');
      if (pEl && e.lead) pEl.textContent = e.lead;
    });
  }

  // 148-MIG-03: SDK bootstrap — wirePhoneLinks + product catalogue loader.
  // Source: 148-CONTEXT.md D-C-01..07 + D-D-02; 148-RESEARCH.md Code Example 2.

  function mapProduct(p) {
    var meta = p.metadata || {};
    var mediaImgs = (p.media && p.media.length)
      ? p.media.map(function (m) { return m.url; })
      : null;
    var imgs = mediaImgs || meta.imgs || (meta.img ? [meta.img] : []);
    var img = imgs[0] || '';
    // Prefer the top-level p.slug (first-class column post-migration 108).
    // Fall back to metadata.jsa_id for clients still seeded under the old path.
    var slug = p.slug || meta.jsa_id || meta.slug || '';
    // Phase 184 D-19 / Pitfall 11: surface Phase 175 typed top-level fields
    // verbatim on the returned shape so priceFor/unitFor + the upcoming
    // Plan 04 quote loop can read e.price_cents / e.per_person / capacity
    // fields directly. Metadata spread preserved — other consumers still
    // use meta.tab / tier / tags / imgs / canonical.
    return Object.assign(
      { id: String(p.id), slug: slug, basePrice: (p.price_cents || 0) / 100 },
      meta,
      {
        slug: slug,
        img: img,
        imgs: imgs,
        linked_products: p.linked_products || [],
        price_cents: p.price_cents,
        per_person: p.per_person,
        min_people: p.min_people,
        max_people: p.max_people,
        overage_threshold: p.overage_threshold,
        overage_price_cents: p.overage_price_cents,
      }
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
    // Field names must match src/api/public_booking.rs::PublicBookingPayload.
    // `people` not `party_size` (Phase 175), `owner_notes` not `notes`.
    var payload = {
      booking_date:     s.date,
      booking_time:     s.time,
      duration_minutes: minutes,
      people:           Number(s.people) || 1,
      guest_name:       s.name,
      guest_email:      s.email,
      guest_phone:      s.phone,
    };
    if (s.notes && String(s.notes).trim()) {
      payload.owner_notes = String(s.notes).trim();
    }
    // Phase 184 (D-22, Pitfall 4): resolve state.booking.extras (Set of link.id strings)
    // to backend {slug, quantity} shape via extrasLookup. .filter(Boolean) drops stale
    // link.ids no longer in extrasLookup (e.g. user toggled product mid-booking).
    // duration_minutes is NOT touched — extras DO NOT extend booking duration (D-26).
    if (s.extras && s.extras.size) {
      payload.extras = Array.from(s.extras).map(function (linkId) {
        var entry = extrasLookup[String(linkId)];
        var qty = (state.booking.extraQty && state.booking.extraQty[String(linkId)]) || 1;
        return entry && entry.child_slug
          ? { slug: entry.child_slug, quantity: qty }
          : null;
      }).filter(Boolean);
    }
    return payload;
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

  // djb2 string hash -- deterministic, no crypto dependency.
  // Used only for idempotency key stability (PUBAPI-10 body field), not a security primitive.
  function djb2Hash(str) {
    var h = 5381;
    for (var i = 0; i < str.length; i++) {
      h = ((h << 5) + h) + str.charCodeAt(i);
      h = h & 0xFFFFFFFF;
    }
    return (h >>> 0).toString(16).padStart(8, '0');
  }

  function buildIdempotencyKey(productId, date, time, email) {
    var raw = [productId, date, time, (email || '').toLowerCase()].join('|');
    return 'jsk-' + djb2Hash(raw) + '-' + djb2Hash(raw + raw);
  }

  // 148-MIG-04: inline success / error UI helpers. Warning #5 closed at plan time —
  // the success/toast surface helpers were verified absent on master HEAD, so these
  // helpers own the entire success/error surface (no upstream reach-throughs permitted).
  function showBookingSuccess(booking) {
    var modal = document.getElementById('bookingSheet')
             || document.getElementById('bkModal')
             || document.querySelector('.bk-modal')
             || document.querySelector('[data-booking-modal]');
    // Defensive field read: PUBAPI-05 spec says {id, expires_at}; Phase 148 expected booking_id.
    // Prefer booking_id (existing Phase 148 convention), fall back to id (Phase 153 PUBAPI-05).
    var rawId = (booking && booking.booking_id != null) ? booking.booking_id
              : (booking && booking.id != null) ? booking.id
              : null;
    var bookingIdLabel = (rawId != null) ? String(rawId) : '—';
    var dateLabel      = (booking && booking.booking_date) ? String(booking.booking_date) : '';
    var timeLabel      = (booking && booking.booking_time) ? String(booking.booking_time) : '';
    var when           = (dateLabel && timeLabel) ? (dateLabel + ' alle ' + timeLabel) : '';

    // D-06: expires_at display -- static formatted string, no setInterval in v1.
    var expiryLine = '';
    if (booking && booking.expires_at) {
      var expDate = new Date(booking.expires_at);
      if (!isNaN(expDate.getTime())) {
        expiryLine = '<p style="color:var(--ink-3);margin-bottom:16px">Scade alle ' +
          expDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) +
          '</p>';
      }
    }

    // Mirror the page's .empty-ico placeholder: 56px surface circle, line
    // border, fine 1.8 stroke — keeps the success state visually consistent
    // with other low-emphasis status surfaces on the site.
    var iconHtml =
      '<div aria-hidden="true" ' +
           'style="width:56px;height:56px;border-radius:50%;' +
                  'background:var(--surface);border:1px solid var(--line);' +
                  'display:grid;place-items:center;margin:0 auto 12px;color:var(--ink)">' +
        '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" ' +
             'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M20 6L9 17l-5-5"/>' +
        '</svg>' +
      '</div>';

    var html =
      '<div class="bk-success-state" role="status" aria-live="polite" ' +
           'style="min-height:200px;display:grid;place-items:center;padding:32px;text-align:center;color:var(--ink)">' +
        '<div>' +
          iconHtml +
          '<p style="font-size:18px;font-weight:600;margin-bottom:8px">Prenotazione ricevuta!</p>' +
          '<p style="color:var(--ink-3);margin-bottom:12px">Numero: <code>' + bookingIdLabel + '</code></p>' +
          (when ? '<p style="color:var(--ink-3);margin-bottom:12px">' + when + '</p>' : '') +
          expiryLine +
          '<p style="color:var(--ink-2)">Ti abbiamo inviato un’email di conferma. ' +
          'Clicca il link entro 15 minuti per completare la prenotazione.</p>' +
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
      booking_time:     null,           // radio group — cannot focus()
      duration_minutes: null,           // not user-facing
      people:           '#bkPeople',
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

  // 148-MIG-05: availability calendar for the booking modal step 1.
  // Source: 148-CONTEXT.md D-F-01..07; 148-RESEARCH.md Code Example 4.
  // Gates on modalExp.canonical === true (warning #6 fix — operator-owned boolean,
  // not render-code-era tab/cat strings). Empty-state placeholder honors
  // feedback_empty_states_min_height.md (min-height ≥ 40 px on inline state surfaces).

  var availabilityCache = new Map();   // productId -> {at: epoch_ms, data: {dates: [{date, times}]}}

  function formatDateISO(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  function formatDateChipLabel(iso) {
    // 'YYYY-MM-DD' -> 'Mer 21/05' style. Italian short day names.
    var parts = iso.split('-');
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    var DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
    return DAY_NAMES[d.getDay()] + ' ' + parts[2] + '/' + parts[1];
  }

  function getAvailability(productId) {
    var hit = availabilityCache.get(productId);
    if (hit && Date.now() - hit.at < 30000) {
      return Promise.resolve(hit.data);
    }
    var today = new Date();
    var week  = new Date(today); week.setDate(week.getDate() + 6);
    return Gestiscilo.availability(productId, {
      from: formatDateISO(today),
      to:   formatDateISO(week),
    }).then(function (data) {
      availabilityCache.set(productId, { at: Date.now(), data: data });
      return data;
    });
  }

  function availabilitySkeleton() {
    var chips = Array.from({length: 7}, function() {
      return '<span class="skel-bar skel-light" style="height:34px;width:52px;border-radius:20px;flex-shrink:0"></span>';
    }).join('');
    var slots = Array.from({length: 6}, function() {
      return '<span class="skel-bar skel-light" style="height:38px;width:72px;border-radius:8px"></span>';
    }).join('');
    return '<div style="min-height:120px;padding:4px 0" aria-hidden="true">' +
      '<div style="display:flex;gap:8px;overflow:hidden;margin-bottom:12px">' + chips + '</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px">' + slots + '</div>' +
      '</div>';
  }

  function renderAvailability(productId) {
    var container = document.getElementById('bkAvailability');
    if (!container) return;
    if (!window.Gestiscilo || typeof Gestiscilo.availability !== 'function') {
      renderAvailabilityError(container, { code: 'bootstrap_error', message: 'SDK non disponibile' }, productId);
      return;
    }
    container.innerHTML = availabilitySkeleton();
    getAvailability(productId)
      .then(function (data) {
        renderAvailabilityData(container, data, productId);
      })
      .catch(function (err) {
        renderAvailabilityError(container, err, productId);
      });
  }

  function renderAvailabilityData(container, data, productId) {
    if (!data || !Array.isArray(data.dates) || data.dates.length === 0) {
      renderAvailabilityEmpty(container);
      return;
    }
    var anyTimes = data.dates.some(function (d) { return Array.isArray(d.times) && d.times.length > 0; });
    if (!anyTimes) {
      renderAvailabilityEmpty(container);
      return;
    }

    // Build date strip: 7 chips, one per day in data.dates order. Disable chips with empty times.
    var stripHtml = data.dates.map(function (d) {
      var disabled = (!Array.isArray(d.times) || d.times.length === 0);
      return '<button type="button" class="bk-date-chip"' +
             ' data-date="' + d.date + '"' +
             (disabled ? ' disabled aria-disabled="true"' : '') +
             '>' + formatDateChipLabel(d.date) + '</button>';
    }).join('');

    container.innerHTML =
      '<div class="bk-date-strip" role="tablist" aria-label="Date disponibili" style="display:flex;gap:8px;overflow-x:auto;padding:8px 0">' + stripHtml + '</div>' +
      '<div class="bk-time-grid" id="bkTimeGrid" style="min-height:60px;padding:8px 0"></div>';

    // Wire chip clicks.
    var chips = container.querySelectorAll('.bk-date-chip');
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        if (chip.disabled) return;
        chips.forEach(function (c) { c.classList.remove('is-active'); });
        chip.classList.add('is-active');
        var d = data.dates.find(function (x) { return x.date === chip.dataset.date; });
        if (d) selectDate(d);
      });
    });

    // Initial selection: first date with non-empty times.
    var initial = data.dates.find(function (d) { return Array.isArray(d.times) && d.times.length > 0; });
    if (initial) {
      var initialChip = container.querySelector('.bk-date-chip[data-date="' + initial.date + '"]');
      if (initialChip) initialChip.classList.add('is-active');
      selectDate(initial);
    }
  }

  function selectDate(d) {
    state.booking.date = d.date;
    state.booking.time = '';   // reset until user picks a time
    var grid = document.getElementById('bkTimeGrid');
    if (!grid) return;
    if (!Array.isArray(d.times) || d.times.length === 0) {
      grid.innerHTML = '<p style="color:var(--ink-3)">Nessun orario disponibile per questa data.</p>';
      return;
    }
    grid.innerHTML = d.times.map(function (t) {
      return '<label style="display:inline-block;padding:6px 10px;margin:4px;border:1px solid var(--ink-5);border-radius:6px">' +
             '<input type="radio" name="bkTime" value="' + t + '" style="margin-right:6px">' + t +
             '</label>';
    }).join('');
    var radios = grid.querySelectorAll('input[name="bkTime"]');
    radios.forEach(function (r) {
      r.addEventListener('change', function () {
        if (r.checked) state.booking.time = r.value;
      });
    });
  }

  function renderAvailabilityEmpty(container) {
    container.innerHTML =
      '<p style="min-height:60px;display:grid;place-items:center;color:var(--ink-3);text-align:center">' +
        'Nessuna disponibilità nei prossimi 7 giorni — ' +
        '<a href="https://wa.me/" target="_blank" rel="noopener">scrivici su WhatsApp</a>' +
      '</p>';
    if (window.Gestiscilo && Gestiscilo.wirePhoneLinks) { Gestiscilo.wirePhoneLinks(container); }
  }

  function renderAvailabilityError(container, err, productId) {
    var message = (err && err.message) ? err.message : 'Impossibile caricare la disponibilità.';
    container.innerHTML =
      '<div style="min-height:120px;display:grid;place-items:center;padding:16px;color:var(--ink-3);text-align:center">' +
        '<p>' + message + '</p>' +
        '<button type="button" class="bk-retry-availability" style="margin-top:8px;padding:6px 12px">Riprova</button>' +
      '</div>';
    var btn = container.querySelector('.bk-retry-availability');
    if (btn) {
      btn.addEventListener('click', function () {
        // Bust the cache entry so retry hits the network.
        availabilityCache.delete(productId);
        renderAvailability(productId);
      });
    }
  }

  // Defer the SDK bootstrap until the document has finished parsing so
  // embed/v1.js (loaded by a later <script> tag in the template) has had
  // a chance to attach window.Gestiscilo. Previously this ran inline at
  // module load — when app.js comes BEFORE embed/v1.js in the script
  // order (the post-Phase-173 template layout), the SDK isn't defined
  // yet and the entire chain is silently skipped, so static editorial
  // cards never progressive-enhance.
  function runSdkBootstrap() {
    if (typeof window === 'undefined' || !window.Gestiscilo || !Gestiscilo.ready) {
      // SDK absent — empty-catalogue state, no crash.
      showEmptyCatalogueState();
      return;
    }
    // 158: SDK bootstrap — product catalogue loader + updateExpGrid.
    // Phase 186: Gestiscilo.autoWire() auto-starts on ready and re-wires on DOM
    // mutations; manual wirePhoneLinks/wireEmailLinks are no longer needed here.
    Gestiscilo.ready
      .then(function () {
        return Gestiscilo.products();
      })
      .then(function (rows) {
        if (!Array.isArray(rows) || rows.length === 0) {
          showEmptyCatalogueState();
          return;
        }
        // Populate per-category .flagship-overview grids BEFORE enrichment so
        // the dynamically generated cards' data-product-id is in the DOM when
        // updateExpGrid walks article.exp[data-product-id].
        fillCategoryGrids(rows);
        EXPERIENCES.splice.apply(EXPERIENCES, [0, EXPERIENCES.length].concat(rows.map(mapProduct)));
        // init() touches DOM elements (#cards, #feed) that may not be present
        // on every page (sub-pages don't include the feed). Don't let a missing
        // DOM node abort the chain — updateExpGrid runs on .exp cards which
        // every page has, and the bug pattern was: init() throws → static
        // editorial cards silently never enhance.
        if (typeof init === 'function') {
          try { init(); }
          catch (err) { if (window.console && console.warn) console.warn('init skipped:', err && err.message); }
        }
        updateExpGrid(EXPERIENCES);
        // 166 D-02: deep-link entry — index.html#p=<id> opens detail sheet
        var dl = window.JSA && JSA.parseDeepLink ? JSA.parseDeepLink(location.hash) : null;
        if (dl && dl.id) {
          setTimeout(function () { openDetail(dl.id); }, 50);
        }
      })
      .catch(function (err) {
        if (window.console && console.warn) { console.warn('158: bootstrap failed:', err); }
        showEmptyCatalogueState();
      });
  }

  // Run the bootstrap after the document has parsed so the SDK (loaded by
  // a later <script> tag) is available. Idempotent: runSdkBootstrap checks
  // window.Gestiscilo before doing work.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runSdkBootstrap);
  } else {
    runSdkBootstrap();
  }

  // applyTenantInfo / geocodeAddress / applyMap moved to assets/js/tenant-info.js
  // (shared via _layout.html so every sub-page hydrates the info-strip,
  // contact card, status pill and OSM map — not just index).

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
      // link.id -> quantity for per-unit extras (Telo Mare, metadata.qtyMax > 1).
      // Absent keys default to 1 at quote/payload time.
      extraQty: {},
      name: '',
      phone: '',
      email: '',
      notes: ''
    },
    bkStep: 1,
    cardCarousels: {}, // id -> currentIndex
    returnToDetail: null // when set, closing meteo reopens this detail id
  };

  // Phase 184 (D-20, Pitfall 5): debounce timer + cart-generation counter for /quote
  // race protection. updateBookingTotal() rewrites use these to coalesce stepper drags
  // and drop stale responses when a newer edit lands first.
  var quoteDebounceTimer = null;
  var quoteCartGeneration = 0;

  // Phase 184 (D-22, Pitfall 4): link.id (stringified) -> {child_slug, name} lookup.
  // state.booking.extras carries link.id values (set by dataset.extra in renderExtras),
  // NOT slugs. Backend POST /bookings expects {slug, quantity}. This map bridges them.
  // Populated by renderExtras on each render; read by buildBookingPayload at submit and
  // by updateBookingTotal when assembling /quote cart items.
  var extrasLookup = {};

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

      // Conditional rendering: badge / rating / loc are optional in product
      // metadata. Render the elements only when truthy so empty-state values
      // ("undefined", "0.00") don't leak into the UI.
      const hasBadge  = typeof e.badge === 'string' && e.badge.trim().length > 0;
      const hasRating = typeof e.rating === 'number' && e.rating > 0;
      const hasLoc    = typeof e.loc === 'string' && e.loc.trim().length > 0;
      const hasLead   = typeof e.lead === 'string' && e.lead.trim().length > 0;
      const stars     = hasRating ? e.rating.toFixed(2) : '';
      return `
        <article class="card ${isLove ? 'card--love' : ''}" data-card="${e.id}">
          <div class="card-img" data-card-img="${e.id}">
            ${mediaHtml}
            ${hasBadge ? `<span class="card-badge ${isLove ? 'card-badge--love' : ''}">${e.badge}</span>` : ''}
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
              <h3 class="card-title">${sanitizeTitle(e.title)}</h3>
              ${hasRating ? `<span class="card-rating" aria-label="Voto ${stars}"><svg viewBox="0 0 24 24"><path d="M12 2l2.9 6.9L22 10l-5.5 4.8L18.2 22 12 18.2 5.8 22l1.7-7.2L2 10l7.1-1.1z"/></svg>${stars}</span>` : ''}
            </div>
            ${hasLoc ? `<p class="card-loc">${e.loc}</p>` : ''}
            <p class="card-meta">${e.meta}</p>
            ${hasLead ? `<p class="card-desc">${sanitizeTitle(e.lead)}</p>` : ''}
            <div class="card-foot">
              <p class="card-price"><b>${e.per_person ? 'da ' : ''}${priceFor(e)}€</b><small>${unitFor(e)}</small></p>
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
    const scroller = sheet.querySelector('.sheet-body');

    // Top band of the sheet (px from the sheet's top edge) inside which a
    // pointerdown can also start the close-drag, regardless of which child
    // element it lands on (hero image, title, summary strip, …). Picked to
    // cover the visual "header" area of all three sheets without reaching
    // into the form controls below.
    const TOP_BAND_PX = 140;
    const INTERACTIVE_SEL = 'button, a, input, select, textarea, label, [role="button"], [contenteditable=""], [contenteditable="true"]';

    let startY = 0;
    let dy = 0;
    let dragging = false;
    let startTime = 0;

    function startDrag(e, captureTarget){
      startY = e.clientY;
      dy = 0;
      dragging = true;
      startTime = Date.now();
      sheet.style.transition = 'none';
      if(grab) grab.classList.add('is-dragging');
      try{ captureTarget.setPointerCapture(e.pointerId); }catch(_){}
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
      if(grab) grab.classList.remove('is-dragging');
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

    // (1) Grabber drag — unchanged behaviour, dedicated handle.
    if(grab){
      grab.addEventListener('pointerdown', (e) => {
        if(!isMobileSheet()) return;
        startDrag(e, grab);
      });
      grab.addEventListener('pointermove', onMove);
      grab.addEventListener('pointerup', onUp);
      grab.addEventListener('pointercancel', onUp);
    }

    // (2) Upper-band drag — start the same close-gesture when the user
    // pulls from any non-interactive spot in the top band of the sheet
    // (hero image, title row, summary strip). Visual layout untouched.
    sheet.addEventListener('pointerdown', (e) => {
      if(!isMobileSheet() || dragging) return;
      const t = e.target;
      if(!t || !t.closest) return;
      // the grabber has its own binding above
      if(t.closest('.sheet-grab')) return;
      // never hijack interactive controls inside the band
      if(t.closest(INTERACTIVE_SEL)) return;
      // only when scrollable content is at the top — otherwise the user
      // is scrolling content, not dismissing the sheet
      if(scroller && scroller.scrollTop > 0) return;
      // restrict to the upper band of the visible sheet
      const rect = sheet.getBoundingClientRect();
      if(e.clientY - rect.top > TOP_BAND_PX) return;
      startDrag(e, sheet);
    });
    sheet.addEventListener('pointermove', onMove);
    sheet.addEventListener('pointerup', onUp);
    sheet.addEventListener('pointercancel', onUp);
  }
  ['bookingSheet','meteoSheet','detailSheet'].forEach(attachDragClose);

  // ============ DETAIL SHEET ============
  function openDetail(id){
    const e = EXPERIENCES.find(x =>
      x.id === id ||
      String(x.jsa_id || '') === id ||
      String(x.slug || '') === id ||
      String(x.detail_key || '') === id
    );
    if(!e) return;
    // Category accent: scope --tab-accent to the sheet from the ITEM's tab
    // (not the page's active tab) so the modal matches the item's category.
    const dtSheet = document.getElementById('detailSheet');
    if (dtSheet) dtSheet.setAttribute('data-active-tab', e.tab || '');
    const liked = state.likes.has(id);
    const isLove = e.tab === 'love';

    // Phase 184 D-18: "da" prefix gated on typed per_person field (legacy
    // e.priceFrom boolean read deleted; priceFor() reads e.price_cents directly).
    const dtPrefix = e.per_person ? 'da ' : '';
    $('#detailPrice').textContent = `${dtPrefix}${priceFor(e)}€`;
    $('#detailPriceUnit').textContent = unitFor(e);
    $('#detailBook').onclick = () => {
      closeSheet('detailSheet');
      setTimeout(() => openBooking(id), 280);
    };

    // Same conditional pattern as card render — show rating/reviews/loc only
    // when the product carries them. Stagione 0: no real reviews → meta line
    // collapses to the product's duration/format meta instead.
    const dtHasRating = typeof e.rating === 'number' && e.rating > 0;
    const dtStars = dtHasRating ? e.rating.toFixed(2) : '';
    const dtReviewsLine = (dtHasRating && e.reviews)
      ? `<b>${dtStars}</b> · ${e.reviews} recensioni${e.loc ? ' · ' + e.loc : ''}`
      : (e.meta || '');

    // Sync the (static, sticky) heart-button state with the current product.
    $('#detailHeart').classList.toggle('is-liked', liked);

    $('#detailBody').innerHTML = `
      <div class="dt-hero" style="background-image:url('${e.imgs ? e.imgs[0] : e.img}')">
        ${e.video ? `<video class="dt-hero-video" src="${e.video}" muted loop playsinline preload="metadata" autoplay></video>` : ''}
      </div>
      <div class="dt-body">
        <h1>${sanitizeTitle(e.title)}</h1>
        <p class="dt-meta">
          ${dtHasRating ? `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="vertical-align:-2px"><path d="M12 2l2.9 6.9L22 10l-5.5 4.8L18.2 22 12 18.2 5.8 22l1.7-7.2L2 10l7.1-1.1z"/></svg>` : ''}
          ${dtReviewsLine}
        </p>
        ${e.lead ? `<p class="lead">${e.lead}</p>` : ''}

        <div class="dt-tags">
          ${(e.tags || []).map(t => `<span class="dt-tag">${t}</span>`).join('')}
        </div>

        ${(Array.isArray(e.includes) && e.includes.length) ? `
        <div class="dt-includes">
          <h4>Cosa è incluso</h4>
          <ul>
            ${e.includes.map(i => `<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg><span>${i}</span></li>`).join('')}
          </ul>
        </div>
        ` : ''}

        ${e.duration ? `
        <div class="dt-includes">
          <h4>Durata</h4>
          <p style="margin:0;font-size:14px">${e.duration}</p>
        </div>
        ` : ''}

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

  // ============ EXTRAS RENDERER ============
  // Inline SVG glyphs per addonType — small, neutral line icons that work on the
  // tinted backgrounds set in CSS via data-type. Keep these path-only so CSS
  // `currentColor` can tone them per category.
  var EXT_GLYPH = {
    digital: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-2h6l2 2h3v11H4z"/><circle cx="12" cy="13.5" r="3.5"/></svg>',
    accessori: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6l8-3z"/></svg>',
    servizi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2l2.5 6.6L21 9.4l-5 4.5L17.5 21 12 17.5 6.5 21l1.5-7.1-5-4.5 6.5-.8z"/></svg>',
    catering: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3v8a2 2 0 002 2v8M6 3v6m0-6h2v6M18 3c-1.7 1-3 3.3-3 6 0 1.7 1 3 3 3v9"/></svg>',
  };

  function renderExtras(exp) {
    var pane = document.querySelector('section[data-bk-pane="2"]');
    var container = document.querySelector('.bk-extras');
    if (!container) return;

    var linked = (exp && exp.linked_products) || [];

    // Empty linked_products -> hide the entire extras pane (per CONTEXT D-D-02).
    if (!linked.length) {
      if (pane) pane.hidden = true;
      container.innerHTML = '';
      return;
    }
    if (pane) pane.hidden = false;

    // Enrich linked entries with full child metadata from the inline products
    // catalogue. linked_products only carries (id, child_product_id, name,
    // price_cents) — the lead, badge, and addonType live in the child's
    // metadata, available via the global __GESTISCILO_PRODUCTS__ payload.
    var byId = {};
    var inlineProducts = window.__GESTISCILO_PRODUCTS__ || [];
    for (var i = 0; i < inlineProducts.length; i++) {
      byId[String(inlineProducts[i].id)] = inlineProducts[i];
    }

    container.innerHTML = '';

    linked.forEach(function (link) {
      var child = byId[String(link.child_product_id)] || {};
      var meta = child.metadata || {};
      var addonType = (meta.addonType || 'servizi').toLowerCase();
      var overrideCents = link.price_override_cents;
      var basePriceCents = typeof overrideCents === 'number' ? overrideCents : (link.price_cents || 0);
      var price = basePriceCents / 100;
      var priceLabel = (price > 0) ? ('+' + price + '€') : 'su richiesta';
      var titleHtml = sanitizeTitle(meta.title || link.name || '');
      var lead = meta.lead || '';
      var badge = meta.badge || '';

      var label = document.createElement('label');
      label.className = 'bk-extra';
      label.dataset.type = addonType;
      // Typed columns (migration 139) for the notice-gate mirror + qty stepper.
      label.dataset.noticeHours = String(Number(child.min_notice_hours) || 0);

      var input = document.createElement('input');
      input.type = 'checkbox';
      input.dataset.extra = String(link.id);
      input.dataset.price = String(price);

      var row = document.createElement('span');
      row.className = 'ext-row';

      var ico = document.createElement('span');
      ico.className = 'ext-ico';
      ico.innerHTML = EXT_GLYPH[addonType] || EXT_GLYPH.servizi;

      var metaEl = document.createElement('span');
      metaEl.className = 'ext-meta';

      var titleRow = document.createElement('span');
      titleRow.className = 'ext-title';
      var nameEl = document.createElement('b');
      nameEl.innerHTML = titleHtml;
      titleRow.appendChild(nameEl);
      if (badge) {
        var badgeEl = document.createElement('span');
        badgeEl.className = 'ext-badge';
        badgeEl.textContent = badge;
        titleRow.appendChild(badgeEl);
      }
      metaEl.appendChild(titleRow);

      if (lead) {
        var leadEl = document.createElement('small');
        leadEl.textContent = lead;
        metaEl.appendChild(leadEl);
      }

      var priceEl = document.createElement('span');
      priceEl.className = 'ext-price';
      priceEl.textContent = priceLabel;
      if (price === 0) priceEl.classList.add('is-onrequest');

      var check = document.createElement('span');
      check.className = 'ext-check';
      check.setAttribute('aria-hidden', 'true');
      check.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

      row.appendChild(ico);
      row.appendChild(metaEl);
      row.appendChild(priceEl);
      row.appendChild(check);
      label.appendChild(input);
      label.appendChild(row);
      container.appendChild(label);

      // Phase 184 (D-22, Pitfall 4): populate module-scope extrasLookup so
      // buildBookingPayload + updateBookingTotal can resolve link.id -> child_slug at
      // submit/quote time. state.booking.extras Set carries link.id strings (set on
      // input.dataset.extra above); the backend expects child_slug. Backend Plan 01
      // emits link.child_slug verbatim on ProductResource.linked_products[N].
      extrasLookup[String(link.id)] = {
        child_slug: link.child_slug,
        name: (link.name || child.name || ''),
      };

      // Pitfall 1: wire change listener per-instance because boot-time wiring is deleted.
      input.addEventListener('change', function () {
        if (input.checked) state.booking.extras.add(input.dataset.extra);
        else state.booking.extras.delete(input.dataset.extra);
        updateBookingTotal();
      });

      // Per-unit quantity stepper (metadata.qtyMax > 1 — e.g. Telo Mare, 1-2).
      // Shown only while the extra is checked; server is authoritative on the
      // ceiling (public_booking validates quantity <= qtyMax). Buttons
      // stopPropagation so a click doesn't toggle the wrapping <label> checkbox.
      var qtyMax = Number(child.max_quantity) || 1;
      if (qtyMax > 1) {
        var qtyWrap = document.createElement('div');
        qtyWrap.className = 'bk-extra-qty';
        qtyWrap.hidden = true;
        qtyWrap.style.cssText = 'display:flex;align-items:center;gap:10px;margin:-2px 0 8px;padding-left:46px';
        var qtyLabel = document.createElement('small');
        qtyLabel.textContent = 'Quantità';
        qtyLabel.style.color = 'var(--ink-3)';
        var minus = document.createElement('button');
        var num = document.createElement('b');
        var plus = document.createElement('button');
        num.textContent = '1';
        num.style.cssText = 'min-width:18px;text-align:center';
        minus.type = 'button'; minus.textContent = '−'; minus.setAttribute('aria-label', 'Meno');
        plus.type = 'button'; plus.textContent = '+'; plus.setAttribute('aria-label', 'Più');
        [minus, plus].forEach(function (b) {
          b.className = 'bk-qty-btn';
          b.style.cssText = 'width:28px;height:28px;border-radius:8px;border:1px solid var(--line,#d9dde1);background:#fff;font-size:16px;line-height:1;cursor:pointer';
        });
        function setExtraQty(n) {
          n = Math.max(1, Math.min(qtyMax, n));
          num.textContent = String(n);
          state.booking.extraQty[String(link.id)] = n;
          updateBookingTotal();
        }
        minus.addEventListener('click', function (ev) {
          ev.preventDefault(); ev.stopPropagation();
          setExtraQty((state.booking.extraQty[String(link.id)] || 1) - 1);
        });
        plus.addEventListener('click', function (ev) {
          ev.preventDefault(); ev.stopPropagation();
          setExtraQty((state.booking.extraQty[String(link.id)] || 1) + 1);
        });
        qtyWrap.appendChild(qtyLabel);
        qtyWrap.appendChild(minus);
        qtyWrap.appendChild(num);
        qtyWrap.appendChild(plus);
        container.appendChild(qtyWrap);

        input.addEventListener('change', function () {
          qtyWrap.hidden = !input.checked;
          if (input.checked) {
            if (!state.booking.extraQty[String(link.id)]) state.booking.extraQty[String(link.id)] = 1;
          } else {
            delete state.booking.extraQty[String(link.id)];
            num.textContent = '1';
          }
        });
      }
    });
  }

  // Notice-gate UX mirror. The server (public_booking) is authoritative; this
  // only greys out extras whose required advance notice (data-notice-hours,
  // from products.min_notice_hours) the chosen slot can't satisfy, so the
  // customer doesn't pick something that would 422 at submit. Runs on entry to
  // the extras pane and whenever the slot changes. Idempotent.
  function gateExtras() {
    var labels = document.querySelectorAll('.bk-extra');
    if (!labels.length) return;
    // Need a concrete slot to gate against; with no time chosen yet, leave open.
    var slot = null;
    if (state.booking.date && state.booking.time) {
      var d = state.booking.date.split('-');
      var t = state.booking.time.split(':');
      if (d.length === 3 && t.length >= 2) {
        slot = new Date(+d[0], +d[1] - 1, +d[2], +t[0], +t[1], 0, 0);
      }
    }
    var now = new Date();
    labels.forEach(function (label) {
      var hours = Number(label.dataset.noticeHours) || 0;
      var input = label.querySelector('input[type="checkbox"]');
      if (!input) return;
      var prev = label.querySelector('.bk-extra-lock');
      if (prev) prev.remove();
      var locked = false;
      if (hours > 0 && slot) {
        locked = (slot.getTime() - now.getTime()) / 3600000 < hours;
      }
      if (locked) {
        input.disabled = true;
        label.style.opacity = '.55';
        // Uncheck + drop from cart if it was selected. dispatch('change') runs
        // the existing listeners (remove from cart, hide qty stepper, re-quote).
        if (input.checked) {
          input.checked = false;
          input.dispatchEvent(new Event('change'));
        }
        var note = document.createElement('small');
        note.className = 'bk-hint bk-extra-lock';
        note.style.color = 'var(--ink-3)';
        note.textContent = 'Richiede preavviso di ' + hours + 'h — scegli uno slot più avanti.';
        label.appendChild(note);
      } else {
        input.disabled = false;
        label.style.opacity = '';
      }
    });
  }

  // ============ AVAILABILITY (day strip + time slots) ============
  // Italian short labels for day chips. Date.getDay() → 0=Sun, 6=Sat.
  var WEEKDAY_SHORT = ['DOM','LUN','MAR','MER','GIO','VEN','SAB'];
  var MONTH_SHORT   = ['GEN','FEB','MAR','APR','MAG','GIU','LUG','AGO','SET','OTT','NOV','DIC'];

  function renderDayStripPlaceholder(message) {
    var daysEl = document.getElementById('bkDays');
    var timesEl = document.getElementById('bkTimes');
    if (daysEl)  daysEl.innerHTML  = '<small class="bk-hint">' + message + '</small>';
    if (timesEl) timesEl.innerHTML = '';
  }

  function renderTimeSlots(slots, preferredTime) {
    var timesEl = document.getElementById('bkTimes');
    if (!timesEl) return;
    if (!Array.isArray(slots) || slots.length === 0) {
      timesEl.innerHTML = '<small class="bk-hint">Nessun orario disponibile in questo giorno.</small>';
      state.booking.time = '';
      return;
    }
    timesEl.innerHTML = slots.map(function (t) {
      return '<label><input type="radio" name="bkTime" value="' + t + '" /><span>' + t + '</span></label>';
    }).join('');
    // Restore preferred time if still offered, otherwise pick the first slot.
    var pick = (preferredTime && slots.indexOf(preferredTime) !== -1) ? preferredTime : slots[0];
    var input = timesEl.querySelector('input[name="bkTime"][value="' + pick + '"]');
    if (input) {
      input.checked = true;
      state.booking.time = pick;
    }
    updateBookingTotal();
  }

  function selectDay(date) {
    var daysEl = document.getElementById('bkDays');
    if (!daysEl) return;
    state.booking.date = date;
    var hidden = document.getElementById('bkDate');
    if (hidden) hidden.value = date;
    daysEl.querySelectorAll('.bk-day').forEach(function (b) {
      var active = b.dataset.date === date;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    var day = (state.booking.availability || []).find(function (d) { return d.date === date; });
    var slots = (day && Array.isArray(day.times)) ? day.times : [];
    renderTimeSlots(slots, state.booking.time);
  }

  function renderAvailability(productId, people) {
    var daysEl = document.getElementById('bkDays');
    if (!daysEl) return;
    renderDayStripPlaceholder('Carico disponibilità…');
    if (!window.Gestiscilo || typeof Gestiscilo.availability !== 'function') {
      renderDayStripPlaceholder('Disponibilità non disponibile in questo momento.');
      return;
    }
    // SDK `quantity` = vessels needed, NOT riders. Each booking reserves ONE
    // vessel regardless of people on board (Sportender JST-30 seats 2). The
    // `people` count is captured in the booking payload, not the availability
    // query, otherwise quantity>=2 returns zero slots.
    void people;
    Gestiscilo.availability(productId, {})
      .then(function (data) {
        var dates = (data && Array.isArray(data.dates)) ? data.dates : [];
        state.booking.availability = dates;
        var anyOpen = dates.some(function (d) { return Array.isArray(d.times) && d.times.length > 0; });
        if (!anyOpen) {
          renderDayStripPlaceholder('Nessun giorno disponibile nei prossimi 14 giorni. Scrivici su WhatsApp per altre date.');
          return;
        }
        daysEl.innerHTML = dates.map(function (d) {
          var dt = new Date(d.date + 'T00:00:00');
          var wd = WEEKDAY_SHORT[dt.getDay()];
          var dayNum = dt.getDate();
          var mo = MONTH_SHORT[dt.getMonth()];
          var open = Array.isArray(d.times) && d.times.length > 0;
          return '<button type="button" class="bk-day' + (open ? '' : ' is-disabled') + '"'
            + ' data-date="' + d.date + '"'
            + ' aria-pressed="false"'
            + (open ? '' : ' disabled')
            + '>'
            + '<span class="bk-day-wd">' + wd + '</span>'
            + '<span class="bk-day-num">' + dayNum + '</span>'
            + '<span class="bk-day-mo">' + mo + '</span>'
            + '</button>';
        }).join('');
        // Auto-pick the previously-selected date if still open, else the first open day.
        var keep = state.booking.date && dates.find(function (d) {
          return d.date === state.booking.date && Array.isArray(d.times) && d.times.length > 0;
        });
        var firstOpen = dates.find(function (d) { return Array.isArray(d.times) && d.times.length > 0; });
        selectDay((keep || firstOpen).date);
      })
      .catch(function () {
        renderDayStripPlaceholder('Non riusciamo a caricare la disponibilità. Riprova fra un momento.');
      });
  }

  // Per-vessel capacity. Pulls explicit metadata.capacity_max / capacity_min /
  // capacity_default / capacity_hint when set; otherwise falls back to a
  // tier-driven default so yacht/escursione/love bookings don't display the
  // jet-ski hint copy. Operators can override per-product via product metadata.
  function capacityFor(exp) {
    var tier = (exp && typeof exp.tier === 'string') ? exp.tier : 'jet-ski';
    var defaults = {
      'jet-ski':   { min: 1, max: 2,  pick: 1, hint: 'Prezzo totale per moto · valido fino a 2 persone (pilota + 1), nessun costo aggiuntivo per il passeggero' },
      'yacht':     { min: 1, max: 12, pick: 4, hint: 'Capienza fino a 12 ospiti — confermiamo il numero esatto al check-in.' },
      'love':      { min: 2, max: 2,  pick: 2, hint: 'Esperienza per coppia (2 persone).' },
      'escursione':{ min: 1, max: 8,  pick: 2, hint: 'Capienza fino a 8 persone.' },
    };
    var base = defaults[tier] || defaults['jet-ski'];
    var max  = Number(exp && exp.capacity_max) > 0 ? Number(exp.capacity_max) : base.max;
    var min  = Number(exp && exp.capacity_min) > 0 ? Number(exp.capacity_min) : base.min;
    var pick = Number(exp && exp.capacity_default) > 0 ? Number(exp.capacity_default) : base.pick;
    var hint = (exp && typeof exp.capacity_hint === 'string' && exp.capacity_hint.trim())
      ? exp.capacity_hint.trim()
      : base.hint;
    if (max < min) max = min;
    if (pick < min) pick = min;
    if (pick > max) pick = max;
    return { min: min, max: max, pick: pick, hint: hint };
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
    // Category accent on the booking sheet too (matches the detail modal).
    const bkSheet = document.getElementById('bookingSheet');
    if (bkSheet) bkSheet.setAttribute('data-active-tab', e.tab || '');
    $('#bkExpName').textContent = e.title.replace(/<[^>]+>/g, '');
    $('#bkThumb').style.backgroundImage = `url('${e.img}')`;

    // reset date, time, extras, people
    state.booking.date = '';
    state.booking.time = '';
    state.booking.availability = [];

    // reset extras and re-render from SDK linked_products
    state.booking.extras = new Set();
    state.booking.extraQty = {};
    renderExtras(e);

    // people — capacity driven by product tier with per-product overrides.
    var cap = capacityFor(e);
    state.booking.capacityMin = cap.min;
    state.booking.capacityMax = cap.max;
    state.booking.people = cap.pick;
    $('#bkPeople').textContent = String(cap.pick);
    var capHint = document.getElementById('bkCapacityHint');
    if (capHint) capHint.textContent = cap.hint;

    updateBookingStep();
    updateBookingTotal();
    openSheet('bookingSheet');

    // Fire availability fetch after the sheet is open (non-blocking).
    var productId = Number(e.id);
    if (isFinite(productId)) renderAvailability(productId, state.booking.people);
    else renderDayStripPlaceholder('Esperienza non disponibile.');
  }

  function updateBookingStep(){
    const step = state.bkStep;
    $$('.bk-pane').forEach(p => p.classList.toggle('is-active', Number(p.dataset.bkPane) === step));
    $('#bkBack').hidden = step === 1;
    // Single primary button — relabels on the final step
    $('#bkNext').textContent = step === 3 ? 'Conferma prenotazione' : 'Avanti';
    // Extras pane (step 2): the slot is already chosen in step 1, so re-run the
    // notice-gate mirror against the final slot. Re-fires if the user goes back,
    // changes the slot, and returns.
    if (step === 2) gateExtras();
  }

  function getCurrentExp(){
    return EXPERIENCES.find(x => x.id === state.booking.expId) || EXPERIENCES[0];
  }
  // Phase 184 (D-20, D-23, D-24, D-25, D-32, Pitfalls 3 + 5):
  // updateBookingTotal is now a debounced consumer of Gestiscilo.quote(). The server
  // is the single source of truth for pricing; the client only renders the envelope.
  //
  // Cart shape per D-04 / D-20:
  //   [{slug: primary, people: state.booking.people, quantity: 1},
  //    ...{slug: extra_child_slug, people: 1, quantity: 1}]
  //
  // SDK readiness (Pitfall 3): embed/v1.js loads AFTER app.js; the early-return guard
  // at function entry mirrors the applyTenantInfo defer pattern at lines 695-697.
  //
  // Race protection (Pitfall 5): every entry bumps quoteCartGeneration and captures
  // the bumped value; stale fetch responses whose captured gen no longer matches the
  // module-scope counter are dropped on the floor.
  //
  // D-21: hardcoded perPersonSlugs / perCoupleSlugs arrays DELETED. Phase 175 seeder
  // stripped the matching metadata; per-person semantics ride on e.per_person now.
  function updateBookingTotal(){
    if (!window.Gestiscilo || typeof Gestiscilo.quote !== 'function') return;
    clearTimeout(quoteDebounceTimer);
    quoteDebounceTimer = setTimeout(function () {
      var gen = ++quoteCartGeneration;
      var e = getCurrentExp();
      if (!e || !e.slug) return;

      var items = [{ slug: e.slug, people: state.booking.people, quantity: 1 }];
      // extrasLookup is hoisted by Plan 05 — guard with typeof so Plan 04 ships
      // primary-only flows correctly until Plan 05 lands the lookup map population.
      state.booking.extras.forEach(function (linkId) {
        var entry = (typeof extrasLookup !== 'undefined') ? extrasLookup[String(linkId)] : null;
        if (entry && entry.child_slug) {
          var q = (state.booking.extraQty && state.booking.extraQty[String(linkId)]) || 1;
          items.push({ slug: entry.child_slug, people: 1, quantity: q });
        }
      });

      Gestiscilo.quote(items).then(function (env) {
        if (gen !== quoteCartGeneration) return;  // Pitfall 5: drop stale
        renderQuoteEnvelope(env);
      }).catch(function () {
        // D-32: silent single retry after 500ms; on second fail, fallback copy
        // and leave CTA enabled — booking POST is authoritative and recomputes server-side.
        setTimeout(function () {
          if (gen !== quoteCartGeneration) return;
          if (!window.Gestiscilo || typeof Gestiscilo.quote !== 'function') return;
          Gestiscilo.quote(items).then(function (env) {
            if (gen !== quoteCartGeneration) return;
            renderQuoteEnvelope(env);
          }).catch(function () {
            if (gen !== quoteCartGeneration) return;
            var totalEl = $('#bkTotal');
            var unitEl = $('#bkTotalUnit');
            if (totalEl) totalEl.textContent = 'Calcolo prezzo non disponibile';
            if (unitEl) unitEl.textContent = 'al check-in';
            clearInlineErrors();
            restoreCtaFromOperatorQuote();
            setCtaEnabled(true);  // D-32: CTA stays enabled on network fallback
          });
        }, 500);
      });
    }, 200);  // D-20 debounce window
  }

  // Phase 184 (D-20, D-23, D-24, D-25): state-machine renderer over the /quote envelope.
  // Six render states, each idempotent — every call fully replaces the previous render
  // (no partial cleanup needed between transitions). See UI-SPEC §Interaction State Matrix.
  function renderQuoteEnvelope(env) {
    var totalEl = $('#bkTotal');
    var unitEl = $('#bkTotalUnit');
    if (!totalEl || !unitEl) return;

    var lines = (env && env.lines) || [];
    var unavailable = false;
    var operatorQuote = false;
    var primaryError = null;
    var extraErrors = [];

    lines.forEach(function (line, idx) {
      if (!line || !line.error_kind) return;
      if (line.error_kind === 'unknown_product' || line.error_kind === 'product_unavailable') {
        unavailable = true;
      } else if (line.error_kind === 'operator_quote_required') {
        operatorQuote = true;
      } else if (idx === 0) {
        primaryError = line.message || 'Errore';
      } else {
        extraErrors.push({ index: idx - 1, message: line.message || 'Errore' });
      }
    });

    // D-24: product unavailable wins over all other states.
    if (unavailable) {
      totalEl.textContent = 'Esperienza non disponibile';
      unitEl.textContent = '';
      clearInlineErrors();
      restoreCtaFromOperatorQuote();
      setCtaEnabled(false);
      return;
    }

    // D-25: operator quote required — swap CTA, render best-effort total caption.
    if (operatorQuote) {
      if (typeof env.grand_total_cents === 'number' && env.grand_total_cents > 0) {
        totalEl.textContent = fmt(env.grand_total_cents / 100) + ' €';
      } else {
        totalEl.textContent = '—';
      }
      unitEl.textContent = '';
      clearInlineErrors();
      swapCtaToOperatorQuote();
      return;
    }

    // D-20: success or per-line capacity errors. Total renders unconditionally;
    // errors gate the CTA. Server has already computed grand_total_cents excluding
    // any error lines (per /quote contract).
    totalEl.textContent = fmt((env.grand_total_cents || 0) / 100) + ' €';
    unitEl.textContent = 'al check-in';
    restoreCtaFromOperatorQuote();
    applyPrimaryErrorHint(primaryError);
    applyExtraErrorHints(extraErrors);
    var hasErrors = !!primaryError || extraErrors.length > 0;
    setCtaEnabled(!hasErrors);
  }

  // Phase 184 (D-23): inline error hint under the #bkPeople stepper. Reuses the
  // existing #bkCapacityHint slot — color toggles to --rose on error, clears on success.
  function applyPrimaryErrorHint(message) {
    var hintEl = $('#bkCapacityHint');
    if (!hintEl) return;
    if (message) {
      hintEl.textContent = message;
      hintEl.style.color = 'var(--rose)';
    } else {
      // Restore the static capacity hint set on openBooking (cap.hint). When no
      // primary error is active, the slot reverts to its capacity caption.
      var e = getCurrentExp();
      var cap = (e && typeof capacityFor === 'function') ? capacityFor(e) : null;
      hintEl.textContent = (cap && cap.hint) ? cap.hint : '';
      hintEl.style.color = '';
    }
  }

  // Phase 184 (D-23): per-extra inline error hints. New DOM is injected under each
  // offending .bk-extra label and removed/rebuilt on every render (idempotent).
  // Inherits .bk-hint styling — only the color is overridden to --rose.
  function applyExtraErrorHints(extraErrors) {
    document.querySelectorAll('.bk-extra-hint').forEach(function (n) { n.remove(); });
    if (!extraErrors || !extraErrors.length) return;
    var labels = document.querySelectorAll('.bk-extra');
    extraErrors.forEach(function (err) {
      var label = labels[err.index];
      if (!label) return;
      var hint = document.createElement('small');
      hint.className = 'bk-hint bk-extra-hint';
      hint.style.color = 'var(--rose)';
      hint.textContent = err.message;
      label.parentNode.insertBefore(hint, label.nextSibling);
    });
  }

  function clearInlineErrors() {
    applyPrimaryErrorHint(null);
    document.querySelectorAll('.bk-extra-hint').forEach(function (n) { n.remove(); });
  }

  function setCtaEnabled(enabled) {
    var cta = $('#bkNext');
    if (!cta) return;
    cta.disabled = !enabled;
  }

  // Phase 184 (D-25): operator-quote CTA swap. Dormant in JSA today (zero from_price
  // SKUs) but wired-for-future so a future yacht-quote SKU surfaces as a graceful
  // WhatsApp handoff instead of a 500. Original label preserved on the dataset for
  // restoration when the cart returns to a priced state.
  function swapCtaToOperatorQuote() {
    var cta = $('#bkNext');
    if (!cta) return;
    if (cta.dataset.operatorQuote === '1') return;  // already swapped
    cta.dataset.originalLabel = cta.textContent;
    cta.textContent = 'Richiedi preventivo';
    cta.disabled = false;
    cta.dataset.operatorQuote = '1';
  }

  function restoreCtaFromOperatorQuote() {
    var cta = $('#bkNext');
    if (!cta) return;
    if (cta.dataset.operatorQuote !== '1') return;
    if (typeof cta.dataset.originalLabel === 'string') {
      cta.textContent = cta.dataset.originalLabel;
      delete cta.dataset.originalLabel;
    }
    delete cta.dataset.operatorQuote;
  }

  // Phase 184 (D-25): WhatsApp message body for the operator-quote handoff.
  // Names the product so the operator knows which SKU the customer wants priced.
  function buildOperatorQuoteMsg() {
    var e = getCurrentExp();
    var name = (e && (e.name || e.title)) || 'esperienza';
    return 'Ciao, vorrei un preventivo per: ' + name + '.';
  }

  // step interactions — delegated so dynamically-rendered chips bind without
  // re-wiring per render. Day strip is button-based (selectDay handles state),
  // time slots are radios (change event after render).
  var bkDaysEl = document.getElementById('bkDays');
  if (bkDaysEl) {
    bkDaysEl.addEventListener('click', function (ev) {
      var btn = ev.target.closest('.bk-day');
      if (!btn || btn.disabled) return;
      selectDay(btn.dataset.date);
    });
  }
  var bkTimesEl = document.getElementById('bkTimes');
  if (bkTimesEl) {
    bkTimesEl.addEventListener('change', function (ev) {
      var r = ev.target;
      if (r && r.name === 'bkTime' && r.checked) {
        state.booking.time = r.value;
      }
    });
  }

  $$('.bk-stepper button').forEach(b => {
    b.addEventListener('click', () => {
      const dir = b.dataset.step === '+' ? 1 : -1;
      const min = Number(state.booking.capacityMin) > 0 ? Number(state.booking.capacityMin) : 1;
      const max = Number(state.booking.capacityMax) > 0 ? Number(state.booking.capacityMax) : 3;
      let next = state.booking.people + dir;
      next = Math.max(min, Math.min(max, next));
      state.booking.people = next;
      $('#bkPeople').textContent = String(next);
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

  function isPaneHidden(n) {
    var p = document.querySelector('[data-bk-pane="' + n + '"]');
    return p ? p.hidden : false;
  }
  $('#bkBack').addEventListener('click', () => {
    if(state.bkStep > 1){
      var prev = state.bkStep - 1;
      while(prev > 1 && isPaneHidden(prev)) prev--;
      state.bkStep = prev;
      updateBookingStep();
    }
  });
  $('#bkNext').addEventListener('click', function () {
    // Phase 184 (D-25): operator-quote handoff. When /quote returned
    // operator_quote_required, the CTA was swapped via swapCtaToOperatorQuote()
    // and the dataset flag was set. Bypass the regular submit flow and open a
    // prefilled WhatsApp deep link instead. Dormant in JSA today (zero from_price
    // SKUs) but wired-for-future so this path is exercised the day operator
    // publishes a yacht-quote product.
    var ctaEl = this;
    if (ctaEl && ctaEl.dataset && ctaEl.dataset.operatorQuote === '1') {
      if (!window.Gestiscilo || !Gestiscilo.contact || typeof Gestiscilo.contact.waLink !== 'function') return;
      window.open(Gestiscilo.contact.waLink(buildOperatorQuoteMsg()), '_blank', 'noopener');
      return;
    }
    if(state.bkStep < 3){
      var next = state.bkStep + 1;
      while(next < 3 && isPaneHidden(next)) next++;
      state.bkStep = next;
      updateBookingStep();
      return;
    }
    // 148-MIG-04: final step → submit through SDK.
    // Source: 148-CONTEXT.md D-E-01..04; Phase 146 D-B-02 (booking validator).
    state.booking.name  = $('#bkName').value.trim();
    state.booking.phone = $('#bkPhone').value.trim();
    state.booking.notes = $('#bkNotes').value.trim();

    // Required: name + phone + email (email is server-required per Phase 146 D-B-02).
    if(!state.booking.name){ $('#bkName').focus(); return; }
    if(!state.booking.phone){ $('#bkPhone').focus(); return; }
    var emailInput = $('#bkEmail');
    if(!emailInput.validity.valid){ emailInput.focus(); return; }
    state.booking.email = emailInput.value.trim();

    var exp = getCurrentExp();
    if(!exp){ showBookingGenericError('Esperienza non disponibile.'); return; }
    var productId = Number(exp.id);
    if(!isFinite(productId)){ showBookingGenericError('Identificativo prodotto non valido.'); return; }

    var payload = buildBookingPayload(state.booking, exp);
    payload.idempotency_key = buildIdempotencyKey(
      productId, payload.booking_date, payload.booking_time, payload.guest_email
    );
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
          bkNextBtn.disabled = false;
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
  // tickStatus moved to assets/js/tenant-info.js (SDK-hours-driven 3-state pill).

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
    onScroll();
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

  // 7-day inline forecast moved to assets/js/fcast.js (shared with sub-pages
  // that include _partials/meteo.html).

})();
