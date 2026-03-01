# Museum Game

A web-based interactive museum exploration game where you can discover, edit, and update artifacts in real-time.

## Prerequisites

- Node.js installed on your machine.

## How to Start the Game

1. **Install dependencies** (if you haven't already):
   ```bash
   npm install
   ```

2. **Start the server**:
   ```bash
   node server.js
   ```

3. **Play the game**:
   Open your web browser and navigate to:
   [http://localhost:3000](http://localhost:3000)

## How to Play

- **Explore:** Move your character around the museum lobby to find various artifacts scattered throughout the map.
- **Interact:** When you find an artifact, interact with it to view its details, including its title, description, and an image (if it has one).

## How to Modify Artifacts

This game features a live-editing system that lets you customize the museum artifacts while playing!

### In-Game Editing

1. Interact with any artifact in the game.
2. You can edit the artifact's **Title**, **Description**, and **Color** directly through the in-game interface.
3. **Change Images:** You can drag and drop a new image (PNG or JPG) directly onto the artifact's interface to update its picture.
4. When you save your changes, the game automatically updates the underlying files and rebuilds the level data, so your changes are visible immediately without restarting the server.

### Manual Editing (Files)

If you prefer to edit files directly, you can modify the artifacts in the `levels/` directory.

1. Navigate to `levels/lobby/` (or create new folders inside `levels/` for different rooms).
2. Each artifact has a text file (e.g., `artifact_03.txt`) containing its properties:
   ```text
   Title: Mystery Artifact
   Color: #a1887f
   X: 1500
   Y: 2000
   Description: Your custom description goes here.
   ```
3. To add an image to an artifact manually, place a `.png` or `.jpg` file in the same folder with the same base name (e.g., `artifact_03.png`).
4. **Important:** After making manual file changes, you must run the build script to update the game data:
   ```bash
   node build_levels.js
   ```
   *(Note: The server handles this automatically if you use the in-game editing tools.)*

## Generating Placeholders

If you want to quickly populate the museum with random artifacts to edit later, you can run the placeholder generation script:

```bash
node generate_placeholders.js
```

This will generate 48 random placeholder artifacts in the `levels/lobby/` directory. Remember to run `node build_levels.js` afterwards to see them in the game!
