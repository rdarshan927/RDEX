/* Focus functionality for RDEX Dashboard */

// DOM Elements
const focusInput = document.getElementById('focus-input');
const focusInputContainer = document.getElementById('focus-input-container');
const focusDisplay = document.getElementById('focus-display');
const focusText = document.getElementById('focus-text');
const focusCheckbox = document.getElementById('focus-checkbox');
const focusEditBtn = document.getElementById('focus-edit-btn');

/**
 * Initializes the focus section
 */
function initFocus() {
  const savedFocus = Storage.getData(STORAGE_KEYS.FOCUS);
  const isCompleted = Storage.getData(STORAGE_KEYS.FOCUS_COMPLETED, false);
  
  if (savedFocus) {
    // Show saved focus
    showFocus(savedFocus, isCompleted);
  } else {
    // Show input for new focus
    showFocusInput();
  }
  
  // Event listeners
  focusInput.addEventListener('keypress', handleFocusInput);
  focusCheckbox.addEventListener('change', handleFocusCompletion);
  focusEditBtn.addEventListener('click', handleFocusEdit);
}

/**
 * Handles focus input submission
 * @param {Event} e - Keyboard event
 */
function handleFocusInput(e) {
  if (e.key === 'Enter' && focusInput.value.trim() !== '') {
    const focus = focusInput.value.trim();
    Storage.saveData(STORAGE_KEYS.FOCUS, focus);
    Storage.saveData(STORAGE_KEYS.FOCUS_COMPLETED, false);
    showFocus(focus, false);
  }
}

/**
 * Displays the saved focus
 * @param {string} focus - The focus text
 * @param {boolean} isCompleted - Whether the focus is completed
 */
function showFocus(focus, isCompleted) {
  focusText.textContent = focus;
  focusCheckbox.checked = isCompleted;
  
  // Apply strikethrough if completed
  if (isCompleted) {
    focusText.classList.add('line-through', 'opacity-50');
  } else {
    focusText.classList.remove('line-through', 'opacity-50');
  }
  
  // Show display and hide input
  focusDisplay.classList.remove('hidden');
  focusInputContainer.classList.add('hidden');
}

/**
 * Shows the focus input field
 */
function showFocusInput() {
  focusInput.value = '';
  focusDisplay.classList.add('hidden');
  focusInputContainer.classList.remove('hidden');
  focusInput.focus();
}

/**
 * Handles focus completion checkbox
 */
function handleFocusCompletion() {
  const isCompleted = focusCheckbox.checked;
  Storage.saveData(STORAGE_KEYS.FOCUS_COMPLETED, isCompleted);
  
  if (isCompleted) {
    focusText.classList.add('line-through', 'opacity-50');
  } else {
    focusText.classList.remove('line-through', 'opacity-50');
  }
}

/**
 * Handles editing the current focus
 */
function handleFocusEdit() {
  const currentFocus = Storage.getData(STORAGE_KEYS.FOCUS, '');
  focusInput.value = currentFocus;
  showFocusInput();
}

// Initialize focus feature when DOM is loaded
document.addEventListener('DOMContentLoaded', initFocus);
