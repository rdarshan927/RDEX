/* Focus functionality for RDEX Dashboard */

// DOM Elements
let focusInput = null;
let focusContainer = null;

/**
 * Initializes the focus section
 */
function initFocus(inputElement) {
  console.log("Initializing focus with:", inputElement);
  
  focusInput = inputElement;
  focusContainer = document.getElementById('focus-container');
  
  if (!focusInput) {
    console.error("Focus input element not found");
    return;
  }
  
  // Load saved focus
  loadFocus();
  
  // Set up event listeners
  focusInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      saveFocus();
    }
  });
  
  focusInput.addEventListener('blur', saveFocus);
}

// Load focus from storage
async function loadFocus() {
  if (!focusInput) return;
  
  try {
    const data = await browser.storage.local.get(window.STORAGE_KEYS.FOCUS);
    if (data && data[window.STORAGE_KEYS.FOCUS]) {
      focusInput.value = data[window.STORAGE_KEYS.FOCUS];
      showFocusCompleted();
    } else {
      showFocusInput();
    }
  } catch (error) {
    console.error("Error loading focus:", error);
    showFocusInput();
  }
}

// Save focus to storage
async function saveFocus() {
  if (!focusInput) return;
  
  const focus = focusInput.value.trim();
  
  try {
    await browser.storage.local.set({ 
      [window.STORAGE_KEYS.FOCUS]: focus 
    });
    
    if (focus) {
      showFocusCompleted();
    } else {
      showFocusInput();
    }
  } catch (error) {
    console.error("Error saving focus:", error);
  }
}

// Show focus input UI
function showFocusInput() {
  if (focusContainer) {
    focusContainer.classList.add('active');
  }
}

// Show completed focus UI
function showFocusCompleted() {
  if (focusContainer) {
    focusContainer.classList.add('completed');
  }
}

// Make the function available globally
window.initFocus = initFocus;

// Initialize focus feature when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const inputElement = document.getElementById('focus-input');
  initFocus(inputElement);
});
