const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const levelElement = document.getElementById('level');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over');
const pauseScreen = document.getElementById('pause-screen');
const finalScoreElement = document.getElementById('final-score');
const finalHighScoreElement = document.getElementById('final-high-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const resumeBtn = document.getElementById('resume-btn');
const fastModeToggle = document.getElementById('fast-mode-toggle');

// Audio Context for Sound Effects
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if (type === 'jump') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'coin') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.setValueAtTime(1200, audioCtx.currentTime + 0.05);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'gameover') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.5);
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
    } else if (type === 'levelup') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.1);
        osc.frequency.setValueAtTime(800, audioCtx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    }
}

// Game State
let gameState = 'start'; // start, playing, gameover, paused
let animationId;
let frames = 0;
let score = 0;
let highScore = localStorage.getItem('ameliaHighScore') || 0;
highScoreElement.innerText = highScore;
let level = 1;
let gameSpeed = 5;
let baseSpeed = 5;
let fastMode = false;

// Amelia the Bird
const amelia = {
    x: 50,
    y: 300,
    width: 40,
    height: 35,
    dy: 0,
    jumpForce: 20, // Increased jump force for a faster jump
    grounded: false,
    jumpCount: 0,
    maxJumps: 3,
    color: '#ff007f', // Pink
    wingUp: true,
    
    draw() {
        // Wing animation state
        if (frames % 8 === 0) {
            this.wingUp = !this.wingUp;
        }

        // Draw body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye
        ctx.fillStyle = '#4a148c'; // Dark purple eye
        ctx.beginPath();
        ctx.arc(this.x + 28, this.y + 12, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Beak
        ctx.fillStyle = '#ff3333'; // Red beak
        ctx.beginPath();
        ctx.moveTo(this.x + 36, this.y + 12);
        ctx.lineTo(this.x + 52, this.y + 16);
        ctx.lineTo(this.x + 36, this.y + 20);
        ctx.fill();
        
        // Tail
        ctx.fillStyle = '#ff66b2'; // Light pink tail
        ctx.beginPath();
        ctx.moveTo(this.x + 5, this.y + 15);
        ctx.lineTo(this.x - 12, this.y + 5);
        ctx.lineTo(this.x - 8, this.y + 25);
        ctx.fill();

        // Wing
        ctx.fillStyle = '#ff66b2'; // Light pink wing
        ctx.beginPath();
        if (this.wingUp && !this.grounded) {
            // Wing pointing up when jumping/falling
            ctx.moveTo(this.x + 10, this.y + 15);
            ctx.lineTo(this.x - 2, this.y - 10);
            ctx.lineTo(this.x + 22, this.y + 10);
        } else if (!this.wingUp && !this.grounded) {
            // Wing pointing down when jumping/falling
            ctx.moveTo(this.x + 10, this.y + 20);
            ctx.lineTo(this.x - 2, this.y + 45);
            ctx.lineTo(this.x + 22, this.y + 25);
        } else {
            // Wing folded when on the ground
            ctx.moveTo(this.x + 10, this.y + 15);
            ctx.lineTo(this.x + 5, this.y + 25);
            ctx.lineTo(this.x + 25, this.y + 20);
        }
        ctx.fill();
    },
    
    jump() {
        if (this.grounded || this.jumpCount < this.maxJumps) {
            this.dy = -this.jumpForce;
            this.grounded = false;
            this.jumpCount++;
            playSound('jump');
        }
    },
    
    update() {
        // Gravity
        this.y += this.dy;
        if (this.y + this.height < canvas.height - 20) {
            this.dy += 1.8; // Increased gravity force for a less "floaty" feel
            this.grounded = false;
        } else {
            this.dy = 0;
            this.grounded = true;
            this.jumpCount = 0;
            this.y = canvas.height - 20 - this.height;
        }
        
        this.draw();
    }
};

const obstacles = [];
const coins = [];

class Obstacle {
    constructor() {
        this.width = Math.random() * 20 + 20;
        this.height = Math.random() * 40 + 30;
        this.x = canvas.width;
        this.y = canvas.height - 20 - this.height;
        this.color = '#800080'; // Purple
        this.passed = false;
    }
    
    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        // Add a red stripe to make it look distinct
        ctx.fillStyle = '#ff3333';
        ctx.fillRect(this.x, this.y + this.height / 2 - 5, this.width, 10);
    }
    
    update() {
        this.x -= gameSpeed;
        this.draw();
    }
}

class Coin {
    constructor() {
        this.radius = 10;
        this.x = canvas.width;
        // Random height: sometimes ground level, sometimes jump level
        this.y = canvas.height - 20 - 20 - Math.random() * 100;
        this.color = '#ff66b2'; // Light Pink base
    }
    
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ff007f'; // Bright Pink outer
        ctx.fill();
        ctx.closePath();
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius - 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ff3333'; // Red inner
        ctx.fill();
        ctx.closePath();
    }
    
    update() {
        this.x -= gameSpeed;
        this.draw();
    }
}

function handleObstacles() {
    // Spawn obstacles much more frequently for higher difficulty
    if (frames % Math.floor(Math.random() * 30 + 40) === 0) {
        obstacles.push(new Obstacle());
    }
    
    for (let i = 0; i < obstacles.length; i++) {
        obstacles[i].update();
        
        // Collision detection
        if (
            amelia.x < obstacles[i].x + obstacles[i].width &&
            amelia.x + amelia.width > obstacles[i].x &&
            amelia.y < obstacles[i].y + obstacles[i].height &&
            amelia.y + amelia.height > obstacles[i].y
        ) {
            gameOver();
        }
        
        // Clean up
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
            i--;
        }
    }
}

function handleCoins() {
    if (frames % Math.floor(Math.random() * 100 + 50) === 0) {
        coins.push(new Coin());
    }
    
    for (let i = 0; i < coins.length; i++) {
        coins[i].update();
        
        // Circular collision approximation for coin vs rect
        const distX = Math.abs(coins[i].x - amelia.x - amelia.width / 2);
        const distY = Math.abs(coins[i].y - amelia.y - amelia.height / 2);

        if (distX <= (amelia.width / 2 + coins[i].radius) && 
            distY <= (amelia.height / 2 + coins[i].radius)) {
            // Hit
            score += 10;
            scoreElement.innerText = score;
            if (score > highScore) {
                highScore = score;
                highScoreElement.innerText = highScore;
                localStorage.setItem('ameliaHighScore', highScore);
            }
            playSound('coin');
            coins.splice(i, 1);
            i--;
            checkLevelUp();
            continue;
        }
        
        if (coins[i].x + coins[i].radius < 0) {
            coins.splice(i, 1);
            i--;
        }
    }
}

function drawBackground() {
    // Draw ground
    ctx.fillStyle = '#2d0a4c'; // Darker purple ground
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
    
    // Draw some red accent lines on ground
    ctx.strokeStyle = '#ff3333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 20);
    ctx.lineTo(canvas.width, canvas.height - 20);
    ctx.stroke();
    
    // Parallax stars/dots in background
    ctx.fillStyle = 'rgba(255, 102, 178, 0.5)'; // Faint pink dots
    if(frames % 10 === 0) {
         // simple star creation logic, not fully persistent but creates a scrolling effect
    }
}

function checkLevelUp() {
    const newLevel = Math.floor(score / 50) + 1;
    if (newLevel > level) {
        level = newLevel;
        levelElement.innerText = level;
        baseSpeed += 1; // Increase base difficulty
        updateGameSpeed();
        playSound('levelup');
    }
}

function updateGameSpeed() {
    gameSpeed = fastMode ? baseSpeed * 1.5 : baseSpeed;
}

function resetGame() {
    amelia.y = 300;
    amelia.dy = 0;
    amelia.jumpCount = 0;
    obstacles.length = 0;
    coins.length = 0;
    score = 0;
    level = 1;
    baseSpeed = 5;
    updateGameSpeed();
    frames = 0;
    scoreElement.innerText = score;
    levelElement.innerText = level;
}

function togglePause() {
    if (gameState === 'playing') {
        gameState = 'paused';
        cancelAnimationFrame(animationId);
        pauseScreen.classList.remove('hidden');
    } else if (gameState === 'paused') {
        gameState = 'playing';
        pauseScreen.classList.add('hidden');
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        animate();
    }
}

function startGame() {
    resetGame();
    gameState = 'playing';
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    // Ensure audio context is started
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    animate();
}

function gameOver() {
    gameState = 'gameover';
    playSound('gameover');
    cancelAnimationFrame(animationId);
    finalScoreElement.innerText = score;
    finalHighScoreElement.innerText = highScore;
    gameOverScreen.classList.remove('hidden');
}

function animate() {
    if (gameState !== 'playing') return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawBackground();
    amelia.update();
    handleObstacles();
    handleCoins();
    
    frames++;
    animationId = requestAnimationFrame(animate);
}

// Controls
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (gameState === 'playing') {
            amelia.jump();
        } else if (gameState === 'start') {
            startGame();
        } else if (gameState === 'gameover') {
            startGame();
        }
    } else if (e.code === 'KeyP' || e.code === 'Escape') {
        if (gameState === 'playing' || gameState === 'paused') {
            togglePause();
        }
    }
});

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
resumeBtn.addEventListener('click', togglePause);

fastModeToggle.addEventListener('change', (e) => {
    fastMode = e.target.checked;
    updateGameSpeed();
});

// Initial draw to show something before start
drawBackground();
amelia.draw();
