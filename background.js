/**
 * Background Service Worker
 * Handles extension lifecycle and background tasks
 */

// Extension installation and startup
chrome.runtime.onInstalled.addListener((details) => {
    console.log('QR Code Generator extension installed');
    
    if (details.reason === 'install') {
        // First-time installation
        console.log('Extension installed for the first time');
    } else if (details.reason === 'update') {
        // Extension updated
        console.log(`Extension updated from version ${details.previousVersion}`);
    }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
    console.log('QR Code Generator extension started');
});

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Currently no background processing needed
    // Future features could include:
    // - Batch QR code generation
    // - History tracking
    // - Cloud sync
    
    return false; // Don't send async response
});

// Handle action button click - show instructions since we now use floating logo
chrome.action.onClicked.addListener((tab) => {
    // Since we removed tabs permission, we can't send messages to content scripts
    // The floating logo is already visible on the page, so no action needed
    console.log('QR Generator: Action button clicked - floating logo should already be visible');
});

// Keep service worker alive (if needed for future features)
const keepAlive = () => setInterval(chrome.runtime.getPlatformInfo, 20e3);
chrome.runtime.onStartup.addListener(keepAlive);
keepAlive(); 