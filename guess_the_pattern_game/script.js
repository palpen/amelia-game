const shapes = ['square', 'circle', 'triangle', 'star', 'diamond'];
const colors = ['#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6'];

let currentScore = 0;
let correctAnswer = [];
let isPlaying = false;

const patternDisplay = document.getElementById('pattern-display');
const optionsContainer = document.getElementById('options-container');
const feedbackElement = document.getElementById('feedback');
const scoreElement = document.getElementById('score');
const patternTypeSelect = document.getElementById('pattern-type');
const itemsToGuessSelect = document.getElementById('items-to-guess');
const startBtn = document.getElementById('start-btn');

startBtn.addEventListener('click', generateGame);

function generateItem(type) {
    let item = {};
    if (type === 'color') {
        item.shape = 'square';
        item.color = colors[Math.floor(Math.random() * colors.length)];
    } else if (type === 'shape') {
        item.shape = shapes[Math.floor(Math.random() * shapes.length)];
        item.color = '#333';
    } else {
        item.shape = shapes[Math.floor(Math.random() * shapes.length)];
        item.color = colors[Math.floor(Math.random() * colors.length)];
    }
    return item;
}

// Generate a random pattern logic
// E.g., A B A B, A B C A B C, A A B A A B
function generatePatternLogic(type) {
    const patternLengths = [2, 3, 4]; // Length of the repeating block
    const blockLength = patternLengths[Math.floor(Math.random() * patternLengths.length)];
    
    let block = [];
    for(let i = 0; i < blockLength; i++) {
        block.push(generateItem(type));
    }
    
    // Sometimes make items same in block (e.g. AAB)
    if(blockLength > 2 && Math.random() > 0.5) {
        block[1] = {...block[0]};
    }

    return block;
}

function renderItemHTML(item) {
    if (item.shape === 'triangle') {
        return `<div class="shape-item triangle" style="border-bottom-color: ${item.color}"></div>`;
    } else {
        return `<div class="shape-item ${item.shape}" style="background-color: ${item.color}"></div>`;
    }
}

function generateGame() {
    isPlaying = true;
    feedbackElement.textContent = '';
    feedbackElement.className = 'feedback';
    optionsContainer.innerHTML = '';
    patternDisplay.innerHTML = '';

    const type = patternTypeSelect.value;
    const numToGuess = parseInt(itemsToGuessSelect.value);
    
    const block = generatePatternLogic(type);
    
    // We want the total sequence to be long enough to establish the pattern
    // Usually at least 2 full blocks + maybe some part of the next
    const totalItems = block.length * 2 + numToGuess + Math.floor(Math.random() * block.length);
    
    let fullSequence = [];
    for(let i = 0; i < totalItems; i++) {
        fullSequence.push(block[i % block.length]);
    }

    // Extract correct answer (last 'numToGuess' items)
    correctAnswer = fullSequence.slice(-numToGuess);
    
    // The visible sequence
    const visibleSequence = fullSequence.slice(0, -numToGuess);

    // Render visible
    visibleSequence.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.innerHTML = renderItemHTML(item);
        const el = itemDiv.firstElementChild;
        el.classList.add('animate-pop');
        patternDisplay.appendChild(el);
    });

    // Render slots
    for(let i = 0; i < numToGuess; i++) {
        const slot = document.createElement('div');
        slot.className = 'slot animate-pop';
        slot.textContent = '?';
        patternDisplay.appendChild(slot);
    }

    generateOptions(correctAnswer, type, numToGuess);
}

function generateOptions(correctArr, type, numToGuess) {
    let options = [correctArr];
    const numOptions = 4;
    
    while(options.length < numOptions) {
        let wrongOption = [];
        for(let i = 0; i < numToGuess; i++) {
             // 50% chance to mutate correctly, 50% to be completely random, but let's just make a random item similar to current type
             wrongOption.push(generateItem(type));
        }
        
        // Ensure unique options
        const isDuplicate = options.some(opt => JSON.stringify(opt) === JSON.stringify(wrongOption));
        if(!isDuplicate) {
            options.push(wrongOption);
        }
    }

    // Shuffle options
    options = options.sort(() => Math.random() - 0.5);

    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn animate-pop';
        
        opt.forEach(item => {
            const itemHTML = renderItemHTML(item);
            btn.innerHTML += itemHTML;
        });

        btn.addEventListener('click', () => checkAnswer(opt));
        optionsContainer.appendChild(btn);
    });
}

function checkAnswer(selectedOpt) {
    if (!isPlaying) return;
    
    const isCorrect = JSON.stringify(selectedOpt) === JSON.stringify(correctAnswer);
    
    if (isCorrect) {
        feedbackElement.textContent = 'Correct! Great job!';
        feedbackElement.className = 'feedback success';
        currentScore += 10;
        
        // Replace slots with correct answer
        const slots = Array.from(patternDisplay.querySelectorAll('.slot'));
        slots.forEach((slot, index) => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = renderItemHTML(correctAnswer[index]);
            const newElement = tempDiv.firstElementChild;
            newElement.classList.add('animate-pop');
            patternDisplay.replaceChild(newElement, slot);
        });
        
    } else {
        feedbackElement.textContent = 'Oops! Try again.';
        feedbackElement.className = 'feedback error';
        currentScore = Math.max(0, currentScore - 5);
    }
    
    scoreElement.textContent = currentScore;
    isPlaying = false;
    
    setTimeout(() => {
        if(isCorrect) generateGame();
    }, 1500);
}

// Initial game load
generateGame();