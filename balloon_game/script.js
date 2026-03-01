const gameContainer = document.getElementById('game-container');
const scoreElement = document.getElementById('score');
const startBtn = document.getElementById('start-btn');

let score = 0;
let gameInterval;
let spawnRate = 1500; // Start with a new balloon every 1.5 seconds
let balloonSpeed = 8; // Seconds it takes to reach the top
let isPlaying = false;

// Audio context for sound effects
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

const colors = [
    '#FF3B30', // Red
    '#FF9500', // Orange
    '#FFCC00', // Yellow
    '#4CD964', // Green
    '#5AC8FA', // Light Blue
    '#007AFF', // Blue
    '#5856D6', // Purple
    '#FF2D55'  // Pink
];

startBtn.addEventListener('click', startGame);

function startGame() {
    if (isPlaying) return;
    isPlaying = true;
    score = 0;
    
    // Browsers block audio until the user interacts with the page
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    updateScoreDisplay();
    startBtn.style.display = 'none';
    
    // Reset difficulty
    spawnRate = 1500;
    balloonSpeed = 8;

    // Clear existing balloons and confetti
    const existingElements = document.querySelectorAll('.balloon, .confetti');
    existingElements.forEach(el => el.remove());

    scheduleNextBalloon();
}

function scheduleNextBalloon() {
    if (!isPlaying) return;
    
    createBalloon();
    
    // Decrease spawn rate slightly to increase difficulty
    if (spawnRate > 400) {
        spawnRate -= 20; // Slightly faster scaling
    }
    
    gameInterval = setTimeout(scheduleNextBalloon, spawnRate);
}

function createBalloon() {
    const balloon = document.createElement('div');
    balloon.classList.add('balloon');
    
    // Random color
    const color = colors[Math.floor(Math.random() * colors.length)];
    balloon.style.setProperty('--balloon-color', color);

    // Random horizontal position (keep away from edges)
    const leftPos = Math.random() * 80 + 10; // 10% to 90%
    balloon.style.left = `${leftPos}vw`;

    // Make balloons move faster as game progresses
    const currentSpeed = Math.max(3, balloonSpeed - (score * 0.1));
    balloon.style.animation = `floatUp ${currentSpeed}s linear forwards`;

    // Pop event
    balloon.addEventListener('mousedown', () => popBalloon(balloon, color));
    // For touch devices
    balloon.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Prevent double firing
        popBalloon(balloon, color);
    });

    // Remove balloon when animation ends (missed it)
    balloon.addEventListener('animationend', () => {
        if (balloon.parentNode) {
            balloon.remove();
        }
    });

    gameContainer.appendChild(balloon);
}

function popBalloon(balloon, color) {
    if (!balloon.parentNode) return; // Already popped

    // Get position for confetti
    const rect = balloon.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    balloon.remove();
    
    // Increase score
    score++;
    updateScoreDisplay();
    
    createConfetti(x, y, color);
    
    // Play fun sound effect
    playPopSound();
}

function playPopSound() {
    if (audioCtx.state === 'suspended') return;
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = 'sine';
    
    // A quick drop in pitch creates a cute "pop" or "bloop" sound
    oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.08);
    
    // Fade out quickly so it doesn't click
    gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.08);
}

function createConfetti(x, y, baseColor) {
    const numConfetti = 20; // slightly more confetti
    
    for (let i = 0; i < numConfetti; i++) {
        const confetti = document.createElement('div');
        confetti.classList.add('confetti');
        
        // Random bright colors for confetti
        const color = Math.random() > 0.4 ? baseColor : colors[Math.floor(Math.random() * colors.length)];
        confetti.style.backgroundColor = color;
        
        // Random fall distance
        const fallDistance = 50 + Math.random() * 150;
        
        confetti.style.left = `${x}px`;
        confetti.style.top = `${y}px`;
        
        // Setup animation via CSS variables
        confetti.style.setProperty('--fall-y', `${fallDistance}px`);
        
        // Random spread
        const spreadX = (Math.random() - 0.5) * 200;
        const spreadY = (Math.random() - 0.5) * 200;
        
        confetti.animate([
            { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
            { transform: `translate(${spreadX}px, ${spreadY + fallDistance}px) rotate(${Math.random() * 360 + 360}deg)`, opacity: 0 }
        ], {
            duration: Math.random() * 500 + 500, // 500ms to 1000ms
            easing: 'cubic-bezier(.37,0,.63,1)',
            fill: 'forwards'
        }).onfinish = () => {
            if (confetti.parentNode) confetti.remove();
        };
        
        gameContainer.appendChild(confetti);
    }
}

function updateScoreDisplay() {
    scoreElement.innerText = score;
}
