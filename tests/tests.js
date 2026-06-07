(function(){
  'use strict';
  const results = document.getElementById('results');
  const summary = document.getElementById('summary');
  let passed = 0, failed = 0;

  // Phase 184: async-aware test runner. Returns a Promise so the run() driver
  // can await each test sequentially. Sync tests (fn() returns undefined) work
  // unchanged; async tests (fn() returns a Promise) are awaited before the
  // pass/fail is recorded.
  function test(name, fn){
    return Promise.resolve()
      .then(function(){ return fn(); })
      .then(function(){
        results.insertAdjacentHTML('beforeend', '<li class="pass">✓ ' + name + '</li>');
        passed++;
      })
      .catch(function(err){
        results.insertAdjacentHTML('beforeend', '<li class="fail">✗ ' + name + ' — ' + (err && err.message ? err.message : err) + '</li>');
        console.error(name, err);
        failed++;
      });
  }
  function eq(a, b, msg){
    const sa = JSON.stringify(a), sb = JSON.stringify(b);
    if(sa !== sb) throw new Error((msg || '') + ' expected ' + sb + ', got ' + sa);
  }

  // Wait for app.js to attach window.JSA
  async function run(){
    if(!window.JSA){ summary.textContent = 'window.JSA not found — app.js did not export pure functions'; summary.className = 'summary bad'; return; }

    // V-184-13: updateBookingTotal renders grand_total_cents via Gestiscilo.quote()
    // stub. Replaces the legacy pre-Phase-175 client-side pricing tests deleted in
    // Phase 184 — Phase 175 backend killed the code paths those tests covered.
    await test('updateBookingTotal renders grand_total_cents via fmt() (V-184-13)', async function () {
      // Stub the SDK before driving the booking flow.
      window.Gestiscilo = window.Gestiscilo || {};
      window.Gestiscilo.ready = Promise.resolve();
      var originalQuote = window.Gestiscilo.quote;
      window.Gestiscilo.quote = async function (items) {
        return {
          lines: [{
            slug: (items && items[0] && items[0].slug) || 'x',
            breakdown: { line_total_cents: 12345 },
          }],
          grand_total_cents: 12345,
          currency: 'EUR',
        };
      };

      // Seed a fake experience so getCurrentExp() inside the IIFE resolves.
      // EXPERIENCES is normally populated by Gestiscilo.products(), which doesn't fire
      // in the test page bootstrap.
      if (typeof window.JSA.__seedTestExperience === 'function') {
        window.JSA.__seedTestExperience({
          id: 'test184-primary',
          slug: 'test184-primary',
          tab: 'moto',
          cat: 'ride',
          per_person: false,
          price_cents: 0,
        });
      }

      // DOM fixture — the minimal nodes updateBookingTotal + renderQuoteEnvelope read.
      // Prefixed IDs avoid colliding with any production app DOM injected by app.js boot.
      document.body.insertAdjacentHTML('beforeend',
        '<div id="testFixture184">' +
          '<input id="bkPeople" type="number" value="2" />' +
          '<button id="bkNext">Avanti</button>' +
          '<div id="bkTotal"></div>' +
          '<div id="bkTotalUnit"></div>' +
          '<small id="bkCapacityHint" class="bk-hint"></small>' +
        '</div>'
      );

      // Trigger.
      if (typeof window.JSA.updateBookingTotal !== 'function') {
        document.getElementById('testFixture184').remove();
        if (originalQuote === undefined) delete window.Gestiscilo.quote;
        else window.Gestiscilo.quote = originalQuote;
        throw new Error('window.JSA.updateBookingTotal not exported — Plan 05 Task 1 incomplete');
      }
      try {
        window.JSA.updateBookingTotal();

        // Wait for 200ms debounce + microtask settling.
        await new Promise(function (r) { setTimeout(r, 350); });

        // Assert. fmt() uses Intl.NumberFormat('it-IT') which renders 123.45 as "123,45".
        // renderQuoteEnvelope renders "{fmt} €" (with a space and Euro sign).
        var rendered = (document.getElementById('bkTotal').textContent || '').trim();
        eq(rendered, '123,45 €', '#bkTotal renders grand_total_cents/100 via fmt()');
      } finally {
        // Cleanup — keep test idempotent across re-runs.
        var fixture = document.getElementById('testFixture184');
        if (fixture) fixture.remove();
        if (originalQuote === undefined) delete window.Gestiscilo.quote;
        else window.Gestiscilo.quote = originalQuote;
      }
    });

    summary.textContent = passed + ' passed, ' + failed + ' failed';
    summary.className = failed ? 'summary bad' : 'summary ok';
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
