// Tenant-info hydration — shared across ALL pages (loaded by _layout.html).
//
// Hydrates from the Gestiscilo SDK:
//   [data-gs="address-line"]  street + postal + city
//   [data-gs="maps-cta"]      Google Maps directions href
//   [data-gs="hours-today"]   "dalle 9:00–20:00" (hidden with its sep when closed)
//   [data-gs="hours-week"]    "9:00–20:00 · 7/7"
//   #statusPill               3-state: open / whatsapp / closed (SDK-hours-driven)
//   [data-gs="osm-frame"]     OSM iframe via Nominatim geocoding
//
// Formerly index-only inside app.js (Phase 154 MIG-08/09/10); extracted so the
// info-strip, contact card and map hydrate on every sub-page too. The status
// pill merges the old binary SDK writer with the richer hardcoded 3-state
// ticker: the "Solo WhatsApp" band is now derived from the SDK hours (2h
// before opening, 2h after closing) instead of literal 7-9/20-22.
//
// Invariants preserved from the original:
//   - Idempotent: querySelectorAll-driven; safe to call more than once.
//   - Defensive: missing fields produce empty strings, never throws.
//   - XSS-safe (T-154-04): textContent + encodeURIComponent, never innerHTML.
//   - Nominatim: 1 req per page-session per address via sessionStorage cache.
(function () {
  var WHATSAPP_BAND_MINUTES = 120;

  async function applyTenantInfo() {
    if (!window.Gestiscilo || !Gestiscilo.ready) return;
    try { await Gestiscilo.ready; } catch (_) { return; }
    var b = Gestiscilo.business;
    if (!b) return;

    // Address line — "${streetAddress} · ${postalCode} ${city}"
    var addrParts = [
      b.streetAddress,
      [b.postalCode, b.city].filter(Boolean).join(' ')
    ].filter(function (s) { return s && String(s).trim() !== ''; });
    var addr = addrParts.join(' · ');
    document.querySelectorAll('[data-gs="address-line"]').forEach(function (el) {
      el.textContent = addr;
    });

    // Google Maps deep link — encoded address text (not coordinates).
    var dest = encodeURIComponent(
      [b.streetAddress, b.postalCode, b.city].filter(Boolean).join(', ')
    );
    document.querySelectorAll('[data-gs="maps-cta"]').forEach(function (a) {
      a.href = 'https://www.google.com/maps/dir/?api=1&destination=' + dest;
    });

    // Hours placeholders.
    if (Gestiscilo.hours && typeof Gestiscilo.hours.todayLabel === 'function') {
      var lbl = Gestiscilo.hours.todayLabel();
      var closedDay = !lbl || /^\s*chiuso\s*$/i.test(lbl);
      document.querySelectorAll('[data-gs="hours-today"]').forEach(function (el) {
        var prevSep = el.previousElementSibling;
        if (closedDay) {
          el.textContent = '';
          el.style.display = 'none';
          if (prevSep && prevSep.classList.contains('sep')) prevSep.style.display = 'none';
        } else {
          el.textContent = 'dalle ' + lbl;
          el.style.display = '';
          if (prevSep && prevSep.classList.contains('sep')) prevSep.style.display = '';
        }
      });
      document.querySelectorAll('[data-gs="hours-week"]').forEach(function (el) {
        el.textContent = closedDay ? 'orari su richiesta' : (lbl + ' · 7/7');
      });
    }

    tickStatus();

    // OSM iframe (async, non-blocking). Failure hides the iframe; the Google
    // Maps CTA above still works because it uses address text.
    applyMap(addr).catch(function () { /* iframe stays hidden */ });
  }

  // ── Status pill — 3-state, SDK-hours-driven ────────────────────────────
  // open: inside today's opening window; whatsapp: within 2h before opening
  // or 2h after closing; closed: otherwise (or no hours data).
  function todayWindow() {
    var b = window.Gestiscilo && Gestiscilo.business;
    var rows = b && Array.isArray(b.hours) ? b.hours : null;
    if (!rows) return null;
    // SDK weekday: 1=Mon..7=Sun; JS getDay(): 0=Sun..6=Sat.
    var jsDay = new Date().getDay();
    var weekday = jsDay === 0 ? 7 : jsDay;
    var row = rows.find(function (r) { return Number(r.weekday) === weekday; });
    if (!row || row.closed || !row.opensAt || !row.closesAt) return null;
    var p = function (hm) {
      var m = String(hm).match(/^(\d{1,2}):(\d{2})/);
      return m ? (Number(m[1]) * 60 + Number(m[2])) : null;
    };
    var open = p(row.opensAt), close = p(row.closesAt);
    if (open === null || close === null) return null;
    return { open: open, close: close };
  }

  function tickStatus() {
    var pill = document.getElementById('statusPill');
    if (!pill) return;
    var w = todayWindow();
    var status = 'closed';
    if (w) {
      var now = new Date();
      var mins = now.getHours() * 60 + now.getMinutes();
      if (mins >= w.open && mins < w.close) status = 'open';
      else if ((mins >= w.open - WHATSAPP_BAND_MINUTES && mins < w.open) ||
               (mins >= w.close && mins < w.close + WHATSAPP_BAND_MINUTES)) status = 'whatsapp';
    }
    pill.setAttribute('data-status', status);
    var t = pill.querySelector('.status-label');
    if (t) {
      t.textContent = status === 'open' ? 'Aperto'
        : (status === 'whatsapp' ? 'Solo WhatsApp' : 'Chiuso');
    }
  }

  // ── Nominatim geocoding + OSM iframe ───────────────────────────────────
  async function geocodeAddress(text) {
    var key = 'gs:nominatim:' + text;
    try {
      var cached = sessionStorage.getItem(key);
      if (cached) {
        var c = JSON.parse(cached);
        if (c && c.lat && c.lon) return c;
      }
    } catch (_) { /* sessionStorage disabled — proceed to fetch */ }

    var url = 'https://nominatim.openstreetmap.org/search?q=' +
      encodeURIComponent(text) + '&format=json&limit=1';
    var res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error('nominatim http ' + res.status);
    var arr = await res.json();
    if (!Array.isArray(arr) || arr.length === 0) throw new Error('nominatim empty');

    var hit = { lat: arr[0].lat, lon: arr[0].lon, ts: Date.now() };
    try { sessionStorage.setItem(key, JSON.stringify(hit)); } catch (_) {}
    return hit;
  }

  async function applyMap(addressLine) {
    var iframes = document.querySelectorAll('[data-gs="osm-frame"]');
    if (iframes.length === 0) return;  // page has no map region
    if (!addressLine) {
      iframes.forEach(function (f) { f.classList.add('contact-map--no-coords'); });
      return;
    }

    var geo;
    try {
      geo = await geocodeAddress(addressLine);
    } catch (e) {
      console.warn('Gestiscilo: geocoding failed —', (e && e.message) || e);
      iframes.forEach(function (f) { f.classList.add('contact-map--no-coords'); });
      return;
    }

    var lat = parseFloat(geo.lat);
    var lon = parseFloat(geo.lon);
    if (isNaN(lat) || isNaN(lon)) {
      iframes.forEach(function (f) { f.classList.add('contact-map--no-coords'); });
      return;
    }

    // ±0.01° bbox (~1.1 km × 1.1 km at this latitude).
    var minLon = (lon - 0.01).toFixed(4);
    var maxLon = (lon + 0.01).toFixed(4);
    var minLat = (lat - 0.01).toFixed(4);
    var maxLat = (lat + 0.01).toFixed(4);

    var src = 'https://www.openstreetmap.org/export/embed.html' +
      '?bbox=' + minLon + '%2C' + minLat + '%2C' + maxLon + '%2C' + maxLat +
      '&layer=mapnik' +
      '&marker=' + lat + '%2C' + lon;

    iframes.forEach(function (f) {
      f.classList.remove('contact-map--no-coords');
      f.src = src;
    });
  }

  // ── Boot ────────────────────────────────────────────────────────────────
  // The embed script may attach window.Gestiscilo after DOMContentLoaded; the
  // gestiscilo:ready listener covers that ordering. applyTenantInfo is
  // idempotent so double-firing is harmless.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { applyTenantInfo(); });
  } else {
    applyTenantInfo();
  }
  document.addEventListener('gestiscilo:ready', function () { applyTenantInfo(); });
  setInterval(tickStatus, 60000);
})();
