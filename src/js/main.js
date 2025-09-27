// Main entry point for the RDEX dashboard

// Ensure browser compatibility
if (typeof browser === 'undefined') {
  var browser = chrome;
}

// Global interval IDs for cleanup
const intervals = window.__rdex_intervals || { clock: null, background: null };
window.__rdex_intervals = intervals;

// Start clock safely (clear previous interval first)
function startClock(clockEl, dateEl) {
  // clear previous interval if exists
  if (intervals.clock) {
    clearInterval(intervals.clock);
    intervals.clock = null;
  }

  if (clockEl && dateEl && window.initClockFunction) {
    intervals.clock = window.initClockFunction(clockEl, dateEl);
  }
}

// Initialize the dashboard
function initDashboard() {
  console.log("Initializing dashboard...");
  
  // Get DOM elements
  const elements = {
    clockEl: document.getElementById('clock'),
    dateEl: document.getElementById('date'),
    quoteEl: document.getElementById('quote'),
    authorEl: document.getElementById('author'),
    focusInput: document.getElementById('focus-input'),
    backgroundContainer: document.getElementById('background-container')
  };
  
  // Log elements for debugging
  console.log("Dashboard elements:", elements);
  
  // Initialize clock with optimization if elements exist
  if (elements.clockEl && elements.dateEl && window.initClockFunction) {
    intervals.clock = window.initClockFunction(elements.clockEl, elements.dateEl);
  } else {
    console.error("Clock elements or function not available");
  }
  
  // Initialize background image
  if (elements.backgroundContainer && window.initBackground) {
    window.initBackground(elements.backgroundContainer);
  } else {
    console.error("Background container or function not available");
  }
  
  // Initialize quote display
  if (elements.quoteEl && elements.authorEl && window.initQuote) {
    window.initQuote(elements.quoteEl, elements.authorEl);
  } else {
    console.error("Quote elements or function not available");
  }
  
  // Initialize focus input
  if (elements.focusInput && window.initFocus) {
    window.initFocus(elements.focusInput);
  } else {
    console.error("Focus input or function not available");
  }
  
  // Clean up on page unload
  window.addEventListener('beforeunload', cleanupIntervals);
  
  // Optimize for visibility state
  document.addEventListener('visibilitychange', handleVisibilityChange);
}

// Handle visibility change (tab active/inactive)
function handleVisibilityChange() {
  if (document.hidden) {
    // Pause updates when tab is not visible
    cleanupIntervals();
  } else {
    // Resume updates when tab becomes visible
    const clockEl = document.getElementById('clock');
    const dateEl = document.getElementById('date');
    if (clockEl && dateEl) startClock(clockEl, dateEl);

    const quoteEl = document.getElementById('quote');
    const authorEl = document.getElementById('author');
    if (quoteEl && authorEl && typeof window.initQuote === 'function') {
      window.initQuote(quoteEl, authorEl);
    }
  }
}

// Clean up all intervals
function cleanupIntervals() {
  for (const key in intervals) {
    if (intervals[key]) {
      clearInterval(intervals[key]);
      intervals[key] = null;
    }
  }
}

// Add this at the bottom of main.js for debugging
window.debugElements = function() {
  console.log("Checking DOM elements...");
  
  const elements = [
    "clock", "date", "quote", "author", "focus-input", "background-container",
    "bookmarks-container", "add-bookmark-btn", "bookmark-modal"
  ];
  
  elements.forEach(id => {
    const element = document.getElementById(id);
    console.log(`${id}: ${element ? "Found" : "NOT FOUND"}`);
  });
  
  console.log("Checking global functions...");
  console.log("initClockFunction:", typeof window.initClockFunction === "function" ? "Available" : "NOT AVAILABLE");
  console.log("initBackground:", typeof window.initBackground === "function" ? "Available" : "NOT AVAILABLE");
  console.log("initQuote:", typeof window.initQuote === "function" ? "Available" : "NOT AVAILABLE");
  console.log("initFocus:", typeof window.initFocus === "function" ? "Available" : "NOT AVAILABLE");
};

// Initialize the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM loaded, initializing dashboard");
  setTimeout(() => {
    initDashboard();
    window.debugElements();
  }, 500); // Small delay to ensure scripts are loaded
});
