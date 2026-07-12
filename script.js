/**
 * =====================================================================
 * Altitud - Motor de Entrenamiento
 * Arquitectura Modular
 * =====================================================================
 */

// =====================================================================
// 1. WEATHER SERVICE (Integración Open-Meteo)
// =====================================================================
const WeatherService = (() => {
  
  // Traducir códigos del tiempo WMO
  const mapWeatherCode = (code) => {
    if (code === 0) return 'Despejado';
    if ([1, 2, 3].includes(code)) return 'Parcialmente nublado';
    if ([45, 48].includes(code)) return 'Niebla';
    if ([51, 53, 55, 56, 57].includes(code)) return 'Llovizna';
    if ([61, 63, 65, 66, 67].includes(code)) return 'Lluvia';
    if ([71, 73, 75, 77].includes(code)) return 'Nieve';
    if ([80, 81, 82].includes(code)) return 'Chubascos';
    if ([95, 96, 99].includes(code)) return 'Tormenta';
    return 'Despejado';
  };

  return {
    async getForecast(cityName, timeStr) {
      try {
        // 1. Geocodificación: obtener latitud y longitud a partir de la ciudad
        const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=es&format=json`;
        const geoRes = await fetch(geocodeUrl);
        
        if (!geoRes.ok) throw new Error('Error al contactar con el servidor de geocodificación.');
        const geoData = await geoRes.json();
        
        if (!geoData.results || geoData.results.length === 0) {
          throw new Error(`No hemos podido encontrar la ubicación "${cityName}". Comprueba el nombre.`);
        }
        
        const { latitude, longitude, name, country } = geoData.results[0];

        // 2. Obtener pronóstico meteorológico horario
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,wind_speed_10m,wind_direction_10m,uv_index,weather_code&timezone=auto`;
        const weatherRes = await fetch(weatherUrl);
        
        if (!weatherRes.ok) throw new Error('Error al obtener los datos meteorológicos.');
        const weatherData = await weatherRes.json();

        // 3. Encontrar el índice correspondiente a la hora solicitada por el usuario
        const todayDate = new Date().toISOString().split('T')[0];
        const targetTimeStr = `${todayDate}T${timeStr}`;
        let timeIndex = weatherData.hourly.time.indexOf(targetTimeStr);
        
        if (timeIndex === -1) {
          // Fallback simple: coger la hora introducida (0-23) para el día actual
          timeIndex = parseInt(timeStr.split(':')[0], 10); 
        }

        const weatherCode = weatherData.hourly.weather_code[timeIndex];
        const description = mapWeatherCode(weatherCode);

        // 4. Retornar el objeto normalizado para el calculador
        return {
          temp: weatherData.hourly.temperature_2m[timeIndex],
          feelsLike: weatherData.hourly.apparent_temperature[timeIndex],
          humidity: weatherData.hourly.relative_humidity_2m[timeIndex],
          windSpeed: weatherData.hourly.wind_speed_10m[timeIndex], // Open-Meteo lo da en km/h por defecto
          windDegrees: weatherData.hourly.wind_direction_10m[timeIndex],
          rainProbability: weatherData.hourly.precipitation_probability[timeIndex],
          uvIndex: weatherData.hourly.uv_index[timeIndex] || 3,
          description: description,
          descriptionDetail: description.toLowerCase(),
          cityName: `${name}, ${country}`
        };

      } catch (error) {
        throw error; // Propagar error a la UI
      }
    }
  };
})();

// =====================================================================
// 2. PHYSIOLOGY ENGINE (Modelo Jack Daniels / VDOT)
// =====================================================================
const PhysiologyEngine = (() => {
  const zoneDefinitions = [
    { key: 'z1', name: 'Recuperación', short: 'Z1', percent: 0.62, color: '#6ee7a8' },
    { key: 'z2', name: 'Aeróbico', short: 'Z2', percent: 0.72, color: '#3ecf8e' },
    { key: 'z3', name: 'Tempo', short: 'Z3', percent: 0.84, color: '#ffc453' },
    { key: 'z4', name: 'Umbral', short: 'Z4', percent: 0.90, color: '#ff6b45' },
    { key: 'z5', name: 'VO2Máx', short: 'Z5', percent: 0.985, color: '#ff4d5e' }
  ];

  const vo2AtVelocity = (v) => -4.60 + 0.182258 * v + 0.000104 * (v * v);
  const percentVo2Max = (t) => 0.8 + 0.1894393 * Math.exp(-0.012778 * t) + 0.2989558 * Math.exp(-0.1932605 * t);
  const velocityFromVo2 = (vo2) => {
    const a = 0.000104, b = 0.182258, c = -4.60 - vo2;
    return (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
  };

  return {
    calculateVdot(timeSeconds) {
      const v = 5000 / (timeSeconds / 60);
      const t = timeSeconds / 60;
      return vo2AtVelocity(v) / percentVo2Max(t);
    },
    getZonePaces(vdot) {
      return zoneDefinitions.map(z => {
        const velocityMMin = velocityFromVo2(vdot * z.percent);
        return { ...z, secPerKm: (1000 / velocityMMin) * 60 };
      });
    }
  };
})();

// =====================================================================
// 3. ENVIRONMENT CORRECTOR (Penalizaciones)
// =====================================================================
const EnvironmentCorrector = (() => {
  return {
    getTotalCorrection(weather, distanceKm) {
      const tempHum = this.tempCorrection(weather.temp, weather.humidity);
      const wind = this.windCorrection(weather.windSpeed, weather.temp);
      const distance = this.distCorrection(distanceKm);
      const uv = this.uvCorrection(weather.uvIndex);
      const rain = this.rainCorrection(weather.rainProbability);

      const total = Math.max(0, tempHum.factor + wind.factor + distance.factor + uv.factor + rain.factor);

      return { total, factors: { tempHum, wind, distance, uv, rain }, hasCorrections: total > 0.005, windWarning: weather.windSpeed >= 25 };
    },

    tempCorrection(temp, humidity) {
      const wbgt = temp + ((humidity - 50) * 0.18);
      if (wbgt <= 13) return { factor: 0, explanation: null };
      
      let penalty = Math.min((wbgt - 13) * 0.007, 0.20);
      return {
        factor: penalty,
        explanation: `Temperatura percibida ${wbgt.toFixed(1)}°C: estrés térmico. Ritmo reducido ${(penalty * 100).toFixed(0)}%.`
      };
    },

    windCorrection(windSpeed, temp) {
      if (windSpeed < 3) return { factor: 0, explanation: null };
      if (temp < 10) return { factor: Math.min(0.02 * windSpeed, 0.12), explanation: `Viento aumenta wind chill. Ritmo penalizado.` };
      if (temp > 22) return { factor: Math.max(-0.01 * windSpeed, -0.06), explanation: `Viento favorece enfriamiento. Beneficio estimado.` };
      return { factor: 0, explanation: null };
    },

    distCorrection(distanceKm) {
      if (distanceKm <= 12) return { factor: 0, explanation: null };
      const penalty = Math.min(Math.pow(distanceKm - 12, 1.06) * 0.0032, 0.12);
      return { factor: penalty, explanation: `Tirada de ${distanceKm} km. Ritmo ajustado por fatiga acumulada.` };
    },

    uvCorrection(uvIndex) {
      if (uvIndex < 4) return { factor: 0, explanation: null };
      return { factor: Math.min((uvIndex - 4) * 0.015, 0.08), explanation: `Índice UV alto (${uvIndex.toFixed(1)}). Estrés térmico añadido.` };
    },

    rainCorrection(rainProbability) {
      if (rainProbability < 40) return { factor: 0, explanation: null };
      return { factor: Math.min((rainProbability / 100) * 0.04, 0.06), explanation: `Lluvia probable. Ritmo cauteloso por tracción.` };
    }
  };
})();

// =====================================================================
// 4. UTILS & HELPERS
// =====================================================================
const Helpers = {
  secToPace: (sec) => `${Math.floor(sec / 60)}:${Math.round(sec % 60).toString().padStart(2, '0')}`,
  secToDuration: (totSec) => {
    const h = Math.floor(totSec / 3600);
    const m = Math.floor((totSec % 3600) / 60);
    return h > 0 ? `${h}h ${m.toString().padStart(2, '0')}m` : `${m}:${Math.round(totSec % 60).toString().padStart(2, '0')} min`;
  },
  effortLabel: (pct) => pct < 0.68 ? 'Suave' : pct < 0.80 ? 'Moderado' : pct < 0.88 ? 'Alto' : pct < 0.95 ? 'Muy alto' : 'Máximo',
  recommendZone: (dist) => dist <= 6 ? { i: 0, r: 'Recuperación activa' } : dist <= 11 ? { i: 1, r: 'Rodaje aeróbico' } : dist <= 18 ? { i: 2, r: 'Ritmo tempo' } : { i: 1, r: 'Tirada larga (base)' }
};

// =====================================================================
// 5. UI CONTROLLER (DOM Interactions)
// =====================================================================
const UIController = (() => {
  const DOM = {};

  const cacheDOM = () => {
    DOM.form = document.getElementById('paceForm');
    DOM.formError = document.getElementById('formError');
    DOM.resultsEmpty = document.getElementById('resultsEmpty');
    DOM.resultsContent = document.getElementById('resultsContent');
    DOM.submitBtn = document.querySelector('.calc-submit');
    DOM.minInput = document.getElementById('pb5kMin');
    DOM.secInput = document.getElementById('pb5kSec');
    DOM.distInput = document.getElementById('distance');
    DOM.timeInput = document.getElementById('trainTime');
    DOM.cityInput = document.getElementById('city');
  };

  const bindEvents = () => {
    DOM.form.addEventListener('submit', handleFormSubmit);
    window.addEventListener('scroll', handleHeaderScroll, { passive: true });
    initFAQ();
    initAnimations();
    drawContours();
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const min = parseInt(DOM.minInput.value, 10);
    const sec = parseInt(DOM.secInput.value, 10);
    const distKm = parseFloat(DOM.distInput.value);
    
    if (isNaN(min) || isNaN(sec) || isNaN(distKm)) return;

    // Resetear UI para carga
    DOM.formError.style.display = 'none';
    const originalText = DOM.submitBtn.textContent;
    DOM.submitBtn.textContent = 'Consultando meteorología...';
    DOM.submitBtn.disabled = true;

    try {
      const weather = await WeatherService.getForecast(DOM.cityInput.value.trim(), DOM.timeInput.value);
      const vdot = PhysiologyEngine.calculateVdot(min * 60 + sec);
      const correctionData = EnvironmentCorrector.getTotalCorrection(weather, distKm);
      const zones = PhysiologyEngine.getZonePaces(vdot).map(z => ({ ...z, correctedSecPerKm: z.secPerKm * (1 + correctionData.total) }));
      const rec = Helpers.recommendZone(distKm);

      renderResults({ weather, vdot, zones, correctionData, recZone: zones[rec.i], recReason: rec.r, distKm });
    } catch (err) {
      // Manejo del error
      DOM.formError.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="flex-shrink:0;"><path d="M12 9v4M12 17h.01M10.3 3.9L2.7 18a1.6 1.6 0 001.4 2.4h15.8a1.6 1.6 0 001.4-2.4L13.7 3.9a1.6 1.6 0 00-2.8 0Z"/></svg> <span>${err.message}</span>`;
      DOM.formError.style.display = 'flex';
      DOM.resultsContent.style.display = 'none';
      DOM.resultsEmpty.style.display = 'flex';
    } finally {
      DOM.submitBtn.textContent = originalText;
      DOM.submitBtn.disabled = false;
    }
  };

  const renderResults = (data) => {
    DOM.resultsEmpty.style.display = 'none';
    DOM.resultsContent.style.display = 'block';
    
    // Configuración UI Badge Clima
    const badge = document.getElementById('dataSourceBadge');
    badge.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"></polyline></svg> Pronóstico para: ${data.weather.cityName}`;

    // Weather Strip
    document.getElementById('weatherStrip').innerHTML = `
      <div class="weather-card"><div class="wnum">${Math.round(data.weather.temp)}°</div><div class="wlabel">Temperatura</div></div>
      <div class="weather-card"><div class="wnum">${Math.round(data.weather.feelsLike)}°</div><div class="wlabel">Sensación</div></div>
      <div class="weather-card"><div class="wnum">${Math.round(data.weather.humidity)}%</div><div class="wlabel">Humedad</div></div>
      <div class="weather-card"><div class="wnum">${Math.round(data.weather.windSpeed)} km/h</div><div class="wlabel">Viento</div></div>
    `;

    // Zona Recomendada
    document.getElementById('rpZoneLabel').textContent = `Recomendado · ${data.recZone.name} — ${data.recReason}`;
    document.getElementById('rpValue').innerHTML = `${Helpers.secToPace(data.recZone.correctedSecPerKm)}<span>/km</span>`;
    document.getElementById('rpFinishTime').textContent = Helpers.secToDuration(data.recZone.correctedSecPerKm * data.distKm);
    document.getElementById('rpEffort').textContent = Helpers.effortLabel(data.recZone.percent);
    document.getElementById('rpVdot').textContent = data.vdot.toFixed(1);

    // Zonas Grid
    document.getElementById('zonesList').innerHTML = data.zones.map(z => `
      <div class="zone-row">
        <span class="zone-dot" style="background:${z.color};"></span>
        <span class="zone-name">${z.name} <small>${z.short} · ${Math.round(z.percent*100)}% VO2máx</small></span>
        <span class="zone-pace">${Helpers.secToPace(z.correctedSecPerKm)}/km</span>
      </div>
    `).join('');

    // Ajustes Desglose
    const breakdownEl = document.getElementById('correctionsBreakdown');
    if (data.correctionData.hasCorrections) {
      const factors = data.correctionData.factors;
      const list = [];
      if (factors.tempHum.factor > 0) list.push({ l: factors.tempHum.explanation, v: `−${(factors.tempHum.factor*100).toFixed(1)}%` });
      if (factors.wind.factor !== 0 && factors.wind.explanation) list.push({ l: factors.wind.explanation, v: `${factors.wind.factor > 0 ? '−' : '+'}${Math.abs(factors.wind.factor*100).toFixed(1)}%`, pos: factors.wind.factor < 0 });
      if (factors.distance.factor > 0) list.push({ l: factors.distance.explanation, v: `−${(factors.distance.factor*100).toFixed(1)}%` });
      if (factors.uv.factor > 0) list.push({ l: factors.uv.explanation, v: `−${(factors.uv.factor*100).toFixed(1)}%` });
      if (factors.rain.factor > 0) list.push({ l: factors.rain.explanation, v: `−${(factors.rain.factor*100).toFixed(1)}%` });
      
      if (list.length) {
        breakdownEl.style.display = 'block';
        document.getElementById('correctionsList').innerHTML = list.map(c => `
          <div class="correction-item ${c.pos ? 'positive' : ''}">
            <span class="label">${c.l}</span><span class="value">${c.v}</span>
          </div>`).join('');
      }
    } else {
      breakdownEl.style.display = 'none';
    }

    DOM.resultsContent.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const handleHeaderScroll = () => {
    document.getElementById('siteHeader').classList.toggle('scrolled', window.scrollY > 40);
  };

  const initFAQ = () => {
    document.querySelectorAll('.faq-item').forEach(item => {
      const q = item.querySelector('.faq-q');
      const a = item.querySelector('.faq-a');
      q.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item.open').forEach(other => {
          if (other !== item) {
            other.classList.remove('open');
            other.querySelector('.faq-a').style.maxHeight = null;
            other.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
          }
        });
        item.classList.toggle('open', !isOpen);
        q.setAttribute('aria-expanded', !isOpen);
        a.style.maxHeight = !isOpen ? a.scrollHeight + 'px' : null;
      });
    });
  };

  const initAnimations = () => {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    
    document.querySelectorAll('.counter').forEach(el => counterObserver.observe(el));
  };

  const animateCounter = (el) => {
    const target = parseInt(el.dataset.target, 10);
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / 1400, 1);
      el.textContent = Math.round((1 - Math.pow(1 - progress, 3)) * target).toLocaleString('es-ES');
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const drawContours = () => {
    const svg = document.getElementById('contourSVG');
    const colors = ['#6ee7a8', '#ffc453', '#ff6b45'];
    let paths = '';
    for (let i = 0; i < 7; i++) {
      const yBase = 120 + i * 85, amp = 30 + i * 6;
      let d = `M -50 ${yBase}`;
      for (let x = 0; x <= 1250; x += 100) d += ` L ${x} ${yBase + Math.sin((x / 200) + i) * amp}`;
      paths += `<path d="${d}" fill="none" stroke="${colors[i % colors.length]}" stroke-width="1.1" opacity="${Math.max(0.5 - i * 0.05, 0.08)}"/>`;
    }
    if (svg) svg.innerHTML = paths;
  };

  return {
    init() {
      cacheDOM();
      bindEvents();
    }
  };
})();

// =====================================================================
// INIT APP
// =====================================================================
document.addEventListener('DOMContentLoaded', UIController.init);