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

  // "Il varo" — entry effect della strip. La partial parte con is-loading
  // (solo la moto, che galleggia: loading placeholder). All'idratazione dei
  // dati tenant (Gestiscilo.ready / gestiscilo:ready, failsafe 4s) la moto
  // fa la sua corsa e le voci affiorano nella scia (is-arriving, stagger CSS
  // sinistra→destra). Su mobile la sequenza avviene dentro il marquee, che
  // scorre a prescindere. Con prefers-reduced-motion la classe viene solo
  // rimossa: il CSS è già gated, niente animazioni.
  (function stripEntry(){
    var strip = document.querySelector('.info-strip');
    if (!strip || !strip.classList.contains('is-loading')) return;
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    function arrive(){
      if (!strip.classList.contains('is-loading')) return;
      strip.classList.remove('is-loading');
      if (reduce) return;
      strip.classList.add('is-arriving');
      var logo = document.querySelector('a.strip-logo');
      var img = logo && logo.querySelector('img');
      var items = [].slice.call(strip.querySelectorAll(
        '.info-l > *:not(.strip-logo), .info-strip-track > .sep, .info-r'
      ));
      // Sync per costruzione: un rAF legge dove sta davvero la moto e marca
      // .wake ogni voce appena la sua coda la sorpassa — niente delay stimati,
      // funziona con qualsiasi easing e anche dentro il marquee che scorre.
      // Il lead proporzionale alla velocità (~150ms) compensa il ramp-up del
      // fade: la voce parte poco prima del passaggio così è già percepibile
      // quando la moto la incrocia — senza, a destra (dove la moto è veloce)
      // si sente un vuoto tra una voce e la successiva.
      var prevSkiL = null;
      function surfaceInWake(){
        if (items.length === 0) return;
        var skiL = img.getBoundingClientRect().left;
        var lead = prevSkiL === null ? 0 : Math.max(0, skiL - prevSkiL) * 9;
        prevSkiL = skiL;
        items = items.filter(function (el) {
          var r = el.getBoundingClientRect();
          if (r.width === 0 || skiL + lead > r.left + r.width / 2) {
            el.classList.add('wake');
            return false;
          }
          return true;
        });
        if (items.length > 0 && logo.classList.contains('is-riding')) {
          requestAnimationFrame(surfaceInWake);
        }
      }
      function surfaceRest(){
        items.forEach(function (el) { el.classList.add('wake'); });
        items = [];
      }
      if (img && !logo.classList.contains('is-riding')) {
        logo.classList.add('is-riding');
        img.addEventListener('animationend', function(){
          logo.classList.remove('is-riding');
          surfaceRest(); // ciò che la corsa non ha coperto (cloni fuori schermo)
        }, { once:true });
        requestAnimationFrame(surfaceInWake);
      } else {
        surfaceRest();
      }
      // Le wake-in finiscono entro ~1.5s dopo la corsa; tolta la classe, le
      // voci restano alla loro opacity di default (1) senza scatti.
      setTimeout(function(){
        strip.classList.remove('is-arriving');
        strip.querySelectorAll('.wake').forEach(function (el) { el.classList.remove('wake'); });
      }, 4000);
    }
    function boot(){
      if (window.Gestiscilo && Gestiscilo.ready && Gestiscilo.ready.then) {
        Gestiscilo.ready.then(arrive, arrive);
      }
      document.addEventListener('gestiscilo:ready', arrive);
      setTimeout(arrive, 4000);
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot);
    } else {
      boot();
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
