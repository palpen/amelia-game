const fs = require('fs');
const path = require('path');

const levelsDir = path.join(__dirname, 'levels');
const outputFile = path.join(__dirname, 'artifacts_data.js');

let allArtifacts = [];
let allCarpets = [];
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

    const carpetsPath = path.join(levelPath, 'carpets');
    if (fs.existsSync(carpetsPath)) {
        const carpetFiles = fs.readdirSync(carpetsPath);
        carpetFiles.forEach(file => {
            if (file.endsWith('.txt')) {
                const id = file.replace('.txt', '');
                const content = fs.readFileSync(path.join(carpetsPath, file), 'utf8');
                const lines = content.replace(/\r\n/g, '\n').split('\n');

                let title = id;
                let x = 0;
                let y = 0;
                let width = 200;
                let height = 150;

                lines.forEach(line => {
                    if (line.startsWith('Title:')) title = line.replace('Title:', '').trim();
                    else if (line.startsWith('X:')) x = parseFloat(line.replace('X:', '').trim());
                    else if (line.startsWith('Y:')) y = parseFloat(line.replace('Y:', '').trim());
                    else if (line.startsWith('Width:')) width = parseFloat(line.replace('Width:', '').trim());
                    else if (line.startsWith('Height:')) height = parseFloat(line.replace('Height:', '').trim());
                });

                let imagePath = null;
                if (fs.existsSync(path.join(carpetsPath, `${id}.png`))) {
                    imagePath = `levels/${levelFolder}/carpets/${id}.png`;
                } else if (fs.existsSync(path.join(carpetsPath, `${id}.jpg`))) {
                    imagePath = `levels/${levelFolder}/carpets/${id}.jpg`;
                }

                allCarpets.push({
                    id: `${levelFolder}_carpet_${id}`,
                    level: levelFolder,
                    x, y, width, height,
                    title,
                    image: imagePath
                });
            }
        });
    }
});

const artifactsContent = `// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run 'node build_levels.js' to update this file from the 'levels/' directory.
const ARTIFACTS_DATA = ${JSON.stringify(allArtifacts, null, 4)};
`;
fs.writeFileSync(outputFile, artifactsContent);
fs.writeFileSync(path.join(__dirname, 'artifacts_data.json'), JSON.stringify(allArtifacts, null, 4));

const carpetsOutputFile = path.join(__dirname, 'carpets_data.js');
const carpetsContent = `// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run 'node build_levels.js' to update this file from the 'levels/' directory.
const CARPETS_DATA = ${JSON.stringify(allCarpets, null, 4)};
`;
fs.writeFileSync(carpetsOutputFile, carpetsContent);
fs.writeFileSync(path.join(__dirname, 'carpets_data.json'), JSON.stringify(allCarpets, null, 4));

console.log(`Successfully built ${allArtifacts.length} artifacts into artifacts_data.js!`);
console.log(`Successfully built ${allCarpets.length} carpets into carpets_data.js!`);
