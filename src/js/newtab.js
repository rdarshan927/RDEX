/* Main JavaScript for new tab page */

document.addEventListener('DOMContentLoaded', async function() {
  // Check if there's a pending bookmark from the extension action
  checkForPendingBookmark();
});

/**
 * Check for pending bookmarks set by the browser action
 */
async function checkForPendingBookmark() {
  try {
    // Check if we're in a browser extension environment
    if (typeof browser !== 'undefined' && browser.storage && browser.storage.local) {
      const data = await browser.storage.local.get('rdex_pending_bookmark');
      
      if (data.rdex_pending_bookmark) {
        const bookmark = data.rdex_pending_bookmark;
        
        // Clear the pending bookmark
        await browser.storage.local.remove('rdex_pending_bookmark');
        
        // Prepare the link modal with this data
        if (typeof openLinkModal === 'function') {
          linkNameInput.value = bookmark.title;
          linkUrlInput.value = bookmark.url;
          openLinkModal();
        }
      }
    }
  } catch (error) {
    console.error('Error checking for pending bookmark:', error);
  }
}

/**
 * Browser compatibility polyfill
 */
if (typeof browser === 'undefined') {
  var browser = chrome;
}
