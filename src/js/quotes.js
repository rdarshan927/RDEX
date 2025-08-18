/* Daily quotes functionality for RDEX Dashboard */

/**
 * Fetches a random quote from the Quotable API
 * @returns {Promise<Object>} - Quote object with content and author
 */
async function fetchRandomQuote() {
  try {
    const response = await fetch('https://api.quotable.io/random');
    if (!response.ok) {
      throw new Error(`Failed to fetch quote: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      content: data.content,
      author: data.author
    };
  } catch (error) {
    console.error('Error fetching quote:', error);
    // Return a fallback quote
    return {
      content: "The future depends on what you do today.",
      author: "Mahatma Gandhi"
    };
  }
}

/**
 * Checks if we need a new quote for today
 * @returns {boolean} - True if we need a new quote
 */
function needsNewQuote() {
  const today = new Date().toDateString();
  const lastQuoteDate = Storage.getData(STORAGE_KEYS.LAST_QUOTE_DATE, '');
  return lastQuoteDate !== today;
}

/**
 * Updates the quote on the page
 */
async function updateQuote() {
  const quoteElement = document.getElementById('quote');
  const authorElement = document.getElementById('quote-author');
  
  if (needsNewQuote()) {
    // Fetch new quote
    const quote = await fetchRandomQuote();
    
    // Save to localStorage
    Storage.saveData(STORAGE_KEYS.CURRENT_QUOTE, quote);
    Storage.saveData(STORAGE_KEYS.LAST_QUOTE_DATE, new Date().toDateString());
    
    // Update UI
    quoteElement.textContent = `"${quote.content}"`;
    authorElement.textContent = quote.author;
  } else {
    // Use existing quote from localStorage
    const quote = Storage.getData(STORAGE_KEYS.CURRENT_QUOTE, {
      content: "The future depends on what you do today.",
      author: "Mahatma Gandhi"
    });
    
    quoteElement.textContent = `"${quote.content}"`;
    authorElement.textContent = quote.author;
  }
}

// Update quote when page loads
document.addEventListener('DOMContentLoaded', updateQuote);
