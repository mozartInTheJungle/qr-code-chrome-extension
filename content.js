/**
 * Content Script - Extracts additional website information
 * Runs on all websites to gather enhanced metadata
 */

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getPageInfo') {
        try {
            const pageInfo = extractPageInfo();
            sendResponse(pageInfo);
        } catch (error) {
            console.error('Error extracting page info:', error);
            sendResponse(null);
        }
        return true; // Indicates we will send a response asynchronously
    }
});

function extractPageInfo() {
    const info = {};
    
    // Try to get site name from various meta tags
    info.siteName = getSiteName();
    
    // Get high-resolution favicon/logo
    info.highResLogo = getHighResolutionLogo();
    
    // Get additional meta information
    info.description = getMetaContent('description');
    info.keywords = getMetaContent('keywords');
    
    // Get OpenGraph data
    info.ogTitle = getMetaContent('og:title');
    info.ogSiteName = getMetaContent('og:site_name');
    info.ogImage = getMetaContent('og:image');
    
    // Get Twitter Card data
    info.twitterSite = getMetaContent('twitter:site');
    info.twitterImage = getMetaContent('twitter:image');
    
    // Get theme color
    info.themeColor = getMetaContent('theme-color');
    
    return info;
}

function getSiteName() {
    // Try multiple sources for site name
    const sources = [
        // OpenGraph site name
        getMetaContent('og:site_name'),
        
        // Twitter site handle (clean up @)
        getMetaContent('twitter:site')?.replace('@', ''),
        
        // Application name
        getMetaContent('application-name'),
        
        // Apple mobile web app title
        getMetaContent('apple-mobile-web-app-title'),
        
        // Look for JSON-LD structured data
        getStructuredDataSiteName(),
        
        // Try to extract from logo alt text
        getLogoAltText(),
        
        // Extract from page title (before " - " or " | ")
        extractSiteFromTitle()
    ];
    
    // Return first non-empty result
    return sources.find(name => name && name.trim().length > 0) || null;
}

function getHighResolutionLogo() {
    const logoSources = [
        // Apple touch icons (usually highest quality)
        getLinkHref('apple-touch-icon'),
        getLinkHref('apple-touch-icon-precomposed'),
        
        // High-resolution favicons
        getLinkHref('icon', 'sizes="192x192"'),
        getLinkHref('icon', 'sizes="180x180"'),
        getLinkHref('icon', 'sizes="152x152"'),
        getLinkHref('icon', 'sizes="144x144"'),
        getLinkHref('icon', 'sizes="120x120"'),
        
        // OpenGraph image
        getMetaContent('og:image'),
        
        // Twitter card image
        getMetaContent('twitter:image'),
        
        // Look for logo images in the page
        findLogoImage(),
        
        // Standard favicon
        getLinkHref('icon'),
        getLinkHref('shortcut icon')
    ];
    
    return logoSources.find(src => src && src.trim().length > 0) || null;
}

function getMetaContent(name) {
    // Try property attribute first (for OpenGraph)
    let meta = document.querySelector(`meta[property="${name}"]`);
    if (meta) return meta.getAttribute('content');
    
    // Try name attribute
    meta = document.querySelector(`meta[name="${name}"]`);
    if (meta) return meta.getAttribute('content');
    
    return null;
}

function getLinkHref(rel, additionalSelector = '') {
    const selector = additionalSelector 
        ? `link[rel="${rel}"]${additionalSelector}`
        : `link[rel="${rel}"]`;
    
    const link = document.querySelector(selector);
    return link ? link.getAttribute('href') : null;
}

function getStructuredDataSiteName() {
    try {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        for (const script of scripts) {
            const data = JSON.parse(script.textContent);
            if (data.name) return data.name;
            if (data.publisher && data.publisher.name) return data.publisher.name;
        }
    } catch (error) {
        // Ignore JSON parsing errors
    }
    return null;
}

function getLogoAltText() {
    // Look for images with 'logo' in class, id, or alt text
    const logoImages = document.querySelectorAll('img[alt*="logo" i], img[class*="logo" i], img[id*="logo" i]');
    
    for (const img of logoImages) {
        const alt = img.getAttribute('alt');
        if (alt && alt.toLowerCase().includes('logo')) {
            // Extract site name from alt text
            return alt.replace(/logo/gi, '').trim();
        }
    }
    return null;
}

function extractSiteFromTitle() {
    const title = document.title;
    if (!title) return null;
    
    // Common title patterns: "Page Title - Site Name" or "Page Title | Site Name"
    const separators = [' - ', ' | ', ' • ', ' :: ', ' — '];
    
    for (const sep of separators) {
        if (title.includes(sep)) {
            const parts = title.split(sep);
            // Usually site name is the last part
            const siteName = parts[parts.length - 1].trim();
            
            // Avoid returning very long strings (likely not site names)
            if (siteName.length < 50) {
                return siteName;
            }
        }
    }
    
    return null;
}

function findLogoImage() {
    // Look for images that are likely logos
    const logoSelectors = [
        'img[alt*="logo" i]',
        'img[class*="logo" i]',
        'img[id*="logo" i]',
        '.logo img',
        '.brand img',
        '.header img',
        'header img',
        '.navbar img',
        '.site-logo img'
    ];
    
    for (const selector of logoSelectors) {
        const img = document.querySelector(selector);
        if (img && img.src) {
            // Prefer images that are reasonably sized for logos
            const width = img.naturalWidth || img.width;
            const height = img.naturalHeight || img.height;
            
            if (width >= 32 && height >= 32 && width <= 500 && height <= 500) {
                return img.src;
            }
        }
    }
    
    return null;
}

// Utility function to convert relative URLs to absolute
function makeAbsoluteURL(url) {
    if (!url) return null;
    
    try {
        return new URL(url, window.location.href).href;
    } catch (error) {
        return null;
    }
}

// Convert all URLs to absolute URLs before sending
function normalizeURLs(info) {
    const urlFields = ['highResLogo', 'ogImage', 'twitterImage'];
    
    urlFields.forEach(field => {
        if (info[field]) {
            info[field] = makeAbsoluteURL(info[field]);
        }
    });
    
    return info;
} 