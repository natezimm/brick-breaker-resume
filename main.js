import Phaser from 'phaser';
import { config } from './src/config.js';
import { setupUIButtons, setupWindowResize } from './src/ui.js';
import { initializeTheme, setupSettings } from './src/settings.js';

// Initialize theme immediately for visual readiness
initializeTheme();

// Defer heavy Phaser initialization to reduce main-thread blocking
function initGame() {
    const game = new Phaser.Game(config);
    setupUIButtons(game);
    setupWindowResize(game);
    setupSettings(game);
}

// Use requestIdleCallback to defer game init to idle time, fallback to setTimeout
if ('requestIdleCallback' in window) {
    requestIdleCallback(initGame, { timeout: 100 });
} else {
    setTimeout(initGame, 0);
}
