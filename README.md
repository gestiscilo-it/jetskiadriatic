# Jet Ski Adriatic

Sito demo single-page per l'attività di noleggio moto d'acqua, tour guidati ed eventi privati sulla Riviera Romagnola (Cattolica, Rimini).

**Slogan:** *Adriatico, chiavi in mano.*

## Caratteristiche

- Single-file HTML/CSS/JS — zero dipendenze esterne a parte font Google (Fraunces, DM Serif Display, Alfa Slab One, Caveat, Familjen Grotesk, Inter, JetBrains Mono)
- Hero full-bleed con CTA e status indicator dinamico (Aperto / Solo WhatsApp / Chiuso)
- Sezioni: esperienze, tour (Cattolica → San Bartolo), flotta Yamaha, manifesto, pricing a tab, gallery, recensioni, FAQ, CTA grande, contatti, footer
- Foto prodotto ufficiali Yamaha (via proxy images.weserv.nl per bypassare hotlink)
- Responsive mobile con menu a tutto schermo
- Pattern serigrafia/postcard (box shadows offset, tilt, timbri decorativi)

## Come aprire in locale

```bash
# Opzione 1 — doppio click su index.html
open index.html

# Opzione 2 — server HTTP locale (consigliato)
python3 -m http.server 8080
# poi http://localhost:8080
```

## Come pubblicare

### GitHub Pages
1. Crea un repo su GitHub, es. `jetskiadriatic-site`
2. Push di questo codice
3. Settings → Pages → Deploy from branch `main` / root
4. Disponibile su `https://<user>.github.io/jetskiadriatic-site/`

### Altri hosting statici
Funziona out-of-the-box su Netlify, Vercel, Cloudflare Pages, GitHub Pages. Basta caricare `index.html`.

## Come personalizzare

Tutti i contenuti sono in `index.html`. Sezioni principali:

- **Numero WhatsApp / telefono**: cerca `+390000000000` e `+39 000 000 0000`
- **Email**: cerca `ciao@jetskiadriatic.it`
- **Indirizzo**: cerca `Via del Porto, Cattolica`
- **Coordinate GPS**: `43.9592° N · 12.7431° E`
- **Prezzi**: sezione `#prezzi` — 3 tab (Noleggio / Tour / Eventi)
- **Flotta**: sezione `#flotta` — 3 moto Yamaha
- **Foto**: `style="background-image:url(...)"` in hero, experiences, tours, fleet, gallery — sostituire con foto cliente quando disponibili

## Status bar dinamica

Attualmente hardcoded su `open`. Per collegare un backend, sostituire la funzione JS:

```js
async function fetchStatus(){
  const r = await fetch('/api/status');
  return await r.json();
  // risposta attesa: { status: 'open' | 'whatsapp' | 'closed' }
}
```

## Licenza

Proprietario: Jet Ski Adriatic — uso interno / demo cliente.
