/* Background service worker for RDEX Dashboard */

// List of background images (could be expanded or fetched from an API)
const backgroundImages = [
  'images/bg1.jpg',
  'images/bg2.jpg',
  'images/bg3.jpg',
  'images/bg4.jpg',
  'images/bg5.jpg'
];

/**
 * Gets a random background image
 * @returns {string} - URL of the background image
 */
function getRandomBackground() {
  const randomIndex = Math.floor(Math.random() * backgroundImages.length);
  return backgroundImages[randomIndex];
}

/**
 * Updates the background image
 */
function updateBackgroundImage() {
  const body = document.querySelector('body');
  
  // Check if we need a new background for today
  const today = new Date().toDateString();
  const lastBgDate = Storage.getData(STORAGE_KEYS.LAST_BACKGROUND_DATE, '');
  
  if (lastBgDate !== today) {
    // Set new background
    const newBackground = getRandomBackground();
    body.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('${newBackground}')`;
    
    // Save to storage
    Storage.saveData(STORAGE_KEYS.CURRENT_BACKGROUND, newBackground);
    Storage.saveData(STORAGE_KEYS.LAST_BACKGROUND_DATE, today);
  } else {
    // Use saved background
    const currentBg = Storage.getData(STORAGE_KEYS.CURRENT_BACKGROUND, backgroundImages[0]);
    body.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('${currentBg}')`;
  }
}

// Update background when page loads
document.addEventListener('DOMContentLoaded', updateBackgroundImage);
