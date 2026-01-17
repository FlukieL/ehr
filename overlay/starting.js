/**
 * EHR OBS Overlay - Starting Screen Controller
 * Manages logo and ticker animations with coordination to prevent clashes
 * Enhanced for "Getting Ready" screen with faster rotation and more animations
 */

// Logo configuration
const logos = [
    { src: '../assets/EHRLogoRemoveBG.png', isCircle: false },
    { src: '../assets/EHRCircle.png', isCircle: true },
    { src: '../EHRHeater.png', isCircle: false }
];

// Animation classes (Extended list for Starting Overlay)
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
    'logo-animate-stretch',
    // New animations
    'logo-animate-spin-3d',
    'logo-animate-flip-vertical',
    'logo-animate-swing',
    'logo-animate-rubber-band',
    'logo-animate-tada',
    'logo-animate-heartbeat'
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
const ANIMATION_COOLDOWN = 300; // Reduced buffer for faster pace
const LOGO_ANIMATION_DURATION = 2000;
const TICKER_ANIMATION_DURATION = 1500;

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
    'entering'
];

/**
 * Check if we should delay an animation to avoid clashes
 */
function shouldDelayAnimation(type) {
    const now = Date.now();

    if (type === 'logo') {
        if (animationState.tickerAnimating ||
            (now - animationState.tickerAnimationEndTime) < ANIMATION_COOLDOWN) {
            return true;
        }
        if ((now - animationState.logoAnimationEndTime) < ANIMATION_COOLDOWN) {
            return true;
        }
    } else if (type === 'ticker') {
        if (animationState.logoAnimating ||
            (now - animationState.logoAnimationEndTime) < ANIMATION_COOLDOWN) {
            return true;
        }
        if ((now - animationState.tickerAnimationEndTime) < ANIMATION_COOLDOWN) {
            return true;
        }
    }

    return false;
}

/**
 * Logo rotation (Faster: 10 seconds)
 */
function rotateLogo() {
    const logoImg = document.getElementById('logo-img');
    const currentLogo = logos[currentLogoIndex];

    animationState.logoAnimating = true;
    logoImg.classList.add('animating');
    logoImg.classList.add('fade-out');

    setTimeout(() => {
        currentLogoIndex = (currentLogoIndex + 1) % logos.length;
        const nextLogo = logos[currentLogoIndex];
        logoImg.src = nextLogo.src;

        logoImg.classList.remove(...animations);
        logoImg.classList.remove('logo-spin');

        if (nextLogo.isCircle) {
            logoImg.classList.add('logo-spin');
        }

        if (nextLogo.src.includes('EHRHeater.png')) {
            logoImg.classList.add('heater-style');
        } else {
            logoImg.classList.remove('heater-style');
        }

        logoImg.classList.remove('fade-out');
        logoImg.classList.add('fade-in');

        setTimeout(() => {
            logoImg.classList.remove('animating', 'fade-in');
            animationState.logoAnimating = false;
            animationState.logoAnimationEndTime = Date.now();

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

    if (currentLogo.isCircle) {
        return;
    }

    if (shouldDelayAnimation('logo')) {
        setTimeout(() => {
            playRandomAnimation();
        }, ANIMATION_COOLDOWN);
        return;
    }

    animationState.logoAnimating = true;
    logoImg.classList.add('animating');
    logoImg.classList.remove(...animations);
    logoImg.classList.remove('logo-animate-greyscale-pulse');

    void logoImg.offsetWidth;

    let randomAnim;
    if (currentLogo.src.includes('EHRHeater.png')) {
        const heaterAnimations = ['logo-animate-glow', 'logo-animate-greyscale-pulse'];
        randomAnim = heaterAnimations[Math.floor(Math.random() * heaterAnimations.length)];
    } else {
        randomAnim = animations[Math.floor(Math.random() * animations.length)];
    }

    logoImg.classList.add(randomAnim);

    setTimeout(() => {
        logoImg.classList.remove(randomAnim, 'animating');
        animationState.logoAnimating = false;
        animationState.logoAnimationEndTime = Date.now();
    }, LOGO_ANIMATION_DURATION);
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
        const now = new Date();
        const eventMessages = (eventsData.events || [])
            .filter(event => {
                if (!event.date) return false;
                const eventDateTime = new Date(`${event.date}T${event.time || '00:00'}`);
                return eventDateTime > now;
            })
            .map(event => {
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

        // Custom Starting Messages
        const startingMessages = [
            { text: "Getting Ready...", type: 'system' },
            { text: "Stream Starting Soon...", type: 'system' },
            { text: "Getting Ready...", type: 'system' } // Duplicate to increase frequency
        ];

        // Combine all messages
        tickerMessages = [
            ...startingMessages,
            websiteMessage,
            ...eventMessages,
            ...tickerData.messages
        ];

        // Shuffle messages but ensure first one is Getting Ready
        shuffleArray(tickerMessages);
        tickerMessages.unshift({ text: "Getting Ready...", type: 'system' });

        startTickerCycle();
    } catch (error) {
        console.error('Error loading ticker data:', error);
        tickerMessages = [
            { text: 'Getting Ready...', type: 'system' },
            { text: 'Stream Starting Soon...', type: 'system' },
            { text: 'Visit ehr.lukeharper.co.uk', type: 'website', link: 'https://ehr.lukeharper.co.uk' }
        ];
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

    animationState.tickerAnimating = true;
    tickerSection.classList.add('animating');
    logoSection.classList.remove('border-hidden');
    tickerSection.classList.add('visible');
    isTickerExpanded = true;

    setTimeout(() => {
        tickerSection.classList.remove('animating');
        animationState.tickerAnimating = false;
        animationState.tickerAnimationEndTime = Date.now();

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

    animationState.tickerAnimating = true;
    tickerSection.classList.add('animating');
    tickerContent.classList.remove('visible');
    tickerContent.classList.add('exiting');
    logoSection.classList.add('border-hidden');

    setTimeout(() => {
        tickerSection.classList.remove('visible', 'animating');
        tickerContent.classList.remove('exiting');
        isTickerExpanded = false;
        animationState.tickerAnimating = false;
        animationState.tickerAnimationEndTime = Date.now();
    }, 1500);
}

/**
 * Show next ticker message
 */
function showNextTickerMessage() {
    if (!isTickerExpanded || tickerMessages.length === 0) {
        return;
    }

    if (shouldDelayAnimation('ticker')) {
        setTimeout(() => {
            showNextTickerMessage();
        }, ANIMATION_COOLDOWN);
        return;
    }

    const tickerContent = document.getElementById('ticker-content');
    const tickerSection = document.querySelector('.ticker-section');

    animationState.tickerAnimating = true;
    tickerSection.classList.add('animating');
    tickerContent.classList.remove(...tickerAnimations);
    tickerContent.classList.remove('visible');
    tickerContent.classList.add('exiting');

    setTimeout(() => {
        const message = tickerMessages[currentTickerIndex % tickerMessages.length];
        currentTickerIndex++;

        let messageHTML = '';
        if (message.link) {
            messageHTML = `<a href="${message.link}" target="_blank" class="ticker-link">${message.text}</a>`;
        } else {
            // Emphasize "Getting Ready" messages
            if (message.text.includes('Getting Ready') || message.text.includes('Stream Starting')) {
                messageHTML = `<span style="font-weight: 700; color: #FFF; text-transform: uppercase;">${message.text}</span>`;
            } else {
                messageHTML = message.text;
            }
        }

        tickerContent.innerHTML = messageHTML;
        tickerContent.classList.remove('exiting');

        const randomAnimation = tickerAnimations[Math.floor(Math.random() * tickerAnimations.length)];
        tickerContent.classList.add(randomAnimation);
        void tickerContent.offsetWidth;

        const animationDuration = randomAnimation === 'entering' ? 1500 :
            randomAnimation.includes('bounce') || randomAnimation.includes('elastic') ? 1200 :
                randomAnimation.includes('glow-pulse') ? 1300 : 1000;

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
 * Start ticker cycle
 */
function startTickerCycle() {
    // For Starting Screen: Keep ticker expanded most of the time?
    // Original: Expand every 3.5 mins for 40 secs
    // Starting: Maybe show constantly or more frequently?
    // User didn't specify, but "Getting Ready" implies it should be visible.
    // I will increase visibility duration: Show for 60s, hide for 10s (brief refresh).

    tickerExpandInterval = setInterval(() => {
        expandTicker();
        setTimeout(() => {
            retractTicker();
        }, 60000); // Show for 60 seconds
    }, 75000); // Cycle every 75 seconds

    tickerMessageInterval = setInterval(() => {
        if (isTickerExpanded) {
            showNextTickerMessage();
        }
    }, 8000); // Change message every 8 seconds

    expandTicker();
    setTimeout(() => {
        retractTicker();
    }, 60000);
}

/**
 * Client Card Expansion Enhancement? 
 * (Not relevant here, different file)
 */

function init() {
    const logoImg = document.getElementById('logo-img');
    const currentLogo = logos[currentLogoIndex];
    if (currentLogo.src.includes('EHRHeater.png')) {
        logoImg.classList.add('heater-style');
    } else {
        logoImg.classList.remove('heater-style');
    }

    // Faster rotation: 10 seconds
    logoRotationInterval = setInterval(rotateLogo, 10000);

    // More frequent animations: 2.5 seconds
    animationInterval = setInterval(playRandomAnimation, 2500);

    setTimeout(() => {
        playRandomAnimation();
    }, 1000);

    loadTickerData();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
