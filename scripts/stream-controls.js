/**
 * Stream Controls Module
 * 
 * Handles tab switching between Kick and Twitch streams, and chat wrapper toggle.
 * 
 * @module stream-controls
 */

import { unloadStream, initTwitchEmbed, createIframeEmbed } from './embeds.js';

/**
 * Currently active stream tab
 * @type {string}
 */
let activeStream = 'kick';

/**
 * Initialises stream controls (tab switching and chat wrapper)
 * 
 * Sets up event listeners for:
 * - Stream tab buttons to switch between Kick and Twitch
 * - Chat wrapper toggle button
 * 
 * @example
 * initStreamControls();
 */
export function initStreamControls() {
    // Stream tab switching
    const kickTab = document.getElementById('kick-tab');
    const twitchTab = document.getElementById('twitch-tab');
    const kickPlayer = document.getElementById('kick-player');
    const twitchPlayer = document.getElementById('twitch-player');
    
    if (kickTab && twitchTab) {
        kickTab.addEventListener('click', () => {
            switchStream('kick');
        });
        
        twitchTab.addEventListener('click', () => {
            switchStream('twitch');
        });
    }

    // Chat wrapper toggle
    const chatToggle = document.getElementById('chat-toggle');
    const chatWrapper = document.getElementById('chat-wrapper');
    
    if (chatToggle && chatWrapper) {
        chatToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleChatWrapper();
        });
        
        // Initialise chat wrapper as collapsed by default on mobile devices
        if (isMobileDevice()) {
            chatWrapper.classList.add('collapsed');
        }
        // On desktop, chat starts visible alongside the player
    }
}

/**
 * Switches between Kick and Twitch streams
 * 
 * @param {string} stream - The stream to switch to ('kick' or 'twitch')
 * 
 * @example
 * switchStream('twitch');
 */
export function switchStream(stream) {
    if (stream !== 'kick' && stream !== 'twitch') {
        console.warn(`Invalid stream: ${stream}. Must be 'kick' or 'twitch'.`);
        return;
    }

    // Don't do anything if already on this stream
    if (activeStream === stream) {
        return;
    }

    const kickTab = document.getElementById('kick-tab');
    const twitchTab = document.getElementById('twitch-tab');
    const kickPlayer = document.getElementById('kick-player');
    const twitchPlayer = document.getElementById('twitch-player');

    if (!kickTab || !twitchTab || !kickPlayer || !twitchPlayer) {
        return;
    }

    // Unload the currently active stream before switching
    if (activeStream) {
        unloadStream(activeStream);
    }

    // Update active tab
    const kickChat = document.getElementById('kick-chat');
    const twitchChat = document.getElementById('twitch-chat');
    
    if (stream === 'kick') {
        kickTab.classList.add('active');
        twitchTab.classList.remove('active');
        kickPlayer.classList.add('active');
        twitchPlayer.classList.remove('active');
        
        // Switch to Kick chat
        if (kickChat && twitchChat) {
            kickChat.classList.add('active');
            twitchChat.classList.remove('active');
        }
        
        // Reload Kick stream
        const kickIframe = document.querySelector('#kick-embed iframe');
        if (kickIframe) {
            const originalSrc = kickIframe.getAttribute('data-original-src');
            if (originalSrc && (!kickIframe.src || kickIframe.src === '')) {
                kickIframe.src = originalSrc;
            } else if (!kickIframe.src || kickIframe.src === '' || !kickIframe.src.includes('kick.com')) {
                // Fallback: Get channel name from original src or use default
                const kickChannel = 'flukie'; // Could be made configurable
                kickIframe.src = `https://player.kick.com/${kickChannel}`;
            }
        }
    } else {
        twitchTab.classList.add('active');
        kickTab.classList.remove('active');
        twitchPlayer.classList.add('active');
        kickPlayer.classList.remove('active');
        
        // Switch to Twitch chat
        if (kickChat && twitchChat) {
            twitchChat.classList.add('active');
            kickChat.classList.remove('active');
            console.log('Switched to Twitch chat');
        } else {
            console.warn('Twitch chat elements not found:', { kickChat, twitchChat });
        }
        
        // Reload Twitch stream
        const twitchContainer = document.getElementById('twitch-embed');
        if (twitchContainer) {
            const twitchIframe = twitchContainer.querySelector('iframe');
            if (!twitchIframe || !twitchIframe.src) {
                // Reinitialize Twitch embed
                const twitchChannel = 'flukie'; // Could be made configurable
                initTwitchEmbed(twitchChannel, 'twitch-embed', {
                    width: 1280,
                    height: 720
                });
            }
        }
    }

    activeStream = stream;
}

/**
 * Toggles the chat wrapper expand/collapse state
 * 
 * @example
 * toggleChatWrapper();
 */
export function toggleChatWrapper() {
    const chatWrapper = document.getElementById('chat-wrapper');
    
    if (!chatWrapper) {
        return;
    }

    const isCollapsed = chatWrapper.classList.contains('collapsed');
    
    if (isCollapsed) {
        chatWrapper.classList.remove('collapsed');
    } else {
        chatWrapper.classList.add('collapsed');
    }
}

/**
 * Gets the currently active stream
 * 
 * @returns {string} The active stream ('kick' or 'twitch')
 * 
 * @example
 * const currentStream = getActiveStream();
 */
export function getActiveStream() {
    return activeStream;
}

/**
 * Gets the current state of the chat wrapper
 * 
 * @returns {boolean} True if expanded, false if collapsed
 * 
 * @example
 * const isExpanded = isChatWrapperExpanded();
 */
export function isChatWrapperExpanded() {
    const chatWrapper = document.getElementById('chat-wrapper');
    return chatWrapper ? !chatWrapper.classList.contains('collapsed') : false;
}

/**
 * Detects if the current device is a mobile device
 * 
 * Checks both window width and user agent to determine if device is mobile
 * 
 * @returns {boolean} True if mobile device, false otherwise
 * 
 * @example
 * if (isMobileDevice()) {
 *     // Mobile-specific code
 * }
 */
function isMobileDevice() {
    // Check window width (matches CSS media query breakpoint)
    const isMobileWidth = window.innerWidth <= 768;
    
    // Check user agent for mobile devices
    const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Also check for touch capability
    const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Consider it mobile if width is small OR (user agent suggests mobile AND has touch)
    return isMobileWidth || (isMobileUserAgent && hasTouchScreen);
}
