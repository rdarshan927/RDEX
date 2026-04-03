// This is the background service worker for the RDEX Extension

// Check for browser compatibility
if (typeof browser === 'undefined') {
  var browser = chrome;
}

// Initialize extension
function initExtension() {
  setupContextMenu();
  setupMessageHandlers();
  setupCommandListeners();
  setupBrowserActionListener();
}

// Set up context menu
function setupContextMenu() {
  // Remove existing menu items to avoid duplicates
  browser.contextMenus.removeAll().then(() => {
    browser.contextMenus.create({
      id: "save-to-rdex",
      title: "Save to RDEX",
      contexts: ["page", "link"]
    });
  });

  // Context menu click handler
  browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "save-to-rdex") {
      const url = info.linkUrl || info.pageUrl;
      saveUrl(url, tab.title);
    }
  });
}

// Set up message handlers for communication with other extension parts
function setupMessageHandlers() {
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Background script received message:", message);
    
    if (message.action === "captureActiveTab") {
      getCurrentTabInfo().then(sendResponse);
      return true; // Required for async response
    } 
    else if (message.action === "getCurrentTabInfo") {
      getCurrentTabInfo().then(sendResponse);
      return true; // Required for async response
    }
    else if (message.action === 'ipLookup') {
      // Return { lat, lon, city } or { error }
      (async () => {
        // Try multiple providers then return a safe fallback if all fail
        const fallback = { lat: 40.7128, lon: -74.0060, city: 'New York' };
        try {
          // 1) try ip-api.com
          try {
            const r1 = await fetch('https://ip-api.com/json/?fields=status,message,country,regionName,city,lat,lon');
            if (r1.ok) {
              const d1 = await r1.json();
              if (d1 && d1.status === 'success') {
                return sendResponse({ lat: d1.lat, lon: d1.lon, city: d1.city || d1.regionName || d1.country });
              }
            }
          } catch (e) {
            console.warn('ip-api attempt failed', e);
          }

          // 2) try ipwho.is
          try {
            const r2 = await fetch('https://ipwho.is/json/');
            if (r2.ok) {
              const d2 = await r2.json();
              if (d2 && d2.success !== false) {
                return sendResponse({ lat: d2.latitude, lon: d2.longitude, city: d2.city || d2.region || d2.country });
              }
            }
          } catch (e) {
            console.warn('ipwho attempt failed', e);
          }

          // 3) try ipinfo.io
          try {
            const r3 = await fetch('https://ipinfo.io/json?token=');
            if (r3.ok) {
              const d3 = await r3.json();
              if (d3 && d3.loc) {
                const [lat, lon] = d3.loc.split(',');
                return sendResponse({ lat: parseFloat(lat), lon: parseFloat(lon), city: d3.city || d3.region || d3.country });
              }
            }
          } catch (e) {
            console.warn('ipinfo attempt failed', e);
          }

          // If all providers failed, return a fallback location rather than an outright error
          console.warn('All IP lookup providers failed, returning fallback');
          sendResponse({ error: 'ipLookup failed', fallback });
        } catch (err) {
          console.warn('background ipLookup error', err);
          sendResponse({ error: String(err), fallback });
        }
      })();
      return true;
    }
    else if (message.action === 'reverseGeocode') {
      const { lat, lon } = message;
      (async () => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`);
          if (!res.ok) throw new Error('reverseGeocode failed');
          const data = await res.json();
          const address = data.address || {};
          const name = address.city || address.town || address.village || data.display_name || '';
          sendResponse({ name });
        } catch (err) {
          console.warn('background reverseGeocode error', err);
          sendResponse({ error: String(err) });
        }
      })();
      return true;
    }
    else if (message.action === 'forwardGeocode') {
      const { q } = message;
      (async () => {
        try {
          if (!q || typeof q !== 'string') throw new Error('Invalid query');
          const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&limit=1`;
          const res = await fetch(url);
          if (!res.ok) throw new Error('forwardGeocode failed');
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const item = data[0];
            return sendResponse({ lat: parseFloat(item.lat), lon: parseFloat(item.lon), name: item.display_name });
          }
          sendResponse({ error: 'No results' });
        } catch (err) {
          console.warn('background forwardGeocode error', err);
          sendResponse({ error: String(err) });
        }
      })();
      return true;
    }
    else if (message.action === 'fetchWeather') {
      const { lat, lon } = message;
      (async () => {
        try {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&current_weather=true&timezone=auto`;
          const res = await fetch(url);
          if (!res.ok) throw new Error('fetchWeather failed');
          const data = await res.json();
          if (!data || !data.current_weather) throw new Error('No weather data');
          sendResponse({ temperature: data.current_weather.temperature, weathercode: data.current_weather.weathercode });
        } catch (err) {
          console.warn('background fetchWeather error', err);
          sendResponse({ error: String(err) });
        }
      })();
      return true;
    }
    else if (message.action === 'fetchQuote') {
      (async () => {
        try {
          const res = await fetch('https://api.quotable.io/random');
          if (res && res.ok) {
            const data = await res.json();
            return sendResponse({ text: data.content, author: data.author });
          }
        } catch (err) {
          console.warn('background fetchQuote attempt failed', err);
        }

        // If network fetching fails, return a small built-in fallback quote
        const fallbackQuotes = [
          { text: 'The best way to predict the future is to invent it.', author: 'Alan Kay' },
          { text: 'Simplicity is the soul of efficiency.', author: 'Austin Freeman' },
          { text: 'Action is the foundational key to all success.', author: 'Pablo Picasso' }
        ];
        const q = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
        sendResponse({ text: q.text, author: q.author });
      })();
      return true;
    }
  });
}

// Set up keyboard shortcut listeners
function setupCommandListeners() {
  browser.commands.onCommand.addListener((command) => {
    if (command === "save-current-tab") {
      getCurrentTabInfo().then(tabInfo => {
        if (tabInfo && tabInfo.url) {
          saveUrl(tabInfo.url, tabInfo.title);
        }
      });
    }
  });
}

// Set up browser action (toolbar button) click handler
function setupBrowserActionListener() {
  browser.action.onClicked.addListener((tab) => {
    // Don't save the extension page itself
    if (!tab.url.includes('moz-extension:') && 
        !tab.url.includes('chrome-extension:')) {
      saveUrl(tab.url, tab.title);
    }
  });
}

// Get current tab information
async function getCurrentTabInfo() {
  try {
    const tabs = await browser.tabs.query({active: true, currentWindow: true});
    
    // Skip extension pages
    if (tabs[0] && (!tabs[0].url.includes('moz-extension:') && 
                    !tabs[0].url.includes('chrome-extension:'))) {
      return {
        url: tabs[0].url,
        title: tabs[0].title
      };
    } 
    // If we're on an extension page, find the most recent non-extension tab
    else {
      const allTabs = await browser.tabs.query({currentWindow: true});
      const nonExtensionTab = allTabs.find(t => 
        !t.url.includes('moz-extension:') && 
        !t.url.includes('chrome-extension:'));
      
      if (nonExtensionTab) {
        return {
          url: nonExtensionTab.url,
          title: nonExtensionTab.title
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error getting tab info:", error);
    return null;
  }
}

// Save a URL to the extension storage
async function saveUrl(url, title) {
  try {
    if (!url) return;
    
    // Sanitize the URL
    try {
      new URL(url);
    } catch (e) {
      console.error("Invalid URL:", url);
      return;
    }
    
    // Get existing bookmarks
    const data = await browser.storage.local.get('rdex_bookmarks');
    const bookmarks = data.rdex_bookmarks || [];
    
    // Check for duplicates
    const isDuplicate = bookmarks.some(bookmark => bookmark.url === url);
    
    // Add new bookmark if not a duplicate
    if (!isDuplicate) {
      // Auto-detect icon
      let icon = '🌐';
      const domain = new URL(url).hostname.replace('www.', '');
      
      // Simple icon matching for common sites
      for (const [key, value] of Object.entries({
        'youtube.com': '📺',
        'mail.google': '✉️',
        'github.com': '💻',
        'docs.google': '📄',
        'calendar': '📅',
        'twitter.com': '👥',
        'facebook.com': '👥',
        'spotify.com': '🎵',
        'netflix.com': '📺',
      })) {
        if (domain.includes(key)) {
          icon = value;
          break;
        }
      }
      
      // Create new bookmark
      const newBookmark = {
        id: Date.now(),
        url: url,
        icon: icon,
        createdAt: new Date().toISOString()
      };
      
      // Save to storage
      bookmarks.push(newBookmark);
      await browser.storage.local.set({ 'rdex_bookmarks': bookmarks });
      
      // Show notification
      showNotification("Bookmark Added", `Added to your RDEX bookmarks`);
    } else {
      showNotification("Already Bookmarked", "This URL is already in your bookmarks");
    }
    
  } catch (error) {
    console.error("Error saving URL:", error);
    showNotification("Error", "Could not save bookmark");
  }
}

// Show a notification
function showNotification(title, message) {
  browser.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: title,
    message: message
  });
}

// Initialize the extension
initExtension();
