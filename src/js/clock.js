/* Clock functionality for RDEX Dashboard */

/**
 * Updates the clock and date display
 */
function updateClock() {
  const now = new Date();
  const timeElement = document.getElementById('time');
  const dateElement = document.getElementById('date');
  
  // Format time (HH:MM)
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  timeElement.textContent = `${hours}:${minutes}`;
  
  // Format date (Weekday, Month Day)
  const options = { weekday: 'long', month: 'long', day: 'numeric' };
  const formattedDate = now.toLocaleDateString(undefined, options);
  dateElement.textContent = formattedDate;
}

// Update clock immediately and then every second
updateClock();
setInterval(updateClock, 60000); // Update every minute
