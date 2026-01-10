/**
 * Configuration Module
 * 
 * Handles loading and parsing of the archives.json configuration file.
 * Provides a clean interface for accessing archive data throughout the application.
 * 
 * @module config
 */

/**
 * Configuration data loaded from archives.json
 * @type {Object|null}
 */
let configData = null;

/**
 * Error state for configuration loading
 * @type {Error|null}
 */
let configError = null;

/**
 * Site configuration data loaded from site-config.json
 * @type {Object|null}
 */
let siteConfigData = null;

/**
 * Error state for site configuration loading
 * @type {Error|null}
 */
let siteConfigError = null;

/**
 * Loads the archives.json configuration file
 * 
 * @returns {Promise<Object>} Promise that resolves with the configuration data
 * @throws {Error} If the configuration file cannot be loaded or parsed
 * 
 * @example
 * const config = await loadConfig();
 * console.log(config.audio); // Array of audio archive items
 */
export async function loadConfig() {
    if (configData) {
        return configData;
    }

    if (configError) {
        throw configError;
    }

    try {
        // Add cache-busting parameter to ensure fresh data
        const cacheBuster = `?t=${Date.now()}`;
        const response = await fetch(`data/archives.json${cacheBuster}`);
        
        if (!response.ok) {
            throw new Error(`Failed to load configuration: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // Validate configuration structure
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid configuration format: expected an object');
        }

        if (!Array.isArray(data.audio)) {
            throw new Error('Invalid configuration format: audio must be an array');
        }

        if (!Array.isArray(data.video)) {
            throw new Error('Invalid configuration format: video must be an array');
        }

        configData = data;
        return configData;
    } catch (error) {
        configError = error;
        console.error('Error loading configuration:', error);
        throw error;
    }
}

/**
 * Gets the audio archives from the configuration
 * 
 * @returns {Promise<Array>} Promise that resolves with an array of audio archive items
 * 
 * @example
 * const audioArchives = await getAudioArchives();
 * audioArchives.forEach(item => {
 *   console.log(item.title, item.platform);
 * });
 */
export async function getAudioArchives() {
    const config = await loadConfig();
    return config.audio || [];
}

/**
 * Gets the video archives from the configuration
 * 
 * @returns {Promise<Array>} Promise that resolves with an array of video archive items
 * 
 * @example
 * const videoArchives = await getVideoArchives();
 * videoArchives.forEach(item => {
 *   console.log(item.title, item.platform);
 * });
 */
export async function getVideoArchives() {
    const config = await loadConfig();
    return config.video || [];
}

/**
 * Loads the site-config.json configuration file
 * 
 * @returns {Promise<Object>} Promise that resolves with the site configuration data
 * @throws {Error} If the configuration file cannot be loaded or parsed
 * 
 * @example
 * const siteConfig = await loadSiteConfig();
 * console.log(siteConfig.defaultTab); // The default tab section ID
 */
export async function loadSiteConfig() {
    if (siteConfigData) {
        return siteConfigData;
    }

    if (siteConfigError) {
        throw siteConfigError;
    }

    try {
        // Add cache-busting parameter to ensure fresh data
        const cacheBuster = `?t=${Date.now()}`;
        const response = await fetch(`data/site-config.json${cacheBuster}`);
        
        if (!response.ok) {
            throw new Error(`Failed to load site configuration: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // Validate configuration structure
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid site configuration format: expected an object');
        }

        siteConfigData = data;
        return siteConfigData;
    } catch (error) {
        siteConfigError = error;
        console.error('Error loading site configuration:', error);
        throw error;
    }
}

/**
 * Gets the default tab from the site configuration
 * 
 * @returns {Promise<string>} Promise that resolves with the default tab section ID
 * 
 * @example
 * const defaultTab = await getDefaultTab();
 * console.log(defaultTab); // e.g., "audio-archives"
 */
export async function getDefaultTab() {
    try {
        const siteConfig = await loadSiteConfig();
        return siteConfig.defaultTab || 'live-streams'; // Fallback to live-streams if not specified
    } catch (error) {
        console.warn('Could not load default tab from config, using fallback:', error);
        return 'live-streams'; // Fallback to live-streams on error
    }
}

/**
 * Resets the configuration cache (useful for testing or reloading)
 */
export function resetConfig() {
    configData = null;
    configError = null;
    siteConfigData = null;
    siteConfigError = null;
}

