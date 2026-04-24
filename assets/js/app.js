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
