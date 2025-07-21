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
    // Inject a simple instruction notification
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
            // Show instruction toast
            const toast = document.createElement('div');
            toast.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #667eea;
                color: white;
                padding: 16px 24px;
                border-radius: 12px;
                z-index: 10002;
                font-size: 14px;
                font-weight: 500;
                box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                text-align: center;
                max-width: 300px;
            `;
            toast.innerHTML = '👀 Look for the floating logo in the bottom-right corner to generate QR codes!';
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.remove();
            }, 4000);
        }
    });
});

// Keep service worker alive (if needed for future features)
const keepAlive = () => setInterval(chrome.runtime.getPlatformInfo, 20e3);
chrome.runtime.onStartup.addListener(keepAlive);
keepAlive(); 