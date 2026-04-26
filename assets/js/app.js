/* ==============================================================
   STATUS INDICATOR — Aperto / Solo WhatsApp / Chiuso
   Attualmente hardcoded 'open'. Quando il backend sarà pronto,
   sostituire fetchStatus() con: fetch('/api/status').then(r=>r.json())
   Risposta attesa: { status: 'open' | 'whatsapp' | 'closed' }
============================================================== */
async function fetchStatus(){ return { status: 'open' }; }
function applyStatus({status}){
  const el = document.getElementById('statusBar');
  if (!el) return;
  el.setAttribute('data-status', status);
  const label = el.querySelector('.status-label');
  const labels = { open: 'Aperto', whatsapp: 'Solo WhatsApp', closed: 'Chiuso' };
  if (label) label.textContent = labels[status] || 'Aperto';
}
fetchStatus().then(applyStatus).catch(() => applyStatus({status:'whatsapp'}));

/* Reveal */
const io = new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}, {rootMargin:'0px 0px -10% 0px', threshold:.06});
document.querySelectorAll('.reveal,.reveal-s').forEach(el => io.observe(el));

/* Pricing tabs */
document.querySelectorAll('.p-tabs button').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.p-tabs button').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    const k = b.dataset.tab;
    document.querySelectorAll('[data-pgrid]').forEach(g => {
      g.hidden = g.dataset.pgrid !== k;
    });
  });
});

/* FAQ */
document.querySelectorAll('.fa').forEach(it => it.addEventListener('click', () => it.classList.toggle('open')));

/* Topbar marquee on mobile */
(() => {
  if (window.innerWidth > 720) return;
  const wrap = document.querySelector('.topbar .wrap');
  if (!wrap) return;
  const track = document.createElement('div');
  track.className = 'topbar-track';
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
  inner.className = 'topbar-marquee-inner';
  inner.appendChild(track);
  inner.appendChild(clone);
  wrap.appendChild(inner);
})();

/* Hide header on scroll down, restore on scroll up */
(() => {
  const hdr = document.querySelector('.site-header');
  const tb  = document.querySelector('.topbar');
  if (!hdr) return;
  if (tb) document.documentElement.style.setProperty('--topbar-h', tb.offsetHeight + 'px');
  let last = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    hdr.classList.toggle('header--hidden', y > last && y > 80);
    last = y;
  }, { passive: true });
})();

/* Mobile menu */
const burger = document.getElementById('burger');
const menu = document.getElementById('menu');
const mclose = document.getElementById('mclose');
function setM(o){ menu.classList.toggle('open', o); document.body.style.overflow = o ? 'hidden' : ''; }
burger?.addEventListener('click', () => setM(true));
mclose?.addEventListener('click', () => setM(false));
menu?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setM(false)));

/* Manifesto scroll-lock */
(() => {
  const section = document.querySelector('.manifesto');
  if (!section) return;

  const THRESHOLD = 600;
  let accumulated = 0;
  let locked = false;
  let done = false;

  window.addEventListener('wheel', (e) => {
    if (done) return;

    const sTop = section.offsetTop;
    const y    = window.scrollY;
    const next = y + e.deltaY;

    if (!locked && e.deltaY > 0 && y < sTop + 60 && next > sTop - 80) {
      locked = true;
      accumulated = 0;
      e.preventDefault();
      return;
    }

    if (!locked) return;
    e.preventDefault();

    if (e.deltaY < 0) {
      locked = false;
      accumulated = 0;
      section.style.setProperty('--lock-p', 0);
      return;
    }

    accumulated += e.deltaY;
    section.style.setProperty('--lock-p', Math.min(accumulated / THRESHOLD, 1));

    if (accumulated >= THRESHOLD) {
      locked = false;
      done = true;
      accumulated = 0;
      section.style.setProperty('--lock-p', 0);
    }
  }, { passive: false });

  window.addEventListener('scroll', () => {
    if (done && window.scrollY < section.offsetTop - window.innerHeight * 0.5) done = false;
  }, { passive: true });
})();

/* ==============================================================
   BOOKING DRAWER
   3-step bottom sheet che guida l'utente Cosa → Quando → Chi,
   apertura dai CTA [data-book], submit su WhatsApp.
============================================================== */
(() => {
  const WA_NUMBER = '390000000000';  // sostituire con numero reale

  const EXPERIENCES = [
    // Noleggio
    { id:'fast-fun',       cat:'noleggio', name:'Fast & Fun · 15 min',    dur:'15 min', price:50,  unit:'/ 15 min',  desc:'Adrenalina pura. +10 min omaggio rientro.' },
    { id:'sprint',         cat:'noleggio', name:'Sprint · 30 min',        dur:'30 min', price:85,  unit:'/ 30 min',  desc:'Divertimento puro, senza pensieri.' },
    { id:'classic',        cat:'noleggio', name:'Classic · 45 min',       dur:'45 min', price:105, unit:'/ 45 min',  desc:'Il best seller. Miglior rapporto qualità/prezzo.' },
    { id:'sunset-hour',    cat:'noleggio', name:'Sunset Hour · 1 ora',    dur:'1 ora',  price:145, unit:'/ ora',     desc:'Esperienza premium, ideale al tramonto.' },
    { id:'vallugola-gold', cat:'noleggio', name:'Vallugola Gold · 4 ore', dur:'4 ore',  price:289, unit:'/ persona · min 2', desc:'VIP: attracco + sconto Ristorante Falco.' },
    // Love Experience
    { id:'secret-romance',    cat:'love', name:'Secret Romance · 1 ora',       dur:'1 ora',  price:320, unit:'/ coppia',  desc:'Rose, Champagne piccolo, GoPro. In segreto.' },
    { id:'the-proposal',      cat:'love', name:'The Proposal · 1h30',          dur:'1h30',   price:490, unit:'/ coppia',  desc:'Drone 4K, paparazzo, pergamena GPS. La proposta.' },
    { id:'midday-brunch',     cat:'love', name:'Midday Brunch · 1 ora',        dur:'1 ora',  price:220, unit:'/ coppia',  desc:'Luxury Brunch Box, drink, tavolo a bordo.' },
    { id:'vallugola-diamond', cat:'love', name:'Vallugola Diamond · 4 ore',    dur:'4 ore',  price:850, unit:'/ coppia',  desc:'All-inclusive: 2 bottiglie, fiori, drone, attracco.' }
  ];

  const CAT_LABELS = { noleggio: 'Noleggio', love: 'Love Experience' };

  const state = {
    step: 1,
    expId: null,
    date: '',
    time: '',
    people: 2,
    name: '',
    phone: '',
    email: '',
    notes: '',
    consent: true
  };

  const bk          = document.getElementById('bk');
  const backdrop    = document.getElementById('bkBackdrop');
  const closeBtn    = document.getElementById('bkClose');
  const body        = bk?.querySelector('.bk-body');
  const panes       = [...bk?.querySelectorAll('.bk-pane') || []];
  const stepNum     = document.getElementById('bkStepNum');
  const catBtns     = [...bk?.querySelectorAll('.bk-cats button') || []];
  const expGrid     = document.getElementById('bkExpGrid');
  const dateIn      = document.getElementById('bkDate');
  const timeRadios  = [...bk?.querySelectorAll('input[name="bkTime"]') || []];
  const peopleEl    = document.getElementById('bkPeople');
  const peopleBtns  = [...bk?.querySelectorAll('.bk-stepper button') || []];
  const nameIn      = document.getElementById('bkName');
  const phoneIn     = document.getElementById('bkPhone');
  const emailIn     = document.getElementById('bkEmail');
  const notesIn     = document.getElementById('bkNotes');
  const consentIn   = document.getElementById('bkConsent');
  const jumpBtns    = [...bk?.querySelectorAll('[data-jump]') || []];
  const sumExp      = document.getElementById('sumExp');
  const sumDate     = document.getElementById('sumDate');
  const sumTime     = document.getElementById('sumTime');
  const sumPeople   = document.getElementById('sumPeople');
  const sumPrice    = document.getElementById('sumPrice');
  const backBtn     = document.getElementById('bkBack');
  const nextBtn     = document.getElementById('bkNext');
  const submitBtn   = document.getElementById('bkSubmit');
  const hintEl      = document.getElementById('bkHint');

  if (!bk) return;

  // Set min date to today, default value = tomorrow
  if (dateIn) {
    const today    = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    dateIn.min     = today.toISOString().split('T')[0];
    dateIn.value   = tomorrow.toISOString().split('T')[0];
    state.date     = dateIn.value;
  }

  const STEP_META = [
    null,
    { num:'01', label:'Esperienza',     hint:"Scegli un'esperienza" },
    { num:'02', label:'Data e orario',  hint:'Scegli data e orario' },
    { num:'03', label:'I tuoi contatti',hint:'Conferma prenotazione' }
  ];

  function getExp(id) {
    return EXPERIENCES.find(e => e.id === id) || null;
  }

  function formatDate(iso) {
    if (!iso) return '—';
    try {
      const d = new Date(iso + 'T00:00');
      return d.toLocaleDateString('it-IT', { weekday:'long', day:'numeric', month:'long' });
    } catch { return iso; }
  }

  // Flags for featured items ("Più scelto")
  const FEATURED = new Set(['classic', 'the-proposal']);

  function renderExpCards() {
    if (!expGrid) return;
    const activeCat = catBtns.find(b => b.classList.contains('active'))?.dataset.cat || 'noleggio';
    const items = EXPERIENCES.filter(e => e.cat === activeCat);
    expGrid.innerHTML = items.map(e => `
      <button type="button" class="bk-exp-card ${state.expId === e.id ? 'active' : ''}" data-pick="${e.id}">
        ${FEATURED.has(e.id) ? '<span class="bk-featured">Più scelto</span>' : ''}
        <div class="bk-exp-head">
          <h4>${e.name}</h4>
        </div>
        <span class="bk-exp-desc">${e.desc}</span>
        <div class="bk-exp-price">
          <b>${e.price === null ? 'Custom' : e.price + '€'}</b>
          <small>${e.unit}</small>
        </div>
      </button>
    `).join('');
    expGrid.querySelectorAll('[data-pick]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.expId = btn.dataset.pick;
        renderExpCards();  // re-render to update active state
        updateHint();
        updateNextBtn();
      });
    });
  }

  function setStep(n) {
    state.step = Math.min(Math.max(n, 1), 3);
    panes.forEach(p => p.classList.toggle('active', +p.dataset.pane === state.step));
    const meta = STEP_META[state.step];
    if (stepNum) stepNum.textContent = meta.num;
    backBtn.hidden   = state.step === 1;
    nextBtn.hidden   = state.step === 3;
    submitBtn.hidden = state.step !== 3;
    updateHint();
    updateNextBtn();
    if (state.step === 3) updateSummary();
    body?.scrollTo({ top: 0, behavior: 'smooth' });
    // Auto-focus primo input dello step (helper UX)
    setTimeout(() => {
      const pane = panes.find(p => +p.dataset.pane === state.step);
      const firstInput = pane?.querySelector('input:not([type=radio]):not([type=checkbox]):not([type=hidden]), textarea, button[data-pick]');
      if (firstInput && state.step !== 1) firstInput.focus({preventScroll:true});
    }, 360);
  }

  function updateHint() {
    if (!hintEl) return;
    hintEl.classList.remove('warn');
    hintEl.textContent = STEP_META[state.step].hint;
  }

  function updateNextBtn() {
    let valid = false;
    if (state.step === 1) valid = !!state.expId;
    else if (state.step === 2) valid = !!state.date && !!state.time;
    nextBtn.disabled = !valid;
    submitBtn.disabled = !(state.name.trim() && state.phone.trim() && state.consent);
  }

  function updateSummary() {
    const e = getExp(state.expId);
    sumExp.textContent    = e ? e.name : '—';
    sumDate.textContent   = formatDate(state.date);
    sumTime.textContent   = state.time || '—';
    sumPeople.textContent = state.people;
    if (e && e.price !== null) {
      // Moltiplica solo se unit include "persona" (es. Vallugola Gold 289€/pers)
      // Tutti gli altri (coppia, add-on, 15/30/45/60 min) hanno prezzo flat
      const perPerson = e.unit.includes('persona');
      const total = perPerson ? e.price * Math.max(state.people, 2) : e.price;
      sumPrice.textContent  = total + '€ ' + e.unit;
    } else if (e && e.price === null) {
      sumPrice.textContent = 'Da preventivare';
    } else {
      sumPrice.textContent  = '—';
    }
  }

  function open(preselectId) {
    if (preselectId && getExp(preselectId)) {
      const exp = getExp(preselectId);
      state.expId = preselectId;
      // switch category tab
      catBtns.forEach(b => b.classList.toggle('active', b.dataset.cat === exp.cat));
    }
    renderExpCards();
    setStep(state.step || 1);
    backdrop.classList.add('open');
    backdrop.setAttribute('aria-hidden','false');
    bk.classList.add('open');
    bk.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    bk.classList.remove('open');
    backdrop.classList.remove('open');
    bk.setAttribute('aria-hidden','true');
    backdrop.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  }

  // Triggers — any element with data-book attribute opens the drawer
  document.querySelectorAll('[data-book]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const id = el.getAttribute('data-book') || null;
      open(id);
    });
  });

  // Close handlers
  closeBtn?.addEventListener('click', close);
  backdrop?.addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && bk.classList.contains('open')) close(); });

  // Category switcher
  catBtns.forEach(b => {
    b.addEventListener('click', () => {
      catBtns.forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      renderExpCards();
    });
  });

  // Date + time
  dateIn?.addEventListener('change', () => { state.date = dateIn.value; updateNextBtn(); });
  timeRadios.forEach(r => r.addEventListener('change', () => { if (r.checked) { state.time = r.value; updateNextBtn(); } }));

  // People stepper
  function renderPeople(){ if (peopleEl) peopleEl.textContent = state.people; }
  peopleBtns.forEach(b => b.addEventListener('click', () => {
    const op = b.dataset.step;
    if (op === '+' && state.people < 12) state.people++;
    if (op === '-' && state.people > 1)  state.people--;
    renderPeople();
  }));

  // Contact fields
  nameIn?.addEventListener('input',  () => { state.name  = nameIn.value;  updateHint(); updateNextBtn(); });
  phoneIn?.addEventListener('input', () => { state.phone = phoneIn.value; updateHint(); updateNextBtn(); });
  emailIn?.addEventListener('input', () => { state.email = emailIn.value; });
  notesIn?.addEventListener('input', () => { state.notes = notesIn.value; });
  consentIn?.addEventListener('change', () => { state.consent = consentIn.checked; updateHint(); updateNextBtn(); });

  // Summary click → jump to related step
  jumpBtns.forEach(el => el.addEventListener('click', (e) => {
    e.preventDefault();
    const target = parseInt(el.dataset.jump, 10);
    if (target >= 1 && target <= 3) setStep(target);
  }));

  // Nav
  nextBtn?.addEventListener('click', () => setStep(state.step + 1));
  backBtn?.addEventListener('click', () => setStep(state.step - 1));

  // Submit — placeholder finché il backend non è collegato.
  // TODO: sostituire con POST /api/bookings → body: JSON.stringify(state)
  submitBtn?.addEventListener('click', () => {
    const firstName = state.name.trim().split(/\s+/)[0] || '';
    if (!body) return;
    body.innerHTML = `
      <div class="bk-thanks">
        <div class="bk-thanks-ic">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
        </div>
        <h3>Grazie${firstName ? ', ' + firstName : ''}!</h3>
        <p>Abbiamo ricevuto la tua richiesta di prenotazione. Ti ricontattiamo su WhatsApp entro pochi minuti per confermare disponibilità.</p>
        <div class="bk-thanks-sum">
          <div><span>Esperienza</span><b>${getExp(state.expId)?.name || '—'}</b></div>
          <div><span>Data</span><b>${formatDate(state.date)}</b></div>
          <div><span>Orario</span><b>${state.time || '—'}</b></div>
        </div>
      </div>
    `;
    // Hide footer controls
    document.querySelector('.bk-foot')?.setAttribute('hidden','');
    document.querySelector('.bk-trust')?.setAttribute('hidden','');
  });

  // Initial render
  renderExpCards();
  renderPeople();
})();

/* ==============================================================
   FORECAST 7 GIORNI — Cattolica, dati Open-Meteo (free, no key)
   wave_height_max + wind_speed_10m_max + weather_code
============================================================== */
(async () => {
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
        Le previsioni si stanno aggiornando. Se non le vedi, <a href="https://wa.me/390000000000?text=Ciao!%20Vorrei%20info%20sul%20meteo">scrivici su WhatsApp</a> e ti diciamo le condizioni in tempo reale.
      </div>
    `;
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
    // Sconsigliato: temporali, neve, mare > 0.8m, vento forte, pioggia battente
    if (code >= 95) return { level: 'no', label: 'No' };
    if (code >= 71 && code <= 77) return { level: 'no', label: 'No' };
    if ((typeof wave === 'number' && wave > 0.8)
       || (typeof wind === 'number' && wind > 30)
       || (code >= 65 && code <= 67)
       || (code >= 82 && code <= 86)) return { level: 'no', label: 'Sconsigliato' };
    // Verifichiamo: condizioni borderline
    if ((typeof wave === 'number' && wave > 0.5)
       || (typeof wind === 'number' && wind > 22)
       || (code >= 51 && code <= 64)
       || (code >= 80 && code <= 81)
       || (code >= 45 && code <= 48)) return { level: 'caution', label: 'Verifichiamo' };
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

