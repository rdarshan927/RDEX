/* Links functionality for RDEX Dashboard */

// DOM Elements
const linksContainer = document.getElementById('links-container');
const addLinkBtn = document.getElementById('add-link-btn');
const linkModal = document.getElementById('link-modal');
const linkNameInput = document.getElementById('link-name');
const linkUrlInput = document.getElementById('link-url');
const saveLinkBtn = document.getElementById('save-link-btn');
const cancelLinkBtn = document.getElementById('cancel-link-btn');
const bookmarkCurrentBtn = document.getElementById('bookmark-current-btn');

let editingLinkId = null;

/**
 * Initializes the links section
 */
function initLinks() {
  // Load saved links
  renderLinks();
  
  // Event listeners
  addLinkBtn.addEventListener('click', () => openLinkModal());
  saveLinkBtn.addEventListener('click', saveLink);
  cancelLinkBtn.addEventListener('click', closeLinkModal);
  bookmarkCurrentBtn.addEventListener('click', bookmarkCurrentPage);
  
  // Close modal on outside click
  linkModal.addEventListener('click', e => {
    if (e.target === linkModal) {
      closeLinkModal();
    }
  });
}

/**
 * Opens the link modal for adding a new link
 * @param {Object} [linkData] - Optional link data for editing
 */
function openLinkModal(linkData = null) {
  if (linkData) {
    linkNameInput.value = linkData.name;
    linkUrlInput.value = linkData.url;
    editingLinkId = linkData.id;
  } else {
    linkNameInput.value = '';
    linkUrlInput.value = '';
    editingLinkId = null;
  }
  
  linkModal.classList.remove('hidden');
  linkNameInput.focus();
}

/**
 * Closes the link modal
 */
function closeLinkModal() {
  linkModal.classList.add('hidden');
  linkNameInput.value = '';
  linkUrlInput.value = '';
  editingLinkId = null;
}

/**
 * Saves a new link or updates an existing one
 */
function saveLink() {
  const name = linkNameInput.value.trim();
  let url = linkUrlInput.value.trim();
  
  // Validate inputs
  if (!name || !url) {
    alert('Please enter both name and URL');
    return;
  }
  
  // Add http:// if missing
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  // Get existing links
  const links = Storage.getData(STORAGE_KEYS.LINKS, []);
  
  if (editingLinkId !== null) {
    // Update existing link
    const linkIndex = links.findIndex(link => link.id === editingLinkId);
    if (linkIndex !== -1) {
      links[linkIndex] = { id: editingLinkId, name, url };
    }
  } else {
    // Add new link
    const newLink = {
      id: Date.now().toString(), // Use timestamp as ID
      name,
      url
    };
    links.push(newLink);
  }
  
  // Save to storage
  Storage.saveData(STORAGE_KEYS.LINKS, links);
  
  // Update UI and close modal
  renderLinks();
  closeLinkModal();
}

/**
 * Renders all links in the links container
 */
function renderLinks() {
  const links = Storage.getData(STORAGE_KEYS.LINKS, []);
  
  // Clear container
  linksContainer.innerHTML = '';
  
  if (links.length === 0) {
    // Show empty state
    linksContainer.innerHTML = `
      <p class="text-center opacity-70">No links added yet</p>
    `;
    return;
  }
  
  // Create link elements
  links.forEach(link => {
    const linkElement = document.createElement('div');
    linkElement.className = 'flex items-center justify-between p-3 bg-white/10 rounded-lg';
    linkElement.innerHTML = `
      <a href="${link.url}" class="text-lg hover:underline flex-grow">${link.name}</a>
      <div class="flex items-center space-x-2">
        <button class="edit-link-btn p-1 rounded-full hover:bg-white/20" data-id="${link.id}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button class="delete-link-btn p-1 rounded-full hover:bg-white/20" data-id="${link.id}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18"></path>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    `;
    
    linksContainer.appendChild(linkElement);
  });
  
  // Add event listeners
  document.querySelectorAll('.edit-link-btn').forEach(btn => {
    btn.addEventListener('click', handleEditLink);
  });
  
  document.querySelectorAll('.delete-link-btn').forEach(btn => {
    btn.addEventListener('click', handleDeleteLink);
  });
}

/**
 * Handles edit link button click
 * @param {Event} e - Click event
 */
function handleEditLink(e) {
  const linkId = e.currentTarget.dataset.id;
  const links = Storage.getData(STORAGE_KEYS.LINKS, []);
  const link = links.find(l => l.id === linkId);
  
  if (link) {
    openLinkModal(link);
  }
}

/**
 * Handles delete link button click
 * @param {Event} e - Click event
 */
function handleDeleteLink(e) {
  const linkId = e.currentTarget.dataset.id;
  
  if (confirm('Are you sure you want to delete this link?')) {
    const links = Storage.getData(STORAGE_KEYS.LINKS, []);
    const updatedLinks = links.filter(link => link.id !== linkId);
    
    Storage.saveData(STORAGE_KEYS.LINKS, updatedLinks);
    renderLinks();
  }
}

/**
 * Bookmarks the current page using WebExtensions API
 */
async function bookmarkCurrentPage() {
  try {
    // Get the active tab using the WebExtensions API
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    
    if (tabs.length > 0) {
      const tab = tabs[0];
      
      // Prepare the link data
      linkNameInput.value = tab.title || 'New Bookmark';
      linkUrlInput.value = tab.url;
      
      // Open the modal to let the user confirm
      openLinkModal();
    }
  } catch (error) {
    console.error('Error bookmarking current page:', error);
  }
}

// Initialize links when DOM is loaded
document.addEventListener('DOMContentLoaded', initLinks);
