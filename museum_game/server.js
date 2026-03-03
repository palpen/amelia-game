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
    const { id, title, description, color, x, y, imageBase64, imageExtension, uploadedImageName } = req.body;
    
    // id is expected to be in the format: folder_filename
    const underscoreIndex = id.indexOf('_');
    const folder = id.substring(0, underscoreIndex);
    const filename = id.substring(underscoreIndex + 1);
    
    // Determine the new filename based on the uploaded image name, if any
    let newFilename = filename;
    if (uploadedImageName) {
        // Basic sanitization
        newFilename = uploadedImageName.replace(/[^a-zA-Z0-9_.-]/g, '_');
    }
    
    const levelPath = path.join(__dirname, 'levels', folder);
    
    // Ensure the directory exists
    if (!fs.existsSync(levelPath)) {
        fs.mkdirSync(levelPath, { recursive: true });
    }

    // Clean up old files if the filename has changed
    if (newFilename !== filename) {
        const oldTxtPath = path.join(levelPath, `${filename}.txt`);
        if (fs.existsSync(oldTxtPath)) fs.unlinkSync(oldTxtPath);
        
        // Try to remove old image (could be .png, .jpg, etc., but we don't know the exact extension so we check common ones)
        const commonExts = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
        commonExts.forEach(ext => {
            const oldImgPath = path.join(levelPath, `${filename}.${ext}`);
            if (fs.existsSync(oldImgPath)) fs.unlinkSync(oldImgPath);
        });
    }

    // Write text file
    const txtContent = `Title: ${title}
Color: ${color}
X: ${x}
Y: ${y}
Description: ${description}`;
    fs.writeFileSync(path.join(levelPath, `${newFilename}.txt`), txtContent);

    // Write image if a new one was provided via drag and drop
    if (imageBase64) {
        // Strip off data URI scheme header
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const ext = imageExtension || 'png';
        const imgPath = path.join(levelPath, `${newFilename}.${ext}`);
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

app.post('/api/update_carpet', (req, res) => {
    const { id, title, width, height, x, y, imageBase64, imageExtension, uploadedImageName } = req.body;

    // id format: <level>_carpet_<filename>
    const match = id.match(/^(.+?)_carpet_(.+)$/);
    if (!match) {
        return res.status(400).json({ success: false, error: "Invalid carpet ID format." });
    }
    const folder = match[1];
    let filename = match[2];
    
    // Determine the new filename based on the uploaded image name, if any
    let newFilename = filename;
    if (uploadedImageName) {
        newFilename = uploadedImageName.replace(/[^a-zA-Z0-9_.-]/g, '_');
    }

    const carpetsPath = path.join(__dirname, 'levels', folder, 'carpets');
    if (!fs.existsSync(carpetsPath)) {
        fs.mkdirSync(carpetsPath, { recursive: true });
    }
    
    // Clean up old files if the filename has changed
    if (newFilename !== filename) {
        const oldTxtPath = path.join(carpetsPath, `${filename}.txt`);
        if (fs.existsSync(oldTxtPath)) fs.unlinkSync(oldTxtPath);
        
        const commonExts = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
        commonExts.forEach(ext => {
            const oldImgPath = path.join(carpetsPath, `${filename}.${ext}`);
            if (fs.existsSync(oldImgPath)) fs.unlinkSync(oldImgPath);
        });
    }

    const txtContent = `Title: ${title}
X: ${x}
Y: ${y}
Width: ${width}
Height: ${height}`;
    fs.writeFileSync(path.join(carpetsPath, `${newFilename}.txt`), txtContent);
    
    // Write image if a new one was provided
    if (imageBase64) {
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const ext = imageExtension || 'png';
        const imgPath = path.join(carpetsPath, `${newFilename}.${ext}`);
        fs.writeFileSync(imgPath, base64Data, 'base64');
    }

    try {
        execSync('node build_levels.js', { cwd: __dirname });
        res.json({ success: true, message: 'Carpet updated and rebuilt successfully.' });
    } catch (error) {
        console.error("Error rebuilding:", error);
        res.status(500).json({ success: false, error: "Failed to rebuild." });
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
