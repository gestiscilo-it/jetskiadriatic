# Copy & Tone Rewrite — Design Spec
**Date:** 2026-05-02  
**Scope:** `index.html`, `yacht.html`, `assets/js/app.js`  
**Status:** Approved

---

## Goal

Rewrite all user-facing copy on the site with a motorsport-editorial voice inspired by Formula 1, MotoGP (Italian edition), and WRC — while preserving the Italian conversational rhythm that short staccato copy cannot deliver.

---

## References

- formula1.com — stat-first headlines, calm technical confidence, declarative race framing
- motogp.com/it — Italian language rhythm, physical/sensory specificity, present tense energy
- wrc.com — precision language, stage/conditions data, "performance at the limit" tone

---

## Approach: Performance-First Hierarchy

Headlines open with a hard number or undeniable fact. Body copy earns the emotional payoff with full Italian sentence rhythm — subordinate clauses, conjunctions, no chopped fragments.

Applied uniformly to both jet ski and yacht sections.

---

## Editorial Rules

1. **Open with a fact, not a promise** — "38 nodi disponibili" beats "Vivi la velocità"
2. **One subordinate clause minimum per lead paragraph** — Italian conversational rhythm
3. **No three-word exclamation fragments** — a single fluid sentence replaces "Sali. Accendi. Spingi."
4. **Specificity over superlative** — "10 minuti di briefing, poi sei da solo" beats "esperienza indimenticabile"
5. **The sea is a surface to perform on** — technical, navigable, measurable — not a romantic backdrop

---

## Voice Posture

Calm confidence of someone who knows the circuit, not the announcer hyping the crowd. Numbers are stated plainly. The reader infers the thrill.

---

## Scope of Changes

### `index.html`

| Element | Change |
|---|---|
| `<title>` | Tighten, add primary stat |
| `<meta description>` | Conversational, specificity-first |
| Hero `h1` | Stat + italic location, one breath |
| Hero lead `p` | Single flowing sentence, one bold max |
| Feed title — Noleggio | Replace catchphrase with operational fact |
| Feed title — Escursioni | Specificity about what you actually get |
| Feed title — Yacht | Numbers-forward, not category label |
| Section head — Il mezzo | Performance-fact + italic payoff |
| Mezzo description | Expand from terse to conversational |
| Section head — Come si fa | Replace with process stat |
| How-it-works steps | Longer leads, subordinate structure |
| Manifesto big text | Numbers + place, one declarative sentence |
| Manifesto stats labels | Already good, minor polish |
| Section head — Media | Sharpen the data point |
| Media card descriptions | Keep length, tighten first sentence |
| FAQ head | Keep, it works |
| FAQ answers | Sharpen first sentence, keep conversational body |
| Contact head | Minor polish |
| Footer tagline | Same voice as hero |
| Trust bar items | Operational facts, not marketing claims |

### `yacht.html`

| Element | Change |
|---|---|
| Hero `h1` | Performance fact + italic |
| Hero lead | Flowing, technical specificity |
| Manifesto big text | Same treatment as index |
| Itinerari section head/lead | Route data + skipper confidence |
| Route card descriptions | Longer, conversational, nm/hours/stops |
| FAQ answers | Same polish as index |
| Contact section | Minor alignment |

### `assets/js/app.js`

| Element | Change |
|---|---|
| `FEED_COPY` titles + subtitles | 3 tab titles rewritten |
| `lead` field for all products | Key rewrite — conversational + specific |
| `duration` labels | Minor — operational precision |
| Noleggio alias leads (fast-fun, sprint, classic, sunset-hour) | Tighten to match voice |
| Experience leads (romance, proposal, sinfonia, diamond, brunch, kids, blind-date) | Same treatment |
| Yacht leads (sunset, day-charter, private-event, weekend, ultra-platinum) | Same |

---

## What Does NOT Change

- Product titles (e.g. "Vallugola Gold", "The Proposal") — brand names, not copy
- Prices, specs, capacity numbers — factual data
- Legal/regulatory text — not in scope
- CTA button labels — already functional
- Tag chips — already terse by design
- `includes[]` arrays — already list-format, functional

---

## Representative Before/After

**Hero h1 (index):**
- Before: `Tutta la velocità. Zero patente. Rimini.`
- After: `38 nodi. Nessuna patente richiesta. *Rimini.*`

**Hero lead (index):**
- Before: `Per chi vuole velocità vera in mare — senza patente, senza aspettare.`
- After: `Dal pontile di Cattolica al largo in meno di dieci minuti, con un mezzo da 70 km/h e un briefing di sicurezza che non dura più di quanto deve.`

**Feed title — Noleggio:**
- Before: `In mare in 5 minuti.`
- After: `Il timer parte solo quando sei fuori dal porto.`

**Manifesto big text:**
- Before: `Velocità. Rotte. Tramonti. Yacht. C'è un solo posto dove trovi tutto.`
- After: `Nove moto in acqua, sei rotte guidate, due yacht — tutto dallo stesso pontile, a Cattolica, dal mattino al tramonto.`

**Sportender product lead:**
- Before: `Sali, accendi, vai.`
- After: `Sali a bordo, dieci minuti di briefing con l'istruttore, poi il motore risponde solo a te — il timer parte quando sei fuori dai pali del porto.`
