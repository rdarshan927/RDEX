/* Clock functionality */

let clockElement = null;
let dateElement = null;
let weatherElement = null;
let weatherIntervalId = null;

// Cross-browser runtime.sendMessage wrapper that returns a Promise
function runtimeSendMessage(message) {
  if (typeof browser !== 'undefined') return browser.runtime.sendMessage(message);
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(message, (resp) => {
        if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
        resolve(resp);
      });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Updates the clock and date display
 */
function updateClock() {
  if (!clockElement || !dateElement) return;

  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');

  clockElement.textContent = `${hours}:${minutes}`;

  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  dateElement.textContent = now.toLocaleDateString(undefined, options);
}

function weatherCodeToEmoji(code) {
  // Mapping from Open-Meteo weathercodes to simple emoji/icons
  if (code === 0) return '☀️';
  if (code === 1 || code === 2 || code === 3) return '⛅';
  if (code === 45 || code === 48) return '🌫️';
  if (code >= 51 && code <= 67) return '🌧️';
  if (code >= 71 && code <= 77) return '🌨️';
  if (code >= 80 && code <= 86) return '🌦️';
  if (code >= 95 && code <= 99) return '⛈️';
  return '🌤️';
}

async function fetchWeatherFor(lat, lon) {
  try {
    // Ask the background script to fetch weather (avoids CORS issues)
    const resp = await runtimeSendMessage({ action: 'fetchWeather', lat, lon });
    if (!resp || resp.error) throw new Error(resp && resp.error ? resp.error : 'No weather response');
    return { temperature: resp.temperature, weathercode: resp.weathercode };
  } catch (err) {
    console.error('fetchWeatherFor error', err);
    return null;
  }
}

async function reverseGeocode(lat, lon) {
  try {
    const resp = await runtimeSendMessage({ action: 'reverseGeocode', lat, lon });
    if (!resp || resp.error) throw new Error(resp && resp.error ? resp.error : 'No reverse response');
    return resp.name || '';
  } catch (err) {
    console.warn('reverseGeocode failed', err);
    return '';
  }
}

async function ipGeolocation() {
  try {
    const resp = await runtimeSendMessage({ action: 'ipLookup' });
    if (!resp) throw new Error('No ip lookup response');
    // If background returned a fallback, prefer it rather than throwing
    if (resp.fallback && !resp.lat) {
      return { lat: resp.fallback.lat, lon: resp.fallback.lon, city: resp.fallback.city, fallback: true };
    }
    if (resp.error && !resp.lat) throw new Error(resp.error);
    return { lat: resp.lat, lon: resp.lon, city: resp.city, fallback: false };
  } catch (err) {
    console.warn('ipGeolocation failed', err);
    return null;
  }
}

async function updateWeatherUIFromPosition(lat, lon, providedCity) {
  if (!weatherElement) return;
  const weather = await fetchWeatherFor(lat, lon);
  if (!weather) {
    weatherElement.textContent = 'Weather unavailable';
    return;
  }

  let locationName = providedCity || await reverseGeocode(lat, lon);
  if (!locationName) locationName = 'Your location';

  const emoji = weatherCodeToEmoji(weather.weathercode);
  weatherElement.textContent = `${emoji} ${Math.round(weather.temperature)}°C — ${locationName}`;
}

async function setupWeather() {
  if (!weatherElement) return;

  // Try browser geolocation first
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      await updateWeatherUIFromPosition(lat, lon);
    }, async (err) => {
      // Fallback to IP-based geolocation
      console.warn('Geolocation denied or failed, falling back to IP lookup', err);
      const ipLoc = await ipGeolocation();
      if (ipLoc) {
        if (ipLoc.fallback) {
          // Providers failed and background returned a generic fallback — avoid showing it as the user's location
          weatherElement.textContent = 'Location unavailable (allow location or set location in settings)';
        } else {
          await updateWeatherUIFromPosition(ipLoc.lat, ipLoc.lon, ipLoc.city);
        }
      } else {
        weatherElement.textContent = 'Location unavailable';
      }
    }, { maximumAge: 60 * 1000, timeout: 5000 });
  } else {
    const ipLoc = await ipGeolocation();
    if (ipLoc) {
      if (ipLoc.fallback) {
        weatherElement.textContent = 'Location unavailable (allow location or set location in settings)';
      } else {
        await updateWeatherUIFromPosition(ipLoc.lat, ipLoc.lon, ipLoc.city);
      }
    } else {
      weatherElement.textContent = 'Location unavailable';
    }
  }

  // Refresh weather every 15 minutes
  if (weatherIntervalId) clearInterval(weatherIntervalId);
  weatherIntervalId = setInterval(async () => {
    // try to read current displayed location from reverse geocode? just call geolocation again
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        await updateWeatherUIFromPosition(pos.coords.latitude, pos.coords.longitude);
      }, async () => {
        const ipLoc = await ipGeolocation();
        if (ipLoc) await updateWeatherUIFromPosition(ipLoc.lat, ipLoc.lon, ipLoc.city);
      });
    } else {
      const ipLoc = await ipGeolocation();
      if (ipLoc) await updateWeatherUIFromPosition(ipLoc.lat, ipLoc.lon, ipLoc.city);
    }
  }, 15 * 60 * 1000);
}

// Export the initialization function to the global scope
window.initClockFunction = function(clockEl, dateEl) {
  console.log('Initializing clock with:', clockEl, dateEl);

  // Store elements for later use
  clockElement = clockEl;
  dateElement = dateEl;
  weatherElement = document.getElementById('weather');

  // Storage helpers (cross-browser)
  function storageGet(key) {
    if (typeof browser !== 'undefined') return browser.storage.local.get(key);
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.get(key, (res) => {
          if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
          resolve(res);
        });
      } catch (err) { reject(err); }
    });
  }

  function storageSet(obj) {
    if (typeof browser !== 'undefined') return browser.storage.local.set(obj);
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.set(obj, () => {
          if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
          resolve();
        });
      } catch (err) { reject(err); }
    });
  }

  // Load saved manual location if present
  (async () => {
    try {
      const data = await storageGet('rdex_location');
      const saved = data && data.rdex_location ? data.rdex_location : null;
      if (saved && saved.lat && saved.lon) {
        // Use saved location immediately
        updateWeatherUIFromPosition(saved.lat, saved.lon, saved.name || saved.city || 'Saved location');
      } else {
        // No saved location; proceed with normal setup
        setupWeather();
      }
    } catch (e) {
      console.warn('Error reading saved location', e);
      setupWeather();
    }
  })();

  // Wire up location UI events
  const locBtn = document.getElementById('location-btn');
  const locModal = document.getElementById('location-modal');
  const locInput = document.getElementById('location-input');
  const locSave = document.getElementById('location-modal-save');
  const locCancel = document.getElementById('location-modal-cancel');
  const locUseGeo = document.getElementById('location-use-geolocation');

  function showLocModal() { locModal.classList.remove('hidden'); locModal.style.display = 'flex'; }
  function hideLocModal() { locModal.classList.add('hidden'); locModal.style.display = 'none'; }

  if (locBtn) locBtn.addEventListener('click', () => { showLocModal(); });
  if (locCancel) locCancel.addEventListener('click', () => { hideLocModal(); });

  if (locUseGeo) locUseGeo.addEventListener('click', async () => {
    // Clear saved location and re-run geolocation
    try {
      await storageSet({ rdex_location: null });
    } catch (e) { console.warn('Could not clear saved location', e); }
    hideLocModal();
    setupWeather();
  });

  if (locSave) locSave.addEventListener('click', async () => {
    const q = locInput.value && locInput.value.trim();
    if (!q) return;
    try {
      const resp = await runtimeSendMessage({ action: 'forwardGeocode', q });
      if (!resp || resp.error) {
        alert('Could not find that location');
        return;
      }
      const saved = { lat: resp.lat, lon: resp.lon, name: resp.name };
      await storageSet({ rdex_location: saved });
      hideLocModal();
      updateWeatherUIFromPosition(saved.lat, saved.lon, saved.name);
    } catch (err) {
      console.error('Error saving location', err);
      alert('Error saving location');
    }
  });

  // Update clock immediately
  updateClock();

  // Start weather setup (async)
  try {
    setupWeather();
  } catch (err) {
    console.error('setupWeather error', err);
  }

  // Set interval for clock updates
  return setInterval(updateClock, 1000);
};
