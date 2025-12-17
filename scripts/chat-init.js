/**
 * Chat Initialisation Module
 * 
 * Handles dynamic initialisation of chat iframes with correct parent parameters.
 * 
 * @module chat-init
 */

/**
 * Initialises chat iframes with correct parent parameters
 * 
 * Updates the src attributes of chat iframes to include the parent parameter
 * for proper embedding (required by Twitch).
 * Also sets up Kick chat iframe with proper configuration for authentication.
 * 
 * @example
 * initChatEmbeds();
 */
export function initChatEmbeds() {
    const twitchChat = document.getElementById('twitch-chat');
    
    if (twitchChat) {
        // Get current hostname for parent parameter
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        
        // Build parent parameter - include both current hostname and common localhost variants
        const parentParams = [];
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            parentParams.push('localhost', '127.0.0.1');
        } else {
            parentParams.push(hostname);
        }
        
        // Update Twitch chat iframe src with parent parameter and dark mode
        const twitchChatUrl = `https://www.twitch.tv/embed/flukie/chat?parent=${parentParams.join('&parent=')}&darkpopout`;
        twitchChat.src = twitchChatUrl;
        
        console.log('Twitch chat embed initialised with URL:', twitchChatUrl);
    }
    
    // Initialise Kick chat iframe
    initKickChat();
    
    // Set up authentication helper
    setupKickAuthHelper();
}

/**
 * Initialises the Kick chat iframe with proper configuration
 * and sets up authentication handling
 * 
 * @private
 */
function initKickChat() {
    const kickChat = document.getElementById('kick-chat');
    
    if (!kickChat) {
        return;
    }
    
    // Store original src for reloading
    const originalSrc = kickChat.src || kickChat.getAttribute('src');
    if (originalSrc) {
        kickChat.setAttribute('data-original-src', originalSrc);
    }
    
    // Set up error handling for authentication issues
    kickChat.addEventListener('load', () => {
        try {
            // Try to access iframe content to check for errors
            // This will fail if cross-origin, but that's expected
            const iframeDoc = kickChat.contentDocument || kickChat.contentWindow?.document;
            if (iframeDoc) {
                // If we can access the document, check for error messages
                const errorElements = iframeDoc.querySelectorAll('[class*="error"], [id*="error"]');
                if (errorElements.length > 0) {
                    console.warn('Kick chat iframe may have errors');
                }
            }
        } catch (e) {
            // Cross-origin access denied - this is normal and expected
            // The iframe should still work for displaying chat
        }
    });
    
    // Listen for messages from the iframe (if Kick.com sends any)
    window.addEventListener('message', (event) => {
        // Only accept messages from kick.com
        if (event.origin !== 'https://kick.com' && event.origin !== 'https://www.kick.com') {
            return;
        }
        
        // Handle authentication-related messages if any
        if (event.data && typeof event.data === 'object') {
            if (event.data.type === 'auth-complete' || event.data.type === 'auth-success') {
                // Reload the iframe after successful authentication
                reloadKickChat();
            }
        }
    });
    
    console.log('Kick chat iframe initialised');
}

/**
 * Reloads the Kick chat iframe to refresh authentication state
 * 
 * @example
 * reloadKickChat();
 */
export function reloadKickChat() {
    const kickChat = document.getElementById('kick-chat');
    
    if (!kickChat) {
        return;
    }
    
    // Get original src or use default
    const originalSrc = kickChat.getAttribute('data-original-src') || 
                       'https://kick.com/popout/flukie/chat';
    
    // Force reload by appending a timestamp to bypass cache
    const separator = originalSrc.includes('?') ? '&' : '?';
    const reloadUrl = `${originalSrc}${separator}_t=${Date.now()}`;
    
    kickChat.src = reloadUrl;
    console.log('Kick chat iframe reloaded');
    
    // Hide the auth helper after reload
    const authHelper = document.getElementById('kick-auth-helper');
    if (authHelper) {
        authHelper.style.display = 'none';
    }
}

/**
 * Sets up the authentication helper button
 * 
 * @private
 */
function setupKickAuthHelper() {
    const reloadButton = document.getElementById('reload-kick-chat');
    if (reloadButton) {
        reloadButton.addEventListener('click', () => {
            reloadKickChat();
        });
    }
    
    // Show helper if iframe fails to load or if there are authentication issues
    const kickChat = document.getElementById('kick-chat');
    if (kickChat) {
        kickChat.addEventListener('error', () => {
            showKickAuthHelper();
        });
        
        // Check for authentication errors after a delay
        setTimeout(() => {
            try {
                // Try to detect if there's an authentication issue
                // This is a best-effort check since we can't access cross-origin content
                const iframe = kickChat;
                if (iframe.contentWindow) {
                    // If we can't access the content, it might be due to authentication
                    // Show the helper as a precaution
                    const authHelper = document.getElementById('kick-auth-helper');
                    if (authHelper) {
                        // Show helper after a short delay to see if chat loads
                        setTimeout(() => {
                            // Only show if user might need help
                            // We'll show it if they click on sign-in related elements
                            // For now, we'll keep it hidden unless explicitly needed
                        }, 2000);
                    }
                }
            } catch (e) {
                // Cross-origin access denied - this is normal
            }
        }, 3000);
    }
}

/**
 * Shows the authentication helper message
 * 
 * @private
 */
function showKickAuthHelper() {
    const authHelper = document.getElementById('kick-auth-helper');
    if (authHelper) {
        authHelper.style.display = 'block';
    }
}

