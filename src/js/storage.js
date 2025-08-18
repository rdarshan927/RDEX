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

// Storage keys
const STORAGE_KEYS = {
  FOCUS: 'rdex_focus',
  FOCUS_COMPLETED: 'rdex_focus_completed',
  LINKS: 'rdex_links',
  LAST_QUOTE_DATE: 'rdex_last_quote_date',
  CURRENT_QUOTE: 'rdex_current_quote',
  LAST_BACKGROUND_DATE: 'rdex_last_bg_date',
  CURRENT_BACKGROUND: 'rdex_current_bg'
};
