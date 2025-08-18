// Browser compatibility
if (typeof browser === 'undefined') {
    var browser = chrome;
}

/**
 * Initialize the extension features
 * - Toolbar button (browser action)
 * - Context menu
 * - Keyboard shortcuts
 */
function initExtension() {
    // Set up context menu
    setupContextMenu();
    
    // Listen for browser action (toolbar button) clicks
    browser.action.onClicked.addListener((tab) => {
        saveTab(tab);
    });
    
    // Listen for keyboard commands
    browser.commands.onCommand.addListener((command) => {
        if (command === "save-current-tab") {
            // Get active tab and save it
            browser.tabs.query({ active: true, currentWindow: true })
                .then(tabs => {
                    if (tabs.length > 0) {
                        saveTab(tabs[0]);
                    }
                })
                .catch(err => console.error("Error handling keyboard shortcut:", err));
        }
    });
}

/**
 * Handle context menu clicks
 */
function handleContextMenuClick(info, tab) {
    if (info.menuItemId === "save-to-rdex") {
        if (info.linkUrl) {
            // If clicked on a link, fetch the link details and save
            saveUrl(info.linkUrl, info.linkText || "Link from " + tab.title);
        } else {
            // If clicked on the page itself, save the current tab
            saveTab(tab);
        }
    }
}

/**
 * Set up the right-click context menu
 */
function setupContextMenu() {
    // Remove existing menu items and event listeners to prevent duplicates
    browser.contextMenus.removeAll()
        .then(() => {
            // Create the menu item
            browser.contextMenus.create({
                id: "save-to-rdex",
                title: "Save this page to RDEX",
                contexts: ["page", "link"]
            });
            
            // Remove existing listener if possible
            if (browser.contextMenus.onClicked.hasListener(handleContextMenuClick)) {
                browser.contextMenus.onClicked.removeListener(handleContextMenuClick);
            }
            
            // Add the listener
            browser.contextMenus.onClicked.addListener(handleContextMenuClick);
        })
        .catch(error => console.error("Error setting up context menu:", error));
}

// Listen for messages from the content script and extension pages
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'addCurrentSite' || message.action === 'captureActiveTab') {
        // Get active tab from currently focused window
        browser.tabs.query({ active: true, currentWindow: true })
            .then(tabs => {
                if (tabs.length > 0) {
                    // Store current tab ID for reference
                    const currentTabId = sender.tab ? sender.tab.id : null;
                    
                    // Don't save the extension page itself
                    if (tabs[0].url.includes('src/index.html') || 
                        tabs[0].url.includes('moz-extension://') || 
                        tabs[0].url.includes('chrome-extension://')) {
                        
                        // Get most recently used non-extension tab instead
                        return browser.tabs.query({})
                            .then(allTabs => {
                                // Filter out extension tabs
                                const nonExtensionTabs = allTabs.filter(tab => 
                                    !tab.url.includes('src/index.html') && 
                                    !tab.url.includes('moz-extension://') && 
                                    !tab.url.includes('chrome-extension://'));
                                
                                if (nonExtensionTabs.length > 0) {
                                    // Sort by last accessed and get most recent
                                    nonExtensionTabs.sort((a, b) => b.lastAccessed - a.lastAccessed);
                                    return saveTab(nonExtensionTabs[0]);
                                }
                            });
                    } else {
                        // Current tab is valid, save it
                        return saveTab(tabs[0]);
                    }
                }
            })
            .then(() => {
                // Send success response back
                if (sendResponse) sendResponse({ success: true });
            })
            .catch(error => {
                console.error("Error handling message:", error);
                if (sendResponse) sendResponse({ success: false, error: error.message });
            });
        
        // Return true to indicate we'll respond asynchronously
        return true;
    }
});

/**
 * Save a tab to storage
 * @param {Object} tab - Browser tab object
 */
async function saveTab(tab) {
    if (!tab) {
        console.error("No tab provided to save");
        return;
    }
    
    try {
        // Create link object from tab
        await saveUrl(tab.url, tab.title);
    } catch (error) {
        console.error("Error saving tab:", error);
    }
}

/**
 * Save a URL with title to storage
 * @param {string} url - The URL to save
 * @param {string} title - The title for the URL
 * @returns {Promise<boolean>} - Whether the URL was saved successfully
 */
async function saveUrl(url, title) {
    if (!url) {
        console.error("No URL provided to save");
        return false;
    }
    
    // Skip saving browser extension pages
    if (url.includes('src/index.html') || 
        url.includes('moz-extension://') || 
        url.includes('chrome-extension://')) {
        console.log("Skipping extension page:", url);
        return false;
    }
    
    try {
        // Create link object
        const newSite = {
            title: title || 'Untitled Page',
            url: url
        };
        
        // Store the site using browser.storage.local
        try {
            // Get existing links
            const result = await browser.storage.local.get('rdex_links');
            let links = result.rdex_links || [];
            
            // Ensure links is always an array (even if storage somehow has non-array data)
            if (!Array.isArray(links)) {
                console.warn('Links was not an array, resetting to empty array');
                links = [];
            }
            
            // Check if URL already exists
            const urlExists = links.some(link => link.url === url);
            if (urlExists) {
                // Show notification that link already exists
                browser.notifications.create({
                    type: 'basic',
                    iconUrl: browser.runtime.getURL('icons/icon48.png') || '',
                    title: 'Already Saved',
                    message: `"${title}" is already in your links`
                });
                return false;
            }
            
            // Add new link with ID
            const newLink = {
                id: Date.now().toString(),
                title: newSite.title,
                url: newSite.url,
                addedAt: new Date().toISOString()
            };
            
            links.push(newLink);
            
            // Save updated links
            await browser.storage.local.set({ 'rdex_links': links });
            
            // Create notification
            browser.notifications.create({
                type: 'basic',
                iconUrl: browser.runtime.getURL('icons/icon48.png') || '',
                title: 'Link Added',
                message: `"${newSite.title}" has been added to your dashboard`
            });
            
            // Broadcast to all extension pages that links have changed
            browser.runtime.sendMessage({
                action: 'linksUpdated',
                links: links
            }).catch(err => {
                // Ignore errors from no listeners
                if (!err.message.includes('Could not establish connection')) {
                    console.error('Error broadcasting link update:', err);
                }
            });
            
            return true;
            
        } catch (storageError) {
            console.error('Error storing link:', storageError);
            // Show error notification
            browser.notifications.create({
                type: 'basic',
                iconUrl: browser.runtime.getURL('icons/icon48.png') || '',
                title: 'Error',
                message: 'Could not save link. Please try again.'
            });
            return false;
        }
        
    } catch (error) {
        console.error("Error saving URL:", error);
        return false;
    }
}

// Legacy function for backwards compatibility
async function addCurrentSite() {
    try {
        const activeTabs = await browser.tabs.query({ active: true, currentWindow: true });
        if (activeTabs.length > 0) {
            await saveTab(activeTabs[0]);
        }
    } catch (error) {
        console.error('Error in addCurrentSite:', error);
    }
}

// Initialize extension when background script loads
initExtension();
