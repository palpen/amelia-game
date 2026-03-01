const wordsList = [
    // Pre-K
    "a", "and", "away", "big", "blue", "can", "come", "down", "find", "for", 
    "funny", "go", "help", "here", "I", "in", "is", "it", "jump", "little", 
    "look", "make", "me", "my", "not", "one", "play", "red", "run", "said", 
    "see", "the", "three", "to", "two", "up", "we", "where", "yellow", "you",
    // Kindergarten
    "all", "am", "are", "at", "ate", "be", "black", "brown", "but", "came", 
    "did", "do", "eat", "four", "get", "good", "have", "he", "into", "like", 
    "must", "new", "no", "now", "on", "our", "out", "please", "pretty", "ran", 
    "ride", "saw", "say", "she", "so", "soon", "that", "there", "they", "this", 
    "too", "under", "want", "was", "well", "went", "what", "white", "who", "will", "with", "yes",
    // 1st Grade
    "after", "again", "an", "any", "as", "ask", "by", "could", "every", "fly", 
    "from", "give", "going", "had", "has", "her", "him", "his", "how", "just", 
    "know", "let", "live", "may", "of", "old", "once", "open", "over", "put", 
    "round", "some", "stop", "take", "thank", "them", "then", "think", "walk", "were", "when",
    // 2nd Grade
    "always", "around", "because", "been", "before", "best", "both", "buy", "call", "cold", 
    "does", "don't", "fast", "first", "five", "found", "gave", "goes", "green", "its", 
    "made", "many", "off", "or", "pull", "read", "right", "sing", "sit", "sleep", 
    "tell", "their", "these", "those", "upon", "us", "use", "very", "wash", "which", 
    "why", "wish", "work", "would", "write", "your"
];

let pendingWords = [];
let knownList = [];
let unknownList = [];

// DOM Elements
const currentWordEl = document.getElementById('current-word');
const knownScoreEl = document.getElementById('known-score');
const unknownScoreEl = document.getElementById('unknown-score');
const wordsLeftEl = document.getElementById('words-left');
const knownBucket = document.getElementById('known-bucket');
const unknownBucket = document.getElementById('unknown-bucket');
const resetBtn = document.getElementById('reset-btn');

// Modal Elements
const modal = document.getElementById('list-modal');
const closeBtn = document.querySelector('.close-btn');
const modalTitle = document.getElementById('modal-title');
const modalList = document.getElementById('modal-list');

// Drag State
let isDragging = false;
let startX = 0, startY = 0;
let currentX = 0, currentY = 0;

// Initialize Game
function initGame() {
    // Shuffle words
    pendingWords = [...wordsList].sort(() => Math.random() - 0.5);
    knownList = [];
    unknownList = [];
    updateUI();
    loadNextWord();
}

function updateUI() {
    knownScoreEl.textContent = knownList.length;
    unknownScoreEl.textContent = unknownList.length;
    wordsLeftEl.textContent = pendingWords.length + (currentWordEl.textContent !== "All Done!" ? 1 : 0);
}

function loadNextWord() {
    if (pendingWords.length > 0) {
        currentWordEl.textContent = pendingWords.pop();
        resetWordPosition();
        currentWordEl.style.display = 'block';
    } else {
        currentWordEl.textContent = "All Done!";
        currentWordEl.style.pointerEvents = 'none';
        currentWordEl.style.backgroundColor = '#a8e6cf';
        currentWordEl.style.borderColor = '#3b9e95';
    }
    updateUI();
}

function resetWordPosition() {
    currentWordEl.classList.add('animating');
    currentX = 0;
    currentY = 0;
    currentWordEl.style.transform = `translate(0px, 0px)`;
    setTimeout(() => {
        currentWordEl.classList.remove('animating');
    }, 300);
}

// Dragging Logic using Pointer Events
currentWordEl.addEventListener('pointerdown', (e) => {
    if (currentWordEl.textContent === "All Done!") return;
    
    isDragging = true;
    currentWordEl.classList.remove('animating');
    currentWordEl.setPointerCapture(e.pointerId);
    
    startX = e.clientX - currentX;
    startY = e.clientY - currentY;
});

currentWordEl.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    
    currentX = e.clientX - startX;
    currentY = e.clientY - startY;
    
    currentWordEl.style.transform = `translate(${currentX}px, ${currentY}px)`;
    
    // Check collisions for highlight
    const knownRect = knownBucket.getBoundingClientRect();
    const unknownRect = unknownBucket.getBoundingClientRect();
    const wordRect = currentWordEl.getBoundingClientRect();
    
    // Check Known
    if (checkCollision(wordRect, knownRect)) {
        knownBucket.classList.add('highlight-known');
    } else {
        knownBucket.classList.remove('highlight-known');
    }
    
    // Check Unknown
    if (checkCollision(wordRect, unknownRect)) {
        unknownBucket.classList.add('highlight-unknown');
    } else {
        unknownBucket.classList.remove('highlight-unknown');
    }
});

currentWordEl.addEventListener('pointerup', (e) => {
    if (!isDragging) return;
    isDragging = false;
    currentWordEl.releasePointerCapture(e.pointerId);
    
    const knownRect = knownBucket.getBoundingClientRect();
    const unknownRect = unknownBucket.getBoundingClientRect();
    const wordRect = currentWordEl.getBoundingClientRect();
    
    const word = currentWordEl.textContent;
    
    knownBucket.classList.remove('highlight-known');
    unknownBucket.classList.remove('highlight-unknown');
    
    if (checkCollision(wordRect, knownRect)) {
        // Dropped in Known
        knownList.push(word);
        animateDropAndLoadNext(knownRect);
    } else if (checkCollision(wordRect, unknownRect)) {
        // Dropped in Unknown
        unknownList.push(word);
        animateDropAndLoadNext(unknownRect);
    } else {
        // Not dropped in either, reset
        resetWordPosition();
    }
});

function animateDropAndLoadNext(targetRect) {
    const wordRect = currentWordEl.getBoundingClientRect();
    const dropTargetX = targetRect.left + targetRect.width / 2;
    const dropTargetY = targetRect.top + targetRect.height / 2;
    
    const currentCenterX = wordRect.left + wordRect.width / 2;
    const currentCenterY = wordRect.top + wordRect.height / 2;
    
    const diffX = dropTargetX - currentCenterX;
    const diffY = dropTargetY - currentCenterY;
    
    currentWordEl.classList.add('animating');
    currentWordEl.style.transform = `translate(${currentX + diffX}px, ${currentY + diffY}px) scale(0.1)`;
    currentWordEl.style.opacity = '0';
    
    setTimeout(() => {
        currentWordEl.style.transform = `translate(0px, 0px) scale(1)`;
        currentWordEl.style.opacity = '1';
        currentWordEl.classList.remove('animating');
        loadNextWord();
    }, 300);
}

// Simple rectangle collision detection
function checkCollision(rect1, rect2) {
    // Adding a little forgiveness margin so it's easier for kids
    const margin = 20;
    return !(rect1.right - margin < rect2.left || 
             rect1.left + margin > rect2.right || 
             rect1.bottom - margin < rect2.top || 
             rect1.top + margin > rect2.bottom);
}

// Modals logic
function showModal(title, list, themeColor) {
    modalTitle.textContent = title;
    modalTitle.style.color = themeColor;
    
    modalList.innerHTML = '';
    
    if (list.length === 0) {
        modalList.innerHTML = '<li>No words yet!</li>';
    } else {
        list.forEach(word => {
            const li = document.createElement('li');
            li.textContent = word;
            modalList.appendChild(li);
        });
    }
    
    modal.classList.remove('hidden');
}

knownBucket.addEventListener('click', () => {
    showModal('Words I Know!', knownList, '#4ecdc4');
});

unknownBucket.addEventListener('click', () => {
    showModal("Words I'm Learning!", unknownList, '#ff9f43');
});

closeBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
});

// Close modal when clicking outside
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.add('hidden');
    }
});

resetBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to start over?")) {
        currentWordEl.style.pointerEvents = 'auto';
        currentWordEl.style.backgroundColor = 'white';
        currentWordEl.style.borderColor = '#ff6b6b';
        initGame();
    }
});

// Start the game!
initGame();
