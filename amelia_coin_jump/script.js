const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

let width, height;
let score = 0;

const NUM_PEOPLE = 100;
const people = [];
const coins = [];

// Palette variations of pink, red, purple
const personColors = [
    '#E91E63', '#C2185B', '#D81B60', '#F06292', '#F48FB1', // Pinks
    '#9C27B0', '#7B1FA2', '#BA68C8', '#CE93D8',             // Purples
    '#F44336', '#D32F2F', '#E53935', '#EF5350'              // Reds
];

const coinColors = ['#FFD700', '#FFEA00', '#FFFF00']; // Gold/Yellow for visibility

class Person {
    constructor() {
        this.width = Math.random() * 8 + 8; // 8 to 16px wide
        this.height = Math.random() * 15 + 15; // 15 to 30px tall
        this.color = personColors[Math.floor(Math.random() * personColors.length)];
        this.velocityY = 0;
        this.gravity = 0.5 + Math.random() * 0.3; // slightly different gravities
        this.jumpPower = -12 - Math.random() * 5; // -12 to -17 jump height
        this.isJumping = false;
        
        // Ensure x is initialized correctly after window load
        this.x = 0;
        this.groundY = 0;
        this.y = 0;
    }

    initPosition() {
        this.x = Math.random() * (width - this.width);
        this.groundY = height - (Math.random() * 50 + 10) - this.height;
        this.y = this.groundY;
    }

    jump() {
        if (!this.isJumping) {
            this.velocityY = this.jumpPower;
            this.isJumping = true;
        }
    }

    update() {
        if (this.isJumping) {
            this.velocityY += this.gravity;
            this.y += this.velocityY;

            if (this.y >= this.groundY) {
                this.y = this.groundY;
                this.velocityY = 0;
                this.isJumping = false;
            }
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        // Draw head
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y, this.width/2, 0, Math.PI * 2);
        ctx.fill();
        // Draw body
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Coin {
    constructor() {
        this.radius = Math.random() * 6 + 6; // 6 to 12px
        this.x = Math.random() * (width - this.radius * 2) + this.radius;
        this.y = -50 - Math.random() * 100; // Start above screen
        this.velocityY = 2 + Math.random() * 3; // Fall speed
        this.color = coinColors[Math.floor(Math.random() * coinColors.length)];
        this.isActive = true;
    }

    update() {
        this.y += this.velocityY;
        if (this.y > height + 50) {
            this.isActive = false; // Coin missed and fell off screen
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // inner ring for coin look
        ctx.strokeStyle = '#DAA520';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    
    // Update ground levels if screen resizes
    people.forEach(p => {
        p.groundY = height - (Math.random() * 50 + 10) - p.height;
        if (!p.isJumping) {
            p.y = p.groundY;
            // Also keep them in bounds if screen shrunk
            if (p.x > width - p.width) {
                p.x = width - p.width;
            }
        }
    });
}

window.addEventListener('resize', resizeCanvas);

// Handle jumping input
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        // Prevent default spacebar scrolling
        e.preventDefault();
        
        // Pick a random group of people to jump (e.g., 20% to 50% of them)
        const percentToJump = 0.2 + Math.random() * 0.3;
        const numToJump = Math.floor(NUM_PEOPLE * percentToJump);
        
        // Filter out those already jumping
        const groundedPeople = people.filter(p => !p.isJumping);
        
        // Shuffle and pick
        const shuffled = groundedPeople.sort(() => 0.5 - Math.random());
        const jumpers = shuffled.slice(0, Math.min(numToJump, groundedPeople.length));
        
        jumpers.forEach(p => p.jump());
    }
});

let coinSpawnTimer = 0;
function spawnCoins() {
    coinSpawnTimer++;
    // roughly every 20-30 frames spawn a coin, up to max 20 on screen
    if (coinSpawnTimer > 20 && Math.random() < 0.5 && coins.length < 20) {
        coins.push(new Coin());
        coinSpawnTimer = 0;
    }
}

function checkCollisions() {
    for (let c = coins.length - 1; c >= 0; c--) {
        const coin = coins[c];
        let collected = false;
        
        if (!coin.isActive) {
            coins.splice(c, 1);
            continue;
        }
        
        for (let p = 0; p < people.length; p++) {
            const person = people[p];
            
            // Allow grounded people to collect coins too if they reach low enough!
            // Approximate person hit box
            const px = person.x;
            const py = person.y - person.width/2; // account for head
            const pw = person.width;
            const ph = person.height + person.width/2;
            
            // Check if coin center is within person bounds (rough approximation)
            if (coin.x > px - coin.radius && coin.x < px + pw + coin.radius &&
                coin.y > py - coin.radius && coin.y < py + ph + coin.radius) {
                collected = true;
                break;
            }
        }
        
        if (collected) {
            coins.splice(c, 1);
            score += 10;
            scoreElement.textContent = score;
        }
    }
}

function drawBackground() {
    // A nice gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#2b0c20'); // Dark pink/purple
    gradient.addColorStop(1, '#4a154b'); // Slightly lighter purple
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
}

function animate() {
    ctx.clearRect(0, 0, width, height);
    
    drawBackground();
    spawnCoins();
    
    // Sort by y to give simple pseudo-depth (draw top ones first)
    people.sort((a, b) => a.groundY - b.groundY);
    
    people.forEach(p => {
        p.update();
        p.draw(ctx);
    });
    
    // Update and draw coins
    coins.forEach(c => {
        c.update();
        c.draw(ctx);
    });
    
    checkCollisions();
    
    requestAnimationFrame(animate);
}

// Initialize Game
function init() {
    resizeCanvas();
    
    for (let i = 0; i < NUM_PEOPLE; i++) {
        const p = new Person();
        p.initPosition();
        people.push(p);
    }
    
    animate();
}

// Start when ready
window.addEventListener('load', init);
