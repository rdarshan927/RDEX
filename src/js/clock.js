/* Clock functionality */

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

// Export the initialization function to the global scope
window.initClockFunction = function(clockEl, dateEl) {
  console.log("Initializing clock with:", clockEl, dateEl);

  // Store elements for later use
  clockElement = clockEl;
  dateElement = dateEl;

  // Update clock immediately
  updateClock();

  // Set interval for clock updates
  return setInterval(updateClock, 1000);
};
