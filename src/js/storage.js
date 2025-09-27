/* Storage utility functions for RDEX Dashboard */

/**
 * Storage class to handle local storage operations
 */
class Storage {
  /**
   * Save data to localStorage
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   */
  static saveData(key, value) {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error(`Error saving data to localStorage: ${error}`);
    }
  }

  /**
   * Get data from localStorage
   * @param {string} key - Storage key
   * @param {any} defaultValue - Default value if key doesn't exist
   * @returns {any} - Retrieved value or default value
   */
  static getData(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(key);
      if (value === null) {
        return defaultValue;
      }
      return JSON.parse(value);
    } catch (error) {
      console.error(`Error retrieving data from localStorage: ${error}`);
      return defaultValue;
    }
  }

  /**
   * Remove data from localStorage
   * @param {string} key - Storage key to remove
   */
  static removeData(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing data from localStorage: ${error}`);
    }
  }

  /**
   * Clear all data from localStorage
   */
  static clearAll() {
    try {
      localStorage.clear();
    } catch (error) {
      console.error(`Error clearing localStorage: ${error}`);
    }
  }
}

// In storage.js - declare the global variable
// Make sure STORAGE_KEYS is defined only once and globally

// Check if STORAGE_KEYS already exists
if (!window.STORAGE_KEYS) {
  window.STORAGE_KEYS = {
    FOCUS: 'rdex_focus',
    FOCUS_COMPLETED: 'rdex_focus_completed',
    LINKS: 'rdex_links',
    LAST_QUOTE_DATE: 'rdex_last_quote_date',
    CURRENT_QUOTE: 'rdex_current_quote',
    LAST_BACKGROUND_DATE: 'rdex_last_bg_date',
    CURRENT_BACKGROUND: 'rdex_current_bg',
    BOOKMARKS: 'rdex_bookmarks'
  };
}

// Add simple debounce helper for expensive saves
window.__rdex_debounceMap = window.__rdex_debounceMap || new Map();

function debouncedSet(key, value, delay = 500) {
  if (window.__rdex_debounceMap.has(key)) {
    clearTimeout(window.__rdex_debounceMap.get(key));
  }
  const t = setTimeout(() => {
    browser.storage.local.set({ [key]: value }).catch(e => {
      console.error('storage set failed', e);
    });
    window.__rdex_debounceMap.delete(key);
  }, delay);
  window.__rdex_debounceMap.set(key, t);
}

// Use debouncedSet instead of browser.storage.local.set for frequent saves (bookmarks, focus, wallpaper)
