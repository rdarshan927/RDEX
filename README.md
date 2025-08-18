# RDEX Dashboard

A Firefox extension that transforms your new tab page into a beautiful, minimal dashboard with clock, daily quotes, focus tracking, and link management.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **New Tab Dashboard**: Overrides the new tab page with a clean, distraction-free dashboard
- **Clock & Date**: Large, easy-to-read time and date display
- **Daily Quotes**: Inspirational quotes that refresh daily
- **Focus Tracking**: Set and track your main focus for the day
- **Link Management**: Save and organize important links
- **Multiple Ways to Save Links**:
  - Toolbar button
  - Context menu
  - Keyboard shortcut (Ctrl+Shift+S)
  - "+" button in dashboard

## Screenshots

_[Screenshots will be added here]_

## Installation

### From Firefox Add-ons (Recommended)

1. Visit the [RDEX Dashboard on Firefox Add-ons](https://addons.mozilla.org/)
2. Click "Add to Firefox"

### Manual Installation (Development)

1. Clone this repository:

   ```
   git clone https://github.com/yourusername/rdex-dashboard.git
   ```

2. Open Firefox and navigate to `about:debugging`
3. Click "This Firefox"
4. Click "Load Temporary Add-on..."
5. Select the `manifest.json` file from the cloned repository

### Building from Source

1. Clone the repository as shown above
2. Install dependencies:
   ```
   npm install
   ```
3. Build the extension:
   ```
   npm run build
   ```
4. The packaged extension will be available in the `dist` directory

## Usage

### Dashboard

- The dashboard appears on every new tab
- Set your daily focus by typing in the input field and pressing Enter
- Mark your focus as completed by checking the checkbox
- Save links using the "+" button at the bottom of the dashboard

### Saving Links

There are multiple ways to save the current page to your links:

1. Click the RDEX toolbar button
2. Right-click anywhere on a page and select "Save this page to RDEX"
3. Use the keyboard shortcut: Ctrl+Shift+S (Cmd+Shift+S on Mac)
4. When on the dashboard, click the "+" button (this will save your most recently visited page)

## Development

### Project Structure

```
RDEX/
├── LICENSE           # MIT License
├── README.md         # This documentation
├── manifest.json     # Firefox extension manifest
├── package.json      # Project dependencies and scripts
├── icons/            # Extension icons
│   ├── icon48.png
│   └── icon96.png
└── src/
    ├── index.html    # New tab dashboard page
    ├── background.js # Background script for extension
    ├── content.js    # Content script for web pages
    ├── script.js     # Main script for the dashboard
    ├── css/          # Stylesheets
    │   ├── tailwind.min.css
    │   └── styles.css
    └── images/       # Background images
```

### Local Development

Start a development instance of Firefox with the extension loaded:

```bash
npm run start:firefox
```

### Testing

Run Mozilla's web-ext linter to validate the extension:

```bash
npm test
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

Please make sure your code follows the existing style and passes the linter.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Momentum](https://momentumdash.com/) for inspiration
- [Quotable API](https://github.com/lukePeavey/quotable) for the quotes
- [TailwindCSS](https://tailwindcss.com/) for styling

---

Made with ❤️ by RDEX Dashboard Contributors

## License

MIT
