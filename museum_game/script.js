const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// UI Elements
const interactionPrompt = document.getElementById('interaction-prompt');
const artifactOverlay = document.getElementById('artifact-overlay');
const artifactTitle = document.getElementById('artifact-title');
const artifactDesc = document.getElementById('artifact-description');
const artifactImage = document.getElementById('artifact-image');
const artifactImageFallback = document.getElementById('artifact-image-fallback');
const imgContainer = document.getElementById('artifact-image-container');
const closeBtn = document.getElementById('close-btn');
const saveBtn = document.getElementById('save-btn');
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');

// Carpet UI Elements
const carpetOverlay = document.getElementById('carpet-overlay');
const carpetTitle = document.getElementById('carpet-title');
const carpetWidthInput = document.getElementById('carpet-width-input');
const carpetHeightInput = document.getElementById('carpet-height-input');
const carpetCloseBtn = document.getElementById('carpet-close-btn');
const carpetSaveBtn = document.getElementById('carpet-save-btn');
const carpetPrompt = document.getElementById('carpet-prompt');
const carpetImage = document.getElementById('carpet-image');
const carpetImageFallback = document.getElementById('carpet-image-fallback');
const carpetImgContainer = document.getElementById('carpet-image-container');
const carpetDragOverlay = document.getElementById('carpet-drag-drop-overlay');


// Edit Mode UI Elements
const editBtn = document.getElementById('edit-btn');
const saveEditBtn = document.getElementById('save-edit-btn');
const titleInput = document.getElementById('artifact-title-input');
const descInput = document.getElementById('artifact-description-input');
const dragOverlay = document.getElementById('drag-drop-overlay');

// Game State
let isPlaying = false;
let isPaused = false;
let keys = {};
let lastStepTime = 0;
let activeArtifact = null;
let activeCarpet = null;

// Edit Mode State
let isEditMode = false;
let uploadedImageBase64 = null;
let uploadedImageExt = null;
let uploadedImageName = null;
let uploadedCarpetImageBase64 = null;
let uploadedCarpetImageExt = null;
let uploadedCarpetImageName = null;

// Level Dimensions (5x bigger than the 800x600 canvas, reduced from 10x)
const LEVEL_WIDTH = 4000;
const LEVEL_HEIGHT = 3000;

// Camera
let cameraX = 0;
let cameraY = 0;

// Audio System
let audioCtx;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playStepSound() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    if (now - lastStepTime < 0.3) return;
    lastStepTime = now;

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
    
    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start(now);
    osc.stop(now + 0.1);
}

function playInteractSound() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(554.37, now + 0.1);
    osc.frequency.setValueAtTime(659.25, now + 0.2);
    
    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start(now);
    osc.stop(now + 0.3);
}

function playJumpSound() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.15);

    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.15);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
}

function playSaveSound() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.2);
    
    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.2);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start(now);
    osc.stop(now + 0.2);
}

// Player Definition
let player = {
    x: LEVEL_WIDTH / 2,
    y: LEVEL_HEIGHT / 2,
    width: 24,
    height: 36,
    speed: 8,
    direction: 'down',
    moving: false,
    color: '#ffcdd2',
    jumpHeight: 0,
    jumpVelocity: 0,
    isJumping: false
};

// Use artifacts generated by the build script
const artifacts = typeof ARTIFACTS_DATA !== 'undefined' ? ARTIFACTS_DATA : [];

// Carpets
const carpets = typeof CARPETS_DATA !== 'undefined' ? CARPETS_DATA : [];
const carpetImages = {};
carpets.forEach(c => {
    if (c.image) {
        const img = new Image();
        img.src = c.image;
        carpetImages[c.id] = img;
    }
});

// NPCs (Other visitors)
const npcs = [];
const npcColors = ['#e57373', '#ba68c8', '#64b5f6', '#4db6ac', '#ffd54f', '#ffb74d', '#aed581', '#90a4ae'];
const hairColors = ['#5d4037', '#795548', '#ffcc80', '#000000', '#b71c1c', '#eceff1'];

function initNPCs(count) {
    for (let i = 0; i < count; i++) {
        npcs.push({
            id: 'npc_' + i,
            x: 100 + Math.random() * (LEVEL_WIDTH - 200),
            y: 100 + Math.random() * (LEVEL_HEIGHT - 200),
            width: 24,
            height: 36,
            speed: 0.5 + Math.random() * 0.8,
            color: npcColors[Math.floor(Math.random() * npcColors.length)],
            skinColor: '#ffcdd2',
            hairColor: hairColors[Math.floor(Math.random() * hairColors.length)],
            direction: 'down',
            targetArtifact: null,
            waitTime: Math.random() * 2000,
            state: 'idle'
        });
    }
}

// Add 60 random visitors to the massive museum
initNPCs(60);

function updateNPCs() {
    for (let npc of npcs) {
        if (npc.state === 'idle') {
            npc.waitTime -= 16;
            if (npc.waitTime <= 0) {
                npc.targetArtifact = artifacts[Math.floor(Math.random() * artifacts.length)];
                npc.state = 'moving';
            }
        } else if (npc.state === 'moving' && npc.targetArtifact) {
            const offsetX = (Math.random() - 0.5) * 40; // Wider spread around artifacts
            const targetX = npc.targetArtifact.x + npc.targetArtifact.width / 2 - npc.width / 2 + offsetX;
            const targetY = npc.targetArtifact.y + npc.targetArtifact.height + 15;
            
            let dx = targetX - npc.x;
            let dy = targetY - npc.y;
            const dist = Math.hypot(dx, dy);
            
            if (dist < 5) {
                npc.state = 'idle';
                npc.waitTime = 3000 + Math.random() * 5000;
                npc.direction = 'up';
            } else {
                dx = (dx / dist) * npc.speed;
                dy = (dy / dist) * npc.speed;
                
                npc.x += dx;
                npc.y += dy;
                
                if (Math.abs(dx) > Math.abs(dy)) {
                    npc.direction = dx > 0 ? 'right' : 'left';
                } else {
                    npc.direction = dy > 0 ? 'down' : 'up';
                }
            }
        }
    }
}

// Save & Load Logic

async function reloadGameData() {
    try {
        const artRes = await fetch('artifacts_data.json?t=' + Date.now());
        const artData = await artRes.json();
        
        artifacts.length = 0;
        artifacts.push(...artData);
        
        const carpRes = await fetch('carpets_data.json?t=' + Date.now());
        const carpData = await carpRes.json();
        
        carpets.length = 0;
        carpets.push(...carpData);

        carpets.forEach(c => {
            if (c.image) {
                const img = new Image();
                img.src = c.image + "?t=" + Date.now();
                carpetImages[c.id] = img;
            } else {
                delete carpetImages[c.id];
            }
        });
        
    } catch (e) {
        console.error("Failed to dynamically reload game data:", e);
    }
}

function saveGame() {
    const saveData = {
        playerX: player.x,
        playerY: player.y,
        playerDirection: player.direction
    };
    localStorage.setItem('museum_save', JSON.stringify(saveData));
    playSaveSound();
    
    const originalText = saveBtn.innerText;
    saveBtn.innerText = "SAVED!";
    setTimeout(() => {
        saveBtn.innerText = originalText;
    }, 1000);
}

function loadGame() {
    const saved = localStorage.getItem('museum_save');
    if (saved) {
        try {
            const saveData = JSON.parse(saved);
            player.x = saveData.playerX || (LEVEL_WIDTH / 2);
            player.y = saveData.playerY || (LEVEL_HEIGHT / 2);
            player.direction = saveData.playerDirection || 'down';
        } catch (e) {
            console.error("Failed to load save:", e);
        }
    }
}

// Input Handling
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    if (e.key.toLowerCase() === 'e' && activeArtifact && !isPaused) {
        openArtifact(activeArtifact);
    }
    if (e.key === ' ' && !player.isJumping && !isPaused && isPlaying) {
        e.preventDefault();
        player.isJumping = true;
        player.jumpVelocity = -7;
        playJumpSound();
    }
    if (e.key.toLowerCase() === 'i' && activeCarpet && !isPaused) {
        openCarpetEditor(activeCarpet);
    }
    if (e.key === 'Escape' && isPaused && !artifactOverlay.classList.contains('hidden')) {
        closeArtifact();
    }
    if (e.key === 'Escape' && isPaused && !carpetOverlay.classList.contains('hidden')) {
        closeCarpetEditor();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// UI Event Listeners
startBtn.addEventListener('click', () => {
    initAudio();
    startScreen.classList.add('hidden');
    loadGame();
    isPlaying = true;
    requestAnimationFrame(gameLoop);
});

closeBtn.addEventListener('click', () => {
    closeArtifact();
});

saveBtn.addEventListener('click', () => {
    saveGame();
});

// Interaction Functions
function openArtifact(artifact) {
    isPaused = true;
    playInteractSound();
    
    // Reset edit mode
    isEditMode = false;
    uploadedImageBase64 = null;
    uploadedImageExt = null;
    uploadedImageName = null;
    
    // Show standard UI, hide edit UI
    artifactTitle.classList.remove('hidden');
    titleInput.classList.add('hidden');
    artifactDesc.classList.remove('hidden');
    descInput.classList.add('hidden');
    saveEditBtn.classList.add('hidden');
    editBtn.classList.remove('hidden');

    artifactTitle.innerText = artifact.title;
    artifactDesc.innerText = artifact.description;
    
    // Pre-fill inputs in case user clicks edit
    titleInput.value = artifact.title;
    descInput.value = artifact.description;
    
    // Handle Image
    if (artifact.image) {
        // Append a timestamp to bypass browser caching if they just uploaded a new one
        artifactImage.src = artifact.image + "?t=" + new Date().getTime();
        artifactImage.classList.remove('hidden');
        artifactImageFallback.classList.add('hidden');
        
        artifactImage.onerror = () => {
            artifactImage.classList.add('hidden');
            artifactImageFallback.classList.remove('hidden');
        };
    } else {
        artifactImage.classList.add('hidden');
        artifactImageFallback.classList.remove('hidden');
    }

    artifactOverlay.classList.remove('hidden');
    interactionPrompt.classList.add('hidden');
}

function closeArtifact() {
    artifactOverlay.classList.add('hidden');
    isPaused = false;
    setTimeout(() => {
        keys['e'] = false; 
    }, 100);
}

// Carpet Editor Functions
function openCarpetEditor(carpet) {
    isPaused = true;
    playInteractSound();
    
    uploadedCarpetImageBase64 = null;
    uploadedCarpetImageExt = null;
    uploadedCarpetImageName = null;
    
    carpetTitle.innerText = carpet.title;
    carpetWidthInput.value = carpet.width;
    carpetHeightInput.value = carpet.height;
    
    if (carpet.image) {
        carpetImage.src = carpet.image + "?t=" + new Date().getTime();
        carpetImage.classList.remove('hidden');
        if(carpetImageFallback) carpetImageFallback.classList.add('hidden');
        
        carpetImage.onerror = () => {
            carpetImage.classList.add('hidden');
            if(carpetImageFallback) carpetImageFallback.classList.remove('hidden');
        };
    } else {
        carpetImage.classList.add('hidden');
        if(carpetImageFallback) carpetImageFallback.classList.remove('hidden');
    }

    carpetOverlay.classList.remove('hidden');
    carpetPrompt.classList.add('hidden');
}

function closeCarpetEditor() {
    carpetOverlay.classList.add('hidden');
    isPaused = false;
    setTimeout(() => { keys['i'] = false; }, 100);
}

carpetCloseBtn.addEventListener('click', () => closeCarpetEditor());

carpetSaveBtn.addEventListener('click', async () => {
    if (!activeCarpet) return;

    const newWidth = parseFloat(carpetWidthInput.value);
    const newHeight = parseFloat(carpetHeightInput.value);

    const originalText = carpetSaveBtn.innerText;
    carpetSaveBtn.innerText = "Saving...";
    carpetSaveBtn.disabled = true;

    try {
        const response = await fetch('/api/update_carpet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: activeCarpet.id,
                width: newWidth,
                height: newHeight,
                x: activeCarpet.x,
                y: activeCarpet.y,
                title: activeCarpet.title,
                imageBase64: uploadedCarpetImageBase64,
                imageExtension: uploadedCarpetImageExt,
                uploadedImageName: uploadedCarpetImageName
            })
        });
        const result = await response.json();
        if (result.success) {
            carpetSaveBtn.innerText = "Saved!";
            setTimeout(() => {
                closeCarpetEditor();
                carpetSaveBtn.innerText = "Save Changes";
                carpetSaveBtn.disabled = false;
                reloadGameData();
            }, 500);
        } else {
            alert("Failed to save carpet.");
            carpetSaveBtn.innerText = originalText;
            carpetSaveBtn.disabled = false;
        }
    } catch (e) {
        console.error(e);
        alert("Error saving carpet!");
        carpetSaveBtn.innerText = originalText;
        carpetSaveBtn.disabled = false;
    }
});

// Edit Mode Listeners
editBtn.addEventListener('click', () => {
    isEditMode = true;
    artifactTitle.classList.add('hidden');
    titleInput.classList.remove('hidden');
    artifactDesc.classList.add('hidden');
    descInput.classList.remove('hidden');
    
    editBtn.classList.add('hidden');
    saveEditBtn.classList.remove('hidden');
});

// Drag and Drop Logic
imgContainer.addEventListener('dragover', (e) => {
    if (!isEditMode) return;
    e.preventDefault();
    imgContainer.classList.add('drag-over');
    dragOverlay.classList.remove('hidden');
});

imgContainer.addEventListener('dragleave', (e) => {
    if (!isEditMode) return;
    e.preventDefault();
    imgContainer.classList.remove('drag-over');
    dragOverlay.classList.add('hidden');
});

imgContainer.addEventListener('drop', (e) => {
    if (!isEditMode) return;
    e.preventDefault();
    imgContainer.classList.remove('drag-over');
    dragOverlay.classList.add('hidden');

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
            uploadedImageBase64 = event.target.result;
            const ext = file.name.split('.').pop();
            uploadedImageExt = ext || 'png';
            
            uploadedImageName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
            titleInput.value = uploadedImageName;
            
            // Preview the uploaded image immediately
            artifactImage.src = uploadedImageBase64;
            artifactImage.classList.remove('hidden');
            artifactImageFallback.classList.add('hidden');
        };
        reader.readAsDataURL(file);
    }
});



// Carpet Drag and Drop
if(carpetImgContainer) {
    carpetImgContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        carpetImgContainer.classList.add('drag-over');
        if(carpetDragOverlay) carpetDragOverlay.classList.remove('hidden');
    });

    carpetImgContainer.addEventListener('dragleave', (e) => {
        e.preventDefault();
        carpetImgContainer.classList.remove('drag-over');
        if(carpetDragOverlay) carpetDragOverlay.classList.add('hidden');
    });

    carpetImgContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        carpetImgContainer.classList.remove('drag-over');
        if(carpetDragOverlay) carpetDragOverlay.classList.add('hidden');

        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                uploadedCarpetImageBase64 = event.target.result;
                const ext = file.name.split('.').pop();
                uploadedCarpetImageExt = ext || 'png';
                
                uploadedCarpetImageName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                
                carpetImage.src = uploadedCarpetImageBase64;
                carpetImage.classList.remove('hidden');
                if(carpetImageFallback) carpetImageFallback.classList.add('hidden');
            };
            reader.readAsDataURL(file);
        }
    });
}

// Save Changes Request
saveEditBtn.addEventListener('click', async () => {
    if (!activeArtifact) return;

    const newTitle = titleInput.value;
    const newDesc = descInput.value;
    
    const originalText = saveEditBtn.innerText;
    saveEditBtn.innerText = "Saving...";
    saveEditBtn.disabled = true;
    
    try {
        const response = await fetch('/api/update_artifact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: activeArtifact.id,
                title: newTitle,
                description: newDesc,
                color: activeArtifact.color,
                x: activeArtifact.x,
                y: activeArtifact.y,
                imageBase64: uploadedImageBase64,
                imageExtension: uploadedImageExt,
                uploadedImageName: uploadedImageName
            })
        });
        
        const result = await response.json();
        if (result.success) {
            saveEditBtn.innerText = "Saved!";
            setTimeout(() => {
                closeArtifact();
                saveEditBtn.innerText = "Save Changes";
                saveEditBtn.disabled = false;
                reloadGameData();
            }, 500);
        } else {
            alert("Failed to save.");
            saveEditBtn.innerText = originalText;
            saveEditBtn.disabled = false;
        }
    } catch (e) {
        console.error(e);
        alert("Error saving! Make sure you are running the game through 'node server.js'.");
        saveEditBtn.innerText = originalText;
        saveEditBtn.disabled = false;
    }
});

// Update Logic
function update() {
    if (isPaused) return;

    // --- Player Update ---
    player.moving = false;
    let dx = 0;
    let dy = 0;

    if (keys['w'] || keys['arrowup']) {
        dy = -player.speed;
        player.direction = 'up';
        player.moving = true;
    }
    if (keys['s'] || keys['arrowdown']) {
        dy = player.speed;
        player.direction = 'down';
        player.moving = true;
    }
    if (keys['a'] || keys['arrowleft']) {
        dx = -player.speed;
        player.direction = 'left';
        player.moving = true;
    }
    if (keys['d'] || keys['arrowright']) {
        dx = player.speed;
        player.direction = 'right';
        player.moving = true;
    }

    if (dx !== 0 && dy !== 0) {
        const length = Math.sqrt(dx * dx + dy * dy);
        dx = (dx / length) * player.speed;
        dy = (dy / length) * player.speed;
    }

    player.x += dx;
    player.y += dy;

    // Clamp player to LEVEL bounds instead of canvas bounds
    player.x = Math.max(0, Math.min(LEVEL_WIDTH - player.width, player.x));
    player.y = Math.max(0, Math.min(LEVEL_HEIGHT - player.height, player.y));

    if (player.moving) {
        playStepSound();
    }

    if (player.isJumping) {
        player.jumpVelocity += 0.5;
        player.jumpHeight += player.jumpVelocity;
        if (player.jumpHeight >= 0) {
            player.jumpHeight = 0;
            player.jumpVelocity = 0;
            player.isJumping = false;
        }
    }

    // --- Update Camera to follow player ---
    cameraX = player.x + player.width / 2 - canvas.width / 2;
    cameraY = player.y + player.height / 2 - canvas.height / 2;

    // Clamp camera to level edges so we don't show empty space outside the museum
    cameraX = Math.max(0, Math.min(LEVEL_WIDTH - canvas.width, cameraX));
    cameraY = Math.max(0, Math.min(LEVEL_HEIGHT - canvas.height, cameraY));

    // --- NPCs Update ---
    updateNPCs();

    // --- Check interaction proximity ---
    let nearArtifact = null;
    const interactRange = 50;

    for (let i = 0; i < artifacts.length; i++) {
        const art = artifacts[i];
        
        const pCenterX = player.x + player.width / 2;
        const pCenterY = player.y + player.height / 2;
        const aCenterX = art.x + art.width / 2;
        const aCenterY = art.y + art.height / 2;
        
        const dist = Math.hypot(pCenterX - aCenterX, pCenterY - aCenterY);
        
        if (dist < interactRange + Math.max(art.width, art.height)/2) {
            nearArtifact = art;
            break;
        }
    }

    if (nearArtifact) {
        if (!activeArtifact) {
            interactionPrompt.classList.remove('hidden');
        }
        activeArtifact = nearArtifact;
    } else {
        if (activeArtifact) {
            interactionPrompt.classList.add('hidden');
        }
        activeArtifact = null;
    }

    // --- Check carpet proximity (player standing on carpet) ---
    const pCX = player.x + player.width / 2;
    const pCY = player.y + player.height / 2;
    let nearCarpet = null;
    for (let i = 0; i < carpets.length; i++) {
        const c = carpets[i];
        if (pCX >= c.x && pCX <= c.x + c.width && pCY >= c.y && pCY <= c.y + c.height) {
            nearCarpet = c;
            break;
        }
    }

    if (nearCarpet) {
        if (!activeCarpet) {
            carpetPrompt.classList.remove('hidden');
        }
        activeCarpet = nearCarpet;
    } else {
        if (activeCarpet) {
            carpetPrompt.classList.add('hidden');
        }
        activeCarpet = null;
    }
}

// Drawing Functions
function drawFloor() {
    // Fill the visible area with the base brown color
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(cameraX, cameraY, canvas.width, canvas.height);

    // Draw the checkered pattern only for the tiles visible to the camera
    ctx.fillStyle = '#4e342e';
    const tileSize = 40;
    
    const startCol = Math.floor(cameraX / tileSize);
    const endCol = startCol + (canvas.width / tileSize) + 1;
    const startRow = Math.floor(cameraY / tileSize);
    const endRow = startRow + (canvas.height / tileSize) + 1;

    for (let row = startRow; row < endRow; row++) {
        for (let col = startCol; col < endCol; col++) {
            if ((col + row) % 2 === 0) {
                // Ensure we don't draw outside the level boundaries
                if (col * tileSize < LEVEL_WIDTH && row * tileSize < LEVEL_HEIGHT) {
                    ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);
                }
            }
        }
    }
}

function drawCarpets() {
    for (let c of carpets) {
        if (c.x + c.width < cameraX || c.x > cameraX + canvas.width ||
            c.y + c.height < cameraY || c.y > cameraY + canvas.height) {
            continue;
        }
        const img = carpetImages[c.id];
        if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, c.x, c.y, c.width, c.height);
        } else {
            ctx.fillStyle = 'rgba(139, 69, 19, 0.4)';
            ctx.fillRect(c.x, c.y, c.width, c.height);
            ctx.strokeStyle = 'rgba(139, 69, 19, 0.6)';
            ctx.lineWidth = 2;
            ctx.strokeRect(c.x, c.y, c.width, c.height);
        }
    }
}

function drawCharacter(charObj, isPlayer) {
    // Only draw if within the camera view to save performance
    if (charObj.x > cameraX + canvas.width || charObj.x + charObj.width < cameraX ||
        charObj.y > cameraY + canvas.height || charObj.y + charObj.height < cameraY) {
        return; 
    }

    const jumpOffset = (isPlayer && player.isJumping) ? player.jumpHeight : 0;

    if (isPlayer && jumpOffset < 0) {
        const shadowScale = 1 + jumpOffset / 60;
        const shadowW = charObj.width * shadowScale;
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(
            charObj.x + charObj.width / 2,
            charObj.y + charObj.height,
            shadowW / 2, 4 * shadowScale,
            0, 0, Math.PI * 2
        );
        ctx.fill();
    }

    const dy = jumpOffset;

    ctx.fillStyle = isPlayer ? '#4CAF50' : charObj.color;
    ctx.fillRect(charObj.x, charObj.y + 10 + dy, charObj.width, charObj.height - 10);

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(charObj.x, charObj.y + 10 + dy, charObj.width, charObj.height - 10);

    ctx.fillStyle = isPlayer ? player.color : charObj.skinColor;
    ctx.fillRect(charObj.x + 2, charObj.y - 5 + dy, charObj.width - 4, 15);
    ctx.strokeRect(charObj.x + 2, charObj.y - 5 + dy, charObj.width - 4, 15);

    ctx.fillStyle = isPlayer ? '#111' : charObj.hairColor;

    if (charObj.direction === 'down') {
        ctx.fillRect(charObj.x, charObj.y - 8 + dy, charObj.width, 10);
        ctx.fillRect(charObj.x, charObj.y + dy, 4, 15);
        ctx.fillRect(charObj.x + charObj.width - 4, charObj.y + dy, 4, 15);
    } else if (charObj.direction === 'up') {
        ctx.fillRect(charObj.x + 2, charObj.y - 5 + dy, charObj.width - 4, 15);
        ctx.fillRect(charObj.x, charObj.y - 8 + dy, charObj.width, 10);
        ctx.fillRect(charObj.x, charObj.y + dy, 4, 15);
        ctx.fillRect(charObj.x + charObj.width - 4, charObj.y + dy, 4, 15);
    } else if (charObj.direction === 'right') {
        ctx.fillRect(charObj.x + 2, charObj.y - 8 + dy, charObj.width - 4, 8);
        ctx.fillRect(charObj.x + 2, charObj.y + dy, 8, 15);
    } else if (charObj.direction === 'left') {
        ctx.fillRect(charObj.x + 2, charObj.y - 8 + dy, charObj.width - 4, 8);
        ctx.fillRect(charObj.x + charObj.width - 10, charObj.y + dy, 8, 15);
    }
}

function drawArtifact(art) {
    // Only draw if within the camera view
    if (art.x > cameraX + canvas.width || art.x + art.width < cameraX ||
        art.y > cameraY + canvas.height || art.y + art.height < cameraY) {
        return; 
    }

    ctx.fillStyle = '#555';
    ctx.fillRect(art.x, art.y, art.width, art.height);
    
    ctx.fillStyle = art.color;
    ctx.fillRect(art.x + 10, art.y - 15, art.width - 20, 20);
    
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(art.x, art.y, art.width, art.height);
    ctx.strokeRect(art.x + 10, art.y - 15, art.width - 20, 20);

    // Draw artifact title text
    if (art.title) {
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        // Black outline for text
        ctx.fillStyle = '#000';
        ctx.fillText(art.title, art.x + art.width / 2 + 1, art.y - 24);
        ctx.fillText(art.title, art.x + art.width / 2 - 1, art.y - 26);
        ctx.fillText(art.title, art.x + art.width / 2 - 1, art.y - 24);
        ctx.fillText(art.title, art.x + art.width / 2 + 1, art.y - 26);
        // White text
        ctx.fillStyle = '#fff';
        ctx.fillText(art.title, art.x + art.width / 2, art.y - 25);
    }
}

// Main Game Loop
function gameLoop() {
    if (isPlaying) {
        update();
        
        // Reset transform to clear the screen based on canvas coordinates
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Translate the canvas context by the camera offset
        ctx.translate(-cameraX, -cameraY);
        
        drawFloor();
        drawCarpets();

        const drawables = [];
        
        drawables.push({
            type: 'player',
            y: player.y + player.height,
            obj: player
        });
        
        for (let npc of npcs) {
            drawables.push({
                type: 'npc',
                y: npc.y + npc.height,
                obj: npc
            });
        }
        
        for (let art of artifacts) {
            drawables.push({
                type: 'artifact',
                y: art.y + art.height,
                obj: art
            });
        }
        
        // Sort for proper depth rendering
        drawables.sort((a, b) => a.y - b.y);
        
        for (let item of drawables) {
            if (item.type === 'artifact') {
                drawArtifact(item.obj);
            } else if (item.type === 'player') {
                drawCharacter(item.obj, true);
            } else if (item.type === 'npc') {
                drawCharacter(item.obj, false);
            }
        }
        
        // The transform automatically resets next frame
        requestAnimationFrame(gameLoop);
    }
}

// Canvas Click Handler for Carpets
canvas.addEventListener('click', async (e) => {
    if (isPaused || !isPlaying) return;

    // Calculate canvas bounds and scale
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Calculate mouse position relative to canvas
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    // Calculate absolute level position
    const levelX = cameraX + mouseX;
    const levelY = cameraY + mouseY;

    // First check if we clicked on an existing carpet
    let clickedCarpet = null;
    for (let i = carpets.length - 1; i >= 0; i--) {
        const c = carpets[i];
        if (levelX >= c.x && levelX <= c.x + c.width &&
            levelY >= c.y && levelY <= c.y + c.height) {
            clickedCarpet = c;
            break;
        }
    }

    if (clickedCarpet) {
        activeCarpet = clickedCarpet;
        openCarpetEditor(clickedCarpet);
    } else {
        // Create new carpet
        const newWidth = 100;
        const newHeight = 100;
        const newId = `lobby_carpet_${Date.now()}`;
        
        try {
            const response = await fetch('/api/update_carpet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: newId,
                    width: newWidth,
                    height: newHeight,
                    x: levelX - newWidth / 2, // Center the click
                    y: levelY - newHeight / 2,
                    title: 'New Carpet'
                })
            });
            if (response.ok) {
                // Save current player state so they don't get reset
                await reloadGameData();
            }
        } catch (err) {
            console.error(err);
        }
    }
});
