![CI](https://github.com/natezimm/brick-breaker-resume/actions/workflows/deploy.yml/badge.svg)
![Coverage](https://img.shields.io/badge/coverage-90%25%20lines%20%7C%2085%25%20funcs%20%7C%2080%25%20branches-brightgreen)

# Brick Breaker Resume

Brick Breaker Resume is a Phaser.js-powered browser game that turns a `.docx` resume into a live Brick Breaker level, letting you break career highlights while tracking lives, score, and high-score streaks.

## Features

- **Resume-driven bricks**: The app parses a `.docx` resume (defaults to `assets/Nathan Zimmerman Resume.docx`) and stacks responsive bricks for each word.
- **Rich UI feedback**: Lives render as animated ball icons, a score overlay updates in real time, and win/game-over overlays trigger with matching sounds.
- **Settings modal**: The cog button opens a modal that auto-pauses the game and lets you toggle sound, choose ball/paddle colors, resize the paddle, and adjust ball speed on the fly.
- **High-score tracking**: Tap the trophy button to open a modal that displays the current high score stored in `localStorage`, so you can chase your personal best across sessions.
- **Responsive layout**: Window resize handlers keep the physics bounds, paddle position, HUD, and countdown aligned with whatever viewport you’re using.
- **Countdown + pause controls**: Every serve starts with a countdown, the `P` key or pause button toggles physics, and pausing implicitly queues a countdown before resuming play.

## Controls & Settings

1. **Mouse**: Move the paddle horizontally to keep the ball in play.
2. **Pause/Play**: Use the `Pause` button or press the `P` key; the button swaps icons depending on the state.
3. **High score modal**: The trophy button pauses gameplay and displays your stored high score; close the modal to resume.
4. **Settings modal**: Click the cog icon to adjust:
   - Sound effects on/off (toggles Phaser audio).
   - Ball/paddle colors via color pickers (textures update instantly).
   - Paddle width slider (maxes out at roughly one-third of the screen width).
   - Ball speed multiplier slider (0.5×–2.0×) which maintains direction when adjusted.
   The modal automatically pauses the game while open and restores gameplay once dismissed.

## Getting Started

1. Clone the repo and install:
   ```bash
   git clone https://github.com/natezimm/brick-breaker-resume.git
   cd brick-breaker-resume
   npm install
   ```
2. Start a static server (the `start` script uses `http-server` and serves on `:8080`):
   ```bash
   npm start
   ```
3. Visit `http://localhost:8080` in your browser. The default resume kicks off automatically, but you can replace the file under `assets/` if you want different content.

## Testing

- `npm test` runs the Jest suite for game, UI, and parser units.
- `npm run test:coverage` generates coverage reports under `coverage/`.

## Deployment on Render

- **Root Directory**: `/`
- **Build Command**: None
- **Publish Directory**: `/`

## File Structure

- `index.html`: Entry point that wires up the Phaser bundle, Mammoth, PDF.js shim, and UI controls.
- `src/`: Modular source split into `game.js` (Phaser lifecycle), `bricks.js` (resume parsing + rendering), `ui.js` (hud, modals, resize helpers), `settings.js` (modal logic and live texture updates), `state.js` (lives/score/high-score tracking), and `config.js`.
- `parser.js`: Browser helper that relies on `mammoth` + DOMParser to produce clean text blocks from `.docx`.
- `assets/`: Contains audio cues, icons, and the sample resume used to seed the level.
