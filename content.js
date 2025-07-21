/**
 * QR Code Generator - Content Script v2.0
 * Creates floating logo and QR code overlay functionality
 */

class QRFloatingWidget {
    constructor() {
        this.pageInfo = null;
        this.floatingLogo = null;
        this.overlay = null;
        this.isOverlayVisible = false;
        this.qrCanvas = null;
        
        this.init();
    }

    async init() {
        try {
            // Skip on restricted pages
            if (this.isRestrictedPage()) {
                console.log('QR Generator: Skipping restricted page');
                return;
            }

            console.log('QR Generator: Initializing floating widget...');
            
            // Extract page information
            this.pageInfo = this.extractPageInfo();
            console.log('QR Generator: Page info extracted:', this.pageInfo);
            
            // Create floating logo
            this.createFloatingLogo();
            
            // Wait a bit then show the logo
            setTimeout(() => {
                if (this.floatingLogo) {
                    this.floatingLogo.style.opacity = '1';
                }
            }, 500);
            
        } catch (error) {
            console.error('QR Generator: Error initializing widget:', error);
        }
    }

    isRestrictedPage() {
        const url = window.location.href;
        const restrictedPrefixes = [
            'chrome://',
            'chrome-extension://',
            'moz-extension://',
            'about:',
            'file://'
        ];
        
        return restrictedPrefixes.some(prefix => url.startsWith(prefix)) ||
               url === 'about:blank' ||
               url === '';
    }

    extractPageInfo() {
        const info = {
            url: window.location.href,
            title: document.title || 'Untitled Page',
            siteName: this.getSiteName(),
            favicon: this.getFavicon(),
            description: this.getMetaContent('description'),
            ogImage: this.getMetaContent('og:image')
        };

        return info;
    }

    getSiteName() {
        // Try multiple sources for site name
        const sources = [
            this.getMetaContent('og:site_name'),
            this.getMetaContent('twitter:site')?.replace('@', ''),
            this.getMetaContent('application-name'),
            this.getMetaContent('apple-mobile-web-app-title'),
            this.extractSiteFromTitle(),
            this.formatDomainName(window.location.hostname)
        ];
        
        return sources.find(name => name && name.trim().length > 0) || 'Website';
    }

    getFavicon() {
        // Try to get high-quality favicon
        const sources = [
            this.getLinkHref('apple-touch-icon'),
            this.getLinkHref('apple-touch-icon-precomposed'),
            this.getLinkHref('icon', 'sizes="192x192"'),
            this.getLinkHref('icon', 'sizes="180x180"'),
            this.getLinkHref('icon', 'sizes="152x152"'),
            this.getLinkHref('icon', 'sizes="144x144"'),
            this.getLinkHref('icon', 'sizes="120x120"'),
            this.getMetaContent('og:image'),
            this.getLinkHref('icon'),
            this.getLinkHref('shortcut icon'),
            '/favicon.ico'
        ];
        
        return sources.find(src => src && src.trim().length > 0) || null;
    }

    getMetaContent(name) {
        let meta = document.querySelector(`meta[property="${name}"]`);
        if (meta) return meta.getAttribute('content');
        
        meta = document.querySelector(`meta[name="${name}"]`);
        if (meta) return meta.getAttribute('content');
        
        return null;
    }

    getLinkHref(rel, additionalSelector = '') {
        const selector = additionalSelector 
            ? `link[rel="${rel}"]${additionalSelector}`
            : `link[rel="${rel}"]`;
        
        const link = document.querySelector(selector);
        return link ? link.getAttribute('href') : null;
    }

    extractSiteFromTitle() {
        const title = document.title;
        if (!title) return null;
        
        const separators = [' - ', ' | ', ' • ', ' :: ', ' — '];
        
        for (const sep of separators) {
            if (title.includes(sep)) {
                const parts = title.split(sep);
                const siteName = parts[parts.length - 1].trim();
                
                if (siteName.length < 50) {
                    return siteName;
                }
            }
        }
        
        return null;
    }

    formatDomainName(domain) {
        return domain
            .replace(/^www\./, '')
            .split('.')[0]
            .replace(/-/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    createFloatingLogo() {
        // Remove existing logo if any
        if (this.floatingLogo) {
            this.floatingLogo.remove();
        }

        this.floatingLogo = document.createElement('div');
        this.floatingLogo.className = 'qr-floating-logo';
        this.floatingLogo.style.opacity = '0';
        this.floatingLogo.setAttribute('title', 'Click to generate QR code for this page');
        this.floatingLogo.setAttribute('role', 'button');
        this.floatingLogo.setAttribute('tabindex', '0');

        // Create logo content
        const logoContent = document.createElement('div');
        logoContent.className = 'qr-logo-content';

        // Try to load favicon
        if (this.pageInfo.favicon) {
            const logoImg = document.createElement('img');
            logoImg.className = 'qr-logo-img';
            logoImg.src = this.makeAbsoluteURL(this.pageInfo.favicon);
            logoImg.alt = 'Website Logo';
            
            logoImg.onload = () => {
                logoContent.appendChild(logoImg);
            };
            
            logoImg.onerror = () => {
                this.createFallbackLogo(logoContent);
            };
        } else {
            this.createFallbackLogo(logoContent);
        }

        this.floatingLogo.appendChild(logoContent);

        // Add event listeners
        this.floatingLogo.addEventListener('click', () => this.showQROverlay());
        this.floatingLogo.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.showQROverlay();
            }
        });

        // Add to page
        document.body.appendChild(this.floatingLogo);
    }

    createFallbackLogo(container) {
        const logoText = document.createElement('div');
        logoText.className = 'qr-logo-text';
        logoText.textContent = this.pageInfo.siteName.charAt(0).toUpperCase();
        container.appendChild(logoText);
    }

    makeAbsoluteURL(url) {
        if (!url) return null;
        
        try {
            return new URL(url, window.location.href).href;
        } catch (error) {
            return null;
        }
    }

    async showQROverlay() {
        if (this.isOverlayVisible) return;

        try {
            // Create overlay
            this.createOverlay();
            
            // Show loading state
            this.showLoading();
            
            // Generate QR code
            await this.generateQRCode();
            
            // Show QR code content
            this.showQRContent();
            
        } catch (error) {
            console.error('QR Generator: Error showing overlay:', error);
            this.showError('Failed to generate QR code');
        }
    }

    createOverlay() {
        if (this.overlay) {
            this.overlay.remove();
        }

        this.overlay = document.createElement('div');
        this.overlay.className = 'qr-overlay';

        const overlayContent = document.createElement('div');
        overlayContent.className = 'qr-overlay-content';

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'qr-close-btn';
        closeBtn.innerHTML = '×';
        closeBtn.setAttribute('title', 'Close');
        closeBtn.addEventListener('click', () => this.hideQROverlay());

        overlayContent.appendChild(closeBtn);
        this.overlay.appendChild(overlayContent);

        // Add overlay to page
        document.body.appendChild(this.overlay);

        // Add event listeners
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.hideQROverlay();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOverlayVisible) {
                this.hideQROverlay();
            }
        });

        // Show overlay
        setTimeout(() => {
            this.overlay.classList.add('qr-overlay-visible');
            this.isOverlayVisible = true;
        }, 10);
    }

    showLoading() {
        const content = this.overlay.querySelector('.qr-overlay-content');
        const closeBtn = content.querySelector('.qr-close-btn');
        
        content.innerHTML = '';
        content.appendChild(closeBtn);

        const loading = document.createElement('div');
        loading.className = 'qr-loading';
        loading.innerHTML = `
            <div class="qr-spinner"></div>
            <div class="qr-loading-text">Generating QR code...</div>
        `;

        content.appendChild(loading);
    }

    async generateQRCode() {
        return new Promise((resolve, reject) => {
            try {
                // Create canvas
                this.qrCanvas = document.createElement('canvas');
                this.qrCanvas.width = 256;
                this.qrCanvas.height = 256;
                this.qrCanvas.className = 'qr-code-canvas';

                // Generate QR code using the loaded library
                QRCode.toCanvas(this.qrCanvas, this.pageInfo.url, {
                    width: 256,
                    height: 256,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    },
                    errorCorrectionLevel: 'H'
                }).then(() => {
                    console.log('QR Generator: QR code generated successfully');
                    resolve();
                }).catch(reject);

            } catch (error) {
                reject(error);
            }
        });
    }

    showQRContent() {
        const content = this.overlay.querySelector('.qr-overlay-content');
        const closeBtn = content.querySelector('.qr-close-btn');
        
        content.innerHTML = '';
        content.appendChild(closeBtn);

        // Header
        const header = document.createElement('div');
        header.className = 'qr-overlay-header';
        header.innerHTML = `
            <h2 class="qr-overlay-title">QR Code Generated</h2>
            <p class="qr-overlay-subtitle">Scan to visit this page</p>
        `;

        // QR Code container
        const qrContainer = document.createElement('div');
        qrContainer.className = 'qr-code-container';
        qrContainer.appendChild(this.qrCanvas);

        // Add logo overlay on QR code
        if (this.pageInfo.favicon) {
            const logoOverlay = document.createElement('div');
            logoOverlay.className = 'qr-logo-overlay';
            
            const logoImg = document.createElement('img');
            logoImg.src = this.makeAbsoluteURL(this.pageInfo.favicon);
            logoImg.alt = 'Website Logo';
            
            logoImg.onload = () => {
                logoOverlay.appendChild(logoImg);
            };
            
            logoImg.onerror = () => {
                // Create text fallback
                const logoText = document.createElement('div');
                logoText.style.cssText = `
                    font-size: 18px;
                    font-weight: 700;
                    color: #667eea;
                `;
                logoText.textContent = this.pageInfo.siteName.charAt(0).toUpperCase();
                logoOverlay.appendChild(logoText);
            };
            
            qrContainer.appendChild(logoOverlay);
        }

        // Website info
        const websiteInfo = document.createElement('div');
        websiteInfo.className = 'qr-website-info';
        websiteInfo.innerHTML = `
            <div class="qr-website-name">${this.escapeHtml(this.pageInfo.siteName)}</div>
            <div class="qr-website-title">${this.escapeHtml(this.limitWords(this.pageInfo.title, 15))}</div>
        `;

        // Action buttons
        const actions = document.createElement('div');
        actions.className = 'qr-actions';
        
        const saveBtn = document.createElement('button');
        saveBtn.className = 'qr-btn qr-btn-primary';
        saveBtn.innerHTML = '💾 Save QR Code';
        saveBtn.addEventListener('click', () => this.saveQRCode());

        const copyBtn = document.createElement('button');
        copyBtn.className = 'qr-btn qr-btn-secondary';
        copyBtn.innerHTML = '📋 Copy URL';
        copyBtn.addEventListener('click', () => this.copyURL());

        actions.appendChild(saveBtn);
        actions.appendChild(copyBtn);

        // Add all elements
        content.appendChild(header);
        content.appendChild(qrContainer);
        content.appendChild(websiteInfo);
        content.appendChild(actions);
    }

    showError(message) {
        const content = this.overlay.querySelector('.qr-overlay-content');
        const closeBtn = content.querySelector('.qr-close-btn');
        
        content.innerHTML = '';
        content.appendChild(closeBtn);

        const error = document.createElement('div');
        error.className = 'qr-error';
        error.innerHTML = `
            <div class="qr-error-icon">⚠️</div>
            <h3 class="qr-error-title">Unable to generate QR code</h3>
            <p class="qr-error-message">${this.escapeHtml(message)}</p>
            <button class="qr-btn qr-btn-primary" onclick="location.reload()">Retry</button>
        `;

        content.appendChild(error);
    }

    hideQROverlay() {
        if (!this.isOverlayVisible) return;

        this.overlay.classList.remove('qr-overlay-visible');
        this.isOverlayVisible = false;

        setTimeout(() => {
            if (this.overlay) {
                this.overlay.remove();
                this.overlay = null;
            }
        }, 300);
    }

    saveQRCode() {
        try {
            // Create composite canvas with QR code and logo
            const compositeCanvas = document.createElement('canvas');
            compositeCanvas.width = 256;
            compositeCanvas.height = 256;
            const ctx = compositeCanvas.getContext('2d');

            // Draw QR code
            ctx.drawImage(this.qrCanvas, 0, 0);

            // Draw logo if available
            const logoOverlay = this.overlay.querySelector('.qr-logo-overlay img');
            if (logoOverlay && logoOverlay.complete) {
                const logoSize = 32;
                const logoX = (256 - logoSize) / 2;
                const logoY = (256 - logoSize) / 2;
                
                // Draw white background for logo
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(logoX - 8, logoY - 8, logoSize + 16, logoSize + 16);
                
                // Draw logo
                ctx.drawImage(logoOverlay, logoX, logoY, logoSize, logoSize);
            }

            // Download
            const link = document.createElement('a');
            link.download = `qr-code-${this.formatDomainName(window.location.hostname)}.png`;
            link.href = compositeCanvas.toDataURL();
            link.click();

            this.showToast('QR code saved successfully!');

        } catch (error) {
            console.error('QR Generator: Error saving QR code:', error);
            this.showToast('Failed to save QR code', 'error');
        }
    }

    async copyURL() {
        try {
            await navigator.clipboard.writeText(this.pageInfo.url);
            this.showToast('URL copied to clipboard!');
        } catch (error) {
            console.error('QR Generator: Error copying URL:', error);
            this.showToast('Failed to copy URL', 'error');
        }
    }

    showToast(message, type = 'success') {
        // Remove existing toast
        const existingToast = document.querySelector('.qr-toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = 'qr-toast';
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
            z-index: 10002;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
            animation: qr-toast-in 0.3s ease;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes qr-toast-in {
                from { opacity: 0; transform: translate(-50%, -20px); }
                to { opacity: 1; transform: translate(-50%, 0); }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
            style.remove();
        }, 3000);
    }

    limitWords(text, maxWords) {
        if (!text) return 'Untitled Page';
        
        const words = text.trim().split(/\s+/);
        if (words.length <= maxWords) {
            return text;
        }
        
        return words.slice(0, maxWords).join(' ') + '...';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the widget when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new QRFloatingWidget();
    });
} else {
    new QRFloatingWidget();
} 