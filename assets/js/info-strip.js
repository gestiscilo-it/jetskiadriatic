(function () {
  function setup() {
    if (window.innerWidth > 720) return;
    const wrap = document.querySelector('.info-strip-inner');
    if (!wrap || wrap.querySelector('.info-strip-marquee-inner')) return;

    const track = document.createElement('div');
    track.className = 'info-strip-track';

    [...wrap.children].forEach((el, i) => {
      if (i > 0) {
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

    wrap.classList.add('has-marquee');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();

  // Easter egg: a volte la moto d'acqua parte. Prima corsa ~10s dopo il
  // load, poi cadenza casuale 25-75s. Disattivata con prefers-reduced-motion.
  (function jetskiRides(){
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var img = document.querySelector('.strip-logo img');
    if (!img) return;
    function ride(){
      img.classList.add('is-riding');
      img.addEventListener('animationend', function(){ img.classList.remove('is-riding'); }, { once:true });
      schedule();
    }
    function schedule(){ setTimeout(ride, 25000 + Math.random()*50000); }
    setTimeout(ride, 10000);
  })();
