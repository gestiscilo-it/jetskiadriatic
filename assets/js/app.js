/* =====================================================
   JET SKI ADRIATIC — APP SHELL
   ===================================================== */

// Pure-function namespace — exposed for tests in /tests/tests.js
// and for any future inline scripts that need pricing or validation logic.
window.JSA = window.JSA || {};

window.JSA.computeTotal = function(product, selections, people){
  if(!product) return 0;
  const sel = selections || {};
  const pp  = Math.max(1, people || 1);
  const groups = product.variantGroups || [];

  // Find the active "replace" variant if any. Only the first one wins
  // (only one group ever uses replace per product — durata, by convention).
  let base = product.basePrice || 0;
  for(const g of groups){
    if(g.selection !== 'single') continue;
    const optId = sel[g.id];
    if(!optId) continue;
    const opt = (g.options || []).find(o => o.id === optId);
    if(opt && opt.priceMode === 'replace'){ base = opt.price || 0; break; }
  }

  let total = product.perPerson ? base * pp : base;

  // Sum all "add" options across groups (single + multi, with Set support).
  for(const g of groups){
    const raw = sel[g.id];
    if(raw == null) continue;
    const ids = (raw instanceof Set) ? [...raw] : (Array.isArray(raw) ? raw : [raw]);
    for(const id of ids){
      const opt = (g.options || []).find(o => o.id === id);
      if(opt && opt.priceMode === 'add') total += (opt.price || 0);
    }
  }

  return total;
};

window.JSA.validateRequiredVariants = function(product, selections){
  const sel = selections || {};
  const missing = [];
  for(const g of (product.variantGroups || [])){
    if(!g.required) continue;
    const raw = sel[g.id];
    if(raw == null){ missing.push(g.id); continue; }
    if(raw instanceof Set){ if(raw.size === 0) missing.push(g.id); continue; }
    if(Array.isArray(raw)){ if(raw.length === 0) missing.push(g.id); continue; }
    if(raw === '') missing.push(g.id);
  }
  return missing;
};

window.JSA.resolveAlias = function(catalog, id){
  if(!Array.isArray(catalog)) return null;
  const entry = catalog.find(p => p.id === id);
  if(!entry) return null;
  if(!entry.aliasOf){
    return { product: entry, preselect: {}, aliasId: null };
  }
  const canonical = catalog.find(p => p.id === entry.aliasOf);
  if(!canonical) return null;
  return { product: canonical, preselect: { ...(entry.preselect || {}) }, aliasId: entry.id };
};

// Apply cross-group `clears` rule: if the just-changed group declares
// `clears: ['otherId']`, wipe selections of those other groups.
// Returns a new selections object (input is not mutated).
window.JSA.applyClears = function(product, selections, changedGroupId){
  const out = {};
  for(const k of Object.keys(selections || {})){
    const v = selections[k];
    out[k] = (v instanceof Set) ? new Set(v) : (Array.isArray(v) ? [...v] : v);
  }
  const group = (product.variantGroups || []).find(g => g.id === changedGroupId);
  if(!group || !group.clears) return out;
  for(const targetId of group.clears){
    const target = (product.variantGroups || []).find(g => g.id === targetId);
    if(!target) continue;
    if(target.selection === 'multi') out[targetId] = new Set();
    else delete out[targetId];
  }
  return out;
};

window.JSA.parseDeepLink = function(hashStr){
  const h = (hashStr || '').replace(/^#/, '');
  if(!h) return null;
  const parts = h.split('&').map(s => s.split('=')).filter(p => p.length === 2);
  const map = Object.fromEntries(parts.map(([k,v]) => [decodeURIComponent(k), decodeURIComponent(v)]));
  if(!map.p) return null;
  const preselect = {};
  for(const k of Object.keys(map)){
    if(k === 'p') continue;
    preselect[k] = map[k].includes(',') ? new Set(map[k].split(',')) : map[k];
  }
  return { id: map.p, preselect };
};

(function(){
  'use strict';

  // ============ DATA ============
  const EXPERIENCES = [
    // ============ NOLEGGIO — canonical ride product ============
    {
      id: 'noleggio-sportender',
      tab: 'noleggio',
      cat: 'veloci',
      title: 'Noleggio <em>Sportender</em>',
      loc: 'Cattolica · pontile',
      img: 'https://images.unsplash.com/photo-1583008585590-c4ed0010bed6?q=85&w=1400&auto=format&fit=crop',
      imgs: [
        'https://images.unsplash.com/photo-1583008585590-c4ed0010bed6?q=85&w=1400&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1641075298538-afccb186b6e1?q=85&w=1400&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1564633351631-e85bd59a91af?q=85&w=1400&auto=format&fit=crop'
      ],
      badge: 'Best seller',
      meta: '15/30/45/60 min',
      duration: 'Tu scegli la durata · da 15 minuti a 2 ore',
      basePrice: 50,
      priceUnit: 'a moto',
      perPerson: false,
      minPeople: 1,
      maxPeople: 3,
      rating: 4.94,
      reviews: 572,
      includes: [
        'Briefing di sicurezza · 10 minuti',
        'Sportender JST-30 · senza patente',
        'Giubbotto in tutte le taglie',
        'Tempo effettivo in mare (timer parte fuori dal porto)'
      ],
      tags: ['senza patente', 'sportender JST-30', 'best seller'],
      lead: 'Sali a bordo, dieci minuti di briefing con l\'istruttore, poi il motore risponde solo a te — il timer parte quando sei fuori dai pali del porto.',
      variantGroups: [
        {
          id: 'durata', label: 'Durata', selection: 'single', required: true,
          options: [
            { id: '15',  label: '15 min',     priceMode: 'replace', price: 50 },
            { id: '30',  label: '30 min',     priceMode: 'replace', price: 85 },
            { id: '45',  label: '45 min',     priceMode: 'replace', price: 105, default: true, sublabel: 'best seller' },
            { id: '60',  label: '1 ora',      priceMode: 'replace', price: 145, sublabel: 'tramonto' },
            { id: '120', label: '2 ore',      priceMode: 'replace', price: 245, sublabel: '1h + Extra Hour' }
          ]
        },
        {
          id: 'media', label: 'Media a bordo', selection: 'multi', required: false,
          options: [
            { id: 'gopro', label: 'GoPro POV',         priceMode: 'add', price: 15, sublabel: '4K · file via AirDrop' },
            { id: 'photo', label: 'Photo Kit Staff',   priceMode: 'add', price: 50, sublabel: 'scatti dallo staff' },
            { id: 'drone', label: 'Drone VIP Movie',   priceMode: 'add', price: 99, sublabel: 'reel 4K · IG/TikTok ready' }
          ]
        },
        {
          id: 'bundle', label: 'Bundle media', selection: 'single', required: false, clears: ['media'],
          options: [
            { id: 'social-star', label: 'Social Star', priceMode: 'add', price: 100, sublabel: 'Drone + GoPro · risparmi 14€' }
          ]
        },
        {
          id: 'accessori', label: 'Accessori', selection: 'multi', required: false,
          options: [
            { id: 'kasko',   label: 'Kasko Light',     priceMode: 'add', price: 10, sublabel: 'graffi/scocca coperti' },
            { id: 'refresh', label: 'VIP Refresh Kit', priceMode: 'add', price: 15, sublabel: 'sacca stagna + acqua + crema' },
            { id: 'glasses', label: 'Occhiali Floating', priceMode: 'add', price: 20, sublabel: 'polarizzati Wave Bros' }
          ]
        },
        {
          id: 'relax-bundle', label: 'Bundle accessori', selection: 'single', required: false, clears: ['accessori'],
          options: [
            { id: 'total-relax', label: 'Total Relax', priceMode: 'add', price: 20, sublabel: 'Kasko + Refresh' }
          ]
        }
      ]
    },

    // ============ NOLEGGIO — marketing aliases (point to canonical) ============
    { id: 'fast-fun',   tab: 'noleggio', cat: 'veloci', aliasOf: 'noleggio-sportender', preselect: { durata: '15' },
      title: 'Fast <em>& Fun</em>', loc: 'Cattolica · pontile',
      img: 'https://images.unsplash.com/photo-1641075298538-afccb186b6e1?q=85&w=1400&auto=format&fit=crop',
      badge: '15 min', meta: '15 min', priceFromOverride: 50,
      tags: ['15 min', 'entry', 'senza patente'],
      lead: 'Quindici minuti effettivi al largo: il timer parte fuori dal porto, non dal momento in cui sali sul mezzo, con dieci minuti extra inclusi per rientrare con calma.' },

    { id: 'sprint',     tab: 'noleggio', cat: 'veloci', aliasOf: 'noleggio-sportender', preselect: { durata: '30' },
      title: 'Sprint <em>30</em>', loc: 'Cattolica · pontile',
      img: 'https://images.unsplash.com/photo-1564633351631-e85bd59a91af?q=85&w=1400&auto=format&fit=crop',
      badge: '30 min', meta: '30 min', priceFromOverride: 85,
      tags: ['30 min', 'divertimento'],
      lead: 'Trenta minuti effettivi per capire cosa fa questo mezzo quando spingi davvero — abbastanza per uscire al largo, fare il giro e tornare con qualcosa da raccontare.' },

    { id: 'classic',    tab: 'noleggio', cat: 'veloci', aliasOf: 'noleggio-sportender', preselect: { durata: '45' },
      title: 'Classic <em>45</em>', loc: 'Cattolica · pontile',
      img: 'https://images.unsplash.com/photo-1583008585590-c4ed0010bed6?q=85&w=1400&auto=format&fit=crop',
      badge: '45 min · best seller', meta: '45 min', priceFromOverride: 105,
      tags: ['45 min', 'best seller'],
      lead: 'Quarantacinque minuti effettivi: abbastanza per spingere al largo, fare il giro costiero e rientrare con calma. Il formato più richiesto, con il timer che parte fuori dai pali del porto.' },

    { id: 'sunset-hour',tab: 'noleggio', cat: 'tour',   aliasOf: 'noleggio-sportender', preselect: { durata: '60' },
      title: 'Sunset <em>Hour</em>', loc: 'Cattolica → Gabicce',
      img: 'https://images.unsplash.com/photo-1714526393543-6fb24e5a68b7?q=85&w=1400&auto=format&fit=crop',
      badge: '1 ora', meta: '1 ora', priceFromOverride: 145,
      tags: ['1 ora', 'tramonto', 'premium'],
      lead: 'Un\'ora effettiva verso Gabicce o lungo costa al tramonto — il momento in cui la luce cambia e l\'Adriatico smette di sembrare piatto. Il timer parte fuori dal porto.' },

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
      badge: '4 ore',
      meta: '4 ore',
      duration: '4 ore · attracco e pranzo',
      basePrice: 289,
      priceUnit: 'a persona',
      perPerson: true, minPeople: 2, maxPeople: 3,
      rating: 4.95,
      reviews: 67,
      includes: [
        'Guida + barca appoggio fino a Vallugola',
        'Attracco nella caletta privata',
        'Sconto al Ristorante Falco',
        'Min. 2 persone'
      ],
      tags: ['4 ore', 'pranzo', 'caletta privata', 'min 2 pers'],
      lead: 'Rotta aperta da Cattolica fino al Porticciolo di Vallugola, con guida inclusa, attracco nella caletta privata e pranzo al Ristorante Falco: quattro ore di navigazione in cui il mezzo risponde solo a te.',
      variantGroups: [
        { id: 'media', label: 'Media a bordo', selection: 'multi', required: false,
          options: [
            { id: 'gopro', label: 'GoPro POV',         priceMode: 'add', price: 15, sublabel: '4K · file via AirDrop' },
            { id: 'photo', label: 'Photo Kit Staff',   priceMode: 'add', price: 50, sublabel: 'scatti dallo staff' },
            { id: 'drone', label: 'Drone VIP Movie',   priceMode: 'add', price: 99, sublabel: 'reel 4K · IG/TikTok ready' }
          ] },
        { id: 'accessori', label: 'Accessori', selection: 'multi', required: false,
          options: [
            { id: 'kasko',   label: 'Kasko Light',     priceMode: 'add', price: 10 },
            { id: 'refresh', label: 'VIP Refresh Kit', priceMode: 'add', price: 15 },
            { id: 'glasses', label: 'Occhiali Floating', priceMode: 'add', price: 20 }
          ] }
      ]
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
      basePrice: 320,
      perPerson: false, minPeople: 1, maxPeople: 2,
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
      lead: 'Un\'ora privata in mare aperto, con le rose preparate nel gavone prima della partenza e lo Champagne già freddo — per sorprendere, non per annunciare.',
      variantGroups: [
        { id: 'champagne-upgrade', label: 'Champagne', selection: 'single', required: false,
          options: [
            { id: 'piccolo', label: 'Champagne piccolo', priceMode: 'add', price: 0, sublabel: 'incluso', default: true },
            { id: '750ml',   label: 'Champagne 750ml',   priceMode: 'add', price: 30, sublabel: '+30€' }
          ] },
        { id: 'media-extra', label: 'Media extra', selection: 'multi', required: false,
          options: [
            { id: 'drone',     label: 'Drone VIP Movie', priceMode: 'add', price: 99 },
            { id: 'paparazzo', label: 'Paparazzo',       priceMode: 'add', price: 50 }
          ] },
        { id: 'drink-delivery', label: 'Drink delivery', selection: 'multi', required: false,
          options: [
            { id: 'moet',         label: 'Moët & Chandon Brut',     priceMode: 'add', price: 230 },
            { id: 'veuve',        label: 'Veuve Clicquot',          priceMode: 'add', price: 240 },
            { id: 'ruinart',      label: 'Ruinart Blanc de Blancs', priceMode: 'add', price: 290 },
            { id: 'dom-perignon', label: 'Dom Pérignon Vintage',    priceMode: 'add', price: 550 },
            { id: 'corona',       label: 'Bucket 6 Corona',         priceMode: 'add', price: 160 },
            { id: 'soft',         label: 'Soft Drinks Kit',         priceMode: 'add', price: 140 }
          ] }
      ]
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
      basePrice: 490,
      perPerson: false, minPeople: 1, maxPeople: 2,
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
      lead: 'Novanta minuti orchestrati in mare aperto: rose nel gavone, Champagne 750ml, drone 4K per riprendere il momento, un paparazzo discreto dallo staff e un certificato su pergamena con le coordinate GPS del sì.',
      variantGroups: [
        { id: 'champagne-upgrade', label: 'Champagne (default 750ml incluso)', selection: 'single', required: false,
          options: [
            { id: 'incluso',      label: 'Champagne 750ml incluso', priceMode: 'add', price: 0,   default: true },
            { id: 'moet',         label: 'Upgrade Moët',             priceMode: 'add', price: 100 },
            { id: 'veuve',        label: 'Upgrade Veuve Clicquot',   priceMode: 'add', price: 110 },
            { id: 'ruinart',      label: 'Upgrade Ruinart',          priceMode: 'add', price: 160 },
            { id: 'dom-perignon', label: 'Upgrade Dom Pérignon',     priceMode: 'add', price: 420 }
          ] },
        { id: 'extras', label: 'Extra', selection: 'multi', required: false,
          options: [
            { id: 'musicista', label: 'Musicista dal vivo', priceMode: 'add', price: 250, sublabel: 'chitarrista o violinista — upsell verso Sinfonia' }
          ] }
      ]
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
      basePrice: 890,
      perPerson: false, minPeople: 1, maxPeople: 2,
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
      lead: 'La seconda moto arriva tra le onde con le rose mentre il musicista suona sul ponte — chitarra o violino, a scelta, in mezzo all\'Adriatico. Regia cinematografica inclusa.',
      variantGroups: [
        { id: 'drone-add', label: 'Drone VIP', selection: 'single', required: false,
          options: [
            { id: 'no',  label: 'No drone', priceMode: 'add', price: 0, default: true },
            { id: 'yes', label: 'Drone VIP Movie', priceMode: 'add', price: 99 }
          ] },
        { id: 'drink-delivery', label: 'Drink delivery', selection: 'multi', required: false,
          options: [
            { id: 'moet',         label: 'Moët & Chandon Brut',     priceMode: 'add', price: 230 },
            { id: 'veuve',        label: 'Veuve Clicquot',          priceMode: 'add', price: 240 },
            { id: 'ruinart',      label: 'Ruinart Blanc de Blancs', priceMode: 'add', price: 290 },
            { id: 'dom-perignon', label: 'Dom Pérignon Vintage',    priceMode: 'add', price: 550 },
            { id: 'corona',       label: 'Bucket 6 Corona',         priceMode: 'add', price: 160 },
            { id: 'soft',         label: 'Soft Drinks Kit',         priceMode: 'add', price: 140 }
          ] }
      ]
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
      basePrice: 850,
      perPerson: false, minPeople: 1, maxPeople: 2,
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
      lead: 'Quattro ore verso Vallugola con fiori a bordo, Drone Movie incluso e aperitivo con due bottiglie di Champagne nel momento in cui la costa del San Bartolo prende la luce del pomeriggio.',
      variantGroups: [
        { id: 'media-extra', label: 'Media extra (drone già incluso)', selection: 'multi', required: false,
          options: [
            { id: 'paparazzo', label: 'Paparazzo', priceMode: 'add', price: 50 }
          ] },
        { id: 'drink-delivery', label: 'Drink delivery', selection: 'multi', required: false,
          options: [
            { id: 'moet',         label: 'Moët & Chandon Brut',     priceMode: 'add', price: 230 },
            { id: 'veuve',        label: 'Veuve Clicquot',          priceMode: 'add', price: 240 },
            { id: 'ruinart',      label: 'Ruinart Blanc de Blancs', priceMode: 'add', price: 290 },
            { id: 'dom-perignon', label: 'Dom Pérignon Vintage',    priceMode: 'add', price: 550 },
            { id: 'corona',       label: 'Bucket 6 Corona',         priceMode: 'add', price: 160 },
            { id: 'soft',         label: 'Soft Drinks Kit',         priceMode: 'add', price: 140 }
          ] }
      ]
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
      basePrice: 220,
      perPerson: false, minPeople: 1, maxPeople: 2,
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
      lead: 'Un\'ora al largo a metà giornata, con il brunch box già apparecchiato a bordo prima della partenza — due miglia dalla riva, nessun altro intorno, tavolo con vista sull\'Adriatico.',
      variantGroups: [
        { id: 'media', label: 'Media a bordo', selection: 'multi', required: false,
          options: [
            { id: 'drone',     label: 'Drone VIP Movie', priceMode: 'add', price: 99 },
            { id: 'paparazzo', label: 'Paparazzo',       priceMode: 'add', price: 50 }
          ] },
        { id: 'drink-delivery', label: 'Drink delivery', selection: 'multi', required: false,
          options: [
            { id: 'moet',         label: 'Moët & Chandon Brut',     priceMode: 'add', price: 230 },
            { id: 'veuve',        label: 'Veuve Clicquot',          priceMode: 'add', price: 240 },
            { id: 'ruinart',      label: 'Ruinart Blanc de Blancs', priceMode: 'add', price: 290 },
            { id: 'dom-perignon', label: 'Dom Pérignon Vintage',    priceMode: 'add', price: 550 },
            { id: 'corona',       label: 'Bucket 6 Corona',         priceMode: 'add', price: 160 },
            { id: 'soft',         label: 'Soft Drinks Kit',         priceMode: 'add', price: 140 }
          ] }
      ]
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
      basePrice: 75,
      priceUnit: 'esperienza family',
      perPerson: false, minPeople: 1, maxPeople: 2,
      rating: 4.97,
      reviews: 41,
      includes: [
        'Noleggio breve · 15–20 minuti',
        'Genitore guida · bambino partecipa attivamente',
        'Foto ricordo',
        'Diploma cartaceo "Piccolo Pilota"'
      ],
      tags: ['15–20 min', 'bambini', 'diploma', 'family'],
      lead: 'Quindici o venti minuti in area protetta con il genitore al manubrio e il bambino che mette le mani sul mezzo: a fine uscita, diploma di Piccolo Pilota consegnato di persona.',
      variantGroups: [
        { id: 'media', label: 'Media a bordo', selection: 'multi', required: false,
          options: [
            { id: 'photo', label: 'Photo Kit Staff', priceMode: 'add', price: 50 },
            { id: 'drone', label: 'Drone VIP Movie', priceMode: 'add', price: 99 }
          ] }
      ]
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
      basePrice: 45,
      perPerson: true, minPeople: 1, maxPeople: 8,
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
      lead: 'Trenta minuti in coppia: uno guida, l\'altro sta dietro e capisce subito se siete compatibili — il mezzo non perdona le esitazioni, ed è meglio saperlo prima.',
      variantGroups: [
        { id: 'media', label: 'Media a bordo', selection: 'multi', required: false,
          options: [
            { id: 'gopro', label: 'GoPro POV',       priceMode: 'add', price: 15 },
            { id: 'drone', label: 'Drone VIP Movie', priceMode: 'add', price: 99 }
          ] },
        { id: 'accessori', label: 'Accessori', selection: 'multi', required: false,
          options: [
            { id: 'kasko',   label: 'Kasko Light',     priceMode: 'add', price: 10 },
            { id: 'refresh', label: 'VIP Refresh Kit', priceMode: 'add', price: 15 }
          ] }
      ]
    },

    // ============ YACHT ============
    {
      id: 'yacht-sunset',
      tab: 'yacht', cat: 'day',
      title: 'Sunset <em>Cruise</em>',
      loc: 'Cattolica · al largo',
      img: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?q=85&w=1600&auto=format&fit=crop',
      imgs: ['https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?q=85&w=1600&auto=format&fit=crop'],
      badge: '2 ore', meta: '2 ore · skipper · aperitivo',
      duration: '2 ore al tramonto',
      basePrice: 690, priceUnit: 'a barca', perPerson: false,
      minPeople: 1, maxPeople: 8,
      slots: ['18:30'],
      rating: 4.95, reviews: 0,
      includes: ['Skipper a bordo', 'Aperitivo standard (taglieri + bollicine)', 'Carburante incluso', 'Fino a 8 ospiti'],
      tags: ['2 ore', 'fino a 8 px', 'aperitivo', 'skipper'],
      lead: 'Due ore al tramonto con aperitivo a bordo — bollicine, taglieri e fino a otto ospiti — partenza alle 18:30 e rientro al buio con le luci di Cattolica che si accendono sulla costa.',
      variantGroups: [
        { id: 'catering-aperitivo', label: 'Aperitivo', selection: 'single', required: false,
          options: [
            { id: 'standard', label: 'Aperitivo standard', priceMode: 'add', price: 0, sublabel: 'incluso', default: true },
            { id: 'premium',  label: 'Aperitivo premium',  priceMode: 'add', price: 120, sublabel: 'crudo + ostriche + champagne' }
          ] },
        { id: 'drink-delivery', label: 'Drink delivery', selection: 'multi', required: false,
          options: [
            { id: 'moet',         label: 'Moët & Chandon Brut',     priceMode: 'add', price: 230 },
            { id: 'veuve',        label: 'Veuve Clicquot',          priceMode: 'add', price: 240 },
            { id: 'ruinart',      label: 'Ruinart Blanc de Blancs', priceMode: 'add', price: 290 },
            { id: 'dom-perignon', label: 'Dom Pérignon Vintage',    priceMode: 'add', price: 550 },
            { id: 'corona',       label: 'Bucket 6 Corona',         priceMode: 'add', price: 160 },
            { id: 'soft',         label: 'Soft Drinks Kit',         priceMode: 'add', price: 140 }
          ] }
      ]
    },
    {
      id: 'yacht-day-charter',
      tab: 'yacht', cat: 'day',
      title: 'Day <em>Charter</em>',
      loc: 'Cattolica → Vallugola → Gabicce',
      img: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?q=85&w=1600&auto=format&fit=crop',
      imgs: ['https://images.unsplash.com/photo-1540541338287-41700207dee6?q=85&w=1600&auto=format&fit=crop'],
      badge: 'full day', meta: '8 ore · 10 px · pranzo',
      duration: '8 ore di mare aperto',
      basePrice: 1890, priceUnit: 'a barca', perPerson: false,
      minPeople: 1, maxPeople: 10,
      slots: ['09:00', '10:00'],
      rating: 4.95, reviews: 0,
      includes: ['Skipper + hostess', 'Tender a bordo per le calette', 'Set snorkeling', 'Carburante incluso', 'Fino a 10 ospiti'],
      tags: ['full day', 'fino a 10 px', 'pranzo', 'tender + snorkel'],
      lead: 'Otto ore di navigazione tra Cattolica, Vallugola e Gabicce: pranzo a bordo o al Ristorante Falco, snorkeling nelle calette con il tender, skipper e hostess inclusi. La giornata che ti porti a casa.',
      variantGroups: [
        { id: 'pranzo', label: 'Pranzo', selection: 'single', required: true,
          options: [
            { id: 'a-bordo', label: 'Pranzo a bordo', priceMode: 'add', price: 0, sublabel: 'incluso', default: true },
            { id: 'falco',   label: 'Pranzo al Ristorante Falco (Vallugola)', priceMode: 'add', price: 0, sublabel: 'a consumo · da confermare' }
          ] },
        { id: 'snorkel-set', label: 'Extra acquatici', selection: 'multi', required: false,
          options: [
            { id: 'tender-extra', label: 'Tender extra time', priceMode: 'add', price: 80 }
          ] },
        { id: 'drink-delivery', label: 'Drink delivery', selection: 'multi', required: false,
          options: [
            { id: 'moet',         label: 'Moët & Chandon Brut',     priceMode: 'add', price: 230 },
            { id: 'veuve',        label: 'Veuve Clicquot',          priceMode: 'add', price: 240 },
            { id: 'ruinart',      label: 'Ruinart Blanc de Blancs', priceMode: 'add', price: 290 },
            { id: 'dom-perignon', label: 'Dom Pérignon Vintage',    priceMode: 'add', price: 550 },
            { id: 'corona',       label: 'Bucket 6 Corona',         priceMode: 'add', price: 160 },
            { id: 'soft',         label: 'Soft Drinks Kit',         priceMode: 'add', price: 140 }
          ] }
      ]
    },
    {
      id: 'yacht-private-event',
      tab: 'yacht', cat: 'event',
      title: 'Private <em>Event</em>',
      loc: 'Cattolica · al largo',
      img: 'https://images.unsplash.com/photo-1605281317010-fe5ffe798166?q=85&w=1600&auto=format&fit=crop',
      imgs: ['https://images.unsplash.com/photo-1605281317010-fe5ffe798166?q=85&w=1600&auto=format&fit=crop'],
      badge: '4 ore', meta: '4 ore · 12 px · catering',
      duration: '4 ore con ponte allestito',
      basePrice: 1490, priceUnit: 'a barca', perPerson: false,
      minPeople: 1, maxPeople: 12,
      rating: 5.0, reviews: 0,
      includes: ['Skipper + hostess', 'Catering standard', 'Ponte allestito', 'Fino a 12 ospiti'],
      tags: ['4 ore', 'fino a 12 px', 'catering', 'DJ opzionale'],
      lead: 'Quattro ore con il ponte allestito, catering a scelta e DJ opzionale — il pretesto lo porti tu, il resto lo gestiamo noi. Fino a dodici ospiti, nessun estraneo a bordo.',
      variantGroups: [
        { id: 'catering', label: 'Catering', selection: 'single', required: true,
          options: [
            { id: 'standard', label: 'Catering standard', priceMode: 'add', price: 0, sublabel: 'incluso', default: true },
            { id: 'premium',  label: 'Catering premium',  priceMode: 'add', price: 400 },
            { id: 'chef',     label: 'Chef a bordo',      priceMode: 'add', price: 800 }
          ] },
        { id: 'dj', label: 'DJ', selection: 'single', required: false,
          options: [
            { id: 'no',  label: 'Senza DJ',    priceMode: 'add', price: 0, default: true },
            { id: 'yes', label: 'DJ a bordo',  priceMode: 'add', price: 250 }
          ] },
        { id: 'drink-delivery', label: 'Drink delivery', selection: 'multi', required: false,
          options: [
            { id: 'moet',         label: 'Moët & Chandon Brut',     priceMode: 'add', price: 230 },
            { id: 'veuve',        label: 'Veuve Clicquot',          priceMode: 'add', price: 240 },
            { id: 'ruinart',      label: 'Ruinart Blanc de Blancs', priceMode: 'add', price: 290 },
            { id: 'dom-perignon', label: 'Dom Pérignon Vintage',    priceMode: 'add', price: 550 },
            { id: 'corona',       label: 'Bucket 6 Corona',         priceMode: 'add', price: 160 },
            { id: 'soft',         label: 'Soft Drinks Kit',         priceMode: 'add', price: 140 }
          ] }
      ]
    },
    {
      id: 'yacht-weekend',
      tab: 'yacht', cat: 'event',
      title: 'Riviera <em>Weekend</em>',
      loc: 'Marche · Emilia',
      img: 'https://images.unsplash.com/photo-1599582909646-2ca06ad65bd1?q=85&w=1600&auto=format&fit=crop',
      imgs: ['https://images.unsplash.com/photo-1599582909646-2ca06ad65bd1?q=85&w=1600&auto=format&fit=crop'],
      badge: '2 gg · 1 notte', meta: 'cabina · colazione',
      duration: '2 giorni, 1 notte a bordo',
      basePrice: 2490, priceUnit: 'a coppia', perPerson: false,
      minPeople: 2, maxPeople: 2,
      rating: 5.0, reviews: 0,
      includes: ['Cabina privata', 'Colazione continental a bordo', 'Skipper', 'Rotta libera tra Marche ed Emilia'],
      tags: ['2 gg · 1 notte', 'coppia', 'cabina', 'colazione'],
      lead: 'Due giorni, una notte in cabina privata con colazione continental a bordo e rotta libera tra le coste delle Marche e dell\'Emilia — il mare come hotel galleggiante, con lo skipper incluso.',
      variantGroups: [
        { id: 'colazione', label: 'Colazione', selection: 'single', required: false,
          options: [
            { id: 'continental', label: 'Continental', priceMode: 'add', price: 0, sublabel: 'inclusa', default: true },
            { id: 'specialty',   label: 'Specialty',   priceMode: 'add', price: 60 }
          ] },
        { id: 'drink-delivery', label: 'Drink delivery', selection: 'multi', required: false,
          options: [
            { id: 'moet',         label: 'Moët & Chandon Brut',     priceMode: 'add', price: 230 },
            { id: 'veuve',        label: 'Veuve Clicquot',          priceMode: 'add', price: 240 },
            { id: 'ruinart',      label: 'Ruinart Blanc de Blancs', priceMode: 'add', price: 290 },
            { id: 'dom-perignon', label: 'Dom Pérignon Vintage',    priceMode: 'add', price: 550 },
            { id: 'corona',       label: 'Bucket 6 Corona',         priceMode: 'add', price: 160 },
            { id: 'soft',         label: 'Soft Drinks Kit',         priceMode: 'add', price: 140 }
          ] }
      ]
    },

    // ============ YACHT — Ultra-Platinum (Valbruna) ============
    {
      id: 'valbruna-ultra-platinum',
      tab: 'yacht', cat: 'ultra',
      title: 'Valbruna <em>Ultra-Platinum</em>',
      loc: 'Cattolica → Vallugola · baia privata',
      img: 'https://images.unsplash.com/photo-1599582909646-2ca06ad65bd1?q=85&w=1600&auto=format&fit=crop',
      imgs: ['https://images.unsplash.com/photo-1599582909646-2ca06ad65bd1?q=85&w=1600&auto=format&fit=crop'],
      badge: 'All-in · fino a 20 px', meta: 'DJ · jet ski · drone · open bar',
      duration: '3 formati · da 4 a 8 ore',
      basePrice: 4500, priceUnit: 'a barca (fino a 10 px)', perPerson: false,
      minPeople: 4, maxPeople: 20,
      rating: 5.0, reviews: 0,
      includes: [
        'Esclusiva totale · nessun estraneo a bordo',
        'Rotta Vallugola · 2 ore navigazione panoramica · carburante incluso',
        'DJ set privato con professionista a bordo',
        '1 ora moto d\'acqua portata allo yacht in sosta',
        'Servizio fotografico e video con drone incluso',
        'Snorkeling kit · maschere e pinne',
        'Open Bar (bollicine, soft drink, mixology) + buffet finger food',
        'Equipaggio: capitano, marinaio e hostess dedicata'
      ],
      tags: ['all-in', 'DJ', 'jet ski incluso', 'drone', 'fino a 20 px'],
      lead: 'Venti metri di club galleggiante privato: rotta verso Vallugola, DJ set professionale, un\'ora di moto d\'acqua portata allo yacht in sosta, drone e servizio fotografico inclusi, open bar e buffet per tutta la navigazione. Fino a venti ospiti, esclusiva totale, nessun estraneo a bordo.',
      variantGroups: [
        { id: 'format', label: 'Formato evento', selection: 'single', required: true,
          options: [
            { id: 'sunrise', label: 'Sunrise Gold · Alba',     priceMode: 'add', price: 0, sublabel: 'colazione gourmet per tutti', default: true },
            { id: 'sunset',  label: 'Sunset Elite · Tramonto', priceMode: 'add', price: 0, sublabel: 'aperitivo lungo + DJ set al tramonto' },
            { id: 'after',   label: 'After Party Supreme',      priceMode: 'add', price: 0, sublabel: 'festa notturna + colazione rigenerante' }
          ]
        }
      ]
    },

    // Yacht hero CTA on yacht.html — alias to sunset cruise
    { id: 'yacht', tab: 'yacht', aliasOf: 'yacht-sunset', preselect: {} },
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
      { id: 'veloci',   label: 'Ride',     icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h7l-1 8 10-12h-7z"/></svg>' },
      { id: 'tour',     label: 'Tour',     icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>' },
      { id: 'famiglia', label: 'Under 12', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="9" cy="7" r="3"/><circle cx="17" cy="7" r="2"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 14h2a3 3 0 0 1 3 3v2"/></svg>' }
    ],
    experience: [
      { id: 'coppia',   label: 'Coppia',   icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-4.5-7-10a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.5-7 10-7 10s-2 0-4 0z"/></svg>' },
      { id: 'brunch',   label: 'Brunch',   icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M3 11h18a8 8 0 0 1-9 8 8 8 0 0 1-9-8z"/><path d="M7 8c0-2 1-3 2-3M11 8c0-2 1-3 2-3M15 8c0-2 1-3 2-3"/></svg>' },
      { id: 'social',   label: 'Social',   icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M14 18a4 4 0 0 1 7 0"/></svg>' }
    ],
    yacht: [
      { id: 'day',   label: 'Crociere', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="14" r="3.5"/><path d="M12 6v2M5 14H3M21 14h-2M6.5 8.5L5 7M19 7l-1.5 1.5"/><path d="M3 19h18"/></svg>' },
      { id: 'event', label: 'Privé',    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6l1.5 4.5L18 12l-4.5 1.5L12 18l-1.5-4.5L6 12l4.5-1.5z"/><path d="M5 3v3M3.5 4.5h3M19 18v3M17.5 19.5h3"/></svg>' },
      { id: 'ultra', label: 'Premium', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>' }
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

    const priceFor = (e) => {
      if(typeof e.priceFromOverride === 'number') return e.priceFromOverride;
      if(typeof e.basePrice === 'number') return e.basePrice;
      if(typeof e.priceFrom === 'number') return e.priceFrom; // legacy
      // Resolve aliases
      if(e.aliasOf){
        const canon = EXPERIENCES.find(p => p.id === e.aliasOf);
        if(canon) return priceFor(canon);
      }
      return 0;
    };
    const unitFor = (e) => e.priceUnit || (e.aliasOf ? (EXPERIENCES.find(p => p.id === e.aliasOf) || {}).priceUnit : '') || '';

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
            <p class="card-price"><b>da ${priceFor(e)}€</b> · ${unitFor(e)}</p>
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
    const FEED_COPY = {
      noleggio: {
        title: 'Il timer parte solo quando sei fuori dal porto.',
        sub:   '70 km/h in mare, nessuna patente. Cattolica · Rimini'
      },
      experience: {
        title: 'Un\'ora in mare aperto cambia la prospettiva.',
        sub:   'Esperienze signature — coppia, brunch, famiglia, community.'
      },
      yacht: {
        title: 'Due yacht, equipaggio incluso, rotte su misura.',
        sub:   'Dal tramonto di due ore al weekend con notte a bordo.'
      }
    };
    const t = FEED_COPY[tab] || FEED_COPY.noleggio;
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

  // ============ HIDE TOPBAR + CAT-BAR WHEN OUTSIDE PRODUCTS ============
  // The chrome (top tabs + bottom filter bar) is product-context UI.
  // The hero now sits ABOVE the feed, so the cat-bar must hide both
  // before (hero) and after (other sections) the feed — not only past it.
  // Inset both top and bottom of the rootMargin so the feed only counts
  // as "in view" once it occupies the central band of the viewport.
  function setupChromeHideOnFooter(){
    if(!('IntersectionObserver' in window)) return;
    const feed = document.getElementById('feed');
    if(!feed) return;
    const obs = new IntersectionObserver((entries) => {
      const e = entries[0];
      document.body.classList.toggle('is-past-products', !e.isIntersecting);
    }, { rootMargin: '-30% 0px -45% 0px', threshold: 0 });
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
    wireBookCtas();
    wireDetailCtas();

    // pre-set deep link
    if(location.hash === '#experience' || location.hash === '#love'){ setTab('experience'); }
    if(location.hash === '#meteo'){ openMeteo(); }
  }

  // Delegated click handler: any element with [data-book] opens the booking
  // sheet. Empty value = default experience for the active tab; a non-empty
  // value selects a specific experience by id (e.g. data-book="classic").
  function wireBookCtas(){
    document.addEventListener('click', (ev) => {
      const trigger = ev.target.closest('[data-book]');
      if(!trigger) return;
      ev.preventDefault();
      const expId = trigger.getAttribute('data-book');
      openBooking(expId || null);
    });
  }

  // Delegated click handler: any element with [data-detail="<id>"] opens
  // the existing product detail sheet. Used by the standalone card sections
  // (Esperienze Standard / Love Flagship). A nested [data-book] wins —
  // clicking an inner Prenota CTA still goes to the booking sheet.
  function wireDetailCtas(){
    document.addEventListener('click', (ev) => {
      if(ev.target.closest('[data-book]')) return;
      const trigger = ev.target.closest('[data-detail]');
      if(!trigger) return;
      const expId = trigger.getAttribute('data-detail');
      if(!expId) return;
      ev.preventDefault();
      openDetail(expId);
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  }else{
    init();
  }
})();


/* =====================================================
   MIGRATED-SECTIONS BEHAVIOURS
   Reveal-on-scroll, FAQ accordion, 7-day inline forecast.
   These power the manifesto / media / fleet / how /
   meteo-section / faq / gallery blocks added below the
   products feed.
   ===================================================== */
(function(){
  'use strict';

  /* ---- Reveal on scroll ---- */
  const revealEls = document.querySelectorAll('.reveal, .reveal-s');
  if (revealEls.length) {
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        }
      }, { rootMargin: '0px 0px -10% 0px', threshold: .06 });
      revealEls.forEach(el => io.observe(el));
    } else {
      revealEls.forEach(el => el.classList.add('in'));
    }
  }

  /* ---- FAQ accordion ---- */
  document.querySelectorAll('.faq .fa').forEach(it => {
    it.addEventListener('click', () => it.classList.toggle('open'));
  });

  /* ---- 7-day inline forecast (Open-Meteo, attribution: Aeronautica Militare in UI) ---- */
  (async function(){
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
      if (code >= 95) return { level: 'no', label: 'No' };
      if (code >= 71 && code <= 77) return { level: 'no', label: 'No' };
      if ((typeof wave === 'number' && wave > 0.8)
         || (typeof wind === 'number' && wind > 30)
         || (code >= 65 && code <= 67)
         || (code >= 82 && code <= 86)) return { level: 'no', label: 'Sconsigliato' };
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

})();
