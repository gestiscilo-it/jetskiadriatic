/* =====================================================
   JET SKI ADRIATIC — APP SHELL
   ===================================================== */

(function(){
  'use strict';

  // ============ DATA ============
  const EXPERIENCES = [
    // ============ NOLEGGIO ============
    {
      id: 'fast-fun',
      tab: 'noleggio',
      cat: 'veloci',
      title: 'Fast <em>& Fun</em>',
      loc: 'Cattolica · pontile',
      img: 'https://images.unsplash.com/photo-1641075298538-afccb186b6e1?q=85&w=1400&auto=format&fit=crop',
      imgs: [
        'https://images.unsplash.com/photo-1641075298538-afccb186b6e1?q=85&w=1400&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1564633351631-e85bd59a91af?q=85&w=1400&auto=format&fit=crop'
      ],
      badge: 'Entry · 15 min',
      meta: '15 min effettivi · senza patente',
      duration: '15 minuti effettivi · +10 min omaggio per il rientro',
      priceFrom: 50,
      priceUnit: 'a moto',
      rating: 4.92,
      reviews: 184,
      includes: [
        'Briefing di sicurezza · 10 minuti',
        'Giubbotto salvagente in tutte le taglie',
        '15 minuti di navigazione effettiva',
        '+10 minuti omaggio per il rientro'
      ],
      tags: ['15 min', 'entry', 'senza patente'],
      lead: 'Adrenalina pura, in 15 minuti effettivi. Il tempo parte fuori dal porto, +10 minuti regalati per il rientro.'
    },
    {
      id: 'sprint',
      tab: 'noleggio',
      cat: 'veloci',
      title: 'Sprint <em>30</em>',
      loc: 'Cattolica · pontile',
      img: 'https://images.unsplash.com/photo-1564633351631-e85bd59a91af?q=85&w=1400&auto=format&fit=crop',
      imgs: [
        'https://images.unsplash.com/photo-1564633351631-e85bd59a91af?q=85&w=1400&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1641075298538-afccb186b6e1?q=85&w=1400&auto=format&fit=crop'
      ],
      badge: '30 min',
      meta: '30 min · senza pensieri',
      duration: '30 minuti effettivi in mare',
      priceFrom: 85,
      priceUnit: 'a moto',
      rating: 4.93,
      reviews: 142,
      includes: [
        'Briefing di sicurezza · 10 minuti',
        '30 minuti effettivi di navigazione',
        'Sportender JST-30 · senza patente',
        'Giubbotto in tutte le taglie'
      ],
      tags: ['30 min', 'divertimento'],
      lead: 'La sessione ideale per chi vuole divertirsi senza pensieri. 30 minuti effettivi, dal pontile al largo.'
    },
    {
      id: 'classic',
      tab: 'noleggio',
      cat: 'veloci',
      title: 'Classic <em>45</em>',
      loc: 'Cattolica · pontile',
      img: 'https://images.unsplash.com/photo-1583008585590-c4ed0010bed6?q=85&w=1400&auto=format&fit=crop',
      imgs: [
        'https://images.unsplash.com/photo-1583008585590-c4ed0010bed6?q=85&w=1400&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1641075298538-afccb186b6e1?q=85&w=1400&auto=format&fit=crop'
      ],
      badge: 'Best seller',
      meta: '45 min · best seller',
      duration: '45 minuti effettivi · best seller',
      priceFrom: 105,
      priceUnit: 'a moto',
      rating: 4.95,
      reviews: 246,
      includes: [
        'Briefing di sicurezza · 10 minuti',
        '45 minuti effettivi in mare',
        'Tempo per arrivare al largo e tornare con calma',
        'Sportender JST-30 · senza patente'
      ],
      tags: ['45 min', 'best seller', 'rapporto qualità/prezzo'],
      lead: 'Il miglior rapporto qualità/prezzo. 45 minuti effettivi: il tempo giusto per arrivare al largo e tornare con calma.'
    },
    {
      id: 'sunset-hour',
      tab: 'noleggio',
      cat: 'premium',
      title: 'Sunset <em>Hour</em>',
      loc: 'Cattolica → Gabicce',
      img: 'https://images.unsplash.com/photo-1714526393543-6fb24e5a68b7?q=85&w=1400&auto=format&fit=crop',
      imgs: [
        'https://images.unsplash.com/photo-1714526393543-6fb24e5a68b7?q=85&w=1400&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1558961078-beebe6540096?q=85&w=1400&auto=format&fit=crop'
      ],
      badge: 'Premium · tramonto',
      meta: '1 ora · ideale al tramonto',
      duration: '60 minuti effettivi · ideale al tramonto',
      priceFrom: 145,
      priceUnit: 'a moto',
      rating: 4.96,
      reviews: 92,
      includes: [
        '60 minuti effettivi al largo',
        'Tour lungo costa Gabicce · San Bartolo',
        'Estensione +1 ora · 100€',
        'Briefing completo · radio a bordo'
      ],
      tags: ['1 ora', 'tramonto', 'premium'],
      lead: 'L\'esperienza premium. Un\'ora effettiva, perfetta al tramonto o per un tour lungo costa.'
    },
    {
      id: 'vallugola-gold',
      tab: 'noleggio',
      cat: 'tour',
      title: 'Vallugola <em>Gold</em>',
      loc: 'Cattolica → Vallugola',
      img: 'https://images.unsplash.com/photo-1596302653226-ba0fd4a518a7?q=85&w=1400&auto=format&fit=crop',
      imgs: [
        'https://images.unsplash.com/photo-1596302653226-ba0fd4a518a7?q=85&w=1400&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1583008585590-c4ed0010bed6?q=85&w=1400&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1714526393543-6fb24e5a68b7?q=85&w=1400&auto=format&fit=crop'
      ],
      badge: '4 ore · pranzo Falco',
      meta: '4 ore · min 2 persone',
      duration: '4 ore · attracco e pranzo',
      priceFrom: 289,
      priceUnit: 'a persona',
      rating: 4.95,
      reviews: 67,
      includes: [
        'Guida + barca appoggio fino a Vallugola',
        'Attracco nella caletta privata',
        'Sconto al Ristorante Falco',
        'Min. 2 persone'
      ],
      tags: ['4 ore', 'pranzo', 'caletta privata', 'min 2 pers'],
      lead: 'L\'escursione VIP. Cattolica → Vallugola con attracco e sconto al Ristorante Falco.'
    },

    // ============ EXPERIENCE ============
    {
      id: 'secret-romance',
      tab: 'experience',
      cat: 'coppia',
      title: 'Secret <em>Romance</em>',
      loc: 'Cattolica · al largo',
      img: 'https://images.unsplash.com/photo-1558961078-beebe6540096?q=85&w=1600&auto=format&fit=crop',
      imgs: [
        'https://images.unsplash.com/photo-1558961078-beebe6540096?q=85&w=1600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1519741497674-611481863552?q=85&w=1400&auto=format&fit=crop'
      ],
      badge: 'Coppia',
      meta: '1 ora · rose · champagne',
      duration: '60 minuti privati',
      priceFrom: 320,
      priceUnit: 'a coppia',
      rating: 4.96,
      reviews: 28,
      includes: [
        'Noleggio Sportender · 1 ora',
        'Mazzo di rose preparato in segreto nel gavone',
        'Bottiglia di Champagne (formato piccolo)',
        'Coordinamento staff per la sorpresa'
      ],
      tags: ['1 ora', 'rose', 'champagne', 'segreto'],
      lead: 'L\'inizio di un sogno. Un\'ora privata, rose preparate in segreto, Champagne fresco. Per sorprendere, non annunciare.'
    },
    {
      id: 'the-proposal',
      tab: 'experience',
      cat: 'coppia',
      title: 'The <em>Proposal</em>',
      loc: 'Cattolica · al largo',
      img: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=85&w=1600&auto=format&fit=crop',
      imgs: [
        'https://images.unsplash.com/photo-1519741497674-611481863552?q=85&w=1600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1617059063772-34532796cdb5?q=85&w=1400&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1558961078-beebe6540096?q=85&w=1400&auto=format&fit=crop'
      ],
      badge: 'Signature',
      meta: '1h30 · drone · paparazzo',
      duration: '90 minuti orchestrati',
      priceFrom: 490,
      priceUnit: 'a coppia',
      rating: 5.0,
      reviews: 7,
      includes: [
        'Noleggio · 1.5 ore',
        'Rose rosse a gambo lungo',
        'Champagne 750ml',
        'Drone VIP Movie',
        'Foto Paparazzo dallo staff',
        'Certificato d\'Amore su pergamena · coordinate GPS del sì'
      ],
      tags: ['1h30', 'drone', 'paparazzo', 'pergamena GPS'],
      lead: 'Il pacchetto definitivo per chiedere la mano in mezzo al mare. Rose, Champagne, drone, paparazzo. E un certificato con le coordinate del sì.'
    },
    {
      id: 'sinfonia-amore',
      tab: 'experience',
      cat: 'coppia',
      title: 'Sinfonia <em>d\'Amore</em>',
      loc: 'Cattolica · al largo · su prenotazione',
      img: 'https://images.unsplash.com/photo-1617059063772-34532796cdb5?q=85&w=1600&auto=format&fit=crop',
      imgs: [
        'https://images.unsplash.com/photo-1617059063772-34532796cdb5?q=85&w=1600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1519741497674-611481863552?q=85&w=1400&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1558961078-beebe6540096?q=85&w=1400&auto=format&fit=crop'
      ],
      badge: 'Elite · novità',
      meta: '1h30–2h · regia cinematografica',
      duration: '90–120 minuti su prenotazione',
      priceFrom: 890,
      priceUnit: 'a coppia',
      rating: 5.0,
      reviews: 0,
      includes: [
        'Noleggio · 1.5–2 ore',
        'Seconda moto d\'acqua per consegna scenografica delle rose',
        'Musicista dal vivo · chitarrista o violinista',
        'Champagne 750ml',
        'Certificato d\'Amore su pergamena',
        'Foto Paparazzo dallo staff',
        'Drone VIP Movie disponibile come extra'
      ],
      tags: ['elite', '1h30–2h', 'musicista', 'regia', 'novità'],
      lead: 'Il lusso assoluto, con regia cinematografica. Seconda moto che consegna le rose tra le onde, musicista dal vivo per una serenata privata.'
    },
    {
      id: 'vallugola-diamond',
      tab: 'experience',
      cat: 'coppia',
      title: 'Vallugola <em>Diamond</em>',
      loc: 'Cattolica → Vallugola',
      img: 'https://images.unsplash.com/photo-1583008585590-c4ed0010bed6?q=85&w=1600&auto=format&fit=crop',
      imgs: [
        'https://images.unsplash.com/photo-1583008585590-c4ed0010bed6?q=85&w=1600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1714526393543-6fb24e5a68b7?q=85&w=1400&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1596302653226-ba0fd4a518a7?q=85&w=1400&auto=format&fit=crop'
      ],
      badge: 'All inclusive',
      meta: '4 ore · drone · champagne',
      duration: '4 ore verso Vallugola',
      priceFrom: 850,
      priceUnit: 'a coppia',
      rating: 4.98,
      reviews: 14,
      includes: [
        '4 ore di navigazione verso Vallugola',
        'Fiori a bordo',
        'Drone Movie',
        'Aperitivo a bordo · 2 bottiglie di Champagne'
      ],
      tags: ['4 ore', 'fiori', 'champagne', 'drone'],
      lead: 'L\'esperienza di navigazione più completa verso Vallugola. Fiori a bordo, drone Movie, aperitivo con due bottiglie di Champagne.'
    },
    {
      id: 'midday-brunch',
      tab: 'experience',
      cat: 'brunch',
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
        'Noleggio · 1 ora',
        'Luxury Brunch Box',
        'Drink',
        'Set-up del tavolo a bordo'
      ],
      tags: ['1 ora', 'brunch', 'drink', 'coppia'],
      lead: 'Pausa di stile a metà giornata. Brunch box di lusso, drink, tavolo apparecchiato. Il mare come sala da pranzo privata.'
    },
    {
      id: 'kids-academy',
      tab: 'noleggio',
      cat: 'famiglia',
      title: 'Kids <em>Academy</em>',
      loc: 'Cattolica · area protetta',
      img: 'https://images.unsplash.com/photo-1564633351631-e85bd59a91af?q=85&w=1400&auto=format&fit=crop',
      imgs: [
        'https://images.unsplash.com/photo-1564633351631-e85bd59a91af?q=85&w=1400&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1641075298538-afccb186b6e1?q=85&w=1400&auto=format&fit=crop'
      ],
      badge: 'Battesimo del mare',
      meta: '15–20 min · genitore + bambino',
      duration: '15–20 minuti in area controllata',
      priceFrom: 75,
      priceUnit: 'esperienza family',
      rating: 4.97,
      reviews: 41,
      includes: [
        'Noleggio breve · 15–20 minuti',
        'Genitore guida · bambino partecipa attivamente',
        'Foto ricordo',
        'Diploma cartaceo "Piccolo Pilota"'
      ],
      tags: ['15–20 min', 'bambini', 'diploma', 'family'],
      lead: 'Il battesimo del mare. Genitore guida, bambino partecipa attivamente. A fine uscita, diploma di Piccolo Pilota.'
    },
    {
      id: 'blind-date',
      tab: 'experience',
      cat: 'social',
      title: 'Blind <em>Date</em>',
      loc: 'Cattolica · su iscrizione social',
      img: 'https://images.unsplash.com/photo-1641075298538-afccb186b6e1?q=85&w=1400&auto=format&fit=crop',
      imgs: [
        'https://images.unsplash.com/photo-1641075298538-afccb186b6e1?q=85&w=1400&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1564633351631-e85bd59a91af?q=85&w=1400&auto=format&fit=crop'
      ],
      badge: 'Single · social',
      meta: '30 min · 2 persone',
      duration: '30 minuti · uno guida, l\'altro dietro',
      priceFrom: 45,
      priceUnit: 'a persona',
      rating: 4.88,
      reviews: 9,
      includes: [
        'Target single · iscrizione social',
        '30 minuti di navigazione',
        'Uno guida, l\'altro sta dietro',
        'La complicità messa alla prova'
      ],
      tags: ['30 min', 'single', 'social'],
      lead: 'Appuntamento al buio in mare. 30 minuti dove uno guida e l\'altro sta dietro: la complicità messa alla prova.'
    }
  ];

  // Sample jet ski clips from Pixabay's public CDN, assigned cyclically
  // as placeholder media. Replace with real footage when available.
  const SAMPLE_VIDEOS = [
    'https://cdn.pixabay.com/video/2021/11/30/99435-653480287_tiny.mp4',
    'https://cdn.pixabay.com/video/2019/09/21/27125-362142178_tiny.mp4',
    'https://cdn.pixabay.com/video/2024/07/01/219047_tiny.mp4',
    'https://cdn.pixabay.com/video/2020/07/07/44132-438259003_tiny.mp4',
    'https://cdn.pixabay.com/video/2021/03/15/68033-524689133_tiny.mp4',
    'https://cdn.pixabay.com/video/2020/09/25/50855-462059727_tiny.mp4'
  ];
  EXPERIENCES.forEach((e, i) => {
    if(!e.video) e.video = SAMPLE_VIDEOS[i % SAMPLE_VIDEOS.length];
  });

  const CATS = {
    noleggio: [
      { id: 'veloci',   label: 'Veloci',   icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h7l-1 8 10-12h-7z"/></svg>' },
      { id: 'premium',  label: 'Premium',  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v3M12 20v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M1 12h3M20 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>' },
      { id: 'tour',     label: 'Tour',     icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>' },
      { id: 'famiglia', label: 'Under 12', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="9" cy="7" r="3"/><circle cx="17" cy="7" r="2"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 14h2a3 3 0 0 1 3 3v2"/></svg>' }
    ],
    experience: [
      { id: 'coppia',   label: 'Coppia',   icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-4.5-7-10a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.5-7 10-7 10s-2 0-4 0z"/></svg>' },
      { id: 'brunch',   label: 'Brunch',   icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M3 11h18a8 8 0 0 1-9 8 8 8 0 0 1-9-8z"/><path d="M7 8c0-2 1-3 2-3M11 8c0-2 1-3 2-3M15 8c0-2 1-3 2-3"/></svg>' },
      { id: 'social',   label: 'Social',   icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M14 18a4 4 0 0 1 7 0"/></svg>' }
    ]
  };

  // ============ STATE ============
  const state = {
    activeTab: 'noleggio',
    activeCat: 'veloci',
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
    cardCarousels: {}, // id -> currentIndex
    returnToDetail: null // when set, closing meteo reopens this detail id
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
      const isLove = e.tab === 'experience';
      // Build the media list: video first (if any), then images.
      const media = [];
      if (e.video) media.push({ type: 'video', src: e.video });
      if (e.imgs && e.imgs.length) e.imgs.forEach(s => media.push({ type: 'image', src: s }));
      else if (e.img) media.push({ type: 'image', src: e.img });
      const idx = Math.min(state.cardCarousels[e.id] || 0, media.length - 1);
      const dotsCount = media.length;

      const mediaHtml = media.map((m, i) => {
        const active = i === idx ? ' is-active' : '';
        if (m.type === 'video') {
          return `<video class="card-media card-video${active}" data-media-idx="${i}" src="${m.src}" muted loop playsinline preload="${i === 0 ? 'metadata' : 'none'}" autoplay></video>`;
        }
        return `<div class="card-media card-img-slide${active}" data-media-idx="${i}" style="background-image:url('${m.src}')"></div>`;
      }).join('');

      const stars = (e.rating || 0).toFixed(2);
      return `
        <article class="card ${isLove ? 'card--love' : ''}" data-card="${e.id}">
          <div class="card-img" data-card-img="${e.id}">
            ${mediaHtml}
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

    // Carousel swipe on the image — short swipe changes media, long swipe
    // hands off to a manual scroll of the .cards row. CSS sets pan-y on
    // .card-img so the browser doesn't fight the gesture.
    const MEDIA_SWIPE_MAX = 120;   // dx <= this = media change
    const MEDIA_SWIPE_MIN = 30;    // dx < this = ignore (likely a tap)
    grid.querySelectorAll('[data-card-img]').forEach(img => {
      let startX = null, startY = null, isHorizontal = null;
      img.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isHorizontal = null;
      }, {passive: true});
      img.addEventListener('touchmove', (e) => {
        if(startX === null) return;
        const dx = e.touches[0].clientX - startX;
        const dy = e.touches[0].clientY - startY;
        if(isHorizontal === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)){
          isHorizontal = Math.abs(dx) > Math.abs(dy);
        }
      }, {passive: true});
      img.addEventListener('touchend', (e) => {
        if(startX === null || isHorizontal !== true){ startX = null; return; }
        const dx = e.changedTouches[0].clientX - startX;
        startX = null;
        if(Math.abs(dx) < MEDIA_SWIPE_MIN) return;

        const id = img.dataset.cardImg;
        const exp = EXPERIENCES.find(x => x.id === id);
        if(!exp) return;
        const total = (exp.video ? 1 : 0) + (exp.imgs ? exp.imgs.length : (exp.img ? 1 : 0));

        if(Math.abs(dx) <= MEDIA_SWIPE_MAX && total >= 2){
          // short swipe → cycle card media
          const cur = state.cardCarousels[id] || 0;
          const dir = dx < 0 ? 1 : -1;
          const next = (cur + dir + total) % total;
          state.cardCarousels[id] = next;
          img.querySelectorAll('[data-media-idx]').forEach(el => {
            const i = parseInt(el.dataset.mediaIdx, 10);
            const wasActive = el.classList.contains('is-active');
            const nowActive = i === next;
            el.classList.toggle('is-active', nowActive);
            if(el.tagName === 'VIDEO'){
              if(nowActive){ el.play().catch(() => {}); }
              else if(wasActive){ el.pause(); }
            }
          });
          const dotsEl = img.querySelector('[data-dots]');
          if(dotsEl){
            dotsEl.querySelectorAll('i').forEach((d,i) => d.classList.toggle('is-on', i === next));
          }
        } else {
          // long swipe → forward to the row's horizontal scroll
          const row = img.closest('.cards');
          if(row){
            row.scrollBy({ left: -dx, behavior: 'smooth' });
          }
        }
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
    const t = tab === 'experience' ? {
      title: 'Quando un\'ora diventa un momento.',
      sub:   'Esperienze signature. Coppia, brunch, famiglia, community.'
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
    const closingId = sh.id;
    sh.classList.remove('is-open');
    sh.setAttribute('aria-hidden','true');
    openSheets = openSheets.filter(s => s !== closingId);

    // If meteo was opened from a product sheet, return to that product on close
    if(closingId === 'meteoSheet' && state.returnToDetail){
      const returnId = state.returnToDetail;
      state.returnToDetail = null;
      // wait for the close transition to finish, then reopen the detail
      setTimeout(() => openDetail(returnId), 280);
      return; // keep backdrop and body lock; openDetail will manage them
    }

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
  ['bookingSheet','meteoSheet','detailSheet'].forEach(attachDragClose);

  // ============ DETAIL SHEET ============
  function openDetail(id){
    const e = EXPERIENCES.find(x => x.id === id);
    if(!e) return;
    const liked = state.likes.has(id);
    const isLove = e.tab === 'experience';

    $('#detailPrice').textContent = `da ${e.priceFrom}€`;
    $('#detailPriceUnit').textContent = e.priceUnit;
    $('#detailBook').onclick = () => {
      closeSheet('detailSheet');
      setTimeout(() => openBooking(id), 280);
    };

    const stars = (e.rating || 0).toFixed(2);

    $('#detailBody').innerHTML = `
      <div class="dt-hero" style="background-image:url('${e.imgs ? e.imgs[0] : e.img}')">
        ${e.video ? `<video class="dt-hero-video" src="${e.video}" muted loop playsinline preload="metadata" autoplay></video>` : ''}
        <div class="dt-hero-actions">
          <button type="button" class="dt-floating-btn" aria-label="Condividi" id="detailShare">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v14"/></svg>
          </button>
          <button type="button" class="dt-floating-btn${liked ? ' is-liked' : ''}" aria-label="Salva" id="detailHeart">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
        </div>
      </div>
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

        <div class="dt-includes dt-meteo">
          <h4>Mare e meteo</h4>
          <p class="dt-meteo-note">L'uscita dipende dalle condizioni del mare. Riprogrammiamo gratis se non si esce.</p>
          <button type="button" class="dt-meteo-strip" id="dtMeteoStrip" data-open-meteo aria-label="Apri il meteo a 7 giorni"></button>
          <a class="dt-link" data-open-meteo href="#meteo">Vedi previsioni complete →</a>
        </div>
      </div>
    `;

    // open meteo from the disclaimer block (strip + link) — close detail, then open meteo
    // store the product id so closing meteo reopens this detail
    $$('#detailBody [data-open-meteo]').forEach(el => {
      el.onclick = (ev) => {
        ev.preventDefault();
        state.returnToDetail = id;
        closeSheet('detailSheet');
        setTimeout(() => openMeteo(), 280);
      };
    });

    // populate the compact meteo strip (uses cached data if available)
    loadCompactMeteo($('#dtMeteoStrip'));

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
      const cardBtn = $(`[data-heart="${id}"]`);
      if(cardBtn){ cardBtn.classList.toggle('is-liked', state.likes.has(id)); }
    };

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
    const perPersonIds = ['vallugola-gold','blind-date'];
    const perCoupleIds = ['the-proposal','vallugola-diamond','secret-romance','midday-brunch','sinfonia-amore'];
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
  function meteoNowSkeleton(){
    return `
      <div class="meteo-now-ico"><span class="skel-dot"></span></div>
      <div class="meteo-now-c">
        <div class="meteo-now-temp"><span class="skel-bar skel-bar--temp"></span></div>
        <div class="meteo-now-meta"><span class="skel-bar skel-bar--meta"></span></div>
      </div>
      <div class="meteo-now-r">
        <small><span class="skel-bar skel-bar--xs"></span></small>
        <b><span class="skel-bar skel-bar--sm"></span></b>
      </div>
    `;
  }
  function meteoGridSkeleton(){
    return Array.from({length: 7}, () =>
      '<article class="md-day skel" aria-hidden="true"></article>'
    ).join('');
  }
  function showMeteoLoading(){
    const now  = $('#meteoNow');
    const grid = $('#meteoGrid');
    if(now){
      now.classList.add('is-loading');
      now.setAttribute('aria-busy', 'true');
      now.innerHTML = meteoNowSkeleton();
    }
    if(grid){
      grid.setAttribute('aria-busy', 'true');
      grid.innerHTML = meteoGridSkeleton();
    }
  }

  function vLabel(v){
    return v === 'go' ? 'Esci sereno' : (v === 'caution' ? 'Verifichiamo' : 'Sconsigliato');
  }

  // Render targets — populate from a fetched data object
  function renderMeteoNow(data){
    const now = $('#meteoNow');
    if(!now || !data.current) return;
    now.innerHTML = `
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
    now.classList.remove('is-loading');
    now.removeAttribute('aria-busy');
  }
  function renderMeteoGrid(data){
    const grid = $('#meteoGrid');
    if(!grid) return;
    const dates = data.daily.time;
    const codes = data.daily.weather_code;
    const tmax = data.daily.temperature_2m_max;
    const tmin = data.daily.temperature_2m_min;
    const wmax = data.daily.wind_speed_10m_max;
    grid.innerHTML = dates.map((dt,i) => {
      const v = verdictFromCode(codes[i], wmax[i]);
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
          <span class="md-verdict" data-v="${v}" aria-label="${vLabel(v)}"></span>
        </article>
      `;
    }).join('');
    grid.removeAttribute('aria-busy');
  }
  function renderCompactMeteo(container, data){
    if(!container || !data || !data.daily) return;
    const dates = data.daily.time;
    const codes = data.daily.weather_code;
    const tmax = data.daily.temperature_2m_max;
    const wmax = data.daily.wind_speed_10m_max;
    container.innerHTML = dates.map((dt,i) => {
      const v = verdictFromCode(codes[i], wmax[i]);
      const day = new Date(dt).toLocaleDateString('it-IT', { weekday: 'short' })
        .replace('.','').slice(0,3);
      return `
        <article class="dt-md" data-v="${v}" aria-label="${day} · ${vLabel(v)}">
          <small>${day}</small>
          <span class="dt-md-ico">${pickIcon(codes[i])}</span>
          <b>${Math.round(tmax[i])}°</b>
          <span class="dt-md-verdict" aria-hidden="true"></span>
        </article>
      `;
    }).join('');
    container.removeAttribute('aria-busy');
  }
  function compactMeteoSkeleton(){
    return Array.from({length: 7}, () =>
      '<article class="dt-md skel" aria-hidden="true"></article>'
    ).join('');
  }

  // Single source of truth — fetch once, cache for the session
  let meteoData = null;
  let meteoFetchPromise = null;
  async function ensureMeteoData(){
    if(meteoData) return meteoData;
    if(meteoFetchPromise) return meteoFetchPromise;
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=43.96&longitude=12.74&current=temperature_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max&timezone=Europe%2FRome&forecast_days=7';
    meteoFetchPromise = (async () => {
      const r = await fetch(url);
      if(!r.ok) throw new Error('http ' + r.status);
      meteoData = await r.json();
      return meteoData;
    })();
    try {
      return await meteoFetchPromise;
    } finally {
      meteoFetchPromise = null;
    }
  }

  async function loadMeteo(){
    // If cached, paint immediately. Otherwise show skeleton and fetch.
    if(meteoData){
      renderMeteoNow(meteoData);
      renderMeteoGrid(meteoData);
      return;
    }
    showMeteoLoading();
    try{
      const data = await ensureMeteoData();
      renderMeteoNow(data);
      renderMeteoGrid(data);
    }catch(err){
      const now  = $('#meteoNow');
      const grid = $('#meteoGrid');
      if(now){ now.classList.remove('is-loading'); now.removeAttribute('aria-busy'); }
      if(grid){
        grid.removeAttribute('aria-busy');
        grid.innerHTML = '<p style="text-align:center;color:var(--ink-3);font-size:13px">Impossibile caricare il meteo. <a href="https://wa.me/390000000000" style="color:var(--cyan-2);text-decoration:underline">Scrivici su WhatsApp</a> per il punto del giorno.</p>';
      }
    }
  }

  async function loadCompactMeteo(container){
    if(!container) return;
    if(meteoData){
      renderCompactMeteo(container, meteoData);
      return;
    }
    container.setAttribute('aria-busy', 'true');
    container.innerHTML = compactMeteoSkeleton();
    try{
      const data = await ensureMeteoData();
      // Container may have been replaced if the user closed/reopened the sheet
      const live = $('#dtMeteoStrip');
      if(live) renderCompactMeteo(live, data);
    }catch(err){
      container.removeAttribute('aria-busy');
      container.innerHTML = '<p class="dt-md-fail">Meteo non disponibile in questo momento.</p>';
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
    if(!pill) return;
    pill.dataset.status = status;
    const label = pill.querySelector('.status-label');
    if(label){
      label.textContent =
        status === 'open' ? 'Aperto' : (status === 'whatsapp' ? 'Solo WhatsApp' : 'Chiuso');
    }
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

  // ============ INFO STRIP MARQUEE (mobile) ============
  function setupInfoStripMarquee(){
    if(window.innerWidth > 720) return;
    const wrap = document.querySelector('.info-strip-inner');
    if(!wrap || wrap.querySelector('.info-strip-marquee-inner')) return;

    const track = document.createElement('div');
    track.className = 'info-strip-track';

    // Move all existing children into the track, with · separators between them
    [...wrap.children].forEach((el, i) => {
      if(i > 0){
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

    // tell CSS to switch the wrap into marquee layout
    wrap.classList.add('has-marquee');
  }

  // ============ HIDE TOPBAR + CAT-BAR WHEN PAST PRODUCTS ============
  // The chrome (top tabs + bottom filter bar) is product-context UI.
  // Hide it only when the products feed is out of view — relying on
  // contact/footer intersection breaks when the feed is short enough
  // that products and contact can be on screen simultaneously.
  function setupChromeHideOnFooter(){
    if(!('IntersectionObserver' in window)) return;
    const feed = document.getElementById('feed');
    if(!feed) return;
    const obs = new IntersectionObserver((entries) => {
      const e = entries[0];
      document.body.classList.toggle('is-past-products', !e.isIntersecting);
    }, { rootMargin: '-240px 0px 0px 0px', threshold: 0 });
    obs.observe(feed);
  }

  // ============ FOOTER CATEGORY LINKS — switch tab/cat in-app ============
  function wireFooterCatLinks(){
    $$('.foot-col a[data-tab]').forEach(a => {
      a.addEventListener('click', (ev) => {
        const tab = a.dataset.tab;
        const cat = a.dataset.cat;
        if(!tab) return;
        ev.preventDefault();
        if(tab !== state.activeTab) setTab(tab);
        if(cat){
          state.activeCat = cat;
          renderCats();
          renderCards();
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  // ============ INIT ============
  function init(){
    document.body.dataset.activeTab = state.activeTab;
    renderCats();
    renderCards();
    tickStatus();
    setInterval(tickStatus, 60_000);
    onScroll();
    setupInfoStripMarquee();
    setupChromeHideOnFooter();
    wireFooterCatLinks();

    // pre-set deep link
    if(location.hash === '#experience' || location.hash === '#love'){ setTab('experience'); }
    if(location.hash === '#meteo'){ openMeteo(); }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  }else{
    init();
  }
})();
