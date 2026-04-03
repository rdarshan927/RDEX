/* Daily quotes functionality for RDEX Dashboard */

/**
 * Quotes functionality
 */

let quoteEl = null;
let authorEl = null;

/**
 * Fetches a random quote from the Quotable API
 * @returns {Promise<Object>} - Quote object with content and author
 */
async function fetchRandomQuote() {
  try {
    // Cross-browser runtime.sendMessage wrapper
    function runtimeSendMessage(message) {
      if (typeof browser !== 'undefined') return browser.runtime.sendMessage(message);
      return new Promise((resolve, reject) => {
        try {
          chrome.runtime.sendMessage(message, (resp) => {
            if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
            resolve(resp);
          });
        } catch (err) {
          reject(err);
        }
      });
    }

    const resp = await runtimeSendMessage({ action: 'fetchQuote' });
    if (!resp || resp.error) throw new Error(resp && resp.error ? resp.error : 'No quote');
    return { text: resp.text, author: resp.author, isFallback: false };
  } catch (error) {
    console.log("Error fetching quote:", error);
    // Get a fallback quote and mark it as such
    const fallback = getFallbackQuote();
    fallback.isFallback = true;
    return fallback;
  }
}

// Add this function in quotes.js
function getFallbackQuote() {
  // Use fallback quotes from fallback-quotes.js if available
  if (window.fallbackQuotes && window.fallbackQuotes.length > 0) {
    const randomIndex = Math.floor(Math.random() * window.fallbackQuotes.length);
    return window.fallbackQuotes[randomIndex];
  }
  
  // Ultimate fallback
  return {
    text: "The best way to predict the future is to invent it.",
    author: "Alan Kay"
  };
}

/**
 * Updates the quote on the page
 */
async function updateQuote() {
  // Store local references to elements to avoid null issues
  const quoteElement = document.getElementById('quote');
  const authorElement = document.getElementById('author');
  
  if (!quoteElement || !authorElement) {
    console.error("Quote elements not found");
    return;
  }
  
  // Display a fallback quote immediately
  const fallback = getFallbackQuote();
  quoteElement.textContent = fallback.text;
  authorElement.textContent = `— ${fallback.author}`;
  
  // Then try to fetch a quote from API, but don't await it
  fetchRandomQuote().then(quote => {
    // Only update if fetch actually succeeded and didn't return a fallback
    if (quote && !quote.isFallback) {
      quoteElement.textContent = quote.text;
      authorElement.textContent = `— ${quote.author}`;
    }
  }).catch(err => {
    // Already showing fallback, so just log the error
    console.log("Quote fetch failed, using fallback:", err);
  });
}

// Update quote when page loads
document.addEventListener('DOMContentLoaded', updateQuote);

function initQuote(quoteElement, authorElement) {
  // Store elements
  quoteEl = quoteElement;
  authorEl = authorElement;
  
  // Update quote immediately
  updateQuote();
}

// Make the initialization function available globally
window.initQuote = initQuote;
