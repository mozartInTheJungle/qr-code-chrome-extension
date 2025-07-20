# Installation & Testing Guide

## Quick Setup

### 1. Load the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **"Load unpacked"**
4. Select the `erweima` folder (this project directory)
5. The QR Code Generator extension will appear in your toolbar

### 2. Test the Extension

1. Visit any website (e.g., `https://google.com`)
2. Click the QR Code Generator icon in your Chrome toolbar
3. The extension popup will appear with:
   - A loading spinner (briefly)
   - Generated QR code (256×256 pixels)
   - Website logo in the center of QR code
   - Website name and title below the QR code
   - Save and Copy URL buttons

## Features Demonstration

### QR Code Generation
- **Size**: 256 × 256 pixels as requested
- **Quality**: High error correction level for logo overlay
- **Logo Integration**: Website favicon/logo centered in QR code

### Information Display
- **Website Name**: Extracted from various sources (OpenGraph, meta tags, domain)
- **Page Title**: Limited to 15 words maximum, displayed in bold
- **Smart Fallbacks**: Creates letter-based logos when favicons aren't available

### User Actions
- **Save QR Code**: Downloads PNG with composite QR code + logo
- **Copy URL**: Copies the current page URL to clipboard
- **Error Handling**: Graceful fallbacks and user-friendly error messages

## Testing Different Websites

Try the extension on various types of websites to see different behaviors:

### Popular Sites (with good logos/metadata)
- `https://github.com`
- `https://stackoverflow.com`
- `https://medium.com`
- `https://twitter.com`

### News Sites (rich metadata)
- `https://bbc.com`
- `https://cnn.com`
- `https://techcrunch.com`

### Simple Sites (basic favicons)
- Local HTML files
- Simple blogs
- Development servers

## Troubleshooting

### Extension Not Loading
- Ensure all files are in the same directory
- Check Chrome Developer Console for errors
- Verify manifest.json is valid JSON
- Reload the extension in `chrome://extensions/`

### QR Code Not Generating - Debugging Steps
1. **Check Extension Popup Console:**
   - Right-click the extension icon → "Inspect"
   - Look for errors in the Console tab
   - Check for "QR Generator:" log messages

2. **Common Issues:**
   - **"QR Code library not loaded"**: The qrcode.min.js file is missing or not loading
   - **"Cannot generate QR code for browser internal pages"**: You're on chrome:// or extension pages
   - **"No active tab found"**: Try refreshing the page first
   - **"Tab URL is empty"**: The current tab doesn't have a valid URL

3. **Restricted Pages:**
   - Chrome internal pages (chrome://, chrome-extension://)
   - New tab pages
   - Some local files (file://)

4. **Try These Test URLs:**
   - `https://example.com`
   - `https://google.com`
   - `https://github.com`

### Logo Not Showing
- The extension tries multiple sources for logos
- If no logo is found, it creates a text-based fallback
- Some websites may block cross-origin logo requests

### Content Script Issues
- If website information doesn't load, the content script may be blocked
- The extension will fall back to basic tab information
- Check if the website has strict security policies

## Performance Notes

### Loading Time
- QR code generation: ~200-500ms
- Logo extraction: ~100-300ms
- Total popup load time: Usually under 1 second

### Memory Usage
- Minimal background memory footprint
- Canvas operations are efficient
- No persistent storage used

## Browser Compatibility

- **Chrome**: Fully supported (Manifest V3)
- **Edge**: Should work (Chromium-based)
- **Firefox**: Not compatible (requires Manifest V2 adaptation)
- **Safari**: Not compatible (requires Safari-specific extensions)

## Development Mode

While the extension is loaded in developer mode:
- Changes to files require extension reload
- Use Chrome DevTools to debug popup (right-click extension → Inspect)
- Check background page console for service worker logs
- Content script errors appear in page console

## Uninstalling

To remove the extension:
1. Go to `chrome://extensions/`
2. Find "QR Code Generator"
3. Click the trash icon or toggle off
4. Optionally delete the project folder 