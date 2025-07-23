/**
 * QR Code Generator - Content Script v2.0 (Debug Version)
 * Creates floating logo and QR code overlay functionality
 */

// Immediate debug log
console.log('🔍 QR Generator: Content script loaded!', {
    url: window.location.href,
    readyState: document.readyState,
    QRCodeAvailable: typeof QRCode !== 'undefined'
});

class QRFloatingWidget {
    constructor() {
        console.log('🔍 QR Generator: QRFloatingWidget constructor called');
        
        this.pageInfo = null;
        this.floatingLogo = null;
        this.overlay = null;
        this.isOverlayVisible = false;
        this.qrCanvas = null;
        
        // Add a small delay to ensure QRCode library is loaded
        setTimeout(() => {
            console.log('🔍 QR Generator: Delayed init, QRCode available:', typeof QRCode !== 'undefined');
            this.init();
        }, 100);
    }

    async init() {
        try {
            console.log('🔍 QR Generator: Starting init...');
            
            // Skip on restricted pages
            if (this.isRestrictedPage()) {
                console.log('🔍 QR Generator: Skipping restricted page:', window.location.href);
                return;
            }

            console.log('🔍 QR Generator: Initializing floating widget...');
            
            // Extract page information
            this.pageInfo = this.extractPageInfo();
            console.log('🔍 QR Generator: Page info extracted:', this.pageInfo);
            
            // Create floating logo
            console.log('🔍 QR Generator: Creating floating logo...');
            this.createFloatingLogo();
            console.log('🔍 QR Generator: Floating logo created, element:', this.floatingLogo);
            
            // Wait a bit then show the logo
            setTimeout(() => {
                if (this.floatingLogo) {
                    console.log('🔍 QR Generator: Making logo visible');
                    this.floatingLogo.style.opacity = '1';
                } else {
                    console.error('🔍 QR Generator: Logo element is null!');
                }
            }, 500);
            
        } catch (error) {
            console.error('🔍 QR Generator: Error initializing widget:', error);
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
        
        const isRestricted = restrictedPrefixes.some(prefix => url.startsWith(prefix)) ||
               url === 'about:blank' ||
               url === '';
               
        console.log('🔍 QR Generator: Page restriction check:', { url, isRestricted });
        return isRestricted;
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
            ? `link[rel="${rel}"][${additionalSelector}]`
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
        try {
            console.log('🔍 QR Generator: Creating floating logo element...');
            
            // Remove existing logo if any
            if (this.floatingLogo) {
                console.log('🔍 QR Generator: Removing existing logo');
                this.floatingLogo.remove();
            }

            // Check if body exists
            if (!document.body) {
                console.error('🔍 QR Generator: document.body is null!');
                return;
            }

            this.floatingLogo = document.createElement('div');
            this.floatingLogo.className = 'qr-floating-logo';
            this.floatingLogo.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
                cursor: pointer;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                border: 3px solid rgba(255, 255, 255, 0.2);
                user-select: none;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                opacity: 0;
            `;
            
            this.floatingLogo.setAttribute('title', 'Click to generate QR code for this page');
            this.floatingLogo.setAttribute('role', 'button');
            this.floatingLogo.setAttribute('tabindex', '0');

            console.log('🔍 QR Generator: Logo element created, adding content...');

            // Create logo content
            const logoContent = document.createElement('div');
            logoContent.style.cssText = `
                width: 36px;
                height: 36px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(255, 255, 255, 0.95);
                box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            `;

            // Always create fallback logo first (simpler)
            this.createFallbackLogo(logoContent);

            this.floatingLogo.appendChild(logoContent);

            // Add event listeners
            this.floatingLogo.addEventListener('click', () => {
                console.log('🔍 QR Generator: Logo clicked!');
                this.showQROverlay();
            });
            
            this.floatingLogo.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    console.log('🔍 QR Generator: Logo activated via keyboard!');
                    this.showQROverlay();
                }
            });

            // Add to page
            console.log('🔍 QR Generator: Adding logo to document.body...');
            document.body.appendChild(this.floatingLogo);
            
            console.log('🔍 QR Generator: Logo added to DOM, checking if visible...');
            
            // Debug: Check if element is actually in DOM
            setTimeout(() => {
                const logoInDom = document.querySelector('.qr-floating-logo');
                console.log('🔍 QR Generator: Logo in DOM check:', {
                    logoInDom: !!logoInDom,
                    styles: logoInDom ? {
                        display: getComputedStyle(logoInDom).display,
                        position: getComputedStyle(logoInDom).position,
                        zIndex: getComputedStyle(logoInDom).zIndex,
                        opacity: getComputedStyle(logoInDom).opacity,
                        visibility: getComputedStyle(logoInDom).visibility
                    } : 'none'
                });
            }, 100);
            
        } catch (error) {
            console.error('🔍 QR Generator: Error creating floating logo:', error);
        }
    }

    createFallbackLogo(container) {
        console.log('🔍 QR Generator: Creating fallback logo text');
        const logoText = document.createElement('div');
        logoText.style.cssText = `
            font-size: 18px;
            font-weight: 700;
            color: #667eea;
            text-align: center;
            line-height: 1;
        `;
        logoText.textContent = this.pageInfo.siteName.charAt(0).toUpperCase();
        container.appendChild(logoText);
        console.log('🔍 QR Generator: Fallback logo created with text:', logoText.textContent);
    }

    addLogoToQRCode(qrContainer) {
        const logoOverlay = document.createElement('div');
        logoOverlay.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 40px;
            height: 40px;
            background: #ffffff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
            border: 2px solid #ffffff;
            overflow: hidden;
        `;

        // Try to load favicon first
        if (this.pageInfo.favicon) {
            const logoImg = document.createElement('img');
            logoImg.style.cssText = `
                width: 28px;
                height: 28px;
                object-fit: cover;
                border-radius: 50%;
            `;
            logoImg.src = this.makeAbsoluteURL(this.pageInfo.favicon);
            logoImg.alt = 'Website Logo';
            
            logoImg.onload = () => {
                console.log('🔍 QR Generator: Logo image loaded for QR overlay');
                logoOverlay.appendChild(logoImg);
            };
            
            logoImg.onerror = () => {
                console.log('🔍 QR Generator: Logo image failed, using fallback text for QR overlay');
                this.createFallbackLogoForQR(logoOverlay);
            };
        } else {
            console.log('🔍 QR Generator: No favicon found, using fallback text for QR overlay');
            this.createFallbackLogoForQR(logoOverlay);
        }

        qrContainer.appendChild(logoOverlay);
    }

    createFallbackLogoForQR(container) {
        const logoText = document.createElement('div');
        logoText.style.cssText = `
            font-size: 16px;
            font-weight: 700;
            color: #667eea;
            text-align: center;
            line-height: 1;
        `;
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
        console.log('🔍 QR Generator: showQROverlay called');
        if (this.isOverlayVisible) return;

        // Check if QRCode library is available
        if (typeof QRCode === 'undefined') {
            console.error('🔍 QR Generator: QRCode library not available!');
            alert('QR Code library not loaded. Please reload the page and try again.');
            return;
        }

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
            console.error('🔍 QR Generator: Error showing overlay:', error);
            this.showError('Failed to generate QR code: ' + error.message);
        }
    }

    createOverlay() {
        if (this.overlay) {
            this.overlay.remove();
        }

        this.overlay = document.createElement('div');
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10001;
            display: block;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            pointer-events: auto;
        `;

        const overlayContent = document.createElement('div');
        overlayContent.style.cssText = `
            position: fixed;
            bottom: 90px;
            right: 20px;
            background: #ffffff;
            border-radius: 20px;
            padding: 16px;
            width: 280px;
            max-height: 80vh;
            box-shadow: 0 24px 64px rgba(0, 0, 0, 0.3);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
            transform: scale(0.8) translateY(20px);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            overflow-y: auto;
        `;

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            position: absolute;
            top: 12px;
            right: 12px;
            width: 28px;
            height: 28px;
            border: none;
            background: #f5f5f7;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            color: #666;
            transition: all 0.2s ease;
            z-index: 1;
        `;
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
            this.overlay.style.opacity = '1';
            this.overlay.style.visibility = 'visible';
            overlayContent.style.transform = 'scale(1) translateY(0)';
            this.isOverlayVisible = true;
        }, 10);
    }

    showLoading() {
        const content = this.overlay.querySelector('div');
        const closeBtn = content.querySelector('button');
        
        content.innerHTML = '';
        content.appendChild(closeBtn);

        const loading = document.createElement('div');
        loading.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
            padding: 40px;
        `;
        
        const spinner = document.createElement('div');
        spinner.style.cssText = `
            width: 40px;
            height: 40px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        `;
        
        const loadingText = document.createElement('div');
        loadingText.textContent = 'Generating QR code...';
        loadingText.style.cssText = `
            color: #666;
            font-size: 14px;
            font-weight: 500;
        `;
        
        // Add spin animation
        const style = document.createElement('style');
        style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
        document.head.appendChild(style);
        
        loading.appendChild(spinner);
        loading.appendChild(loadingText);
        content.appendChild(loading);
    }

    async generateQRCode() {
        return new Promise((resolve, reject) => {
            try {
                console.log('🔍 QR Generator: Generating QR code for URL:', this.pageInfo.url);
                
                // Create canvas
                this.qrCanvas = document.createElement('canvas');
                this.qrCanvas.width = 200;
                this.qrCanvas.height = 200;

                // Generate QR code using the loaded library
                QRCode.toCanvas(this.qrCanvas, this.pageInfo.url, {
                    width: 200,
                    height: 200,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    },
                    errorCorrectionLevel: 'H'
                }).then(() => {
                    console.log('🔍 QR Generator: QR code generated successfully');
                    resolve();
                }).catch(reject);

            } catch (error) {
                reject(error);
            }
        });
    }

    showQRContent() {
        const content = this.overlay.querySelector('div');
        const closeBtn = content.querySelector('button');
        
        content.innerHTML = '';
        content.appendChild(closeBtn);

        // Header
        const header = document.createElement('div');
        header.style.textAlign = 'center';
        header.innerHTML = `
            <h2 style="font-size: 20px; font-weight: 700; color: #1a1a1a; margin: 0 0 6px 0;">QR Code</h2>
            <p style="font-size: 13px; color: #666; margin: 0;">Scan to visit this page</p>
        `;

        // QR Code container
        const qrContainer = document.createElement('div');
        qrContainer.style.cssText = `
            position: relative;
            display: inline-block;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            background: #fff;
            padding: 4px;
        `;
        qrContainer.appendChild(this.qrCanvas);

        // Add logo overlay on QR code
        this.addLogoToQRCode(qrContainer);

        // Website info
        const websiteInfo = document.createElement('div');
        websiteInfo.style.textAlign = 'center';
        websiteInfo.innerHTML = `
            <div style="font-size: 16px; font-weight: 600; color: #1a1a1a; margin-bottom: 4px;">${this.escapeHtml(this.pageInfo.siteName)}</div>
            <div style="font-size: 13px; font-weight: 500; color: #666;">${this.escapeHtml(this.limitWords(this.pageInfo.title, 15))}</div>
        `;

        // Action buttons
        const actions = document.createElement('div');
        actions.style.cssText = 'display: flex; gap: 10px; width: 100%;';
        
        const saveBtn = document.createElement('button');
        saveBtn.innerHTML = '💾 Save QR Code';
        saveBtn.style.cssText = `
            flex: 1;
            padding: 8px 12px;
            border: none;
            border-radius: 10px;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        `;
        saveBtn.addEventListener('click', () => this.saveQRCode());

        const copyBtn = document.createElement('button');
        copyBtn.innerHTML = '📋 Copy URL';
        copyBtn.style.cssText = `
            flex: 1;
            padding: 8px 12px;
            border: 1px solid #e5e5e7;
            border-radius: 10px;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            background: #f5f5f7;
            color: #1a1a1a;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        `;
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
        const content = this.overlay.querySelector('div');
        const closeBtn = content.querySelector('button');
        
        content.innerHTML = '';
        content.appendChild(closeBtn);

        const error = document.createElement('div');
        error.style.cssText = 'text-align: center; padding: 40px; color: #d73a49;';
        error.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
            <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">Unable to generate QR code</h3>
            <p style="font-size: 14px; color: #666; margin-bottom: 16px;">${this.escapeHtml(message)}</p>
            <button onclick="location.reload()" style="padding: 12px 24px; border: none; border-radius: 12px; background: #667eea; color: white; cursor: pointer;">Retry</button>
        `;

        content.appendChild(error);
    }

    hideQROverlay() {
        if (!this.isOverlayVisible) return;

        this.overlay.style.opacity = '0';
        this.overlay.style.visibility = 'hidden';
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
            console.log('🔍 QR Generator: Starting QR code save...');
            
            // Create composite canvas with QR code and logo
            const compositeCanvas = document.createElement('canvas');
            compositeCanvas.width = 200;
            compositeCanvas.height = 200;
            const ctx = compositeCanvas.getContext('2d');

            // Draw QR code
            ctx.drawImage(this.qrCanvas, 0, 0);
            console.log('🔍 QR Generator: QR code drawn to canvas');

            // Always use the safe fallback method to avoid tainted canvas issues
            this.addLogoToSavedQR(ctx);

            // Download the composite image
            const link = document.createElement('a');
            link.download = `qr-code-${this.formatDomainName(window.location.hostname)}.png`;
            link.href = compositeCanvas.toDataURL();
            
            console.log('🔍 QR Generator: Triggering download...');
            link.click();

            this.showToast('QR code saved successfully!');

        } catch (error) {
            console.error('🔍 QR Generator: Error saving QR code:', error);
            this.showToast('Failed to save QR code: ' + error.message, 'error');
        }
    }

    drawLogoFromOverlay(ctx, logoOverlay) {
        try {
            // Create a temporary canvas to draw the logo
            const logoCanvas = document.createElement('canvas');
            logoCanvas.width = 40;
            logoCanvas.height = 40;
            const logoCtx = logoCanvas.getContext('2d');

            // Draw white background circle
            logoCtx.fillStyle = '#ffffff';
            logoCtx.beginPath();
            logoCtx.arc(20, 20, 20, 0, 2 * Math.PI);
            logoCtx.fill();

            // Only use text, avoid images to prevent tainted canvas
            const logoText = logoOverlay.querySelector('div');
            
            if (logoText) {
                console.log('🔍 QR Generator: Drawing logo text:', logoText.textContent);
                // Draw logo text
                logoCtx.fillStyle = '#667eea';
                logoCtx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                logoCtx.textAlign = 'center';
                logoCtx.textBaseline = 'middle';
                logoCtx.fillText(logoText.textContent, 20, 20);
            } else {
                // Fallback to first letter of site name
                logoCtx.fillStyle = '#667eea';
                logoCtx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                logoCtx.textAlign = 'center';
                logoCtx.textBaseline = 'middle';
                logoCtx.fillText(this.pageInfo.siteName.charAt(0).toUpperCase(), 20, 20);
            }

            // Add shadow effect
            ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
            ctx.shadowBlur = 6;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 2;

            // Draw logo overlay on QR code
            ctx.drawImage(logoCanvas, 80, 80, 40, 40);

            // Reset shadow
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            console.log('🔍 QR Generator: Logo drawn to QR code');
        } catch (error) {
            console.error('🔍 QR Generator: Error drawing logo from overlay:', error);
            // Fallback to simple logo
            this.addLogoToSavedQR(ctx);
        }
    }

    addLogoToSavedQR(ctx) {
        try {
            console.log('🔍 QR Generator: Adding fallback logo to saved QR');
            
            // Create a temporary canvas to draw the logo
            const logoCanvas = document.createElement('canvas');
            logoCanvas.width = 40;
            logoCanvas.height = 40;
            const logoCtx = logoCanvas.getContext('2d');

            // Draw white background circle
            logoCtx.fillStyle = '#ffffff';
            logoCtx.beginPath();
            logoCtx.arc(20, 20, 20, 0, 2 * Math.PI);
            logoCtx.fill();

            // Draw logo text (first letter of site name)
            logoCtx.fillStyle = '#667eea';
            logoCtx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            logoCtx.textAlign = 'center';
            logoCtx.textBaseline = 'middle';
            logoCtx.fillText(this.pageInfo.siteName.charAt(0).toUpperCase(), 20, 20);

            // Add shadow effect
            ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
            ctx.shadowBlur = 6;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 2;

            // Draw logo overlay on QR code
            ctx.drawImage(logoCanvas, 80, 80, 40, 40);

            // Reset shadow
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            console.log('🔍 QR Generator: Fallback logo added to QR code');
        } catch (error) {
            console.error('🔍 QR Generator: Error adding fallback logo:', error);
        }
    }

    async copyURL() {
        try {
            await navigator.clipboard.writeText(this.pageInfo.url);
            this.showToast('URL copied to clipboard!');
        } catch (error) {
            console.error('🔍 QR Generator: Error copying URL:', error);
            this.showToast('Failed to copy URL', 'error');
        }
    }

    showToast(message, type = 'success') {
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
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
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

// Multiple initialization methods to ensure it runs
console.log('🔍 QR Generator: Setting up initialization...');

function initializeWidget() {
    console.log('🔍 QR Generator: initializeWidget called, document ready state:', document.readyState);
    try {
        new QRFloatingWidget();
    } catch (error) {
        console.error('🔍 QR Generator: Error in initializeWidget:', error);
    }
}

// Try different initialization approaches
if (document.readyState === 'loading') {
    console.log('🔍 QR Generator: Document still loading, waiting for DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', initializeWidget);
} else {
    console.log('🔍 QR Generator: Document already loaded, initializing immediately');
    // Small delay to ensure everything is ready
    setTimeout(initializeWidget, 50);
}

// Backup initialization
setTimeout(() => {
    if (!document.querySelector('.qr-floating-logo')) {
        console.log('🔍 QR Generator: Backup initialization triggered');
        initializeWidget();
    }
}, 1000);

// Listen for messages from background script (kept for future use)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('🔍 QR Generator: Received message:', request);
    
    if (request.action === 'showInstructions') {
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
        
        sendResponse({ success: true });
    }
    
    return true; // Keep message channel open for async response
});

 