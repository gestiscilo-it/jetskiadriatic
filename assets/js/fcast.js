// 7-day inline forecast (Open-Meteo; UI attribution: Aeronautica Militare).
// Shared across pages that include _partials/meteo.html (renders #fcastGrid).
// Extracted verbatim from app.js so sub-pages can carry the meteo section.
(async function () {
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
        Le previsioni si stanno aggiornando. Se non le vedi, <a href="https://wa.me/">scrivici su WhatsApp</a> e ti diciamo le condizioni in tempo reale.
      </div>
    `;
    if (window.Gestiscilo && Gestiscilo.wirePhoneLinks) { Gestiscilo.wirePhoneLinks(document.body); }
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
       || (code >= 45 && code <= 48)) return { level: 'caution', label: 'Mare mosso' };
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
