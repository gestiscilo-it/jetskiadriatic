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

    test('window.JSA exists and exposes computeTotal', () => {
      if(typeof window.JSA !== 'object') throw new Error('JSA not exported');
      if(typeof window.JSA.computeTotal !== 'function') throw new Error('computeTotal missing');
    });

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

    summary.textContent = `${passed} passed, ${failed} failed`;
    summary.className = failed ? 'summary bad' : 'summary ok';
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
