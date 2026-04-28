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

    summary.textContent = `${passed} passed, ${failed} failed`;
    summary.className = failed ? 'summary bad' : 'summary ok';
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
