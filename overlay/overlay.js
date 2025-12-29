/**
 * EHR OBS Overlay - Animation Controller
 * Manages logo and ticker animations with coordination to prevent clashes
 */

// Logo configuration
const logos = [
    { src: '../assets/EHRLogoRemoveBG.png', isCircle: false },
    { src: '../assets/EHRCircle.png', isCircle: true },
    { src: '../EHRHeater.png', isCircle: false }
];

// Animation classes (excluding spin for non-circle logos)
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

// Animation state management
const animationState = {
    logoAnimating: false,
    tickerAnimating: false,
    logoAnimationEndTime: 0,
    tickerAnimationEndTime: 0,
    lastLogoAnimation: 0,
    lastTickerAnimation: 0
};

// Minimum delay between animations to prevent clashes
const ANIMATION_COOLDOWN = 500; // 500ms buffer between animations
const LOGO_ANIMATION_DURATION = 2000; // Max duration for logo animations
const TICKER_ANIMATION_DURATION = 1500; // Max duration for ticker animations

let currentLogoIndex = 0;
let logoRotationInterval = null;
let animationInterval = null;
let tickerMessages = [];
let currentTickerIndex = 0;
let tickerExpandInterval = null;
let tickerMessageInterval = null;
let isTickerExpanded = false;

// Ticker entry animation classes
const tickerAnimations = [
    'ticker-animate-slide-left',
    'ticker-animate-slide-right',
    'ticker-animate-slide-top',
    'ticker-animate-bounce',
    'ticker-animate-zoom',
    'ticker-animate-rotate',
    'ticker-animate-flip',
    'ticker-animate-elastic',
    'ticker-animate-glow-pulse',
    'ticker-animate-fade-scale',
    'ticker-animate-wobble',
    'entering' // Keep the original entering animation as an option
];

/**
 * Check if we should delay an animation to avoid clashes
 */
function shouldDelayAnimation(type) {
    const now = Date.now();
    
    if (type === 'logo') {
        // Don't animate logo if ticker is currently animating or just finished
        if (animationState.tickerAnimating || 
            (now - animationState.tickerAnimationEndTime) < ANIMATION_COOLDOWN) {
            return true;
        }
        // Don't animate if logo just finished (cooldown)
        if ((now - animationState.logoAnimationEndTime) < ANIMATION_COOLDOWN) {
            return true;
        }
    } else if (type === 'ticker') {
        // Don't animate ticker if logo is currently animating or just finished
        if (animationState.logoAnimating || 
            (now - animationState.logoAnimationEndTime) < ANIMATION_COOLDOWN) {
            return true;
        }
        // Don't animate if ticker just finished (cooldown)
        if ((now - animationState.tickerAnimationEndTime) < ANIMATION_COOLDOWN) {
            return true;
        }
    }
    
    return false;
}

/**
 * Logo rotation (180 seconds)
 */
function rotateLogo() {
    const logoImg = document.getElementById('logo-img');
    const currentLogo = logos[currentLogoIndex];
    
    // Mark as animating
    animationState.logoAnimating = true;
    logoImg.classList.add('animating');
    
    // Fade out
    logoImg.classList.add('fade-out');
    
    setTimeout(() => {
        // Update logo source
        currentLogoIndex = (currentLogoIndex + 1) % logos.length;
        const nextLogo = logos[currentLogoIndex];
        logoImg.src = nextLogo.src;
        
        // Remove all animation classes
        logoImg.classList.remove(...animations);
        logoImg.classList.remove('logo-spin');
        
        // Apply circle spin if needed
        if (nextLogo.isCircle) {
            logoImg.classList.add('logo-spin');
        }
        
        // Fade in
        logoImg.classList.remove('fade-out');
        logoImg.classList.add('fade-in');
        
        // Clear animating state after transition
        setTimeout(() => {
            logoImg.classList.remove('animating', 'fade-in');
            animationState.logoAnimating = false;
            animationState.logoAnimationEndTime = Date.now();
            
            // Trigger initial animation if not circle
            if (!nextLogo.isCircle) {
                setTimeout(() => {
                    playRandomAnimation();
                }, ANIMATION_COOLDOWN);
            }
        }, 400);
    }, 400);
}

/**
 * Random animation with coordination
 */
function playRandomAnimation() {
    const logoImg = document.getElementById('logo-img');
    const currentLogo = logos[currentLogoIndex];
    
    // Don't animate if it's the circle (it's already spinning)
    if (currentLogo.isCircle) {
        return;
    }
    
    // Check if we should delay to avoid clash
    if (shouldDelayAnimation('logo')) {
        // Reschedule for later
        setTimeout(() => {
            playRandomAnimation();
        }, ANIMATION_COOLDOWN);
        return;
    }
    
    // Mark as animating
    animationState.logoAnimating = true;
    logoImg.classList.add('animating');
    
    // Remove all animation classes
    logoImg.classList.remove(...animations);
    
    // Force reflow
    void logoImg.offsetWidth;
    
    // Get random animation
    const randomAnim = animations[Math.floor(Math.random() * animations.length)];
    logoImg.classList.add(randomAnim);
    
    // Calculate animation duration based on class
    const animationDuration = LOGO_ANIMATION_DURATION;
    
    // Remove after animation completes and update state
    setTimeout(() => {
        logoImg.classList.remove(randomAnim, 'animating');
        animationState.logoAnimating = false;
        animationState.logoAnimationEndTime = Date.now();
    }, animationDuration);
}

/**
 * Load and process ticker data
 */
async function loadTickerData() {
    try {
        // Load events
        const eventsResponse = await fetch('../data/events.json');
        const eventsData = await eventsResponse.json();
        
        // Load custom ticker messages
        const tickerResponse = await fetch('ticker.json');
        const tickerData = await tickerResponse.json();
        
        // Process events
        const eventMessages = eventsData.events.map(event => {
            const eventDate = new Date(event.date);
            const formattedDate = eventDate.toLocaleDateString('en-GB', { 
                day: 'numeric', 
                month: 'short',
                year: 'numeric'
            });
            return {
                text: `Upcoming event: ${event.title} - ${formattedDate} at ${event.time}`,
                type: 'event'
            };
        });
        
        // Add website link message
        const websiteMessage = {
            text: 'Visit ehr.lukeharper.co.uk',
            type: 'website',
            link: 'https://ehr.lukeharper.co.uk'
        };
        
        // Combine all messages
        tickerMessages = [
            websiteMessage,
            ...eventMessages,
            ...tickerData.messages
        ];
        
        // Shuffle messages
        shuffleArray(tickerMessages);
        
        // Start ticker cycle
        startTickerCycle();
    } catch (error) {
        console.error('Error loading ticker data:', error);
        // Fallback message
        tickerMessages = [{
            text: 'Visit ehr.lukeharper.co.uk',
            type: 'website',
            link: 'https://ehr.lukeharper.co.uk'
        }];
        startTickerCycle();
    }
}

/**
 * Shuffle array
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

/**
 * Expand ticker section
 */
function expandTicker() {
    const tickerSection = document.querySelector('.ticker-section');
    const logoSection = document.querySelector('.logo-section');
    
    // Mark as animating
    animationState.tickerAnimating = true;
    tickerSection.classList.add('animating');
    
    // Restore border when expanding
    logoSection.classList.remove('border-hidden');
    
    tickerSection.classList.add('visible');
    isTickerExpanded = true;
    
    // Clear animating state after expansion
    setTimeout(() => {
        tickerSection.classList.remove('animating');
        animationState.tickerAnimating = false;
        animationState.tickerAnimationEndTime = Date.now();
        
        // Show first message after expansion animation (with delay to avoid clash)
        setTimeout(() => {
            showNextTickerMessage();
        }, ANIMATION_COOLDOWN);
    }, 800);
}

/**
 * Retract ticker section
 */
function retractTicker() {
    const tickerSection = document.querySelector('.ticker-section');
    const tickerContent = document.getElementById('ticker-content');
    const logoSection = document.querySelector('.logo-section');
    
    // Mark as animating
    animationState.tickerAnimating = true;
    tickerSection.classList.add('animating');
    
    // Fade out content first
    tickerContent.classList.remove('visible');
    tickerContent.classList.add('exiting');
    
    // Hide border when retracting
    logoSection.classList.add('border-hidden');
    
    // Retract section after fade
    setTimeout(() => {
        tickerSection.classList.remove('visible', 'animating');
        tickerContent.classList.remove('exiting');
        isTickerExpanded = false;
        animationState.tickerAnimating = false;
        animationState.tickerAnimationEndTime = Date.now();
    }, 1500);
}

/**
 * Show next ticker message with enhanced animations and coordination
 */
function showNextTickerMessage() {
    if (!isTickerExpanded || tickerMessages.length === 0) {
        return;
    }
    
    // Check if we should delay to avoid clash
    if (shouldDelayAnimation('ticker')) {
        // Reschedule for later
        setTimeout(() => {
            showNextTickerMessage();
        }, ANIMATION_COOLDOWN);
        return;
    }
    
    const tickerContent = document.getElementById('ticker-content');
    const tickerSection = document.querySelector('.ticker-section');
    
    // Mark as animating
    animationState.tickerAnimating = true;
    tickerSection.classList.add('animating');
    
    // Remove all animation classes
    tickerContent.classList.remove(...tickerAnimations);
    
    // Exit animation
    tickerContent.classList.remove('visible');
    tickerContent.classList.add('exiting');
    
    setTimeout(() => {
        // Get next message
        const message = tickerMessages[currentTickerIndex % tickerMessages.length];
        currentTickerIndex++;
        
        // Create message HTML
        let messageHTML = '';
        if (message.link) {
            messageHTML = `<a href="${message.link}" target="_blank" class="ticker-link">${message.text}</a>`;
        } else {
            messageHTML = message.text;
        }
        
        tickerContent.innerHTML = messageHTML;
        tickerContent.classList.remove('exiting');
        
        // Select random animation
        const randomAnimation = tickerAnimations[Math.floor(Math.random() * tickerAnimations.length)];
        tickerContent.classList.add(randomAnimation);
        
        // Force reflow to ensure animation starts
        void tickerContent.offsetWidth;
        
        // Calculate animation duration
        const animationDuration = randomAnimation === 'entering' ? 1500 : 
                                 randomAnimation.includes('bounce') || randomAnimation.includes('elastic') ? 1200 :
                                 randomAnimation.includes('glow-pulse') ? 1300 : 1000;
        
        // Transition to visible state after animation
        setTimeout(() => {
            tickerContent.classList.remove(...tickerAnimations);
            tickerContent.classList.add('visible');
            tickerSection.classList.remove('animating');
            animationState.tickerAnimating = false;
            animationState.tickerAnimationEndTime = Date.now();
        }, animationDuration);
    }, 1500);
}

/**
 * Start ticker expand/retract cycle
 */
function startTickerCycle() {
    // Expand every 3.5 minutes (210000ms), show for 40 seconds (40000ms)
    tickerExpandInterval = setInterval(() => {
        expandTicker();
        
        // Retract after 40 seconds
        setTimeout(() => {
            retractTicker();
        }, 40000);
    }, 210000);
    
    // Cycle through messages while ticker is expanded (change every 9.5 seconds for slower transitions)
    tickerMessageInterval = setInterval(() => {
        if (isTickerExpanded) {
            showNextTickerMessage();
        }
    }, 9500);
    
    // Show first expansion immediately
    expandTicker();
    
    // Retract first expansion after 40 seconds
    setTimeout(() => {
        retractTicker();
    }, 40000);
}

/**
 * Initialise overlay
 */
function init() {
    // Start logo rotation (180 seconds = 180000ms)
    logoRotationInterval = setInterval(rotateLogo, 180000);
    
    // Start random animations (5 seconds = 5000ms for more frequent animations)
    // But with coordination, they may be delayed
    animationInterval = setInterval(playRandomAnimation, 5000);
    
    // Trigger initial animation
    setTimeout(() => {
        playRandomAnimation();
    }, 2000);
    
    // Load ticker data
    loadTickerData();
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

