/**
 * Logo Animations Module
 * 
 * Handles random logo animations on page load, at intervals, and on click.
 * Also handles header collapse/expand on mobile devices.
 * 
 * @module logo-animations
 */

/**
 * Available animation classes
 * @type {Array<string>}
 */
const animations = [
    'logo-animate-pulse',
    'logo-animate-bounce',
    'logo-animate-shake',
    'logo-animate-glow',
    'logo-animate-zoom',
    'logo-animate-wobble',
    'logo-animate-slide',
    'logo-animate-fade',
    'logo-animate-flip',
    'logo-animate-squash',
    'logo-animate-elastic',
    'logo-animate-wave',
    'logo-animate-blur',
    'logo-animate-jiggle',
    'logo-animate-squeeze',
    'logo-animate-float',
    'logo-animate-stretch'
];

/**
 * Currently active animation interval
 * @type {number|null}
 */
let animationInterval = null;

/**
 * Gets a random animation class
 * 
 * @returns {string} A random animation class name
 * @private
 */
function getRandomAnimation() {
    const randomIndex = Math.floor(Math.random() * animations.length);
    return animations[randomIndex];
}

/**
 * Plays a random animation on the logo
 * 
 * @example
 * playRandomAnimation();
 */
export function playRandomAnimation() {
    const logo = document.querySelector('.logo');
    
    if (!logo) {
        return;
    }

    // Remove any existing animation classes
    animations.forEach(anim => {
        logo.classList.remove(anim);
    });

    // Get a random animation
    const randomAnim = getRandomAnimation();
    
    // Force reflow to ensure animation restarts
    void logo.offsetWidth;
    
    // Add the animation class
    logo.classList.add(randomAnim);
    
    // Remove the animation class after it completes
    const animationDuration = 1500; // Max duration of any animation
    setTimeout(() => {
        logo.classList.remove(randomAnim);
    }, animationDuration);
}

/**
 * Fixed breakpoint width for switching to mobile layout
 * Below this width, navigation will use mobile grid layout
 * @type {number}
 */
const MOBILE_LAYOUT_BREAKPOINT = 1100;

/**
 * Automatically switches to mobile mode based on window width
 * Uses a fixed breakpoint to prevent flickering
 * 
 * @private
 */
function handleNavigationOverflow() {
    const header = document.querySelector('.header');
    
    if (!header) {
        return;
    }
    
    // Below 768px, always use mobile mode (handled by CSS media query)
    if (window.innerWidth <= 768) {
        return; // Don't interfere with CSS mobile mode
    }
    
    // Between 769px and breakpoint, use mobile grid layout
    // Above breakpoint, use desktop layout
    const shouldBeCollapsed = window.innerWidth < MOBILE_LAYOUT_BREAKPOINT;
    const isCurrentlyCollapsed = header.classList.contains('collapsed');
    
    // Only change state if it's different
    if (shouldBeCollapsed !== isCurrentlyCollapsed) {
        if (shouldBeCollapsed) {
            header.classList.add('collapsed');
        } else {
            header.classList.remove('collapsed');
        }
    }
}


/**
 * Initialises logo animations
 * 
 * Sets up:
 * - Animation on page load
 * - Animation every 69 seconds
 * - Animation on logo click
 * - Automatic mobile mode when navigation overflows
 * 
 * @example
 * initLogoAnimations();
 */
export function initLogoAnimations() {
    const logo = document.querySelector('.logo');
    
    if (!logo) {
        console.warn('Logo element not found');
        return;
    }

    // Play animation on page load
    playRandomAnimation();

    // Play animation every 69 seconds
    animationInterval = setInterval(() => {
        playRandomAnimation();
    }, 69000); // 69 seconds in milliseconds

    // Play animation on logo click and toggle header on mobile
    logo.addEventListener('click', (e) => {
        e.preventDefault();
        playRandomAnimation();
        
        // Toggle header collapse/expand on mobile devices only
        // (Above 768px, collapse is handled automatically by overflow detection)
        if (isMobileDevice()) {
            toggleHeaderCollapse();
        }
    });

    // Set up navigation layout switching based on window width
    const header = document.querySelector('.header');
    
    if (header) {
        // Check on initial load
        handleNavigationOverflow();
        
        // Check on window resize with debounce
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                handleNavigationOverflow();
            }, 100); // Simple debounce for resize events
        });
    }

    console.log('Logo animations initialised');
}

/**
 * Stops the animation interval (useful for cleanup)
 * 
 * @example
 * stopLogoAnimations();
 */
export function stopLogoAnimations() {
    if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
    }
}

/**
 * Checks if the current device is a mobile device
 * 
 * @returns {boolean} True if mobile device, false otherwise
 * @private
 */
function isMobileDevice() {
    return window.innerWidth <= 768;
}

/**
 * Toggles the header collapse/expand state on mobile
 * 
 * @private
 */
function toggleHeaderCollapse() {
    const header = document.querySelector('.header');
    
    if (!header) {
        return;
    }

    header.classList.toggle('collapsed');
}

