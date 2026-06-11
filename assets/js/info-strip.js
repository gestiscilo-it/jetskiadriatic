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

  // Easter egg: a volte la moto d'acqua parte — saltella sulle onde con la
  // scia dietro, esce a destra e rientra da sinistra. 1 corsa su 4 è turbo.
  // Prima corsa ~10s dopo il load, poi cadenza casuale 25-75s. Se il tab è
  // nascosto la corsa salta (riprogrammata). Disattivata con
  // prefers-reduced-motion. La classe va sull'anchor: la scia è il ::after.
  (function jetskiRides(){
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var logo = document.querySelector('a.strip-logo');
    var img = logo && logo.querySelector('img');
    if (!logo || !img) return;
    function ride(){
      schedule();
      if (document.hidden || logo.classList.contains('is-riding')) return;
      if (Math.random() < 0.25) logo.classList.add('is-turbo');
      logo.classList.add('is-riding');
      img.addEventListener('animationend', function(){
        logo.classList.remove('is-riding');
        logo.classList.remove('is-turbo');
      }, { once:true });
    }
    function schedule(){ setTimeout(ride, 25000 + Math.random()*50000); }
    setTimeout(ride, 10000);
  })();
