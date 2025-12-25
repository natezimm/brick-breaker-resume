import { createConfig } from './src/config.js';
import { setupUIButtons, setupWindowResize } from './src/ui.js';
import { initializeTheme, setupSettings } from './src/settings.js';
import { renderOverlayBricks } from './src/overlay.js';

// Initialize theme immediately for visual readiness
initializeTheme();

// Render static HTML bricks for the start screen
renderOverlayBricks();

// Defer heavy Phaser initialization to reduce main-thread blocking
async function initGame() {
    const { default: Phaser } = await import('phaser');
    const config = createConfig(Phaser);
    const game = new Phaser.Game(config);
    setupUIButtons(game);
    setupWindowResize(game);
    setupSettings(game);
}

// Setup start button listener
const startButton = document.getElementById('startButton');
const startOverlay = document.getElementById('startOverlay');

if (startButton) {
    startButton.addEventListener('click', () => {
        // Hide overlay
        if (startOverlay) {
            startOverlay.classList.add('hidden');
        }

        // Remove button to prevent double clicks
        startButton.disabled = true;

        // Init game
        initGame();
    });
}
