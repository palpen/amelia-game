const fs = require('fs');
const path = require('path');

const levelsDir = path.join(__dirname, 'levels');
const outputFile = path.join(__dirname, 'artifacts_data.js');

let allArtifacts = [];
const LEVEL_WIDTH = 4000;
const LEVEL_HEIGHT = 3000;

if (!fs.existsSync(levelsDir)) {
    fs.mkdirSync(levelsDir);
}

// Read all subdirectories in levels/
const levelFolders = fs.readdirSync(levelsDir).filter(f => fs.statSync(path.join(levelsDir, f)).isDirectory());

levelFolders.forEach(levelFolder => {
    const levelPath = path.join(levelsDir, levelFolder);
    const files = fs.readdirSync(levelPath);
    
    files.forEach(file => {
        if (file.endsWith('.txt')) {
            const id = file.replace('.txt', '');
            const content = fs.readFileSync(path.join(levelPath, file), 'utf8');
            const lines = content.replace(/\r\n/g, '\n').split('\n');
            
            let title = "Mystery Artifact";
            let color = "#a1887f";
            let description = "";
            let x = Math.random() * (LEVEL_WIDTH - 200) + 100;
            let y = Math.random() * (LEVEL_HEIGHT - 200) + 100;
            
            let isParsingDesc = false;

            lines.forEach(line => {
                if (line.startsWith('Title:')) {
                    title = line.replace('Title:', '').trim();
                    isParsingDesc = false;
                }
                else if (line.startsWith('Color:')) {
                    color = line.replace('Color:', '').trim();
                    isParsingDesc = false;
                }
                else if (line.startsWith('X:')) {
                    x = parseFloat(line.replace('X:', '').trim());
                    isParsingDesc = false;
                }
                else if (line.startsWith('Y:')) {
                    y = parseFloat(line.replace('Y:', '').trim());
                    isParsingDesc = false;
                }
                else if (line.startsWith('Description:')) {
                    isParsingDesc = true;
                    description += line.replace('Description:', '').trim() + ' ';
                } else if (isParsingDesc) {
                    description += line.trim() + ' ';
                }
            });

            // Check if an image exists alongside the text file
            let imagePath = null;
            if (fs.existsSync(path.join(levelPath, `${id}.png`))) {
                imagePath = `levels/${levelFolder}/${id}.png`;
            } else if (fs.existsSync(path.join(levelPath, `${id}.jpg`))) {
                imagePath = `levels/${levelFolder}/${id}.jpg`;
            } else if (fs.existsSync(path.join(__dirname, 'assets', `${id}.png`))) {
                // Fallback to check the old assets folder
                imagePath = `assets/${id}.png`;
            }

            allArtifacts.push({
                id: `${levelFolder}_${id}`,
                x: x,
                y: y,
                width: 40 + Math.random() * 20,
                height: 40 + Math.random() * 40,
                title: title,
                description: description.trim() || "No description provided.",
                color: color,
                image: imagePath
            });
        }
    });
});

const jsContent = `// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run 'node build_levels.js' to update this file from the 'levels/' directory.
const ARTIFACTS_DATA = ${JSON.stringify(allArtifacts, null, 4)};
`;
fs.writeFileSync(outputFile, jsContent);
console.log(`Successfully built ${allArtifacts.length} artifacts into artifacts_data.js!`);
