const fs = require('fs');
const path = require('path');

const lobbyDir = path.join(__dirname, 'levels', 'lobby');
const LEVEL_WIDTH = 4000;
const LEVEL_HEIGHT = 3000;
const colors = ['#8d6e63', '#e0e0e0', '#64b5f6', '#ffeb3b', '#9e9e9e', '#ffc107', '#607d8b', '#795548', '#a1887f', '#bdbdbd', '#e91e63', '#00bcd4', '#4caf50'];

// We already have 2 artifacts (dinosaur_bone and vase), so we need 48 more.
for (let i = 3; i <= 50; i++) {
    // Randomly scatter them within the map boundaries
    let x = Math.floor(Math.random() * (LEVEL_WIDTH - 200) + 100);
    let y = Math.floor(Math.random() * (LEVEL_HEIGHT - 200) + 100);
    let color = colors[Math.floor(Math.random() * colors.length)];
    
    let paddedNum = i.toString().padStart(2, '0');
    let filename = `artifact_${paddedNum}.txt`;
    
    let content = `Title: Mystery Artifact ${paddedNum}
Color: ${color}
X: ${x}
Y: ${y}
Description: [PLACEHOLDER] Replace this text with the actual description of the artifact. To add an image, save your picture as artifact_${paddedNum}.png or artifact_${paddedNum}.jpg in this same folder.`;

    fs.writeFileSync(path.join(lobbyDir, filename), content);
}

console.log('Successfully generated 48 placeholder artifacts in levels/lobby/');
