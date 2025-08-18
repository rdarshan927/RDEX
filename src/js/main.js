// Storage keys
const STORAGE_KEYS = {
    FOCUS: 'rdex_focus',
    FOCUS_COMPLETED: 'rdex_focus_completed',
    LINKS: 'rdex_links'
};

// DOM Elements
const clockElement = document.getElementById('clock');
const dateElement = document.getElementById('date');
const quoteElement = document.getElementById('quote');
const authorElement = document.getElementById('author');
const focusInput = document.getElementById('focus-input');
const focusDisplay = document.getElementById('focus-display');
const focusText = document.getElementById('focus-text');
const focusCheckbox = document.getElementById('focus-checkbox');
const focusInputContainer = document.getElementById('focus-input-container');
const linksList = document.getElementById('links-list');
const addSiteBtn = document.getElementById('add-site-btn');

// Update clock
function updateClock() {
    const now = new Date();
    
    // Update time - only if the minute has changed
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;
    
    // Only update DOM if time has changed
    if (clockElement.textContent !== currentTime) {
        clockElement.textContent = currentTime;
        
        // Update date - only when the time changes to XX:00
        if (minutes === '00') {
            const options = { weekday: 'long', month: 'long', day: 'numeric' };
            const currentDate = now.toLocaleDateString(undefined, options);
            if (dateElement.textContent !== currentDate) {
                dateElement.textContent = currentDate;
            }
        }
    }
}

// Update quote
async function updateQuote() {
    // Use the fallback quotes immediately
    useLocalQuote();
    
    // Then try to fetch from API asynchronously
    tryFetchQuote().catch(error => {
        console.warn('Could not fetch quote from API, using local fallback instead');
    });
}

// Try to fetch a quote from the API
async function tryFetchQuote() {
    try {
        const response = await fetch('https://api.quotable.io/random', {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'omit',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        quoteElement.textContent = `"${data.content}"`;
        authorElement.textContent = data.author;
        return true;
    } catch (error) {
        console.error('Error fetching quote:', error);
        return false;
    }
}

// Display a local quote from the fallback array
function useLocalQuote() {
    // Use local fallback quotes
    if (typeof FALLBACK_QUOTES !== 'undefined' && FALLBACK_QUOTES.length > 0) {
        const randomIndex = Math.floor(Math.random() * FALLBACK_QUOTES.length);
        const fallbackQuote = FALLBACK_QUOTES[randomIndex];
        quoteElement.textContent = `"${fallbackQuote.content}"`;
        authorElement.textContent = fallbackQuote.author;
    } else {
        // Ultimate fallback
        quoteElement.textContent = '"The best way to predict the future is to create it."';
        authorElement.textContent = 'Peter Drucker';
    }
}

// Focus functionality
function initFocus() {
    const savedFocus = localStorage.getItem(STORAGE_KEYS.FOCUS);
    const isCompleted = localStorage.getItem(STORAGE_KEYS.FOCUS_COMPLETED) === 'true';
    
    if (savedFocus) {
        showFocus(savedFocus, isCompleted);
    }
    
    focusInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && focusInput.value.trim()) {
            const focus = focusInput.value.trim();
            localStorage.setItem(STORAGE_KEYS.FOCUS, focus);
            localStorage.setItem(STORAGE_KEYS.FOCUS_COMPLETED, 'false');
            showFocus(focus, false);
        }
    });
    
    focusCheckbox.addEventListener('change', (e) => {
        localStorage.setItem(STORAGE_KEYS.FOCUS_COMPLETED, e.target.checked);
        focusText.style.textDecoration = e.target.checked ? 'line-through' : 'none';
        focusText.style.opacity = e.target.checked ? '0.6' : '1';
    });
}

function showFocus(focus, completed) {
    focusText.textContent = focus;
    focusCheckbox.checked = completed;
    focusText.style.textDecoration = completed ? 'line-through' : 'none';
    focusText.style.opacity = completed ? '0.6' : '1';
    
    focusDisplay.classList.remove('hidden');
    focusInputContainer.classList.add('hidden');
}

/**
 * =============================
 * Links Management Functionality
 * =============================
 */

/**
 * Retrieves links from storage
 * @returns {Promise<Array>} Promise resolving to array of link objects
 */
async function getLinks() {
    try {
        // Try browser storage first
        if (typeof browser !== 'undefined' && browser.storage && browser.storage.local) {
            const result = await browser.storage.local.get('rdex_links');
            return result.rdex_links || [];
        } else {
            // Fallback to localStorage
            const linksJSON = localStorage.getItem(STORAGE_KEYS.LINKS);
            return linksJSON ? JSON.parse(linksJSON) : [];
        }
    } catch (error) {
        console.error('Error getting links:', error);
        return [];
    }
}

// Debounce function to limit storage writes
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const later = () => {
            timeout = null;
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Saves links to storage with debounce to prevent excessive writes
 * @param {Array} links - Array of link objects
 */
const saveLinksDebounced = debounce(async (links) => {
    try {
        // Try browser storage first
        if (typeof browser !== 'undefined' && browser.storage && browser.storage.local) {
            await browser.storage.local.set({ 'rdex_links': links });
            
            // Only save to localStorage if browser.storage fails
            // This avoids double storage and unnecessary memory usage
            return;
        }
        
        // Fallback to localStorage if browser.storage is not available
        localStorage.setItem(STORAGE_KEYS.LINKS, JSON.stringify(links));
    } catch (error) {
        console.error('Error saving links:', error);
        // Final fallback
        try {
            localStorage.setItem(STORAGE_KEYS.LINKS, JSON.stringify(links));
        } catch (e) {
            console.error('Critical storage error:', e);
        }
    }
}, 300); // 300ms debounce

/**
 * Saves links to storage
 * @param {Array} links - Array of link objects
 */
async function saveLinks(links) {
    // Use the debounced version for actual saving
    saveLinksDebounced(links);
}

/**
 * Initializes the links section
 */
async function initLinks() {
    // Initial render
    await renderLinks();
    
    // Add event listener for the "+" button
    addSiteBtn.addEventListener('click', captureCurrentTab);
    
    // Listen for storage changes (for cross-tab updates)
    if (typeof browser !== 'undefined' && browser.storage) {
        browser.storage.onChanged.addListener((changes, area) => {
            if (area === 'local' && changes.rdex_links) {
                console.log('Links updated in storage, refreshing UI');
                renderLinks();
            }
        });
    }
    
    // Listen for messages from background script
    if (typeof browser !== 'undefined' && browser.runtime) {
        browser.runtime.onMessage.addListener((message) => {
            if (message.action === 'linksUpdated') {
                console.log('Links updated via message, refreshing UI');
                renderLinks();
                return true;
            }
        });
    }
}

/**
 * Creates a link element
 * @param {Object} link - Link object with id, title, and url
 * @returns {HTMLElement} - The link element
 */
function createLinkElement(link) {
    const li = document.createElement('li');
    li.className = 'bg-black/30 rounded-lg flex items-center justify-between p-3 transition-all hover:bg-black/40';
    li.dataset.id = link.id;
    
    // Create elements directly instead of using innerHTML
    // This is more efficient than parsing HTML string
    const a = document.createElement('a');
    a.href = link.url;
    a.className = 'flex-grow truncate mr-4';
    a.title = link.title;
    a.textContent = link.title;
    li.appendChild(a);
    
    const button = document.createElement('button');
    button.className = 'delete-link text-white/70 hover:text-white';
    button.title = 'Remove link';
    
    // Create SVG element
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'h-5 w-5');
    svg.setAttribute('viewBox', '0 0 20 20');
    svg.setAttribute('fill', 'currentColor');
    
    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('fill-rule', 'evenodd');
    path.setAttribute('d', 'M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z');
    path.setAttribute('clip-rule', 'evenodd');
    
    svg.appendChild(path);
    button.appendChild(svg);
    li.appendChild(button);
    
    // Add event listener for delete button
    // Use a weakref to handle cleanup automatically when element is removed
    const clickHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        removeLink(link.id);
        // Remove the listener when clicked
        button.removeEventListener('click', clickHandler);
    };
    
    button.addEventListener('click', clickHandler);
    
    return li;
}

// Store links state for diffing
let currentLinkIds = [];

/**
 * Renders all links in the links list
 * Optimized to minimize DOM operations by only updating what changed
 */
async function renderLinks() {
    try {
        // Get links (now asynchronous)
        const links = await getLinks();
        const newLinkIds = links.map(link => link.id);
        
        // If first render, show loading state
        if (linksList.children.length === 0 && currentLinkIds.length === 0) {
            const loadingEl = document.createElement('li');
            loadingEl.className = 'text-center text-white/50 py-3';
            loadingEl.textContent = 'Loading links...';
            linksList.appendChild(loadingEl);
        }
        
        // Handle empty state
        if (links.length === 0) {
            // Only update DOM if needed
            if (linksList.children.length !== 1 || 
                !linksList.firstChild.textContent.includes('No links saved yet')) {
                linksList.innerHTML = '';
                const emptyState = document.createElement('li');
                emptyState.className = 'text-center text-white/50 py-3';
                emptyState.textContent = 'No links saved yet';
                linksList.appendChild(emptyState);
            }
            currentLinkIds = [];
            return;
        }
        
        // Check if the link list is unchanged - avoid unnecessary DOM operations
        if (JSON.stringify(currentLinkIds) === JSON.stringify(newLinkIds) && 
            linksList.children.length === links.length &&
            !linksList.querySelector('.text-white\\/50')) {
            return; // No changes needed
        }
        
        // Links have changed, update DOM efficiently
        
        // Clear loading/empty messages if present
        if (linksList.children.length === 1 && 
            (linksList.firstChild.textContent.includes('Loading') || 
             linksList.firstChild.textContent.includes('No links'))) {
            linksList.innerHTML = '';
        }
        
        // Create a map of existing elements
        const existingElements = {};
        Array.from(linksList.children).forEach(child => {
            const id = child.dataset.id;
            if (id) existingElements[id] = child;
        });
        
        // Create document fragment for batch DOM update
        const fragment = document.createDocumentFragment();
        
        // Add/update links
        links.forEach(link => {
            if (existingElements[link.id]) {
                // Element exists, update if needed
                const existingTitle = existingElements[link.id].querySelector('a').textContent;
                const existingUrl = existingElements[link.id].querySelector('a').getAttribute('href');
                
                if (existingTitle !== link.title || existingUrl !== link.url) {
                    // Update existing element
                    const a = existingElements[link.id].querySelector('a');
                    a.textContent = link.title;
                    a.href = link.url;
                    a.title = link.title;
                }
                // Mark as processed
                existingElements[link.id].dataset.processed = 'true';
            } else {
                // Create new element
                const linkElement = createLinkElement(link);
                linkElement.dataset.processed = 'true';
                fragment.appendChild(linkElement);
            }
        });
        
        // Remove elements that no longer exist
        Array.from(linksList.children).forEach(child => {
            if (child.dataset.id && !child.dataset.processed) {
                linksList.removeChild(child);
            }
        });
        
        // Clean up processing markers
        Array.from(linksList.children).forEach(child => {
            if (child.dataset.processed) {
                delete child.dataset.processed;
            }
        });
        
        // Append new elements
        linksList.appendChild(fragment);
        
        // Update current state
        currentLinkIds = newLinkIds;
    } catch (error) {
        console.error('Error rendering links:', error);
        linksList.innerHTML = '';
        
        const errorEl = document.createElement('li');
        errorEl.className = 'text-center text-red-300 py-3';
        errorEl.textContent = 'Error loading links. Please reload.';
        linksList.appendChild(errorEl);
        currentLinkIds = [];
    }
}

/**
 * Adds a new link
 * @param {Object} linkData - Link data object with title and url
 */
async function addLink(linkData) {
    try {
        const links = await getLinks();
        
        // Create new link object
        const newLink = {
            id: Date.now().toString(), // Use timestamp as ID
            title: linkData.title,
            url: linkData.url,
            addedAt: new Date().toISOString()
        };
        
        // Add to links array and save
        links.push(newLink);
        await saveLinks(links);
        
        // Update UI
        await renderLinks();
    } catch (error) {
        console.error('Error adding link:', error);
    }
}

/**
 * Removes a link
 * @param {string} id - ID of the link to remove
 */
async function removeLink(id) {
    try {
        const links = await getLinks();
        const updatedLinks = links.filter(link => link.id !== id);
        await saveLinks(updatedLinks);
        await renderLinks();
    } catch (error) {
        console.error('Error removing link:', error);
    }
}

/**
 * Captures the current tab and adds it as a link
 */
function captureCurrentTab() {
    // Send message to background script to capture current active tab
    // This is necessary because the extension page can't directly access other tabs
    if (typeof browser !== 'undefined' && browser.runtime) {
        browser.runtime.sendMessage({ action: 'captureActiveTab' })
            .then(response => {
                if (response && response.success) {
                    console.log('Tab captured via background script');
                    // The background script will update storage, just refresh UI
                    renderLinks();
                } else {
                    console.log('Using fallback tab capture method');
                    // Fallback to direct method
                    directCaptureCurrentTab();
                }
            })
            .catch(error => {
                console.error('Error sending message to background script:', error);
                // Fallback to direct method
                directCaptureCurrentTab();
            });
    } else {
        // Fallback for environments where browser API might not be available
        directCaptureCurrentTab();
    }
}

/**
 * Direct method to capture the current tab using browser.tabs API
 * This is used as a fallback when the background script method isn't available
 * Note: When called from the extension page, this will only get the extension page itself
 */
async function directCaptureCurrentTab() {
    try {
        // Get the current active tab
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        if (tabs.length === 0) return;
        
        const currentTab = tabs[0];
        
        // Skip adding the extension page itself
        if (currentTab.url.includes('src/index.html') || 
            currentTab.url.includes('moz-extension://') || 
            currentTab.url.includes('chrome-extension://')) {
            console.log('Skipping extension page capture');
            
            // Show helpful message to the user
            const msg = document.createElement('div');
            msg.textContent = 'Please use the toolbar button or context menu to save external pages';
            msg.className = 'text-yellow-300 text-center p-2 mb-4 bg-black/30 rounded-lg';
            msg.style.animation = 'fadeOut 3s forwards';
            
            // Create style for animation if it doesn't exist
            if (!document.getElementById('animation-style')) {
                const style = document.createElement('style');
                style.id = 'animation-style';
                style.textContent = `@keyframes fadeOut {
                    0% { opacity: 1; }
                    70% { opacity: 1; }
                    100% { opacity: 0; visibility: hidden; }
                }`;
                document.head.appendChild(style);
            }
            
            // Add message to top of links section
            const linksSection = linksList.parentElement;
            if (linksSection && linksSection.firstChild) {
                linksSection.insertBefore(msg, linksSection.firstChild);
                setTimeout(() => msg.remove(), 3500);
            }
            
            return;
        }
        
        // Add as link
        addLink({
            title: currentTab.title || 'Untitled',
            url: currentTab.url
        });
        
    } catch (error) {
        console.error('Error directly capturing current tab:', error);
    }
}

// Browser compatibility
if (typeof browser === 'undefined') {
    var browser = chrome;
}

// Store interval references for cleanup
let clockIntervalId = null;
let quoteIntervalId = null;

// Initialize everything
function init() {
    // Initial updates
    updateClock();
    updateQuote();
    initFocus();
    initLinks();
    
    // Set intervals with lower frequency
    clockIntervalId = setInterval(updateClock, 10000); // Check time every 10 seconds instead of every second
    quoteIntervalId = setInterval(updateQuote, 24 * 60 * 60 * 1000);
    
    // Add visibility change handler to pause updates when tab isn't visible
    document.addEventListener('visibilitychange', handleVisibilityChange);
}

/**
 * Handle visibility changes to save resources
 */
function handleVisibilityChange() {
    if (document.hidden) {
        // Page is hidden, clear intervals to save resources
        if (clockIntervalId) {
            clearInterval(clockIntervalId);
            clockIntervalId = null;
        }
    } else {
        // Page is visible again, restart intervals if needed
        if (!clockIntervalId) {
            updateClock(); // Update immediately
            clockIntervalId = setInterval(updateClock, 10000);
        }
    }
}

// Start the app
document.addEventListener('DOMContentLoaded', init);

// Cleanup function to prevent memory leaks
window.addEventListener('beforeunload', () => {
    // Clear all intervals
    if (clockIntervalId) clearInterval(clockIntervalId);
    if (quoteIntervalId) clearInterval(quoteIntervalId);
    
    // Remove event listeners
    document.removeEventListener('visibilitychange', handleVisibilityChange);
});
