# Booking everywhere — design spec

**Date:** 2026-04-28
**Status:** Approved (sections 1–6), pre-implementation
**Scope:** make booking and product detail available on every page of jetskiadriatic.it, with declarative per-product variants and add-ons, future-compatible with the gestiscilo.it/app backend.

---

## 1. Architecture

### 1.1 Data model

`EXPERIENCES` (in `assets/js/app.js`) becomes the canonical product catalog. Today it lives inline; the same shape will eventually be returned by the gestiscilo.it/app API with zero translation.

```js
{
  id, tab, cat,
  title, lead, loc, img, imgs, video,
  badge, meta, duration,
  basePrice,           // renamed from priceFrom
  priceUnit,
  rating, reviews, includes, tags,

  // Optional booking-shape fields
  minPeople,           // default 1
  maxPeople,           // default 3 (jet) / 8 (yacht) — set explicitly per product
  slots,               // optional array of allowed start times; falls back to defaults

  // Marketing alias support (see §5)
  aliasOf,             // canonical product id; if present, this entry is a card-only alias
  preselect,           // { groupId: optionId } — applied when the alias is opened

  // Variant declaration
  variantGroups: [
    {
      id,
      label,
      selection: 'single' | 'multi',
      required: bool,
      clears: ['otherGroupId'],   // optional cross-group rule (used by bundles)
      options: [
        {
          id,
          label,
          sublabel,                 // optional secondary line
          priceMode: 'replace' | 'add',
          price,
          default: bool             // optional; auto-applied on detail open
        }
      ]
    }
  ]
}
```

**Pricing rules:**
- `priceMode: 'replace'` — selected option's `price` overrides `basePrice`. Used by the `durata` group on `noleggio-sportender`.
- `priceMode: 'add'` — selected option's `price` is added on top of the running total.
- For per-person priced products (`vallugola-gold`, `blind-date`), the priced unit is the `basePrice`; total = `unit × people + addons`. Determined by an internal flag on the product (mirror the existing `perPersonIds` set today, but driven by data).
- Cross-group `clears`: when an option in a group with `clears: ['mediaGroup']` is selected, all selections in `mediaGroup` are cleared. Used so picking the Social Star bundle removes individual Drone/GoPro picks.

### 1.2 Sheet injection

The four shared sheets (`#detailSheet`, `#bookingSheet`, `#meteoSheet`, `#sheetBackdrop`) move out of `index.html` and are injected by JS on init via a `injectSheets()` function. Idempotent: if the markup is already in the DOM it skips.

Result: any page that loads `assets/js/app.js` has booking, detail, and meteo sheets available with no per-page HTML changes.

### 1.3 State

`state.booking` extended:

```js
state.booking = {
  expId,                 // canonical product id
  aliasId,               // alias id if entry came via an alias card
  date, time, people,
  variants: {
    [groupId]: optionId | Set<optionId>   // single → optionId; multi → Set
  },
  name, phone, email, notes
}
```

The detail sheet writes to `state.booking.variants` directly. The booking sheet reads from it. There is no separate "extras" state.

### 1.4 Wiring

Existing delegated handlers stay:
- `[data-book]` → `openBooking(id)` (hero/fleet "Prenota" CTAs)
- `[data-detail]` → `openDetail(id)` (cards, flagship overview)

Both handlers accept either a canonical id or an alias id. Aliases resolve to their canonical product and apply `preselect` to `state.booking.variants` before rendering.

A hash deep-link parser runs on init: `index.html#p=classic` or `yacht.html#p=yacht-sunset&drink-delivery=moet` opens the detail sheet with selections applied.

---

## 2. Catalog

All products listed below replace the current `EXPERIENCES` array. Add-on prices come from `.gestito/prezzi accessori.pdf`, `.gestito/pacchetti inclusi gli accessori.pdf`, `.gestito/love experience.pdf`, and `.gestito/drink delivery.pdf`.

### 2.1 Canonical noleggio products

#### `noleggio-sportender` — single canonical ride product
- `basePrice: 50`, `priceUnit: 'a moto'`, `tab: 'noleggio'`, `cat: 'veloci'`
- `variantGroups`:
  - **`durata`** (single, required) — replaces base price
    - `15` · 15 min · 50€
    - `30` · 30 min · 85€
    - `45` · 45 min · 105€ — `default: true`
    - `60` · 1 ora · 145€
    - `120` · 2 ore (1h + Extra) · 245€
  - **`media`** (multi, optional) — adds
    - `gopro` · GoPro POV +15€
    - `photo` · Photo Kit Staff +50€
    - `drone` · Drone VIP Movie +99€
  - **`bundle`** (single, optional) — adds; `clears: ['media']`
    - `social-star` · Social Star (Drone+GoPro) +100€ — sublabel "risparmi 14€"
  - **`accessori`** (multi, optional) — adds
    - `kasko` · Kasko Light +10€
    - `refresh` · VIP Refresh Kit +15€
    - `glasses` · Occhiali Floating +20€
  - **`relax-bundle`** (single, optional) — adds; `clears: ['accessori']`
    - `total-relax` · Total Relax (Kasko+Refresh) +20€

#### `vallugola-gold`
- `basePrice: 289`, `priceUnit: 'a persona'`, per-person, `minPeople: 2`, `tab: 'noleggio'`, `cat: 'tour'`
- `variantGroups`: `media`, `accessori` (no durata — fixed 4h)

#### `kids-academy`
- `basePrice: 75`, `priceUnit: 'esperienza family'`, `tab: 'noleggio'`, `cat: 'famiglia'`
- `variantGroups`: `media` (Photo, Drone optional only)

### 2.2 Marketing aliases (home feed cards) — point to `noleggio-sportender`

| Alias id | Card title | preselect.durata | Card price |
|---|---|---|---|
| `fast-fun` | Fast & Fun | `15` | da 50€ |
| `sprint` | Sprint 30 | `30` | da 85€ |
| `classic` | Classic 45 | `45` | da 105€ |
| `sunset-hour` | Sunset Hour | `60` | da 145€ |

The home feed renders 4 noleggio alias cards exactly as today. Clicking any one opens the detail sheet for `noleggio-sportender` with the matching `durata` chip pre-selected. User can still switch durations inline.

### 2.3 Love / Experience products

Each in `tab: 'experience'`. Variant groups list only what's *not* already included in the package (avoid charging twice for items already in the price).

- **`secret-romance`** · 320€/coppia · 1h · includes GoPro, rose, champagne piccolo
  - `champagne-upgrade` (single, optional) — `none` (default, included), `750ml` +30€
  - `media-extra` (multi, optional) — Drone +99€, Paparazzo +50€
  - `drink-delivery` (multi, optional) — see §2.5

- **`the-proposal`** · 490€ · 1.5h · includes drone, paparazzo, pergamena GPS
  - `champagne-upgrade` (single, optional) — base 750ml incluso (default), Moët +100€, Veuve +110€, Ruinart +160€, Dom Pérignon +420€ *(deltas vs default; placeholder, confirm with client)*
  - `extras` (multi, optional) — `musicista` musicista dal vivo +250€ *(placeholder, confirm — upsell to Sinfonia)*

- **`sinfonia-amore`** · 890€ · 1.5–2h · includes 2nd boat, musicista, champagne, pergamena, paparazzo
  - `drone-add` (single, optional) — `none` (default), `vip-movie` +99€
  - `drink-delivery` (multi, optional)

- **`midday-brunch`** · 220€ · 1h · includes brunch box, drink, table set-up
  - `media` (multi, optional) — Drone +99€, Paparazzo +50€
  - `drink-delivery` (multi, optional)

- **`vallugola-diamond`** · 850€/coppia · 4h · includes fiori, drone, 2 champagne, aperitivo, attracco Vallugola
  - `media-extra` (multi, optional) — Paparazzo +50€ (drone already included)
  - `drink-delivery` (multi, optional)

- **`blind-date`** · 45€/persona · 30 min · per-person, social signup
  - `media` (multi, optional) — GoPro +15€, Drone +99€
  - `accessori` (multi, optional) — Kasko +10€, Refresh +15€

### 2.4 Yacht products (`tab: 'yacht'`)

Rendered statically on `yacht.html` (cards already exist). All four products gain real entries here so detail/booking work.

- **`yacht-sunset`** · 690€/barca · 2h · `maxPeople: 8`
  - `slots: ['18:30']`
  - `catering-aperitivo` (single, optional) — `standard` (default, included), `premium` +120€
  - `drink-delivery` (multi, optional)

- **`yacht-day-charter`** · 1.890€/barca · 8h · `maxPeople: 10`
  - `slots: ['09:00', '10:00']`
  - `pranzo` (single, required) — `a-bordo` (default, included), `falco` *(placeholder, confirm)*
  - `snorkel-set` (multi, optional) — `tender-extra-time` +80€ *(placeholder)*
  - `drink-delivery` (multi, optional)

- **`yacht-private-event`** · 1.490€/barca · 4h · `maxPeople: 12`
  - `catering` (single, required) — `standard` (default, included), `premium` +400€, `chef` +800€ *(placeholder, confirm)*
  - `dj` (single, optional) — `no` (default), `yes` +250€
  - `drink-delivery` (multi, optional)

- **`yacht-weekend`** · 2.490€/coppia · 2gg/1notte · `maxPeople: 2`
  - `colazione` (single, optional) — `continental` (default, included), `specialty` +60€
  - `drink-delivery` (multi, optional)

Yacht hero CTA `data-book="yacht"` resolves via alias to `yacht-sunset` (most common entry).

### 2.5 Drink delivery group (shared shape, multi, optional)

Same options on every product that exposes it:

- `moet` · Moët & Chandon Brut +230€
- `veuve` · Veuve Clicquot +240€
- `ruinart` · Ruinart Blanc de Blancs +290€
- `dom-perignon` · Dom Pérignon Vintage +550€
- `bucket-corona` · Bucket Mix 6 Birre Corona +160€
- `soft-drinks` · Soft Drinks Kit +140€

Prices include the 100€ delivery fee per the source PDF. Food add-ons are out of scope (PDF marks them "da definire").

### 2.6 Out of catalog

- **The Wave Card** abbonamento (450€ for 5×45min) — separate commerce flow; not modeled as a product variant. Deferred.
- Multiple Wave Card tiers ("DA DEFINIRE VARI IMPORTI") — not yet defined by the client.

---

## 3. Detail sheet UX

### 3.1 Layout

Top to bottom inside `#detailSheet`:

1. **Hero** — gallery + share/heart buttons. Unchanged.
2. **Title block** — title, rating, location, lead. Unchanged.
3. **Tags row** — existing `dt-tags`. Unchanged.
4. **Variant groups** — *new section, between tags and "Cosa è incluso"*. One block per group:
   - Block header: `<group.label>` + qualifier ("scegli" for single/required, "opzionali" for multi).
   - **`single`** groups → chip row (radio-pills). Required groups show "obbligatorio" badge until selected. Defaults auto-applied on open.
   - **`multi`** groups → vertical checkbox rows (re-uses `.bk-extra` styling pattern).
   - Each option shows label, optional sublabel, price delta (`+15€` for add, the absolute price for replace).
   - Live update: changing an option recomputes the footer total and the "Cosa è incluso" list.
5. **Cosa è incluso** — existing block, dynamically extended with currently-selected add-ons.
6. **Durata, Politiche, Mare e meteo** — unchanged.

### 3.2 Footer bar

- Left: live total reflecting base + variants + add-ons.
- Right: **"Prenota"** button. Visually muted (disabled state) until all `required: true` groups have a selection. Stays clickable for feedback (see §3.3). Defaults make most products available immediately.

### 3.3 Disabled-Prenota feedback

Pressing "Prenota" while requirements are unmet:
1. Find first missing required group in DOM order.
2. Smooth-scroll into view with offset for sticky footer.
3. Apply `.bk-shake` class for ~400ms (small horizontal keyframe), auto-remove.
4. If multiple groups missing, shake all simultaneously.
5. ARIA: missing group gets `aria-invalid="true"` momentarily; inline hint becomes `role="alert"` so screen readers announce "Scegli {group label}".

### 3.4 Cross-group rules

Bundles are separate single-select groups with a `clears: ['otherGroup']` rule. Selecting a bundle option clears the other group's selections. This is the only cross-group rule needed.

### 3.5 Persistence

Closing the detail sheet without booking discards selections. State is owned by the open sheet, not persisted across sessions.

---

## 4. Booking sheet UX

The booking sheet opens after "Prenota" with all detail-sheet variants locked into `state.booking.variants`. Three steps; pane 2 is conditional.

### 4.1 Pane 1 — When + Who

- **Recap strip** (top, `bk-summary-strip`):
  - Thumb + canonical product name + selected variants list ("Classic 45 · Drone VIP · Kasko").
  - "cambia" button → closes booking, reopens detail sheet preserving everything.
- **Date** — native `<input type="date">`, `min = today`, default = tomorrow.
- **Orario preferito** — chip row (radio). For products with `slots` defined, only those slots are shown; otherwise generic defaults (09:00, 11:00, 14:00, 16:00, "tramonto" 18:30).
- **Persone** — stepper. Range = `[product.minPeople ?? 1, product.maxPeople ?? 3]`. For per-person products, total recomputes on change.

### 4.2 Pane 2 — Recap & aggiungi (conditional)

- **Top recap (read-only)** — required + single-select group selections shown as text rows ("Durata: 45 min", "Bundle: Social Star") with a small "modifica" link → reopen detail sheet preserving everything else.
- **"Vuoi aggiungere qualcosa?"** — renders only the `selection: 'multi'` + `required: false` groups from the product. Pre-ticked add-ons from the detail sheet appear at the top with a "già aggiunto" badge (still untickable). New ticks merge into `state.booking.variants`.
- **Skip rule** — if the product has no optional multi groups (e.g. `sinfonia-amore`), pane 2 is not rendered. Pressing "Avanti" on pane 1 jumps directly to pane 3.

### 4.3 Pane 3 — Contact

Nome (required), WhatsApp (required), Email (optional), Note (optional), privacy consent checkbox. Identical to current pane 3.

### 4.4 Footer bar

- Left: total + breakdown — `<total>€` with `stima · al check-in · +<extras>€ extra` subline.
- Right: "Indietro" (hidden on pane 1) / "Avanti" → "Conferma prenotazione" on the final pane.
- Pane 1 validation: date + time required. Missing fields shake (same pattern as §3.3).
- Pane 3 validation: name + phone required. Same shake pattern.

### 4.5 Submit

Identical channel — opens WhatsApp deep link with a structured message. Format extended to include canonical product id + variant breakdown for future API parsing:

```
Ciao Jet Ski Adriatic! Vorrei prenotare:

• Pacchetto: Noleggio Sportender (alias: classic)
• Durata: 45 min · 105€
• Media: Drone VIP +99€
• Accessori: Kasko Light +10€
• Data: 2026-05-04 · 14:00
• Persone: 2
• Totale stimato: 214€
• Nome: Mario Rossi
```

### 4.6 What's removed / repurposed

- The hardcoded `<input data-extra="drone">` etc. checkboxes in the current pane 2 are removed. The pane 2 container is now populated dynamically by JS from the product's `variantGroups`.
- The current pane 2 framing copy ("Tutti gli extra sono opzionali. Li paghi al check-in insieme all'uscita.") is preserved.
- The existing `bkEditExp` "cambia" button is rewired to reopen the detail sheet preserving variants instead of closing the sheet to scroll up.

---

## 5. Marketing landing pages & deep-links

### 5.1 Pages

`index.html` and `yacht.html` are the only pages today. Both load `app.js`, both get the four sheets injected. No other pages need to change.

### 5.2 Alias entries on home feed

The four noleggio alias cards stay in the home feed (see §2.2). Each is a marketing surface of `noleggio-sportender` with its own title/badge/image/lead/tags and a `preselect.durata` value. Card footer prices reflect the pre-selected variant's price (50/85/105/145€).

### 5.3 Deep-link mechanisms

Three equivalent entries; all resolve to the same canonical product + preselects:

1. **Anchor with attribute**: `<a data-detail="classic">…</a>` — alias id resolves to canonical + preselect (existing handler enhanced).
2. **Direct canonical with explicit preselect**: `<a data-detail="noleggio-sportender" data-preselect="durata:45">…</a>` — for ad-hoc marketing CTAs.
3. **URL hash**: `index.html#p=classic` or `yacht.html#p=yacht-sunset&drink-delivery=moet` — parsed on init by `app.js`.

### 5.4 Booking message identity

Submitted messages include the canonical product id (so future API matches a single SKU) and the alias id when applicable (for attribution and marketing analytics).

### 5.5 Future landing pages

Pure-HTML pages (e.g. `landing/sunset-coppia.html`) can be added later. Pattern: load `app.js`, drop a hero + CTAs with `data-detail` / hash links. Booking and detail sheets work for free — no per-page JS, no per-page sheet markup. Out of scope for this build.

---

## 6. File changes

### 6.1 Modified files

**`assets/js/app.js`** — main work:
- Replace `EXPERIENCES` data with new shape (basePrice, variantGroups, aliasOf, preselect, slots, minPeople, maxPeople).
- Add canonical products: `noleggio-sportender`, `vallugola-gold`, `kids-academy`, `secret-romance`, `the-proposal`, `sinfonia-amore`, `midday-brunch`, `vallugola-diamond`, `blind-date`, `yacht-sunset`, `yacht-day-charter`, `yacht-private-event`, `yacht-weekend`.
- Add alias entries: `fast-fun`, `sprint`, `classic`, `sunset-hour`, `yacht` (alias of `yacht-sunset`).
- Add `injectSheets()` — moves detail/booking/meteo/backdrop markup from HTML into JS template literals, called on init. Idempotent (skips if markup already exists).
- Add `renderVariantGroups(product, container, mode)` — renders chips/checkboxes for detail sheet (`mode='full'`) and pane 2 of booking (`mode='upsell-only'`).
- Add `computeTotal(product, selections, people)` — single source of truth replacing the current ad-hoc `updateBookingTotal` math.
- Add `validateRequiredVariants(product, selections)` + `shakeMissing(groupIds)` for the disabled-Prenota and pane-1/3 validation feedback.
- Rework `openDetail(id)` to accept aliases (resolve `aliasOf`/`preselect`) and render variant groups.
- Rework `openBooking(id, lockedSelections)` to consume locked variants from detail; render dynamic upsell on pane 2; skip pane 2 if the product has no optional multi groups.
- Add hash deep-link parser on init (`#p=…&group=option`).

**`index.html`**:
- Remove `#detailSheet`, `#bookingSheet`, `#meteoSheet`, `#sheetBackdrop` blocks (now JS-injected).
- Existing `data-book` / `data-detail` attributes stay as-is.

**`yacht.html`**:
- Add `<script src="assets/js/app.js"></script>` before `</body>`.
- Existing yacht card `data-detail` IDs (`yacht-sunset`, `yacht-day-charter`, `yacht-private-event`, `yacht-weekend`) now resolve.
- Hero CTA `data-book="yacht"` resolves via alias to `yacht-sunset`.

**`assets/css/app.css`** — additive only:
- `.bk-vgroup` — variant group container
- `.bk-vchip` + `.bk-vchip.is-active` — single-select chip
- `.bk-vrow` — multi-select row (reuses `.bk-extra` tokens)
- `.bk-vgroup--required` + `.bk-vgroup-hint` — required-state styling
- `.bk-shake` keyframe — ~400ms horizontal nudge
- `.bk-prenota.is-disabled` — muted state with hover/click affordance
- `.bk-recap` — read-only summary in pane 2

### 6.2 Out of scope (deferred)

- The Wave Card abbonamento (separate commerce flow — voucher / multi-redemption).
- Drink delivery food add-ons (PDF marks "possibilità aggiunta di food" as undefined).
- Per-product OG metadata + dedicated landing pages.
- Backend API integration to gestiscilo.it/app (data shape ready; fetch layer comes later).
- Analytics / event tracking on variant selection.
- Real meteo-aware time slot disabling.
- Wave Card additional tiers ("DA DEFINIRE VARI IMPORTI").

### 6.3 Open follow-ups for client confirmation

These prices are placeholders in the spec and should be confirmed before going to production:
- **The Proposal** — `musicista` upsell delta (placeholder +250€).
- **The Proposal** — `champagne-upgrade` deltas vs default 750ml (Moët +100€, Veuve +110€, Ruinart +160€, Dom Pérignon +420€).
- **Yacht Day Charter** — `pranzo` Falco option price.
- **Yacht Day Charter** — `snorkel-set` extras pricing.
- **Yacht Private Event** — `catering` premium / chef deltas (placeholder +400€ / +800€).

---

## 7. Killer feature

The killer feature in this design is **declarative variants**: one shape, any number of groups per product, any combination of single/multi/required, with a deterministic total computation. The same shape works for jet ski rentals, love experiences, and yacht charters — no per-product UI code, no per-page HTML, no booking sheet rework when a new add-on is introduced. When the gestiscilo.it/app backend lands, the API returns the same shape and the frontend keeps working.

Everything else (sheet portability, alias cards, shake feedback, recap pane) is operational support around that core abstraction.
