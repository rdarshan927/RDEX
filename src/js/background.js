// This is the background service worker for the RDEX Extension

// Check for browser compatibility
if (typeof browser === 'undefined') {
  var browser = chrome;
}

// Initialize extension
function initExtension() {
  setupContextMenu();
  setupMessageHandlers();
  setupCommandListeners();
  setupBrowserActionListener();
}

// Set up context menu
function setupContextMenu() {
  // Remove existing menu items to avoid duplicates
  browser.contextMenus.removeAll().then(() => {
    browser.contextMenus.create({
      id: "save-to-rdex",
      title: "Save to RDEX",
      contexts: ["page", "link"]
    });
  });

  // Context menu click handler
  browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "save-to-rdex") {
      const url = info.linkUrl || info.pageUrl;
      saveUrl(url, tab.title);
    }
  });
}

// Set up message handlers for communication with other extension parts
function setupMessageHandlers() {
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Background script received message:", message);
    
    if (message.action === "captureActiveTab") {
      getCurrentTabInfo().then(sendResponse);
      return true; // Required for async response
    } 
    else if (message.action === "getCurrentTabInfo") {
      getCurrentTabInfo().then(sendResponse);
      return true; // Required for async response
    }
  });
}

// Set up keyboard shortcut listeners
function setupCommandListeners() {
  browser.commands.onCommand.addListener((command) => {
    if (command === "save-current-tab") {
      getCurrentTabInfo().then(tabInfo => {
        if (tabInfo && tabInfo.url) {
          saveUrl(tabInfo.url, tabInfo.title);
        }
      });
    }
  });
}

// Set up browser action (toolbar button) click handler
function setupBrowserActionListener() {
  browser.action.onClicked.addListener((tab) => {
    // Don't save the extension page itself
    if (!tab.url.includes('moz-extension:') && 
        !tab.url.includes('chrome-extension:')) {
      saveUrl(tab.url, tab.title);
    }
  });
}

// Get current tab information
async function getCurrentTabInfo() {
  try {
    const tabs = await browser.tabs.query({active: true, currentWindow: true});
    
    // Skip extension pages
    if (tabs[0] && (!tabs[0].url.includes('moz-extension:') && 
                    !tabs[0].url.includes('chrome-extension:'))) {
      return {
        url: tabs[0].url,
        title: tabs[0].title
      };
    } 
    // If we're on an extension page, find the most recent non-extension tab
    else {
      const allTabs = await browser.tabs.query({currentWindow: true});
      const nonExtensionTab = allTabs.find(t => 
        !t.url.includes('moz-extension:') && 
        !t.url.includes('chrome-extension:'));
      
      if (nonExtensionTab) {
        return {
          url: nonExtensionTab.url,
          title: nonExtensionTab.title
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error getting tab info:", error);
    return null;
  }
}

// Save a URL to the extension storage
async function saveUrl(url, title) {
  try {
    if (!url) return;
    
    // Sanitize the URL
    try {
      new URL(url);
    } catch (e) {
      console.error("Invalid URL:", url);
      return;
    }
    
    // Get existing bookmarks
    const data = await browser.storage.local.get('rdex_bookmarks');
    const bookmarks = data.rdex_bookmarks || [];
    
    // Check for duplicates
    const isDuplicate = bookmarks.some(bookmark => bookmark.url === url);
    
    // Add new bookmark if not a duplicate
    if (!isDuplicate) {
      // Auto-detect icon
      let icon = '🌐';
      const domain = new URL(url).hostname.replace('www.', '');
      
      // Simple icon matching for common sites
      for (const [key, value] of Object.entries({
        'youtube.com': '📺',
        'mail.google': '✉️',
        'github.com': '💻',
        'docs.google': '📄',
        'calendar': '📅',
        'twitter.com': '👥',
        'facebook.com': '👥',
        'spotify.com': '🎵',
        'netflix.com': '📺',
      })) {
        if (domain.includes(key)) {
          icon = value;
          break;
        }
      }
      
      // Create new bookmark
      const newBookmark = {
        id: Date.now(),
        url: url,
        icon: icon,
        createdAt: new Date().toISOString()
      };
      
      // Save to storage
      bookmarks.push(newBookmark);
      await browser.storage.local.set({ 'rdex_bookmarks': bookmarks });
      
      // Show notification
      showNotification("Bookmark Added", `Added to your RDEX bookmarks`);
    } else {
      showNotification("Already Bookmarked", "This URL is already in your bookmarks");
    }
    
  } catch (error) {
    console.error("Error saving URL:", error);
    showNotification("Error", "Could not save bookmark");
  }
}

// Show a notification
function showNotification(title, message) {
  browser.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: title,
    message: message
  });
}

// Initialize the extension
initExtension();
