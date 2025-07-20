# QR Code Generator Chrome Extension

A Chrome extension that generates QR codes for the current webpage with enhanced visual presentation.

## Features

- **One-click QR code generation** for any webpage
- **256x256 pixel QR code** with high quality
- **Website logo integration** at the center of QR code
- **Website information display** including name and title
- **Clean, modern UI** with intuitive design

## Specifications

- QR code size: 256 × 256 pixels
- Center logo: Extracted from current website's favicon or logo
- Information display:
  - First line: Website name
  - Second line: Page title (bold, maximum 15 words)

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension icon will appear in your toolbar

## Usage

1. Navigate to any webpage
2. Click the QR code extension icon in the toolbar
3. View the generated QR code with website information
4. Share or save the QR code as needed

## Technical Stack

- **Manifest V3** for modern Chrome extension development
- **HTML5 Canvas** for QR code generation and logo overlay
- **CSS3** for responsive, modern styling
- **Vanilla JavaScript** for lightweight performance

## Project Structure

```
erweima/
├── manifest.json          # Extension configuration
├── popup.html            # Main popup interface
├── popup.js              # QR code generation logic
├── popup.css             # Styling
├── background.js         # Background service worker
├── content.js            # Content script for website data
└── icons/               # Extension icons
```

## Development

The extension follows Chrome Extension Manifest V3 specifications and modern web development practices. 