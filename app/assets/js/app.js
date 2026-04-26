/* =====================================================
   JET SKI ADRIATIC — APP SHELL
   ===================================================== */

(function(){
  'use strict';

  // ============ DATA ============
  const EXPERIENCES = [
    {
      id: 'noleggio',
      tab: 'esperienze',
      cat: 'noleggio',
      title: 'Noleggio <em>libero</em>',
      loc: 'Cattolica · Lungomare',
      img: 'https://images.unsplash.com/photo-1641075298538-afccb186b6e1?q=85&w=1400&auto=format&fit=crop',
      imgs: [
        'https://images.unsplash.com/photo-1641075298538-afccb186b6e1?q=85&w=1400&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1564633351631-e85bd59a91af?q=85&w=1400&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1583008585590-c4ed0010bed6?q=85&w=1400&auto=format&fit=crop'
      ],
      badge: 'Senza patente',
      meta: '15 min · 30 min · full day',
      duration: 'Da 15 minuti a tutta la giornata',
      priceFrom: 50,
      priceUnit: '15 minuti',
      rating: 4.92,
      reviews: 184,
      includes: [
        'Briefing di sicurezza 10 minuti',
        'Giubbotto salvagente in tutte le taglie',
        'Radio VHF + GPS a bordo',
        'Istruttore a vista in area controllata'
      ],
      tags: ['15 min', '30 min', '1h', 'mezza giornata', 'full day'],
      lead: 'Sali, accendi, vai. Senza patente resti in area controllata; con patente, rotta libera.'
    },
    {
      id: 'vallugola-gold',
      tab: 'esperienze',
      cat: 'tour',
      title: 'Vallugola <em>Gold</em>',
      loc: 'Cattolica → Vallugola',
      img: 'https://images.unsplash.com/photo-1583008585590-c4ed0010bed6?q=85&w=1400&auto=format&fit=crop',
      imgs: [
        'https://images.unsplash.com/photo-1583008585590-c4ed0010bed6?q=85&w=1400&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1714526393543-6fb24e5a68b7?q=85&w=1400&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1596302653226-ba0fd4a518a7?q=85&w=1400&auto=format&fit=crop'
      ],
      badge: '4 ore · pranzo Falco',
      meta: '4 ore · min 2 persone',
      duration: '4 ore · pranzo incluso',
      priceFrom: 289,
      priceUnit: 'a persona',
      rating: 4.95,
      reviews: 67,
      includes: [
        'Guida + barca appoggio fino a Vallugola',
        'Attracco nella caletta privata',
        'Pranzo al Ristorante Falco (sconto dedicato)',
        'Rientro al tramonto'
      ],
      tags: ['4 ore', 'pranzo', 'caletta privata', 'gruppo'],
      lead: 'Quattro ore Cattolica → Vallugola con attracco e pranzo al Ristorante Falco. Il tour classico, con la caletta tutta vostra.'
    },
    {
      id: 'famiglia',
      tab: 'esperienze',
      cat: 'famiglia',
      title: 'Famiglie <em>& Gruppi</em>',
      loc: 'Cattolica · Sportender JST-30',
      img: 'https://images.unsplash.com/photo-1564633351631-e85bd59a91af?q=85&w=1400&auto=format&fit=crop',
      imgs: [
        'https://images.unsplash.com/photo-1564633351631-e85bd59a91af?q=85&w=1400&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1641075298538-afccb186b6e1?q=85&w=1400&auto=format&fit=crop'
      ],
      badge: 'Bimbi dai 6 anni',
      meta: 'Sportender · 3 posti',
      duration: '30 min – 2 ore',
      priceFrom: 75,
      priceUnit: 'esperienza family',
      rating: 4.97,
      reviews: 41,
      includes: [
        'Sportender JST-30 (più stabile, senza elica)',
        'Giubbotti taglia bambino dai 15 kg',
        'Kids Academy inclusa per i piccoli',
        'Possibilità gruppo intero'
      ],
      tags: ['family', 'gruppi >3 pers', 'kids academy', 'eventi privati'],
      lead: 'Sportender JST-30 — più stabile del jet ski classico: bambini dai 6 anni, gruppi fino a 3 persone per moto.'
    },
    {
      id: 'sunset-tour',
      tab: 'esperienze',
      cat: 'tour',
      title: 'Sunset <em>San Bartolo</em>',
      loc: 'Cattolica → Gabicce → Vallugola',
      img: 'https://images.unsplash.com/photo-1714526393543-6fb24e5a68b7?q=85&w=1400&auto=format&fit=crop',
      imgs: [
        'https://images.unsplash.com/photo-1714526393543-6fb24e5a68b7?q=85&w=1400&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1558961078-beebe6540096?q=85&w=1400&auto=format&fit=crop'
      ],
      badge: 'Tramonto',
      meta: '1h30 · ultima uscita 19:30',
      duration: '90 minuti al tramonto',
      priceFrom: 159,
      priceUnit: 'a moto',
      rating: 4.93,
      reviews: 92,
      includes: [
        'Partenza 30 min prima del tramonto',
        'Guida con conoscenza dei migliori spot',
        'Punto fermo per foto al tramonto',
        'Briefing completo · radio a bordo'
      ],
      tags: ['1h30', 'tramonto', 'guida', 'foto'],
      lead: 'Il tratto più scenografico della Riviera, illuminato dal tramonto. Guida che conosce gli spot, ti porta dove vale.'
    },
    {
      id: 'eventi',
      tab: 'esperienze',
      cat: 'eventi',
      title: 'Eventi <em>privati</em>',
      loc: 'Riviera Romagnola',
      img: 'https://images.unsplash.com/photo-1617059063772-34532796cdb5?q=85&w=1400&auto=format&fit=crop',
      imgs: [
        'https://images.unsplash.com/photo-1617059063772-34532796cdb5?q=85&w=1400&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1596302653226-ba0fd4a518a7?q=85&w=1400&auto=format&fit=crop'
      ],
      badge: 'Su misura',
      meta: 'Aziende · Compleanni · Addii',
      duration: 'Mezza o intera giornata',
      priceFrom: 1200,
      priceUnit: 'da · gruppi',
      rating: 5.0,
      reviews: 12,
      includes: [
        'Flotta dedicata fino a 9 moto',
        'Catering a bordo opzionale',
        'Drone 4K + paparazzo dedicato',
        'Coordinamento eventi end-to-end'
      ],
      tags: ['aziende', 'compleanni', 'addii al celibato', 'team building'],
      lead: 'Mezza giornata, intera, una settimana. Coordinamento, mezzi, foto e video — pensiamo a tutto noi.'
    },

    // ----- LOVE -----
    {
      id: 'the-proposal',
      tab: 'love',
      cat: 'romance',
      title: 'The <em>Proposal</em>',
      loc: 'Cattolica · al largo',
      img: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=85&w=1600&auto=format&fit=crop',
      imgs: [
        'https://images.unsplash.com/photo-1519741497674-611481863552?q=85&w=1600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1617059063772-34532796cdb5?q=85&w=1400&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1558961078-beebe6540096?q=85&w=1400&auto=format&fit=crop'
      ],
      badge: 'Signature',
      meta: '1h30 · coppia · drone 4K',
      duration: '90 minuti orchestrati',
      priceFrom: 490,
      priceUnit: 'a coppia',
      rating: 5.0,
      reviews: 7,
      includes: [
        'Fiori a bordo + Champagne premium',
        'Drone 4K che vi segue dall\'alto',
        'Paparazzo: 30+ scatti dal pontile',
        'Pergamena con coordinate GPS del sì'
      ],
      tags: ['1h30', 'coppia', 'drone 4K', 'paparazzo', 'pergamena GPS'],
      lead: 'Il momento che non si prepara da soli. Fiori, Champagne, drone 4K e pergamena con le coordinate GPS del sì.'
    },
    {
      id: 'vallugola-diamond',
      tab: 'love',
      cat: 'adventure',
      title: 'Vallugola <em>Diamond</em>',
      loc: 'Cattolica → Vallugola',
      img: 'https://images.unsplash.com/photo-1617059063772-34532796cdb5?q=85&w=1600&auto=format&fit=crop',
      imgs: [
        'https://images.unsplash.com/photo-1617059063772-34532796cdb5?q=85&w=1600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1583008585590-c4ed0010bed6?q=85&w=1400&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1714526393543-6fb24e5a68b7?q=85&w=1400&auto=format&fit=crop'
      ],
      badge: 'All inclusive',
      meta: '4 ore · pranzo · drone',
      duration: '4 ore di lusso vero',
      priceFrom: 850,
      priceUnit: 'a coppia',
      rating: 4.98,
      reviews: 14,
      includes: [
        'Pranzo gourmet al Ristorante Falco',
        'Fiori freschi a bordo',
        'Drone 4K + 2 bottiglie Champagne',
        'Servizio paparazzo opzionale'
      ],
      tags: ['4 ore', 'pranzo Falco', 'champagne', 'drone 4K'],
      lead: 'Quattro ore da Cattolica al Porto di Vallugola. Pranzo al Ristorante Falco, fiori a bordo, drone 4K, due bottiglie di Champagne.'
    },
    {
      id: 'secret-romance',
      tab: 'love',
      cat: 'romance',
      title: 'Secret <em>Romance</em>',
      loc: 'Cattolica · al largo',
      img: 'https://images.unsplash.com/photo-1558961078-beebe6540096?q=85&w=1600&auto=format&fit=crop',
      imgs: [
        'https://images.unsplash.com/photo-1558961078-beebe6540096?q=85&w=1600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1519741497674-611481863552?q=85&w=1400&auto=format&fit=crop'
      ],
      badge: 'Anniversario',
      meta: '1 ora · coppia · GoPro',
      duration: '60 minuti privati',
      priceFrom: 320,
      priceUnit: 'a coppia',
      rating: 4.96,
      reviews: 28,
      includes: [
        '12 rose rosse fresche a bordo',
        'Champagne ghiacciato nel gavone',
        'GoPro POV già accesa',
        'Foto rapide AirDrop al rientro'
      ],
      tags: ['1 ora', 'rose', 'champagne', 'GoPro POV'],
      lead: 'Un\'ora in mare, rose a bordo, Champagne nel gavone. GoPro accesa quando serve. Per chi vuole sorprendere, non annunciare.'
    },
    {
      id: 'midday-brunch',
      tab: 'love',
      cat: 'food',
      title: 'Midday <em>Brunch</em>',
      loc: 'Cattolica · al largo',
      img: 'https://images.unsplash.com/photo-1714526393543-6fb24e5a68b7?q=85&w=1600&auto=format&fit=crop',
      imgs: [
        'https://images.unsplash.com/photo-1714526393543-6fb24e5a68b7?q=85&w=1600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1596302653226-ba0fd4a518a7?q=85&w=1400&auto=format&fit=crop'
      ],
      badge: 'Brunch a bordo',
      meta: '1 ora · brunch box',
      duration: '60 minuti al largo',
      priceFrom: 220,
      priceUnit: 'a coppia',
      rating: 4.91,
      reviews: 19,
      includes: [
        'Brunch box di lusso',
        'Drink premium a bordo',
        'Tavolo apparecchiato sul ponte',
        'Salviette + dry-bag forniti'
      ],
      tags: ['1 ora', 'brunch', 'drink premium', 'coppia'],
      lead: 'Un\'ora al largo con brunch box di lusso, drink a bordo, tavolo apparecchiato. Il mare come sala da pranzo privata.'
    }
  ];

  const CATS = {
    esperienze: [
      { id: 'noleggio',  label: 'Noleggio',  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v3M12 20v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M1 12h3M20 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>' },
      { id: 'tour',      label: 'Tour',      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>' },
      { id: 'famiglia',  label: 'Famiglie',  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="9" cy="7" r="3"/><circle cx="17" cy="7" r="2"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 14h2a3 3 0 0 1 3 3v2"/></svg>' },
      { id: 'eventi',    label: 'Eventi',    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 9h18"/></svg>' }
    ],
    love: [
      { id: 'romance',   label: 'Romance',   icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="9" r="4"/><path d="M12 13v8M8 18h8"/></svg>' },
      { id: 'food',      label: 'Brunch',    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M3 11h18a8 8 0 0 1-9 8 8 8 0 0 1-9-8z"/><path d="M7 8c0-2 1-3 2-3M11 8c0-2 1-3 2-3M15 8c0-2 1-3 2-3"/></svg>' },
      { id: 'adventure', label: 'Avventura', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M3 21l6-13 5 8 3-5 4 10z"/></svg>' }
    ]
  };

  // ============ STATE ============
  const state = {
    activeTab: 'esperienze',
    activeCat: 'noleggio',
    likes: new Set(JSON.parse(localStorage.getItem('jsa_likes') || '[]')),
    booking: {
      expId: null,
      date: '',
      time: '',
      people: 2,
      extras: new Set(),
      name: '',
      phone: '',
      email: '',
      notes: ''
    },
    bkStep: 1,
    cardCarousels: {} // id -> currentIndex
  };

  // ============ HELPERS ============
  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const fmt = n => new Intl.NumberFormat('it-IT').format(n);

  function saveLikes(){
    try{ localStorage.setItem('jsa_likes', JSON.stringify([...state.likes])); }catch(e){}
  }

  // ============ RENDER ============
  function renderCats(){
    const cats = CATS[state.activeTab];
    const wrap = $('#cats');
    wrap.innerHTML = cats.map(c => `
      <button type="button" class="cat${state.activeCat === c.id ? ' is-active' : ''}" data-cat="${c.id}">
        ${c.icon}
        <span>${c.label}</span>
      </button>
    `).join('');
    wrap.querySelectorAll('.cat').forEach(btn => {
      btn.addEventListener('click', () => {
        state.activeCat = btn.dataset.cat;
        renderCats();
        renderCards();
      });
    });
  }

  function renderCards(){
    const grid = $('#cards');
    const empty = $('#emptyState');
    let items = EXPERIENCES.filter(e => e.tab === state.activeTab && e.cat === state.activeCat);

    if(!items.length){
      grid.innerHTML = '';
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    grid.innerHTML = items.map(e => {
      const liked = state.likes.has(e.id);
      const isLove = e.tab === 'love';
      const dotsCount = e.imgs ? e.imgs.length : 1;
      const idx = state.cardCarousels[e.id] || 0;

      const stars = (e.rating || 0).toFixed(2);
      return `
        <article class="card ${isLove ? 'card--love' : ''}" data-card="${e.id}">
          <div class="card-img" data-card-img="${e.id}" style="background-image:url('${(e.imgs && e.imgs[idx]) || e.img}')">
            <span class="card-badge ${isLove ? 'card-badge--love' : ''}">${e.badge}</span>
            <button type="button" class="card-heart ${liked ? 'is-liked' : ''}" data-heart="${e.id}" aria-label="Salva ${e.title.replace(/<[^>]+>/g, '')}">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>
            ${dotsCount > 1 ? `
              <div class="card-dots" data-dots="${e.id}">
                ${Array.from({length: dotsCount}).map((_,i) => `<i class="${i === idx ? 'is-on' : ''}"></i>`).join('')}
              </div>
            ` : ''}
          </div>
          <div class="card-body">
            <div class="card-row">
              <h3 class="card-title">${e.title}</h3>
              <span class="card-rating" aria-label="Voto ${stars}"><svg viewBox="0 0 24 24"><path d="M12 2l2.9 6.9L22 10l-5.5 4.8L18.2 22 12 18.2 5.8 22l1.7-7.2L2 10l7.1-1.1z"/></svg>${stars}</span>
            </div>
            <p class="card-loc">${e.loc}</p>
            <p class="card-meta">${e.meta}</p>
            <p class="card-price"><b>da ${e.priceFrom}€</b> · ${e.priceUnit}</p>
          </div>
        </article>
      `;
    }).join('');

    // wire up
    grid.querySelectorAll('[data-card]').forEach(card => {
      card.addEventListener('click', (ev) => {
        if(ev.target.closest('[data-heart]')) return;
        if(ev.target.closest('[data-dots]')) return;
        openDetail(card.dataset.card);
      });
    });

    grid.querySelectorAll('[data-heart]').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        toggleHeart(btn.dataset.heart, btn);
      });
    });

    // simple swipe carousel on the image
    grid.querySelectorAll('[data-card-img]').forEach(img => {
      let startX = null;
      img.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, {passive:true});
      img.addEventListener('touchend', (e) => {
        if(startX === null) return;
        const dx = e.changedTouches[0].clientX - startX;
        if(Math.abs(dx) < 30) return;
        const id = img.dataset.cardImg;
        const exp = EXPERIENCES.find(x => x.id === id);
        if(!exp || !exp.imgs || exp.imgs.length < 2) return;
        const cur = state.cardCarousels[id] || 0;
        const dir = dx < 0 ? 1 : -1;
        const next = (cur + dir + exp.imgs.length) % exp.imgs.length;
        state.cardCarousels[id] = next;
        img.style.backgroundImage = `url('${exp.imgs[next]}')`;
        const dotsEl = img.querySelector('[data-dots]');
        if(dotsEl){
          dotsEl.querySelectorAll('i').forEach((d,i) => d.classList.toggle('is-on', i === next));
        }
        startX = null;
      });
    });
  }

  function toggleHeart(id, btn){
    if(state.likes.has(id)){
      state.likes.delete(id);
      btn.classList.remove('is-liked');
    }else{
      state.likes.add(id);
      btn.classList.add('is-liked');
    }
    saveLikes();
  }

  // ============ TAB SWITCHING ============
  function setTab(tab){
    state.activeTab = tab;
    state.activeCat = CATS[tab][0].id;
    document.body.dataset.activeTab = tab;
    $$('.tab').forEach(t => {
      const on = t.dataset.tab === tab;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    const t = tab === 'love' ? {
      title: 'Quando un\'ora diventa un momento.',
      sub:   'Esperienze signature. Fiori, Champagne, drone 4K, paparazzo.'
    } : {
      title: 'In mare in 5 minuti.',
      sub:   'Senza patente, senza pensieri. Cattolica · Rimini'
    };
    $('#feedTitle').textContent = t.title;
    $('#feedSub').textContent = t.sub;
    renderCats();
    renderCards();
  }

  // ============ SHEETS ============
  const backdrop = $('#sheetBackdrop');
  let openSheets = [];

  function openSheet(id){
    const sh = document.getElementById(id);
    if(!sh) return;
    sh.classList.add('is-open');
    sh.setAttribute('aria-hidden','false');
    backdrop.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    openSheets.push(id);
  }
  function closeSheet(id){
    const sh = id ? document.getElementById(id) : (openSheets.length ? document.getElementById(openSheets[openSheets.length-1]) : null);
    if(!sh) return;
    sh.classList.remove('is-open');
    sh.setAttribute('aria-hidden','true');
    openSheets = openSheets.filter(s => s !== sh.id);
    if(openSheets.length === 0){
      backdrop.classList.remove('is-open');
      document.body.style.overflow = '';
      // reset bottom nav to "esplora" when no sheets remain
      $$('.bn').forEach(b => b.classList.toggle('is-active', b.dataset.nav === 'esplora'));
    }
  }
  function closeAllSheets(){
    [...openSheets].forEach(id => closeSheet(id));
  }

  $$('[data-close-sheet]').forEach(b => {
    b.addEventListener('click', () => closeSheet(b.dataset.closeSheet));
  });
  backdrop.addEventListener('click', closeAllSheets);
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && openSheets.length){ closeSheet(); }
  });

  // ============ DRAG-TO-CLOSE (mobile only) ============
  function isMobileSheet(){ return window.matchMedia('(max-width: 959px)').matches; }
  function attachDragClose(sheetId){
    const sheet = document.getElementById(sheetId);
    if(!sheet) return;
    const grab = sheet.querySelector('.sheet-grab');
    if(!grab) return;

    let startY = 0;
    let dy = 0;
    let dragging = false;
    let startTime = 0;

    function onDown(e){
      if(!isMobileSheet()) return;
      startY = e.clientY;
      dy = 0;
      dragging = true;
      startTime = Date.now();
      sheet.style.transition = 'none';
      grab.classList.add('is-dragging');
      try{ grab.setPointerCapture(e.pointerId); }catch(_){}
    }
    function onMove(e){
      if(!dragging) return;
      dy = e.clientY - startY;
      if(dy > 0){
        sheet.style.transform = `translateY(${dy}px)`;
      }else{
        // small upward bounce: dampened
        sheet.style.transform = `translateY(${dy * 0.15}px)`;
      }
    }
    function onUp(){
      if(!dragging) return;
      dragging = false;
      grab.classList.remove('is-dragging');
      const elapsed = Date.now() - startTime;
      const velocity = dy / Math.max(elapsed, 1);
      // close if dragged past 100px or fast flick down
      if(dy > 100 || velocity > 0.7){
        // continue the gesture down to fully closed
        sheet.style.transition = 'transform .26s cubic-bezier(.32,.72,.24,1)';
        sheet.style.transform = 'translateY(100%)';
        setTimeout(() => {
          sheet.style.transform = '';
          sheet.style.transition = '';
          closeSheet(sheetId);
        }, 260);
      }else{
        // snap back
        sheet.style.transition = '';
        sheet.style.transform = '';
      }
      dy = 0;
    }

    grab.addEventListener('pointerdown', onDown);
    grab.addEventListener('pointermove', onMove);
    grab.addEventListener('pointerup', onUp);
    grab.addEventListener('pointercancel', onUp);
  }
  ['bookingSheet','meteoSheet'].forEach(attachDragClose);

  // ============ DETAIL SHEET ============
  function openDetail(id){
    const e = EXPERIENCES.find(x => x.id === id);
    if(!e) return;
    const liked = state.likes.has(id);
    const isLove = e.tab === 'love';

    $('#detailHeart').classList.toggle('is-liked', liked);
    $('#detailHeart').onclick = () => {
      const btn = $('#detailHeart');
      if(state.likes.has(id)){
        state.likes.delete(id);
        btn.classList.remove('is-liked');
      }else{
        state.likes.add(id);
        btn.classList.add('is-liked');
      }
      saveLikes();
      // also update card heart if visible
      const cardBtn = $(`[data-heart="${id}"]`);
      if(cardBtn){ cardBtn.classList.toggle('is-liked', state.likes.has(id)); }
    };

    $('#detailPrice').textContent = `da ${e.priceFrom}€`;
    $('#detailPriceUnit').textContent = e.priceUnit;
    $('#detailBook').onclick = () => {
      closeSheet('detailSheet');
      setTimeout(() => openBooking(id), 280);
    };

    const stars = (e.rating || 0).toFixed(2);

    $('#detailBody').innerHTML = `
      <div class="dt-hero" style="background-image:url('${e.imgs ? e.imgs[0] : e.img}')"></div>
      <div class="dt-body">
        <h1>${e.title}</h1>
        <p class="dt-meta">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="vertical-align:-2px"><path d="M12 2l2.9 6.9L22 10l-5.5 4.8L18.2 22 12 18.2 5.8 22l1.7-7.2L2 10l7.1-1.1z"/></svg>
          <b>${stars}</b> · ${e.reviews} recensioni · ${e.loc}
        </p>
        <p class="lead">${e.lead}</p>

        <div class="dt-tags">
          ${(e.tags || []).map(t => `<span class="dt-tag">${t}</span>`).join('')}
        </div>

        <div class="dt-includes">
          <h4>Cosa è incluso</h4>
          <ul>
            ${e.includes.map(i => `<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg><span>${i}</span></li>`).join('')}
          </ul>
        </div>

        <div class="dt-includes">
          <h4>Durata</h4>
          <p style="margin:0;font-size:14px">${e.duration}</p>
        </div>

        <div class="dt-includes">
          <h4>Politiche</h4>
          <ul>
            <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg><span>Paghi al check-in (carta · bancomat · contanti)</span></li>
            <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg><span>Cancellazione gratuita fino a 24 h prima</span></li>
            <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg><span>Riprogrammazione gratis se annulliamo per meteo</span></li>
          </ul>
        </div>
      </div>
    `;

    openSheet('detailSheet');
  }

  // ============ BOOKING SHEET ============
  function openBooking(expId){
    let e;
    if(expId){
      e = EXPERIENCES.find(x => x.id === expId);
    }else{
      // default: first experience of currently active tab
      e = EXPERIENCES.find(x => x.tab === state.activeTab) || EXPERIENCES[0];
    }
    state.booking.expId = e.id;
    state.bkStep = 1;
    $('#bkExpName').textContent = e.title.replace(/<[^>]+>/g, '');
    $('#bkThumb').style.backgroundImage = `url('${e.img}')`;

    // default date = today + 1
    const t = new Date();
    t.setDate(t.getDate() + 1);
    const iso = t.toISOString().slice(0,10);
    $('#bkDate').value = iso;
    $('#bkDate').min = new Date().toISOString().slice(0,10);

    // reset radios + extras
    $$('input[name="bkTime"]').forEach(r => { r.checked = false; });
    $$('.bk-extra input').forEach(c => { c.checked = false; });
    state.booking.extras = new Set();
    state.booking.time = '';

    // people
    state.booking.people = 2;
    $('#bkPeople').textContent = '2';

    updateBookingStep();
    updateBookingTotal();
    openSheet('bookingSheet');
  }

  function updateBookingStep(){
    const step = state.bkStep;
    $$('.bk-pane').forEach(p => p.classList.toggle('is-active', Number(p.dataset.bkPane) === step));
    $('#bkBack').hidden = step === 1;
    // Single primary button — relabels on the final step
    $('#bkNext').textContent = step === 3 ? 'Conferma prenotazione' : 'Avanti';
  }

  function getCurrentExp(){
    return EXPERIENCES.find(x => x.id === state.booking.expId) || EXPERIENCES[0];
  }
  function updateBookingTotal(){
    const e = getCurrentExp();
    const people = state.booking.people;
    let base = e.priceFrom;
    // a rough estimation logic — multiply by people for some types
    const perPersonIds = ['vallugola-gold'];
    const perCoupleIds = ['the-proposal','vallugola-diamond','secret-romance','midday-brunch'];
    let total;
    if(perPersonIds.includes(e.id)){
      total = base * people;
    }else if(perCoupleIds.includes(e.id)){
      total = base; // already coppia
    }else{
      total = base;
    }
    let extras = 0;
    state.booking.extras.forEach(ext => {
      const cb = document.querySelector(`.bk-extra input[data-extra="${ext}"]`);
      if(cb) extras += Number(cb.dataset.price || 0);
    });
    total += extras;
    $('#bkTotal').textContent = `${fmt(total)} €`;
    $('#bkTotalUnit').textContent = `stima · al check-in${extras ? ` · +${fmt(extras)} extra` : ''}`;
  }

  // step interactions
  $('#bkDate').addEventListener('change', e => { state.booking.date = e.target.value; });
  $$('input[name="bkTime"]').forEach(r => r.addEventListener('change', () => { state.booking.time = r.value; }));
  $$('.bk-stepper button').forEach(b => {
    b.addEventListener('click', () => {
      const dir = b.dataset.step === '+' ? 1 : -1;
      let next = state.booking.people + dir;
      next = Math.max(1, Math.min(3, next));
      state.booking.people = next;
      $('#bkPeople').textContent = String(next);
      updateBookingTotal();
    });
  });
  $$('.bk-extra input').forEach(c => {
    c.addEventListener('change', () => {
      if(c.checked) state.booking.extras.add(c.dataset.extra);
      else state.booking.extras.delete(c.dataset.extra);
      updateBookingTotal();
    });
  });
  $('#bkEditExp').addEventListener('click', () => {
    closeSheet('bookingSheet');
    setTimeout(() => {
      // open a quick chooser — for now, just toggle tab and close
      window.scrollTo({top: 0, behavior:'smooth'});
    }, 250);
  });

  $('#bkBack').addEventListener('click', () => {
    if(state.bkStep > 1){ state.bkStep--; updateBookingStep(); }
  });
  $('#bkNext').addEventListener('click', () => {
    if(state.bkStep < 3){
      state.bkStep++;
      updateBookingStep();
      return;
    }
    // Final step → submit
    state.booking.name = $('#bkName').value.trim();
    state.booking.phone = $('#bkPhone').value.trim();
    state.booking.email = $('#bkEmail').value.trim();
    state.booking.notes = $('#bkNotes').value.trim();

    if(!state.booking.name || !state.booking.phone){
      if(!state.booking.name) $('#bkName').focus();
      else if(!state.booking.phone) $('#bkPhone').focus();
      return;
    }

    const e = getCurrentExp();
    const lines = [
      `Ciao Jet Ski Adriatic! Vorrei prenotare:`,
      ``,
      `• Esperienza: ${e.title.replace(/<[^>]+>/g, '')}`,
      `• Data: ${state.booking.date || '—'}${state.booking.time ? ' · ' + state.booking.time : ''}`,
      `• Persone: ${state.booking.people}`,
    ];
    if(state.booking.extras.size){
      lines.push(`• Extra: ${[...state.booking.extras].join(', ')}`);
    }
    lines.push(`• Nome: ${state.booking.name}`);
    if(state.booking.email) lines.push(`• Email: ${state.booking.email}`);
    if(state.booking.notes) lines.push(``, `Note: ${state.booking.notes}`);
    const text = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/390000000000?text=${text}`, '_blank', 'noopener');
    closeSheet('bookingSheet');
  });


  // ============ TOPBAR DATA-NAV BUTTONS ============
  $$('[data-nav]').forEach(b => {
    b.addEventListener('click', () => {
      const which = b.dataset.nav;
      if(which === 'meteo'){ openMeteo(); }
    });
  });

  // ============ TABS ============
  $$('.tab').forEach(t => {
    t.addEventListener('click', () => setTab(t.dataset.tab));
  });

  // ============ METEO ============
  const WEATHER_ICONS = {
    sun:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.5 4.5l2 2M17.5 17.5l2 2M4.5 19.5l2-2M17.5 6.5l2-2"/></svg>',
    cloudy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M17.5 19a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.83 1.5A4 4 0 0 0 6 19h11.5z"/></svg>',
    rain:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M17.5 14a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.83 1.5A4 4 0 0 0 6 14"/><path d="M8 19l-1 2M12 19l-1 2M16 19l-1 2"/></svg>',
    storm:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M17.5 14a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.83 1.5A4 4 0 0 0 6 14"/><path d="M11 14l-2 4h3l-2 4"/></svg>'
  };

  function classifyWind(kmh){
    if(kmh < 18) return 'go';
    if(kmh < 30) return 'caution';
    return 'no';
  }
  function pickIcon(code){
    if(code == null) return WEATHER_ICONS.cloudy;
    if(code === 0) return WEATHER_ICONS.sun;
    if(code <= 3) return WEATHER_ICONS.cloudy;
    if(code >= 95) return WEATHER_ICONS.storm;
    if(code >= 51) return WEATHER_ICONS.rain;
    return WEATHER_ICONS.cloudy;
  }
  function dayShort(date){
    const d = new Date(date);
    return d.toLocaleDateString('it-IT', { weekday: 'short' });
  }
  function dayNum(date){
    const d = new Date(date);
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
  }
  function verdictFromCode(code, wind){
    const w = classifyWind(wind);
    const stormy = code >= 80;
    if(stormy) return 'no';
    if(w === 'no') return 'no';
    if(w === 'caution' || (code >= 51 && code < 80)) return 'caution';
    return 'go';
  }
  let meteoLoaded = false;
  async function loadMeteo(){
    if(meteoLoaded) return;
    try{
      const url = 'https://api.open-meteo.com/v1/forecast?latitude=43.96&longitude=12.74&current=temperature_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max&timezone=Europe%2FRome&forecast_days=7';
      const r = await fetch(url);
      const data = await r.json();

      // current
      if(data.current){
        $('#meteoNow').innerHTML = `
          <div class="meteo-now-ico">${pickIcon(data.current.weather_code)}</div>
          <div class="meteo-now-c">
            <div class="meteo-now-temp">${Math.round(data.current.temperature_2m)}°</div>
            <div class="meteo-now-meta">Cattolica · ora</div>
          </div>
          <div class="meteo-now-r">
            <small>Vento</small>
            <b>${Math.round(data.current.wind_speed_10m)}<span> km/h</span></b>
          </div>
        `;
      }

      // 7-day
      const grid = $('#meteoGrid');
      const dates = data.daily.time;
      const codes = data.daily.weather_code;
      const tmax = data.daily.temperature_2m_max;
      const tmin = data.daily.temperature_2m_min;
      const wmax = data.daily.wind_speed_10m_max;

      grid.innerHTML = dates.map((dt,i) => {
        const v = verdictFromCode(codes[i], wmax[i]);
        const vLabel = v === 'go' ? 'Esci sereno' : (v === 'caution' ? 'Verifichiamo' : 'Sconsigliato');
        return `
          <article class="md-day" data-v="${v}">
            <div class="md-dow">
              <b>${dayShort(dt).replace('.','')}</b>
              <small>${dayNum(dt)}</small>
            </div>
            <div class="md-icon">${pickIcon(codes[i])}</div>
            <div class="md-tx">
              <b>${Math.round(tmax[i])}° <span class="dim">/ ${Math.round(tmin[i])}°</span></b>
              <small>Vento ${Math.round(wmax[i])} km/h</small>
            </div>
            <span class="md-verdict" data-v="${v}" aria-label="${vLabel}"></span>
          </article>
        `;
      }).join('');
      meteoLoaded = true;
    }catch(err){
      $('#meteoGrid').innerHTML = '<p style="text-align:center;color:var(--ink-3);font-size:13px">Impossibile caricare il meteo. <a href="https://wa.me/390000000000" style="color:var(--cyan-2);text-decoration:underline">Scrivici su WhatsApp</a> per il punto del giorno.</p>';
    }
  }

  function openMeteo(){
    openSheet('meteoSheet');
    loadMeteo();
  }

  // ============ STATUS ============
  function tickStatus(){
    const now = new Date();
    const h = now.getHours();
    const open = h >= 9 && h < 20;
    const wa  = (h >= 7 && h < 9) || (h >= 20 && h < 22);
    const status = open ? 'open' : (wa ? 'whatsapp' : 'closed');
    const pill = $('#statusPill');
    pill.dataset.status = status;
    pill.querySelector('.status-label').textContent =
      status === 'open' ? 'Aperto' : (status === 'whatsapp' ? 'Solo WhatsApp' : 'Chiuso');
  }

  // ============ SCROLL ELEVATION ============
  const topbar = document.querySelector('.topbar');
  let scrollTicking = false;
  function onScroll(){
    if(!scrollTicking){
      requestAnimationFrame(() => {
        if(topbar){
          topbar.classList.toggle('is-scrolled', window.scrollY > 8);
        }
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  // ============ INIT ============
  function init(){
    document.body.dataset.activeTab = state.activeTab;
    renderCats();
    renderCards();
    tickStatus();
    setInterval(tickStatus, 60_000);
    onScroll();

    // pre-set deep link
    if(location.hash === '#love'){ setTab('love'); }
    if(location.hash === '#meteo'){ openMeteo(); }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  }else{
    init();
  }
})();
