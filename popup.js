/**
 * QR Code Generator - Main Popup Logic
 * Generates QR codes with website logos and information
 */

class QRCodeGenerator {
    constructor() {
        this.canvas = document.getElementById('qr-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentTabData = null;
        
        this.init();
    }

    async init() {
        try {
            console.log('QR Generator: Starting initialization...');
            
            // Check if QRCode library is available
            if (typeof QRCode === 'undefined') {
                throw new Error('QR Code library not loaded');
            }
            console.log('QR Generator: QRCode library available');
            
            // Get current tab information
            console.log('QR Generator: Getting tab data...');
            await this.getCurrentTabData();
            console.log('QR Generator: Tab data received:', this.currentTabData);
            
            // Generate QR code
            console.log('QR Generator: Generating QR code...');
            await this.generateQRCode();
            console.log('QR Generator: QR code generated successfully');
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Hide loading and show QR section
            this.showQRSection();
            
        } catch (error) {
            console.error('Error initializing QR generator:', error);
            this.showError(`Failed to generate QR code: ${error.message}`);
        }
    }

    async getCurrentTabData() {
        return new Promise((resolve, reject) => {
            chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(`Chrome API error: ${chrome.runtime.lastError.message}`));
                    return;
                }
                
                if (!tabs || tabs.length === 0) {
                    reject(new Error('No active tab found'));
                    return;
                }
                
                const tab = tabs[0];
                console.log('QR Generator: Active tab:', tab);
                
                // Validate tab URL
                if (!tab.url || tab.url === '') {
                    reject(new Error('Tab URL is empty'));
                    return;
                }
                
                // Check for restricted URLs
                if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('moz-extension://')) {
                    reject(new Error('Cannot generate QR code for browser internal pages'));
                    return;
                }
                
                // Get basic tab data
                this.currentTabData = {
                    url: tab.url,
                    title: tab.title || 'Untitled Page',
                    favIconUrl: tab.favIconUrl
                };

                // Try to get more detailed information from content script with timeout
                const timeout = setTimeout(() => {
                    console.log('QR Generator: Content script timeout, using basic data');
                    resolve();
                }, 1000);

                try {
                    chrome.tabs.sendMessage(tab.id, { action: 'getPageInfo' }, (response) => {
                        clearTimeout(timeout);
                        if (response && !chrome.runtime.lastError) {
                            this.currentTabData = { ...this.currentTabData, ...response };
                            console.log('QR Generator: Enhanced data from content script:', response);
                        } else if (chrome.runtime.lastError) {
                            console.log('QR Generator: Content script error:', chrome.runtime.lastError.message);
                        }
                        resolve();
                    });
                } catch (error) {
                    clearTimeout(timeout);
                    console.log('QR Generator: Content script exception:', error);
                    resolve(); // Continue with basic data
                }
            });
        });
    }

    async generateQRCode() {
        const url = this.currentTabData.url;
        
        try {
            // Generate QR code on canvas
            await QRCode.toCanvas(this.canvas, url, {
                width: 256,
                height: 256,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                },
                errorCorrectionLevel: 'H' // High error correction for logo overlay
            });

            // Add website logo overlay
            await this.addLogoOverlay();
            
            // Update website information
            this.updateWebsiteInfo();
            
        } catch (error) {
            console.error('Error generating QR code:', error);
            throw error;
        }
    }

    async addLogoOverlay() {
        const logoImg = document.getElementById('website-logo');
        const logoOverlay = document.getElementById('logo-overlay');
        
        // Try to load website logo/favicon
        let logoSrc = this.currentTabData.favIconUrl;
        
        // Fallback to trying to get a higher quality logo
        if (!logoSrc) {
            logoSrc = this.extractHighQualityLogo();
        }
        
        if (logoSrc) {
            try {
                await this.loadImage(logoImg, logoSrc);
                logoOverlay.style.display = 'flex';
            } catch (error) {
                console.log('Could not load logo, using fallback');
                this.createFallbackLogo(logoImg);
                logoOverlay.style.display = 'flex';
            }
        } else {
            this.createFallbackLogo(logoImg);
            logoOverlay.style.display = 'flex';
        }
    }

    extractHighQualityLogo() {
        // Try to get higher quality logo URLs
        const domain = new URL(this.currentTabData.url).hostname;
        
        // Common logo paths to try
        const logoOptions = [
            `https://${domain}/apple-touch-icon.png`,
            `https://${domain}/apple-touch-icon-180x180.png`,
            `https://${domain}/android-chrome-192x192.png`,
            `https://${domain}/favicon-32x32.png`,
            `https://${domain}/logo.png`,
            `https://${domain}/assets/logo.png`
        ];
        
        return logoOptions[0]; // Return first option for now
    }

    createFallbackLogo(imgElement) {
        // Create a simple text-based logo using first letter of domain
        const domain = new URL(this.currentTabData.url).hostname;
        const firstLetter = domain.charAt(0).toUpperCase();
        
        // Create canvas for text logo
        const logoCanvas = document.createElement('canvas');
        logoCanvas.width = 32;
        logoCanvas.height = 32;
        const logoCtx = logoCanvas.getContext('2d');
        
        // Draw background
        logoCtx.fillStyle = '#667eea';
        logoCtx.fillRect(0, 0, 32, 32);
        
        // Draw letter
        logoCtx.fillStyle = '#ffffff';
        logoCtx.font = 'bold 18px -apple-system, sans-serif';
        logoCtx.textAlign = 'center';
        logoCtx.textBaseline = 'middle';
        logoCtx.fillText(firstLetter, 16, 16);
        
        // Convert to data URL and set as image source
        imgElement.src = logoCanvas.toDataURL();
    }

    loadImage(imgElement, src) {
        return new Promise((resolve, reject) => {
            imgElement.onload = resolve;
            imgElement.onerror = reject;
            imgElement.src = src;
        });
    }

    updateWebsiteInfo() {
        const websiteName = document.getElementById('website-name');
        const websiteTitle = document.getElementById('website-title');
        
        // Extract website name from URL
        const domain = new URL(this.currentTabData.url).hostname;
        const siteName = this.currentTabData.siteName || this.formatDomainName(domain);
        
        // Format and limit title to 15 words
        const title = this.limitWords(this.currentTabData.title, 15);
        
        websiteName.textContent = siteName;
        websiteTitle.textContent = title;
    }

    formatDomainName(domain) {
        // Remove www. and common TLDs for cleaner display
        return domain
            .replace(/^www\./, '')
            .split('.')[0]
            .replace(/-/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    limitWords(text, maxWords) {
        if (!text) return 'Untitled Page';
        
        const words = text.trim().split(/\s+/);
        if (words.length <= maxWords) {
            return text;
        }
        
        return words.slice(0, maxWords).join(' ') + '...';
    }

    setupEventListeners() {
        // Save QR Code button
        document.getElementById('save-btn').addEventListener('click', () => {
            this.saveQRCode();
        });
        
        // Copy URL button
        document.getElementById('copy-btn').addEventListener('click', () => {
            this.copyURL();
        });
        
        // Retry button (for errors)
        document.getElementById('retry-btn').addEventListener('click', () => {
            location.reload();
        });
    }

    saveQRCode() {
        try {
            // Create a composite canvas with QR code and logo
            const compositeCanvas = document.createElement('canvas');
            compositeCanvas.width = 256;
            compositeCanvas.height = 256;
            const compositeCtx = compositeCanvas.getContext('2d');
            
            // Draw QR code
            compositeCtx.drawImage(this.canvas, 0, 0);
            
            // Draw logo overlay
            const logoImg = document.getElementById('website-logo');
            if (logoImg.src) {
                const logoSize = 32;
                const logoX = (256 - logoSize) / 2;
                const logoY = (256 - logoSize) / 2;
                
                // Draw white background for logo
                compositeCtx.fillStyle = '#ffffff';
                compositeCtx.fillRect(logoX - 8, logoY - 8, logoSize + 16, logoSize + 16);
                
                // Draw logo
                compositeCtx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
            }
            
            // Download the image
            const link = document.createElement('a');
            link.download = `qr-code-${this.formatDomainName(new URL(this.currentTabData.url).hostname)}.png`;
            link.href = compositeCanvas.toDataURL();
            link.click();
            
            this.showToast('QR code saved successfully!');
            
        } catch (error) {
            console.error('Error saving QR code:', error);
            this.showToast('Failed to save QR code', 'error');
        }
    }

    async copyURL() {
        try {
            await navigator.clipboard.writeText(this.currentTabData.url);
            this.showToast('URL copied to clipboard!');
        } catch (error) {
            console.error('Error copying URL:', error);
            this.showToast('Failed to copy URL', 'error');
        }
    }

    showToast(message, type = 'success') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'success' ? '#4CAF50' : '#f44336'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 1000;
            font-size: 14px;
            font-weight: 500;
            animation: fadeInOut 3s ease;
        `;
        
        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0%, 100% { opacity: 0; transform: translate(-50%, -20px); }
                15%, 85% { opacity: 1; transform: translate(-50%, 0); }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            document.body.removeChild(toast);
            document.head.removeChild(style);
        }, 3000);
    }

    showQRSection() {
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('qr-section').classList.remove('hidden');
    }

    showError(message) {
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('error-message').textContent = message;
        document.getElementById('error-section').classList.remove('hidden');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new QRCodeGenerator();
}); 