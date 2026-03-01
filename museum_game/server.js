const express = require('express');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const app = express();
const PORT = 3000;

// Increase limit to handle large image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.static(__dirname));

app.post('/api/update_artifact', (req, res) => {
    const { id, title, description, color, x, y, imageBase64, imageExtension } = req.body;
    
    // id is expected to be in the format: folder_filename
    const underscoreIndex = id.indexOf('_');
    const folder = id.substring(0, underscoreIndex);
    const filename = id.substring(underscoreIndex + 1);
    
    const levelPath = path.join(__dirname, 'levels', folder);
    
    // Ensure the directory exists
    if (!fs.existsSync(levelPath)) {
        fs.mkdirSync(levelPath, { recursive: true });
    }

    // Write text file
    const txtContent = `Title: ${title}
Color: ${color}
X: ${x}
Y: ${y}
Description: ${description}`;
    fs.writeFileSync(path.join(levelPath, `${filename}.txt`), txtContent);

    // Write image if a new one was provided via drag and drop
    if (imageBase64) {
        // Strip off data URI scheme header
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const ext = imageExtension || 'png';
        const imgPath = path.join(levelPath, `${filename}.${ext}`);
        fs.writeFileSync(imgPath, base64Data, 'base64');
    }

    // Rebuild the artifacts_data.js so the game instantly sees the changes
    try {
        execSync('node build_levels.js', { cwd: __dirname });
        res.json({ success: true, message: 'Artifact updated and rebuilt successfully.' });
    } catch (error) {
        console.error("Error rebuilding artifacts:", error);
        res.status(500).json({ success: false, error: "Failed to rebuild artifacts." });
    }
});

app.listen(PORT, () => {
    console.log(`
======================================================`);
    console.log(`🏛️ Museum Game Server is running!`);
    console.log(`👉 Open http://localhost:${PORT} in your browser.`);
    console.log(`======================================================
`);
});
