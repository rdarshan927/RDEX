// Background wallpaper manager for RDEX

// Make sure STORAGE_KEYS is available
if (!window.STORAGE_KEYS) {
  window.STORAGE_KEYS = {};
}
if (!window.STORAGE_KEYS.WALLPAPER) {
  window.STORAGE_KEYS.WALLPAPER = 'rdex_wallpaper';
}

// List of preset wallpapers
const PRESET_WALLPAPERS = [
  { id: 'default', url: 'images/default-bg.jpg', name: 'Default' },
  { id: 'bg1', url: 'images/default-bg.jpg', name: 'Mountains' },
  { id: 'bg2', url: 'images/default-bg2.jpg', name: 'Ocean' },
  { id: 'bg3', url: 'images/bg3.jpg', name: 'Forest' },
  { id: 'bg4', url: 'images/bg4.jpg', name: 'City' },
  // Add more as needed
];

// Wallpaper manager class
class WallpaperManager {
  constructor() {
    // DOM Elements
    this.backgroundContainer = document.getElementById('background-container');
    this.settingsBtn = document.getElementById('wallpaper-settings-btn');
    this.modal = document.getElementById('wallpaper-modal');
    this.closeBtn = document.getElementById('wallpaper-modal-close');
    this.fileInput = document.getElementById('wallpaper-file-input');
    this.uploadBtn = document.getElementById('wallpaper-upload-btn');
    this.urlInput = document.getElementById('wallpaper-url-input');
    this.urlBtn = document.getElementById('wallpaper-url-btn');
    this.resetBtn = document.getElementById('wallpaper-reset-btn');
    this.presetsContainer = document.getElementById('wallpaper-presets');
    
    // Check if elements exist
    if (!this.backgroundContainer) {
      console.error("Background container not found");
      return;
    }
    
    if (!this.settingsBtn || !this.modal) {
      console.error("Wallpaper settings UI elements not found");
      return;
    }
    
    // expose instance for debug/other modules
    window.__rdex_wallpaper_manager = this;

    // prevent installing multiple keydown handlers
    if (!window.__rdex_wallpaper_keydown_installed) {
      window.__rdex_wallpaper_keydown_installed = true;
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
          this.closeModal();
        }
      });
    }

    // Initialize the manager
    this.init();
  }
  
  // Initialize the wallpaper manager
  async init() {
    // Set up event listeners
    this.setupEventListeners();
    
    // Generate preset wallpapers
    this.generatePresets();
    
    // Load saved wallpaper
    await this.loadWallpaper();
  }
  
  // Set up UI event listeners
  setupEventListeners() {
    // Open settings modal
    this.settingsBtn.addEventListener('click', () => {
      this.openModal();
    });
    
    // Close modal
    this.closeBtn.addEventListener('click', () => {
      this.closeModal();
    });
    
    // Upload file button
    this.uploadBtn.addEventListener('click', () => {
      this.handleFileUpload();
    });
    
    // URL button
    this.urlBtn.addEventListener('click', () => {
      this.handleUrlInput();
    });
    
    // Reset button
    this.resetBtn.addEventListener('click', () => {
      this.resetWallpaper();
    });
    
    // Modal backdrop click to close
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.closeModal();
      }
    });
  }
  
  // Generate preset wallpaper options
  generatePresets() {
    if (!this.presetsContainer) return;
    
    // Clear existing presets
    this.presetsContainer.innerHTML = '';
    
    // Add all preset options
    PRESET_WALLPAPERS.forEach(preset => {
      const presetEl = document.createElement('div');
      presetEl.className = 'relative aspect-video bg-cover bg-center rounded cursor-pointer overflow-hidden group wallpaper-preset';
      presetEl.setAttribute('data-wallpaper', preset.id);
      
      // Log for debugging
      console.log(`Creating preset for ${preset.id} with image: ${preset.url}`);
      
      // Set background image
      presetEl.style.backgroundImage = `url('${preset.url}')`;
      
      // Add hover overlay
      const overlay = document.createElement('div');
      overlay.className = 'absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all';
      presetEl.appendChild(overlay);
      
      // Add name label
      if (preset.name) {
        const nameLabel = document.createElement('div');
        nameLabel.className = 'absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs py-1 text-center';
        nameLabel.textContent = preset.name;
        presetEl.appendChild(nameLabel);
      }
      
      // Click event
      presetEl.addEventListener('click', () => {
        console.log(`Preset ${preset.id} clicked, setting wallpaper to: ${preset.url}`);
        this.setWallpaper(preset.url);
      });
      
      this.presetsContainer.appendChild(presetEl);
    });
    
    // Log total presets created
    console.log(`Total presets created: ${this.presetsContainer.children.length}`);
  }
  
  // Open the settings modal
  openModal() {
    this.modal.classList.remove('hidden');
  }
  
  // Close the settings modal
  closeModal() {
    this.modal.classList.add('hidden');
  }
  
  // Handle file upload for wallpaper
  handleFileUpload() {
    if (!this.fileInput || !this.fileInput.files || this.fileInput.files.length === 0) {
      alert('Please select an image file first.');
      return;
    }

    const file = this.fileInput.files[0];

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }

    // Enforce smaller limit to avoid huge data URLs (1 MB)
    const MAX_BYTES = 1 * 1024 * 1024; // 1 MB
    if (file.size > MAX_BYTES) {
      alert('Image is too large. Please select an image under 1 MB to avoid memory/storage issues.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      // quick safety check on encoded size
      if (dataUrl && dataUrl.length > 1024 * 1024 * 2) { // ~2MB
        alert('Image is too large when encoded. Please pick a smaller image.');
        return;
      }
      this.setWallpaper(dataUrl);
    };
    reader.onerror = () => {
      alert('Error reading the file. Please try again.');
    };

    reader.readAsDataURL(file);
  }
  
  // Handle URL input for wallpaper
  handleUrlInput() {
    const url = this.urlInput.value.trim();
    
    if (!url) {
      alert('Please enter a valid image URL.');
      return;
    }
    
    // Test if the URL is valid
    try {
      new URL(url);
    } catch (e) {
      alert('Please enter a valid URL with http:// or https://');
      return;
    }
    
    // Check if URL points to an image by loading it
    const img = new Image();
    img.onload = () => {
      this.setWallpaper(url);
    };
    img.onerror = () => {
      alert('Could not load image from URL. Please check the URL and try again.');
    };
    img.src = url;
  }
  
  // Reset wallpaper to default
  resetWallpaper() {
    const defaultWallpaper = PRESET_WALLPAPERS[0].url;
    this.setWallpaper(defaultWallpaper);
  }
  
  // Set the wallpaper
  async setWallpaper(wallpaperUrl) {
    if (!this.backgroundContainer) return;
    
    try {
      // Update the background image
      this.backgroundContainer.style.backgroundImage = `url('${wallpaperUrl}')`;
      
      // Save the wallpaper to storage
      await this.saveWallpaper(wallpaperUrl);
      
      // Close the modal
      this.closeModal();
      
      console.log('Wallpaper set successfully:', wallpaperUrl);
    } catch (error) {
      console.error('Error setting wallpaper:', error);
      alert('Could not set wallpaper. Please try again.');
    }
  }
  
  // Save wallpaper to storage
  async saveWallpaper(wallpaperUrl) {
    try {
      const storageKey = window.STORAGE_KEYS.WALLPAPER || 'rdex_wallpaper';

      // prefer debouncedSet if available
      if (typeof window.debouncedSet === 'function') {
        window.debouncedSet(storageKey, wallpaperUrl);
      } else {
        await browser.storage.local.set({ [storageKey]: wallpaperUrl });
      }

      try {
        localStorage.setItem(storageKey, wallpaperUrl);
      } catch (e) {
        console.log("Could not save wallpaper to localStorage (non-critical):", e);
      }
    } catch (error) {
      console.error('Error saving wallpaper to storage:', error);
      try {
        localStorage.setItem(window.STORAGE_KEYS.WALLPAPER, wallpaperUrl);
      } catch (e) {
        console.error('Could not save wallpaper to any storage:', e);
      }
    }
  }
  
  // Load wallpaper from storage
  async loadWallpaper() {
    try {
      // Try to load from browser storage
      const data = await browser.storage.local.get(window.STORAGE_KEYS.WALLPAPER);
      
      if (data && data[window.STORAGE_KEYS.WALLPAPER]) {
        this.backgroundContainer.style.backgroundImage = `url('${data[window.STORAGE_KEYS.WALLPAPER]}')`;
        console.log('Loaded wallpaper from browser storage');
        return;
      }
      
      // Try localStorage as fallback
      const localData = localStorage.getItem(window.STORAGE_KEYS.WALLPAPER);
      if (localData) {
        this.backgroundContainer.style.backgroundImage = `url('${localData}')`;
        console.log('Loaded wallpaper from localStorage');
        
        // Also save to browser storage for future use
        browser.storage.local.set({ 
          [window.STORAGE_KEYS.WALLPAPER]: localData 
        }).catch(e => console.log('Failed to sync localStorage to browser storage:', e));
        return;
      }
      
      // If no saved wallpaper, use default
      console.log('No saved wallpaper, using default');
      this.backgroundContainer.style.backgroundImage = `url('${PRESET_WALLPAPERS[0].url}')`;
      
    } catch (error) {
      console.error('Error loading wallpaper:', error);
      
      // Use default wallpaper as fallback
      this.backgroundContainer.style.backgroundImage = `url('${PRESET_WALLPAPERS[0].url}')`;
    }
  }
}

// Initialize wallpaper manager
let wallpaperManager;
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing WallpaperManager');
  setTimeout(() => {
    wallpaperManager = new WallpaperManager();
  }, 500); // Small delay to ensure DOM is ready
});

// Export for testing
window.testWallpaperModal = function() {
  if (wallpaperManager) {
    wallpaperManager.openModal();
  } else {
    console.error('WallpaperManager not initialized');
  }
};