[![CI](https://github.com/natezimm/brick-breaker-resume/actions/workflows/deploy.yml/badge.svg)](https://github.com/natezimm/brick-breaker-resume/actions/workflows/deploy.yml)
[![Coverage](https://img.shields.io/badge/coverage-checked-brightgreen)](#testing--quality)

# Brick Breaker Resume

Brick Breaker Resume is a Phaser 3 browser game that turns a `.docx` resume into a live Brick Breaker level, letting you break career highlights while tracking lives, score, and a persistent high score.

## Features

- **Resume-driven bricks**: Parses a `.docx` resume (default: `assets/Nathan Zimmerman Resume.docx`) and creates a brick per word, sized to the word length.
- **Scoring by row**: Higher rows are worth more points when broken.
- **Lives + game states**: Lives render as ball icons; win and game-over states include matching sound effects.
- **Settings modal (auto-pauses)**: Toggle sound, toggle dark mode, adjust ball/paddle colors, change paddle width, and tweak ball speed mid-game.
- **High score modal**: High score persists via `localStorage` (`brickBreakerHighScore`).
- **Responsive + pausable**: Physics bounds, HUD, and paddle positioning adapt to resize; pause via the on-screen button or the `P` key; resumes with a countdown.

## Controls & Settings

- **Mouse / touch**: Move the paddle horizontally.
- **Pause/Play**: Click the pause button or press `P`.
- **High score**: Click the trophy button to view your saved high score.
- **Settings**: Click the cog button to toggle sound/dark mode and adjust colors/speeds/sizing.

## Getting Started

### Prerequisites

- Node.js `22.x` (see `.nvmrc`)

### Local dev

1. Install dependencies:
   ```bash
   git clone https://github.com/natezimm/brick-breaker-resume.git
   cd brick-breaker-resume
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Visit the URL shown in the terminal (typically `http://localhost:5173`).

### Building for Production

1. Build the project:
   ```bash
   npm run build
   ```
2. Preview the production build:
   ```bash
   npm start
   ```

### Using your own resume
- Replace `assets/Nathan Zimmerman Resume.docx` with your own `.docx` (same filename).
- Run the update script to regenerate the game data:
   ```bash
   node scripts/generate_resume_json.js
   ```

## Testing

- `npm test` runs the Jest suite for game and UI units.
- `npm run test:coverage` generates coverage reports under `coverage/`.

## Security

The codebase follows security best practices to prevent common web vulnerabilities:

- **XSS Prevention**: All DOM manipulation uses safe methods (`textContent`, `createElement`, `appendChild`) instead of `innerHTML` to prevent cross-site scripting attacks.
- **Input Sanitization**: High scores from `localStorage` are validated as non-negative integers within safe bounds before use.
- **Asset Path Validation**: Only allowlisted local asset paths can be fetched, preventing unauthorized resource loading.
- **Safe Countdown Display**: Countdown values are strictly validated (integers 1-9 only) before rendering.

## Testing & Quality

- GitHub Actions runs tests + coverage on every push to `main` and blocks deployment if thresholds are not met.

**Coverage thresholds:**
- Lines ≥ 90%
- Statements ≥ 85%
- Functions ≥ 85%
- Branches ≥ 80%

## Deployment (GitHub Actions → Lightsail)

- The `deploy` job downloads the repo as an artifact and `rsync`s it to `/var/www/brick-breaker/` on the target host, then runs a simple health check.
- Required GitHub secrets: `LIGHTSAIL_SSH_KEY`, `LIGHTSAIL_HOST`, `LIGHTSAIL_USER`, `APP_DOMAIN`.

## File Structure

- `index.html`: Entry point; loads the game module (`main.js`).
- `main.js`: Initializes theme + Phaser game and wires up UI handlers.
- `src/`: Game modules (`game.js`, `bricks.js`, `ui.js`, `settings.js`, `state.js`, `config.js`, `constants.js`).
- `scripts/`: Build/utility scripts.
- `assets/`: Contains audio cues, icons, and the sample resume used to seed the level.

## License

MIT (see `LICENSE`).
