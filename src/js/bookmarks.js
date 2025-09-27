// Bookmarks management

// Make sure STORAGE_KEYS exists and has BOOKMARKS property
if (!window.STORAGE_KEYS) {
  window.STORAGE_KEYS = {};
}
if (!window.STORAGE_KEYS.BOOKMARKS) {
  window.STORAGE_KEYS.BOOKMARKS = 'rdex_bookmarks';
}

// Icon presets for quick selection
const ICON_PRESETS = {
  globe: '🌐',
  youtube: '📺',
  mail: '✉️',
  docs: '📄',
  code: '💻',
  calendar: '📅',
  music: '🎵',
  social: '👥'
};

// Icon map for common websites - auto-detection
const ICON_MAP = {
  'youtube.com': { icon: '📺', name: 'YouTube' },
  'mail.google.com': { icon: '✉️', name: 'Gmail' },
  'github.com': { icon: '💻', name: 'GitHub' },
  'docs.google.com': { icon: '📄', name: 'Google Docs' },
  'calendar.google.com': { icon: '📅', name: 'Calendar' },
  'twitter.com': { icon: '👥', name: 'Twitter' },
  'facebook.com': { icon: '👥', name: 'Facebook' },
  'spotify.com': { icon: '🎵', name: 'Spotify' },
  'netflix.com': { icon: '📺', name: 'Netflix' },
};

// Bookmark management
class BookmarkManager {
  constructor() {
    console.log("Initializing BookmarkManager");
    this.bookmarks = [];
    this.bookmarksContainer = document.getElementById('bookmarks-container');
    this.addBookmarkBtn = document.getElementById('add-bookmark-btn');
    this.modal = document.getElementById('bookmark-modal');
    
    if (!this.bookmarksContainer) {
      console.error("Bookmarks container not found");
      return;
    }
    
    if (!this.addBookmarkBtn) {
      console.error("Add bookmark button not found");
      return;
    }
    
    if (!this.modal) {
      console.error("Bookmark modal not found");
      return;
    }
    
    this.modalCancelBtn = document.getElementById('bookmark-modal-cancel');
    this.modalSaveBtn = document.getElementById('bookmark-modal-save');
    this.urlInput = document.getElementById('bookmark-url');
    this.iconInput = document.getElementById('bookmark-icon');
    this.iconPresets = document.querySelectorAll('.icon-preset');
    
    // Load bookmarks first, then initialize
    this.loadBookmarks().then(() => {
      this.setupEventListeners();
      this.renderBookmarks();
    });
  }

  // Set up all event listeners
  setupEventListeners() {
    console.log("Setting up bookmark event listeners");
    
    this.addBookmarkBtn.addEventListener('click', () => {
      console.log("Add bookmark button clicked!");
      this.openModal();
    });
    
    if (this.modalCancelBtn) {
      this.modalCancelBtn.addEventListener('click', () => this.closeModal());
    }
    
    if (this.modalSaveBtn) {
      this.modalSaveBtn.addEventListener('click', () => this.saveBookmark());
    }
    
    // Icon preset selection
    if (this.iconPresets && this.iconPresets.length > 0) {
      this.iconPresets.forEach(preset => {
        preset.addEventListener('click', () => {
          const iconType = preset.getAttribute('data-icon');
          this.iconInput.value = ICON_PRESETS[iconType];
          
          // Highlight the selected preset
          this.iconPresets.forEach(p => p.classList.remove('ring-2', 'ring-blue-500'));
          preset.classList.add('ring-2', 'ring-blue-500');
        });
      });
    }

    // URL input change - auto detect icon
    if (this.urlInput) {
      this.urlInput.addEventListener('blur', () => {
        if (!this.iconInput.value) {
          this.autoDetectIcon(this.urlInput.value);
        }
      });
    }

    // Listen for storage changes from other instances
    try {
      browser.storage.onChanged.addListener((changes) => {
        console.log("Storage changed:", changes);
        const bookmarksKey = window.STORAGE_KEYS.BOOKMARKS;
        if (changes[bookmarksKey]) {
          console.log("Bookmarks changed in storage, updating");
          this.bookmarks = changes[bookmarksKey].newValue || [];
          this.renderBookmarks();
        }
      });
    } catch (e) {
      console.error("Error setting up storage listener:", e);
    }
  }

  // Auto-detect icon based on URL
  autoDetectIcon(url) {
    try {
      if (!url) return;
      
      const domain = new URL(url).hostname.replace('www.', '');
      
      // Check if domain or part of it matches our icon map
      for (const [key, value] of Object.entries(ICON_MAP)) {
        if (domain.includes(key)) {
          this.iconInput.value = value.icon;
          return;
        }
      }
      
      // Default icon if no match
      this.iconInput.value = '🌐';
    } catch (e) {
      console.log('Invalid URL for icon detection');
    }
  }

  // Open the bookmark modal
  openModal(bookmark = null) {
    console.log("Opening bookmark modal");
    this.modal.classList.remove('hidden');
    
    if (bookmark) {
      // Edit mode
      this.urlInput.value = bookmark.url;
      this.iconInput.value = bookmark.icon;
      this.editingId = bookmark.id;
    } else {
      // New bookmark mode
      this.urlInput.value = '';
      this.iconInput.value = '';
      this.editingId = null;
      
      // Try to get current tab URL
      this.getCurrentTab();
    }
  }
  
  // Get current tab info for the modal
  async getCurrentTab() {
    try {
      console.log("Getting current tab info");
      // Try to message the background script for current tab info
      browser.runtime.sendMessage({ action: 'getCurrentTabInfo' })
        .then(response => {
          if (response && response.url) {
            console.log("Got tab info:", response);
            this.urlInput.value = response.url;
            this.autoDetectIcon(response.url);
          } else {
            console.log("No URL in response");
          }
        })
        .catch(err => console.log('Error getting tab info:', err));
    } catch (e) {
      console.log('Error requesting current tab:', e);
    }
  }

  // Close the bookmark modal
  closeModal() {
    this.modal.classList.add('hidden');
    this.editingId = null;
    
    // Reset selected preset
    if (this.iconPresets) {
      this.iconPresets.forEach(p => p.classList.remove('ring-2', 'ring-blue-500'));
    }
  }

  // Save the current bookmark
  saveBookmark() {
    const url = this.urlInput.value.trim();
    const icon = this.iconInput.value.trim() || '🌐';
    
    if (!url) {
      alert('Please enter a valid URL');
      return;
    }
    
    try {
      // Ensure URL is valid
      new URL(url);
      
      if (this.editingId) {
        // Update existing bookmark
        this.updateBookmark(this.editingId, url, icon);
      } else {
        // Add new bookmark
        this.addBookmark(url, icon);
      }
      
      this.closeModal();
    } catch (e) {
      alert('Please enter a valid URL with http:// or https://');
    }
  }

  // Add a new bookmark
  addBookmark(url, icon) {
    console.log("Adding bookmark:", url);
    
    const newBookmark = {
      id: Date.now(),
      url: url,
      icon: icon,
      createdAt: new Date().toISOString()
    };
    
    this.bookmarks.push(newBookmark);
    this.saveBookmarks();
  }

  // Update an existing bookmark
  updateBookmark(id, url, icon) {
    this.bookmarks = this.bookmarks.map(bookmark => 
      bookmark.id === id ? { ...bookmark, url, icon } : bookmark
    );
    this.saveBookmarks();
  }

  // Remove a bookmark
  removeBookmark(id) {
    this.bookmarks = this.bookmarks.filter(bookmark => bookmark.id !== id);
    this.saveBookmarks();
  }

  // Save bookmarks to browser storage
  async saveBookmarks() {
    try {
      console.log("Saving bookmarks to storage:", this.bookmarks);
      
      // Create a storage object with the correct key
      const storageObj = { 
        [window.STORAGE_KEYS.BOOKMARKS]: this.bookmarks 
      };
      
      // Save using browser.storage.local
      await browser.storage.local.set(storageObj);
      
      console.log("Bookmarks saved successfully");
      
      // Always re-render after saving
      this.renderBookmarks();
      
      // Also save to localStorage as backup
      try {
        localStorage.setItem(window.STORAGE_KEYS.BOOKMARKS, JSON.stringify(this.bookmarks));
      } catch (e) {
        console.log("Could not save to localStorage (non-critical):", e);
      }
    } catch (error) {
      console.error("Error saving bookmarks:", error);
      
      // Try using localStorage if browser.storage fails
      try {
        localStorage.setItem(window.STORAGE_KEYS.BOOKMARKS, JSON.stringify(this.bookmarks));
        console.log("Saved to localStorage as fallback");
      } catch (e) {
        console.error("Failed to save bookmarks to any storage:", e);
      }
    }
  }

  // Load bookmarks from browser storage
  async loadBookmarks() {
    try {
      console.log("Loading bookmarks from storage");
      
      // Try to load from browser.storage.local first
      const storageKey = window.STORAGE_KEYS.BOOKMARKS;
      const data = await browser.storage.local.get(storageKey);
      
      if (data && data[storageKey] && Array.isArray(data[storageKey])) {
        console.log("Loaded bookmarks from browser.storage:", data[storageKey]);
        this.bookmarks = data[storageKey];
      } else {
        console.log("No bookmarks found in browser.storage, checking localStorage");
        
        // Try localStorage as fallback
        const localData = localStorage.getItem(storageKey);
        if (localData) {
          try {
            const parsedData = JSON.parse(localData);
            if (Array.isArray(parsedData)) {
              console.log("Loaded bookmarks from localStorage:", parsedData);
              this.bookmarks = parsedData;
              
              // Also save to browser.storage for future use
              browser.storage.local.set({ [storageKey]: parsedData })
                .catch(e => console.log("Failed to sync localStorage to browser.storage:", e));
            }
          } catch (e) {
            console.error("Failed to parse localStorage data:", e);
            this.bookmarks = [];
          }
        } else {
          console.log("No bookmarks found in any storage");
          this.bookmarks = [];
        }
      }
    } catch (error) {
      console.error("Error loading bookmarks:", error);
      
      // Try localStorage as fallback
      try {
        const localData = localStorage.getItem(window.STORAGE_KEYS.BOOKMARKS);
        if (localData) {
          const parsedData = JSON.parse(localData);
          if (Array.isArray(parsedData)) {
            console.log("Loaded bookmarks from localStorage fallback:", parsedData);
            this.bookmarks = parsedData;
          }
        }
      } catch (e) {
        console.error("Failed to load bookmarks from any storage:", e);
        this.bookmarks = [];
      }
    }
    
    // Log the loaded bookmarks
    console.log("Final bookmarks after loading:", this.bookmarks);
  }

  // Render bookmarks in the sidebar
  renderBookmarks() {
    console.log("Rendering bookmarks:", this.bookmarks);
    
    if (!this.bookmarksContainer) {
      console.error("Cannot render: bookmarks container not found");
      return;
    }
    
    this.bookmarksContainer.innerHTML = '';
    
    if (!this.bookmarks || this.bookmarks.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'text-center text-gray-400 text-xs mt-4';
      emptyState.textContent = 'No bookmarks';
      this.bookmarksContainer.appendChild(emptyState);
      return;
    }
    
    this.bookmarks.forEach(bookmark => {
      const bookmarkEl = document.createElement('div');
      bookmarkEl.className = 'relative group';
      
      let hostname = '';
      try {
        hostname = new URL(bookmark.url).hostname.replace('www.', '');
      } catch (e) {
        hostname = bookmark.url;
      }
      
      bookmarkEl.innerHTML = `
        <a href="${bookmark.url}" class="block w-10 h-10 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 flex items-center justify-center text-lg transition-all" title="${hostname}">
          ${bookmark.icon}
        </a>
        <button class="delete-bookmark absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" data-id="${bookmark.id}">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      `;
      
      // Add delete event listener
      bookmarkEl.querySelector('.delete-bookmark').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = parseInt(e.currentTarget.getAttribute('data-id'));
        this.removeBookmark(id);
      });
      
      this.bookmarksContainer.appendChild(bookmarkEl);
    });
  }
}

// For debugging - call this from the console to see current storage state
window.checkBookmarkStorage = async function() {
  try {
    const key = window.STORAGE_KEYS.BOOKMARKS;
    const result = await browser.storage.local.get(key);
    console.log("Browser storage bookmarks:", result[key]);
    
    const localResult = localStorage.getItem(key);
    console.log("localStorage bookmarks:", localResult ? JSON.parse(localResult) : null);
    
    return { browserStorage: result[key], localStorage: localResult ? JSON.parse(localResult) : null };
  } catch (e) {
    console.error("Error checking storage:", e);
    return null;
  }
};

// Add this test function for debugging modal
window.testBookmarkModal = function() {
  const modal = document.getElementById('bookmark-modal');
  if (modal) {
    console.log("Found modal, showing it");
    modal.classList.remove('hidden');
  } else {
    console.error("Bookmark modal not found!");
  }
};

// Initialize bookmark manager when DOM is loaded
let bookmarkManager;
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM loaded, initializing BookmarkManager");
  setTimeout(() => {
    bookmarkManager = new BookmarkManager();
  }, 500); // Small delay to ensure DOM is ready
});