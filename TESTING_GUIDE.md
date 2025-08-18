# WebExtension Testing Guide

## Firefox Testing (about:debugging)

### Initial Setup

1. Open Firefox
2. Navigate to `about:debugging`
3. Click "This Firefox" in the sidebar
4. Click "Load Temporary Add-on..."
5. Select your `manifest.json` file

### Testing Process

- Extension loads immediately
- Open new tab to test dashboard
- Check browser console (F12) for errors
- Test all functionality

### Firefox-Specific Debugging

```bash
# Install web-ext for better development experience
npm install -g web-ext

# Run extension with auto-reload
web-ext run --source-dir=./

# Lint extension for Firefox compatibility
web-ext lint --source-dir=./
```

### Firefox Debugging Tools

- Background script: Click "Inspect" next to extension
- Content scripts: Use web inspector on the page
- Console errors: Check both background and content script consoles

## Chrome/Edge Testing (chrome://extensions)

### Initial Setup

1. Open Chrome/Edge
2. Navigate to `chrome://extensions/` or `edge://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select your extension directory

### Testing Process

- Extension appears immediately in extensions list
- Open new tab to test dashboard
- Check for permission warnings
- Verify all features work

### Chrome/Edge Debugging Tools

- Background script: Click "Inspect views: background page"
- Content scripts: Right-click page → "Inspect"
- Errors: Check "Errors" section in extensions page
- Reload: Use "Reload" button after code changes

## Safari Compatibility Requirements

### Development Environment

- Xcode 12+ required
- macOS 10.15+ for development
- Safari 14+ for testing

### Key Differences for Safari

1. **Manifest Version**: Safari uses manifest v2, not v3
2. **Background Scripts**: Different persistence model
3. **Permissions**: More restrictive permission model
4. **Bundle Identifier**: Required for Safari extensions
5. **App Store**: Must go through App Store for distribution

### Safari Conversion Process

```bash
# Convert web extension to Safari extension
xcrun safari-web-extension-converter /path/to/extension

# This creates an Xcode project for Safari
```

## Common WebExtension API Pitfalls

### 1. Browser Object Compatibility

```javascript
// Problem: Different browser objects
// Chrome uses 'chrome', Firefox uses 'browser'

// Solution: Use compatibility layer
if (typeof browser === "undefined") {
  var browser = chrome;
}
```

### 2. Manifest Version Differences

```javascript
// Manifest v2 (Safari, older extensions)
"background": {
    "scripts": ["background.js"],
    "persistent": false
}

// Manifest v3 (Chrome, newer Firefox)
"background": {
    "service_worker": "background.js"
}
```

### 3. Permission Handling

```javascript
// Chrome: More permissive
// Firefox: Stricter security model
// Safari: Most restrictive

// Best practice: Request minimal permissions
"permissions": [
    "storage",    // Usually safe
    "tabs"        // May need user confirmation
]
```

### 4. Content Script Injection

```javascript
// Problem: Different timing and contexts

// Solution: Check if DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
```

### 5. Storage API Differences

```javascript
// Chrome: chrome.storage
// Firefox: browser.storage (Promise-based)
// Safari: Limited storage options

// Solution: Use localStorage for simple data
// or implement storage abstraction layer
```

### 6. Cross-Origin Requests

```javascript
// Different browsers have different CORS policies
// Always declare host permissions in manifest

"host_permissions": [
    "https://api.quotable.io/*"
]
```

### 7. Icon and UI Differences

```javascript
// Different browsers support different icon sizes
// Provide multiple sizes for compatibility

"icons": {
    "16": "icons/icon16.png",   // Chrome/Edge
    "48": "icons/icon48.png",   // Firefox
    "96": "icons/icon96.png",   // Safari
    "128": "icons/icon128.png"  // Chrome Web Store
}
```

## Testing Checklist

### Functionality Tests

- [ ] New tab override works
- [ ] Clock displays and updates
- [ ] Quotes load from API
- [ ] Focus input saves to localStorage
- [ ] Links can be added via button
- [ ] Links can be removed
- [ ] Data persists across sessions

### Cross-Browser Tests

- [ ] Extension loads in Firefox
- [ ] Extension loads in Chrome
- [ ] Extension loads in Edge
- [ ] All features work in each browser
- [ ] No console errors
- [ ] Permissions are granted properly

### Error Scenarios

- [ ] Network failure (quote API down)
- [ ] localStorage unavailable
- [ ] Permission denied for tabs API
- [ ] Invalid URLs in links

## Performance Considerations

### Background Script Optimization

```javascript
// Use event-driven background scripts
// Avoid persistent background scripts when possible
// Minimize memory usage
```

### Content Script Performance

```javascript
// Lazy load content scripts
// Remove event listeners when not needed
// Use efficient DOM queries
```

### Storage Optimization

```javascript
// Use appropriate storage type:
// - localStorage: Simple, synchronous
// - browser.storage.local: Async, larger capacity
// - browser.storage.sync: Cross-device sync
```

This testing approach ensures your extension works reliably across all major browsers while avoiding common pitfalls.
