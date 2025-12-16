/**
 * Embeds Module
 * 
 * Manages native JavaScript embed APIs (Twitch, Mixcloud) and iframe embeds
 * (Kick, hearthis.at, VK Video) for live streams and archives.
 * 
 * @module embeds
 */

/**
 * Twitch embed instance
 * @type {Object|null}
 */
let twitchEmbed = null;

/**
 * Mixcloud widget instances
 * @type {Map<string, Object>}
 */
const mixcloudWidgets = new Map();

/**
 * Initialises the Twitch embed using the native Twitch.Embed API
 * 
 * @param {string} channel - The Twitch channel name
 * @param {string} containerId - The ID of the container element
 * @param {Object} [options={}] - Additional options for the embed
 * @param {number} [options.width=1280] - Width of the embed
 * @param {number} [options.height=720] - Height of the embed
 * 
 * @example
 * initTwitchEmbed('flukie', 'twitch-embed', { width: 1280, height: 720 });
 */
export function initTwitchEmbed(channel, containerId, options = {}) {
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.warn(`Twitch Embed: Container "${containerId}" not found`);
        return;
    }

    // Check if Twitch Embed API is loaded
    if (typeof Twitch === 'undefined' || !Twitch.Embed) {
        console.error('Twitch Embed API not loaded. Make sure https://embed.twitch.tv/embed/v1.js is included.');
        return;
    }

    try {
        const embedOptions = {
            width: options.width || 1280,
            height: options.height || 720,
            channel: channel,
            layout: 'video', // Show only video, no chat
            parent: [window.location.hostname],
            ...options
        };

        twitchEmbed = new Twitch.Embed(containerId, embedOptions);

        // Listen for ready event
        twitchEmbed.addEventListener(Twitch.Embed.VIDEO_READY, () => {
            console.log('Twitch embed ready');
        });

        console.log('Twitch embed initialised');
    } catch (error) {
        console.error('Error initialising Twitch embed:', error);
    }
}

/**
 * Initialises a Mixcloud widget using the native Mixcloud.PlayerWidget API
 * 
 * @param {string} feedUrl - The Mixcloud feed URL
 * @param {string} containerId - The ID of the container element
 * @param {string} [widgetId] - Optional unique ID for this widget instance
 * @returns {Object|null} The Mixcloud widget instance, or null if initialisation failed
 * 
 * @example
 * const widget = initMixcloudWidget('https://www.mixcloud.com/FlukieL/', 'mixcloud-container-1', 'widget-1');
 */
export function initMixcloudWidget(feedUrl, containerId, widgetId = null) {
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.warn(`Mixcloud Widget: Container "${containerId}" not found`);
        return null;
    }

    // Check if Mixcloud Widget API is loaded
    if (typeof Mixcloud === 'undefined' || !Mixcloud.PlayerWidget) {
        console.error('Mixcloud Widget API not loaded. Make sure the Mixcloud widget script is included.');
        // Fallback to iframe embed
        createIframeEmbed(`https://www.mixcloud.com/widget/iframe/?feed=${encodeURIComponent(feedUrl)}`, containerId, {
            height: '120',
            title: 'Mixcloud Player'
        });
        return null;
    }

    try {
        const id = widgetId || `mixcloud-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Create iframe for Mixcloud widget
        const iframe = document.createElement('iframe');
        iframe.width = '100%';
        iframe.height = '120';
        iframe.src = `https://www.mixcloud.com/widget/iframe/?feed=${encodeURIComponent(feedUrl)}`;
        iframe.frameBorder = '0';
        iframe.allow = 'autoplay';
        iframe.id = `mixcloud-iframe-${id}`;
        
        container.appendChild(iframe);
        
        // Initialise PlayerWidget with the iframe
        const widget = Mixcloud.PlayerWidget(iframe);

        mixcloudWidgets.set(id, widget);

        // Listen for ready event
        widget.ready.then(() => {
            console.log(`Mixcloud widget "${id}" ready`);
        }).catch(error => {
            console.error(`Mixcloud widget "${id}" error:`, error);
        });

        console.log(`Mixcloud widget "${id}" initialised`);
        return widget;
    } catch (error) {
        console.error('Error initialising Mixcloud widget:', error);
        // Fallback to iframe embed
        createIframeEmbed(`https://www.mixcloud.com/widget/iframe/?feed=${encodeURIComponent(feedUrl)}`, containerId, {
            height: '120',
            title: 'Mixcloud Player'
        });
        return null;
    }
}

/**
 * Creates an iframe embed for platforms that don't have native JavaScript APIs
 * 
 * @param {string} embedUrl - The URL for the iframe src
 * @param {string} containerId - The ID of the container element
 * @param {Object} [options={}] - Additional options
 * @param {number} [options.width=1280] - Width of the iframe
 * @param {number} [options.height=720] - Height of the iframe
 * @param {string} [options.title=''] - Title attribute for accessibility
 * 
 * @example
 * createIframeEmbed('https://player.kick.com/flukie', 'kick-embed', {
 *   width: 1280,
 *   height: 720,
 *   title: 'Kick.com Live Stream'
 * });
 */
export function createIframeEmbed(embedUrl, containerId, options = {}) {
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.warn(`Iframe Embed: Container "${containerId}" not found`);
        return;
    }

    // Clear existing content
    container.innerHTML = '';

    const iframe = document.createElement('iframe');
    iframe.src = embedUrl;
    iframe.width = options.width || '100%';
    iframe.height = options.height || '100%';
    iframe.frameBorder = '0';
    iframe.scrolling = 'no';
    iframe.allowFullscreen = true;
    iframe.title = options.title || '';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';

    container.appendChild(iframe);
    console.log(`Iframe embed created in "${containerId}"`);
}

/**
 * Creates an audio archive embed item
 * 
 * @param {Object} archiveItem - The archive item data from config
 * @param {string} archiveItem.platform - The platform name (mixcloud, hearthis)
 * @param {string} archiveItem.title - The title of the archive item
 * @param {string} archiveItem.url - The URL of the archive item
 * @param {string} archiveItem.embedUrl - The embed URL for the archive item
 * @param {HTMLElement} container - The container element to append the archive item to
 * 
 * @example
 * const item = { platform: 'mixcloud', title: 'My Mix', url: '...', embedUrl: '...' };
 * createAudioArchiveItem(item, document.getElementById('audio-archives-container'));
 */
export function createAudioArchiveItem(archiveItem, container) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'archive-item';

    const titleDiv = document.createElement('div');
    titleDiv.className = 'archive-title';
    titleDiv.textContent = archiveItem.title;
    itemDiv.appendChild(titleDiv);

    // Add date if available
    if (archiveItem.created_time) {
        const dateDiv = document.createElement('div');
        dateDiv.className = 'archive-date';
        const date = new Date(archiveItem.created_time);
        // Format as DD/MM/YYYY (British format)
        const formattedDate = date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        dateDiv.textContent = formattedDate;
        itemDiv.appendChild(dateDiv);
    }

    const embedDiv = document.createElement('div');
    embedDiv.className = 'archive-embed';
    
    const uniqueId = `audio-${archiveItem.platform}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    embedDiv.id = uniqueId;
    itemDiv.appendChild(embedDiv);

    container.appendChild(itemDiv);

    // Initialise the appropriate embed based on platform
    if (archiveItem.platform === 'mixcloud') {
        initMixcloudWidget(archiveItem.url, uniqueId, uniqueId);
    } else if (archiveItem.platform === 'hearthis') {
        createIframeEmbed(archiveItem.embedUrl, uniqueId, {
            height: '150',
            title: archiveItem.title
        });
    } else {
        console.warn(`Unknown audio platform: ${archiveItem.platform}`);
    }
}

/**
 * Creates a video archive embed item
 * 
 * @param {Object} archiveItem - The archive item data from config
 * @param {string} archiveItem.platform - The platform name (vk)
 * @param {string} archiveItem.title - The title of the archive item
 * @param {string} archiveItem.url - The URL of the archive item
 * @param {string} archiveItem.embedUrl - The embed URL for the archive item
 * @param {HTMLElement} container - The container element to append the archive item to
 * 
 * @example
 * const item = { platform: 'vk', title: 'My Video', url: '...', embedUrl: '...' };
 * createVideoArchiveItem(item, document.getElementById('video-archives-container'));
 */
export function createVideoArchiveItem(archiveItem, container) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'archive-item';

    const titleDiv = document.createElement('div');
    titleDiv.className = 'archive-title';
    titleDiv.textContent = archiveItem.title;
    itemDiv.appendChild(titleDiv);

    const embedDiv = document.createElement('div');
    embedDiv.className = 'archive-embed';
    
    const uniqueId = `video-${archiveItem.platform}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    embedDiv.id = uniqueId;
    itemDiv.appendChild(embedDiv);

    container.appendChild(itemDiv);

    // Initialise the appropriate embed based on platform
    if (archiveItem.platform === 'vk') {
        createIframeEmbed(archiveItem.embedUrl, uniqueId, {
            height: '360',
            title: archiveItem.title
        });
    } else {
        console.warn(`Unknown video platform: ${archiveItem.platform}`);
    }
}

/**
 * Initialises all live stream embeds
 * 
 * @param {string} kickChannel - The Kick.com channel name
 * @param {string} twitchChannel - The Twitch channel name
 * 
 * @example
 * initLiveStreams('flukie', 'flukie');
 */
export function initLiveStreams(kickChannel, twitchChannel) {
    // Initialise Kick embed (iframe)
    createIframeEmbed(`https://player.kick.com/${kickChannel}`, 'kick-embed', {
        width: '1280',
        height: '720',
        title: 'Kick.com Live Stream'
    });

    // Initialise Twitch embed (native API)
    initTwitchEmbed(twitchChannel, 'twitch-embed', {
        width: 1280,
        height: 720
    });
}

/**
 * Loads and displays audio archives from configuration
 * 
 * @param {Array} audioArchives - Array of audio archive items from config
 * 
 * @example
 * const archives = await getAudioArchives();
 * loadAudioArchives(archives);
 */
export function loadAudioArchives(audioArchives) {
    const container = document.getElementById('audio-archives-container');
    
    if (!container) {
        console.warn('Audio archives container not found');
        return;
    }

    // Clear existing content
    container.innerHTML = '';

    if (audioArchives.length === 0) {
        container.innerHTML = '<div class="loading">No audio archives available</div>';
        return;
    }

    // Sort by date (newest first) - using created_time if available
    const sortedArchives = [...audioArchives].sort((a, b) => {
        const dateA = a.created_time ? new Date(a.created_time) : new Date(0);
        const dateB = b.created_time ? new Date(b.created_time) : new Date(0);
        return dateB - dateA; // Descending order (newest first)
    });

    sortedArchives.forEach((item, index) => {
        // Small delay to prevent overwhelming the browser
        setTimeout(() => {
            createAudioArchiveItem(item, container);
        }, index * 100);
    });
}

/**
 * Loads and displays video archives from configuration in YouTube-like layout
 * 
 * @param {Array} videoArchives - Array of video archive items from config
 * 
 * @example
 * const archives = await getVideoArchives();
 * loadVideoArchives(archives);
 */
export function loadVideoArchives(videoArchives) {
    const playerLayout = document.getElementById('video-player-layout');
    const mainPlayerContainer = document.getElementById('video-player-container');
    const playlistContainer = document.getElementById('video-playlist');
    
    if (!playerLayout || !mainPlayerContainer || !playlistContainer) {
        console.warn('Video player layout elements not found');
        return;
    }

    // Clear existing content
    playlistContainer.innerHTML = '';
    mainPlayerContainer.innerHTML = '';

    if (videoArchives.length === 0) {
        mainPlayerContainer.innerHTML = '<div class="video-placeholder">No video archives available</div>';
        return;
    }

    // Sort by date (newest first)
    const sortedArchives = [...videoArchives].sort((a, b) => {
        const dateA = a.created_time ? new Date(a.created_time) : new Date(0);
        const dateB = b.created_time ? new Date(b.created_time) : new Date(0);
        return dateB - dateA; // Descending order (newest first)
    });

    // Create playlist items
    sortedArchives.forEach((item, index) => {
        const playlistItem = document.createElement('div');
        playlistItem.className = 'video-playlist-item';
        playlistItem.dataset.videoIndex = index;
        
        // Add title
        const titleDiv = document.createElement('div');
        titleDiv.className = 'video-playlist-item-title';
        titleDiv.textContent = item.title || 'Untitled';
        playlistItem.appendChild(titleDiv);
        
        // Add date if available
        if (item.created_time) {
            const dateDiv = document.createElement('div');
            dateDiv.className = 'video-playlist-item-date';
            const date = new Date(item.created_time);
            // Format as DD/MM/YYYY (British format)
            const formattedDate = date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            dateDiv.textContent = formattedDate;
            playlistItem.appendChild(dateDiv);
        }
        
        // Add click handler to load video
        playlistItem.addEventListener('click', () => {
            loadVideoInPlayer(item, index, sortedArchives, playlistContainer);
        });
        
        playlistContainer.appendChild(playlistItem);
    });

    // Load first video by default
    if (sortedArchives.length > 0) {
        loadVideoInPlayer(sortedArchives[0], 0, sortedArchives, playlistContainer);
    }
}

/**
 * Loads a video into the main player
 * 
 * @param {Object} videoItem - The video archive item to load
 * @param {number} index - The index of the video in the sorted array
 * @param {Array} allVideos - All video items for reference
 * @param {HTMLElement} playlistContainer - The playlist container to update active state
 */
function loadVideoInPlayer(videoItem, index, allVideos, playlistContainer) {
    const mainPlayerContainer = document.getElementById('video-player-container');
    
    if (!mainPlayerContainer) {
        console.warn('Video player container not found');
        return;
    }

    // Update active state in playlist
    const playlistItems = playlistContainer.querySelectorAll('.video-playlist-item');
    playlistItems.forEach((item, i) => {
        if (i === index) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Clear existing player
    mainPlayerContainer.innerHTML = '';

    // Create iframe for VK video
    if (videoItem.platform === 'vk') {
        const iframe = document.createElement('iframe');
        iframe.src = videoItem.embedUrl || videoItem.url;
        iframe.width = '100%';
        iframe.height = '100%';
        iframe.frameBorder = '0';
        iframe.allowFullscreen = true;
        iframe.title = videoItem.title || 'Video Player';
        iframe.style.position = 'absolute';
        iframe.style.top = '0';
        iframe.style.left = '0';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        
        mainPlayerContainer.appendChild(iframe);
    } else {
        console.warn(`Unknown video platform: ${videoItem.platform}`);
        mainPlayerContainer.innerHTML = '<div class="video-placeholder">Unsupported video platform</div>';
    }
}

/**
 * Pauses the Twitch embed if it exists
 * 
 * @private
 */
function pauseTwitchEmbed() {
    if (twitchEmbed) {
        try {
            const player = twitchEmbed.getPlayer();
            if (player) {
                player.pause();
            }
        } catch (error) {
            console.warn('Error pausing Twitch embed:', error);
        }
    }
}

/**
 * Unloads all media in a given section by pausing/stopping playback
 * 
 * @param {string} sectionId - The ID of the section to unload
 * 
 * @example
 * unloadSectionMedia('audio-archives');
 */
export function unloadSectionMedia(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) {
        return;
    }

    // Handle live streams section
    if (sectionId === 'live-streams') {
        // Pause Twitch embed
        pauseTwitchEmbed();
        
        // Unload Kick iframe by removing src
        const kickIframe = section.querySelector('#kick-embed iframe');
        if (kickIframe && kickIframe.src) {
            kickIframe.src = '';
        }
        
        // Unload Twitch iframe by removing src
        const twitchContainer = document.getElementById('twitch-embed');
        if (twitchContainer) {
            const twitchIframe = twitchContainer.querySelector('iframe');
            if (twitchIframe && twitchIframe.src) {
                twitchIframe.src = '';
            }
        }
        return;
    }

    // Handle audio archives section
    if (sectionId === 'audio-archives') {
        // Pause all Mixcloud widgets
        mixcloudWidgets.forEach((widget, widgetId) => {
            try {
                widget.pause();
            } catch (error) {
                console.warn(`Error pausing Mixcloud widget "${widgetId}":`, error);
            }
        });

        // Unload all iframes in audio archives - store original src before clearing
        const iframes = section.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            const currentSrc = iframe.src;
            if (currentSrc && currentSrc !== 'about:blank' && currentSrc !== window.location.href) {
                // Store original src in data attribute (only if not already stored)
                if (!iframe.getAttribute('data-original-src')) {
                    iframe.setAttribute('data-original-src', currentSrc);
                }
                // Clear the src to stop playback
                iframe.src = 'about:blank';
            }
        });
        return;
    }

    // Handle video archives section
    if (sectionId === 'video-archives') {
        // Unload the main video player iframe
        const mainPlayerContainer = document.getElementById('video-player-container');
        if (mainPlayerContainer) {
            const iframe = mainPlayerContainer.querySelector('iframe');
            if (iframe) {
                const currentSrc = iframe.src;
                if (currentSrc && currentSrc !== 'about:blank' && currentSrc !== window.location.href) {
                    // Store original src in data attribute (only if not already stored)
                    if (!iframe.getAttribute('data-original-src')) {
                        iframe.setAttribute('data-original-src', currentSrc);
                    }
                    // Clear the src to stop playback
                    iframe.src = 'about:blank';
                }
            }
        }
        return;
    }
}

/**
 * Reloads all media in a given section by restoring iframe sources
 * 
 * @param {string} sectionId - The ID of the section to reload
 * 
 * @example
 * reloadSectionMedia('audio-archives');
 */
export function reloadSectionMedia(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) {
        return;
    }

    // Handle audio archives section
    if (sectionId === 'audio-archives') {
        // Reload all iframes in audio archives from stored src
        const iframes = Array.from(section.querySelectorAll('iframe'));
        iframes.forEach((iframe) => {
            const originalSrc = iframe.getAttribute('data-original-src');
            const currentSrc = iframe.src;
            
            // If we have a stored original src, use it
            if (originalSrc) {
                const needsReload = !currentSrc || 
                                   currentSrc === '' || 
                                   currentSrc === 'about:blank' ||
                                   currentSrc === window.location.href;
                
                if (needsReload) {
                    // Store iframe attributes
                    const width = iframe.width || iframe.getAttribute('width') || '100%';
                    const height = iframe.height || iframe.getAttribute('height') || '120';
                    const frameBorder = iframe.frameBorder || iframe.getAttribute('frameborder') || '0';
                    const allow = iframe.allow || iframe.getAttribute('allow') || '';
                    const title = iframe.title || iframe.getAttribute('title') || '';
                    const id = iframe.id || '';
                    const style = iframe.getAttribute('style') || '';
                    
                    // Create new iframe with same attributes
                    const newIframe = document.createElement('iframe');
                    newIframe.width = width;
                    newIframe.height = height;
                    newIframe.frameBorder = frameBorder;
                    if (allow) newIframe.allow = allow;
                    if (title) newIframe.title = title;
                    if (id) newIframe.id = id;
                    if (style) newIframe.setAttribute('style', style);
                    newIframe.setAttribute('data-original-src', originalSrc);
                    
                    // Replace old iframe with new one
                    const parent = iframe.parentNode;
                    if (parent) {
                        parent.replaceChild(newIframe, iframe);
                        
                        // Set src after a small delay to ensure DOM is ready
                        setTimeout(() => {
                            newIframe.src = originalSrc;
                        }, 10);
                    }
                } else if (currentSrc !== originalSrc) {
                    // If src exists but is different, restore it
                    iframe.src = originalSrc;
                }
            } else if (!currentSrc || currentSrc === '' || currentSrc === 'about:blank') {
                // If no stored src but iframe is empty, this shouldn't happen
                // but we'll log it for debugging
                console.warn('Audio archive iframe has no src and no stored original src');
            }
        });
        return;
    }

    // Handle video archives section
    if (sectionId === 'video-archives') {
        // Reload the main video player iframe from stored src
        const mainPlayerContainer = document.getElementById('video-player-container');
        if (mainPlayerContainer) {
            const iframe = mainPlayerContainer.querySelector('iframe');
            if (iframe) {
                const originalSrc = iframe.getAttribute('data-original-src');
                const currentSrc = iframe.src;
                
                // If we have a stored original src, use it
                if (originalSrc) {
                    const needsReload = !currentSrc || 
                                       currentSrc === '' || 
                                       currentSrc === 'about:blank' ||
                                       currentSrc === window.location.href;
                    
                    if (needsReload) {
                        // Store iframe attributes
                        const width = iframe.width || iframe.getAttribute('width') || '100%';
                        const height = iframe.height || iframe.getAttribute('height') || '100%';
                        const frameBorder = iframe.frameBorder || iframe.getAttribute('frameborder') || '0';
                        const allow = iframe.allow || iframe.getAttribute('allow') || '';
                        const title = iframe.title || iframe.getAttribute('title') || '';
                        const id = iframe.id || '';
                        const style = iframe.getAttribute('style') || '';
                        
                        // Create new iframe with same attributes
                        const newIframe = document.createElement('iframe');
                        newIframe.width = width;
                        newIframe.height = height;
                        newIframe.frameBorder = frameBorder;
                        if (allow) newIframe.allow = allow;
                        if (title) newIframe.title = title;
                        if (id) newIframe.id = id;
                        if (style) newIframe.setAttribute('style', style);
                        newIframe.setAttribute('data-original-src', originalSrc);
                        
                        // Replace old iframe with new one
                        const parent = iframe.parentNode;
                        if (parent) {
                            parent.replaceChild(newIframe, iframe);
                            
                            // Set src after a small delay to ensure DOM is ready
                            setTimeout(() => {
                                newIframe.src = originalSrc;
                            }, 10);
                        }
                    } else if (currentSrc !== originalSrc) {
                        // If src exists but is different, restore it
                        iframe.src = originalSrc;
                    }
                } else if (!currentSrc || currentSrc === '' || currentSrc === 'about:blank') {
                    // If no stored src but iframe is empty, this shouldn't happen
                    // but we'll log it for debugging
                    console.warn('Video archive iframe has no src and no stored original src');
                }
            }
        }
        return;
    }
}

/**
 * Unloads a specific stream (Kick or Twitch) by clearing its iframe src
 * 
 * @param {string} stream - The stream to unload ('kick' or 'twitch')
 * 
 * @example
 * unloadStream('twitch');
 */
export function unloadStream(stream) {
    if (stream === 'twitch') {
        pauseTwitchEmbed();
        const twitchContainer = document.getElementById('twitch-embed');
        if (twitchContainer) {
            // Clear the container to fully unload the embed
            twitchContainer.innerHTML = '';
            // Reset the twitchEmbed reference
            twitchEmbed = null;
        }
    } else if (stream === 'kick') {
        const kickIframe = document.querySelector('#kick-embed iframe');
        if (kickIframe && kickIframe.src) {
            // Store original src before clearing
            kickIframe.setAttribute('data-original-src', kickIframe.src);
            kickIframe.src = '';
        }
    }
}

