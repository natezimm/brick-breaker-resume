import { createConfig } from './src/config.js';
import { setupUIButtons, setupWindowResize } from './src/ui.js';
import { initializeTheme, setupSettings } from './src/settings.js';
import { renderOverlayBricks } from './src/overlay.js';

initializeTheme();
renderOverlayBricks();

async function initGame() {
    const { default: Phaser } = await import('phaser');
    const config = createConfig(Phaser);
    const game = new Phaser.Game(config);
    setupUIButtons(game);
    setupWindowResize(game);
    setupSettings(game);
}

const startButton = document.getElementById('startButton');
const startOverlay = document.getElementById('startOverlay');

if (startButton) {
    startButton.addEventListener('click', () => {
        if (startOverlay) {
            startOverlay.classList.add('hidden');
        }

        startButton.disabled = true;

        initGame();
    });
}
