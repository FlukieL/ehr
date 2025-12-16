/**
 * Navigation Module
 * 
 * Handles section switching with smooth animations and active state management.
 * Provides a clean interface for navigating between different sections of the website.
 * 
 * @module navigation
 */

import { unloadSectionMedia, reloadSectionMedia } from './embeds.js';

/**
 * Currently active section ID
 * @type {string|null}
 */
let activeSection = null;

/**
 * All section elements
 * @type {NodeListOf<HTMLElement>}
 */
let sections = null;

/**
 * All navigation buttons
 * @type {NodeListOf<HTMLElement>}
 */
let navButtons = null;

/**
 * Initialises the navigation system
 * 
 * Sets up event listeners for navigation buttons and identifies the initial active section.
 * Should be called once when the page loads.
 * 
 * @example
 * initNavigation();
 */
export function initNavigation() {
    sections = document.querySelectorAll('.section');
    navButtons = document.querySelectorAll('.nav-button');

    if (sections.length === 0 || navButtons.length === 0) {
        console.warn('Navigation: No sections or buttons found');
        return;
    }

    // Set initial active section
    const initialSection = document.querySelector('.section.active');
    if (initialSection) {
        activeSection = initialSection.id;
        updateActiveButton(activeSection);
    }

    // Add click event listeners to navigation buttons
    navButtons.forEach(button => {
        button.addEventListener('click', handleNavClick);
    });

    // Optional: Handle browser back/forward buttons
    window.addEventListener('popstate', handlePopState);
}

/**
 * Handles navigation button clicks
 * 
 * @param {Event} event - The click event
 * @private
 */
function handleNavClick(event) {
    const button = event.currentTarget;
    const sectionId = button.getAttribute('data-section');

    if (sectionId) {
        switchSection(sectionId);
        
        // Update browser history
        const state = { section: sectionId };
        const url = `#${sectionId}`;
        window.history.pushState(state, '', url);
    }
}

/**
 * Handles browser back/forward navigation
 * 
 * @param {PopStateEvent} event - The popstate event
 * @private
 */
function handlePopState(event) {
    if (event.state && event.state.section) {
        switchSection(event.state.section, false);
    } else {
        // Handle hash-based navigation
        const hash = window.location.hash.slice(1);
        if (hash) {
            switchSection(hash, false);
        }
    }
}

/**
 * Switches to a different section with smooth animation
 * 
 * @param {string} sectionId - The ID of the section to switch to
 * @param {boolean} [animate=true] - Whether to animate the transition
 * 
 * @example
 * switchSection('audio-archives');
 */
export function switchSection(sectionId, animate = true) {
    const targetSection = document.getElementById(sectionId);

    if (!targetSection) {
        console.warn(`Navigation: Section "${sectionId}" not found`);
        return;
    }

    if (activeSection === sectionId) {
        return; // Already on this section
    }

    // Unload media in the current section before switching
    if (activeSection) {
        unloadSectionMedia(activeSection);
        
        const currentSection = document.getElementById(activeSection);
        if (currentSection && animate) {
            currentSection.classList.add('fade-out');
            setTimeout(() => {
                currentSection.classList.remove('active', 'fade-out');
            }, 300);
        } else if (currentSection) {
            currentSection.classList.remove('active');
        }
    }

    // Fade in new section
    if (animate) {
        targetSection.style.opacity = '0';
        targetSection.classList.add('active');
        
        // Trigger reflow to ensure the fade-in animation works
        void targetSection.offsetHeight;
        
        requestAnimationFrame(() => {
            targetSection.style.transition = `opacity ${getComputedStyle(document.documentElement).getPropertyValue('--transition-speed')} ${getComputedStyle(document.documentElement).getPropertyValue('--transition-easing')}`;
            targetSection.style.opacity = '1';
        });
    } else {
        targetSection.classList.add('active');
    }

    // Reload media in the new section (restore iframe sources)
    reloadSectionMedia(sectionId);

    // Update active section and button
    activeSection = sectionId;
    updateActiveButton(sectionId);

    // Show/hide chat wrapper based on active section
    const chatWrapper = document.getElementById('chat-wrapper');
    if (chatWrapper) {
        if (sectionId === 'live-streams') {
            chatWrapper.style.display = 'flex';
        } else {
            chatWrapper.style.display = 'none';
        }
    }

    // Scroll to top of the page
    window.scrollTo({
        top: 0,
        behavior: animate ? 'smooth' : 'auto'
    });
}

/**
 * Updates the active state of navigation buttons
 * 
 * @param {string} sectionId - The ID of the active section
 * @private
 */
function updateActiveButton(sectionId) {
    if (!navButtons) return;

    navButtons.forEach(button => {
        const buttonSection = button.getAttribute('data-section');
        if (buttonSection === sectionId) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

/**
 * Gets the currently active section ID
 * 
 * @returns {string|null} The active section ID, or null if no section is active
 * 
 * @example
 * const currentSection = getActiveSection();
 * console.log(`Currently viewing: ${currentSection}`);
 */
export function getActiveSection() {
    return activeSection;
}

/**
 * Initialises navigation based on URL hash (for direct links)
 * 
 * Checks if there's a hash in the URL and switches to that section on page load.
 * Should be called after initNavigation().
 * 
 * @example
 * initNavigation();
 * initHashNavigation();
 */
export function initHashNavigation() {
    const hash = window.location.hash.slice(1);
    if (hash) {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
            switchSection(hash, false);
        }, 100);
    }
}

