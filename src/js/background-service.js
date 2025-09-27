/* Background service worker for RDEX Dashboard */

// Update the path to use the existing default image:
const backgroundPath = 'images/default-bg.jpg';

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

// Background image service

let backgroundContainer = null;

// Set a random background
function setRandomBackground() {
  const backgroundContainer = document.getElementById('background-container');
  
  if (!backgroundContainer) {
    console.error("Background container not found");
    return;
  }
  
  try {
    // Try to load default background image
    const DEFAULT_BG = 'images/default-bg.jpg'; // Make sure this file exists!
    
    // First check if the default image exists
    const img = new Image();
    img.onload = function() {
      // Image exists, set it as background
      backgroundContainer.style.backgroundImage = `url('${DEFAULT_BG}')`;
    };
    img.onerror = function() {
      // If default image doesn't exist, use a color gradient
      console.warn("Default background image not found, using gradient");
      backgroundContainer.style.background = 'linear-gradient(to bottom right, #1a202c, #4a5568)';
    };
    img.src = DEFAULT_BG;
    
    // Always set these regardless of image
    backgroundContainer.style.backgroundSize = 'cover';
    backgroundContainer.style.backgroundPosition = 'center center';
  } catch (error) {
    console.error("Error setting background:", error);
  }
}

// Initialize background
window.initBackground = function(container) {
  console.log("Initializing background with:", container);
  
  // We'll do minimal initialization here as the wallpaper manager will take over
  if (container && !container.style.backgroundImage) {
    container.style.backgroundSize = 'cover';
    container.style.backgroundPosition = 'center center';
    
    // Apply default styles but let wallpaper manager set the actual image
    container.style.backgroundColor = '#121212'; // Fallback color
  }
};

// Export for global use
window.setRandomBackground = setRandomBackground;
