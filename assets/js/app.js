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

/* Mobile menu */
const burger = document.getElementById('burger');
const menu = document.getElementById('menu');
const mclose = document.getElementById('mclose');
function setM(o){menu.classList.toggle('open', o);document.body.style.overflow = o ? 'hidden' : ''}
burger?.addEventListener('click', () => setM(true));
mclose?.addEventListener('click', () => setM(false));
menu?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setM(false)));

/* ==============================================================
   BOOKING DRAWER
   3-step bottom sheet che guida l'utente Cosa → Quando → Chi,
   apertura dai CTA [data-book], submit su WhatsApp.
============================================================== */
(() => {
  const WA_NUMBER = '390000000000';  // sostituire con numero reale

  const EXPERIENCES = [
    // Noleggio
    { id:'taste',   cat:'noleggio', name:'Taste · 15 min',        dur:'15 min',  price:50,   unit:'/ 15 min',  desc:'Senza patente, area controllata.' },
    { id:'ride',    cat:'noleggio', name:'Ride · 30 min',         dur:'30 min',  price:90,   unit:'/ 30 min',  desc:'Con o senza patente. La giusta dose.' },
    { id:'fullday', cat:'noleggio', name:'Full Day · 8 h',        dur:'8 h',     price:590,  unit:'/ giornata',desc:'Richiede patente nautica.' },
    // Flotta specifica
    { id:'vx-cruiser-ho',  cat:'noleggio', name:'Yamaha VX Cruiser HO',    dur:'30 min', price:90,  unit:'/ 30 min', desc:'Top seller · 1.8 L HO, 85 km/h.' },
    { id:'vx-ltd-ho',      cat:'noleggio', name:'Yamaha VX Limited HO',    dur:'30 min', price:120, unit:'/ 30 min', desc:'Audio integrato · 1.8 L HO, 95 km/h.' },
    { id:'fx-cruiser-svho',cat:'noleggio', name:'Yamaha FX Cruiser SVHO',  dur:'30 min', price:150, unit:'/ 30 min', desc:'Flagship · 1.8 SC, 110 km/h.' },
    // Tour
    { id:'tour-cattolica',   cat:'tour', name:'Lungomare di Cattolica',   dur:'20 min', price:69,  unit:'/ moto d\u2019acqua', desc:'Porto · lungomare.' },
    { id:'tour-gabicce',     cat:'tour', name:'Gabicce Monte',            dur:'45 min', price:119, unit:'/ moto d\u2019acqua', desc:'Scogliera · sosta bagno.' },
    { id:'tour-vallugola',   cat:'tour', name:'Baia di Vallugola',        dur:'1h30',   price:189, unit:'/ moto d\u2019acqua', desc:'Caletta · acque cristalline.' },
    { id:'tour-fiorenzuola', cat:'tour', name:'Fiorenzuola di Focara',    dur:'2h',     price:229, unit:'/ moto d\u2019acqua', desc:'Borgo arroccato · foto dal mare.' },
    { id:'tour-sunset',      cat:'tour', name:'Sunset San Bartolo',       dur:'2h',     price:249, unit:'/ moto d\u2019acqua', desc:'Tramonto · brindisi in mare.' },
    // Eventi
    { id:'bachelor',  cat:'evento', name:'Bachelor / Hen',         dur:'2 h',       price:890, unit:'/ gruppo',       desc:'6-12 amici · champagne + foto.' },
    { id:'incentive', cat:'evento', name:'Incentive aziendale',    dur:'mezza/intera giornata', price:null, unit:'preventivo su misura', desc:'Team building brandizzabile, P.IVA.' },
    { id:'shooting',  cat:'evento', name:'Shooting & Video',       dur:'mezza giornata', price:690, unit:'/ mezza giornata', desc:'Location per brand e creator.' }
  ];

  const CAT_LABELS = { noleggio: 'Esperienza', tour: 'Tour', evento: 'Evento' };

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
  const stepLabel   = document.getElementById('bkStepLabel');
  const dots        = [...bk?.querySelectorAll('.bk-dot') || []];
  const lines       = [...bk?.querySelectorAll('.bk-line') || []];
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
    { num:'01', label:'Esperienza',     hint:"Scegli un'esperienza per continuare" },
    { num:'02', label:'Data e orario',  hint:'Scegli data e orario' },
    { num:'03', label:'I tuoi contatti',hint:'Ti confermiamo in 5 min su WhatsApp' }
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
  const FEATURED = new Set(['ride', 'tour-sunset', 'bachelor']);

  function renderExpCards() {
    if (!expGrid) return;
    const activeCat = catBtns.find(b => b.classList.contains('active'))?.dataset.cat || 'noleggio';
    const items = EXPERIENCES.filter(e => e.cat === activeCat);
    expGrid.innerHTML = items.map(e => `
      <button type="button" class="bk-exp-card ${state.expId === e.id ? 'active' : ''}" data-pick="${e.id}">
        ${FEATURED.has(e.id) ? '<span class="bk-featured">Più scelto</span>' : ''}
        <div>
          <h4>${e.name}</h4>
          ${e.dur && e.cat === 'tour' ? `<span class="dur">${e.dur}</span>` : ''}
        </div>
        <span class="bk-exp-desc">${e.desc}</span>
        <div class="price">
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
    if (stepNum)   stepNum.textContent   = meta.num;
    if (stepLabel) stepLabel.textContent = meta.label;
    dots.forEach((d, i) => {
      d.classList.toggle('active', i + 1 === state.step);
      d.classList.toggle('done',   i + 1 < state.step);
    });
    lines.forEach((l, i) => l.classList.toggle('done', i + 1 < state.step));
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
    const meta = STEP_META[state.step];
    let msg = meta.hint;
    if (state.step === 1 && state.expId) {
      const e = getExp(state.expId);
      msg = e ? `✓ Scelto: ${e.name}` : meta.hint;
    } else if (state.step === 2) {
      if (state.date && state.time) msg = `✓ ${formatDate(state.date)} alle ${state.time}`;
      else if (!state.time && state.date) msg = 'Scegli un orario';
      else if (!state.date && state.time) msg = 'Scegli una data';
    } else if (state.step === 3) {
      const missing = [];
      if (!state.name.trim())  missing.push('nome');
      if (!state.phone.trim()) missing.push('WhatsApp');
      if (!state.consent)      missing.push('privacy');
      if (missing.length) {
        msg = 'Manca: ' + missing.join(', ');
        hintEl.classList.add('warn');
      }
    }
    hintEl.textContent = msg;
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
      // Se è "per gruppo" o "preventivo" non moltiplicare
      const perUnit = e.unit.includes('gruppo') || e.unit.includes('moto') || e.unit.includes('giornata') || e.unit.includes('mezza');
      const total = perUnit ? e.price : e.price * state.people;
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

  // Mark sunset slot visually
  const sunsetRadio = bk?.querySelector('input[name="bkTime"][value="18:30"]');
  if (sunsetRadio) sunsetRadio.closest('label').classList.add('sunset');

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
