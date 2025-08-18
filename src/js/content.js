/**
 * Content script for communication between tabs and background script
 * Provides communication layer for the extension
 */

// Browser compatibility
if (typeof browser === 'undefined') {
    var browser = chrome;
}

/**
 * This content script runs in regular web pages (not extension pages)
 * and allows communication between the extension and web pages.
 */

// Listen for messages from the background script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'siteAdded') {
        // Notify the active tab that a site was added
        console.log('Site added notification received in content script');
    }
    return true;
});

// Function to save the current page via background script
function saveCurrentPage() {
    browser.runtime.sendMessage({ action: 'captureActiveTab' })
        .then(response => {
            if (response && response.success) {
                console.log('Current page saved successfully');
            } else {
                console.error('Failed to save current page');
            }
        })
        .catch(error => {
            console.error('Error sending message to save page:', error);
        });
}

// Add keyboard shortcut support in content pages
document.addEventListener('keydown', (event) => {
    // Check if Ctrl+Shift+S (Windows/Linux) or Command+Shift+S (Mac) was pressed
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'S') {
        event.preventDefault(); // Prevent default browser behavior
        saveCurrentPage();
    }
});

// This won't run in standard content script context, but keeping for compatibility
// with any pages where this script might be injected differently
document.addEventListener('DOMContentLoaded', () => {
    const addSiteBtn = document.getElementById('add-site-btn');
    if (addSiteBtn) {
        addSiteBtn.addEventListener('click', () => {
            browser.runtime.sendMessage({ action: 'captureActiveTab' });
        });
    }
});
