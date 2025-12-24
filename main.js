import { createConfig } from './src/config.js';
import { setupUIButtons, setupWindowResize } from './src/ui.js';
import { initializeTheme, setupSettings } from './src/settings.js';

// Initialize theme immediately for visual readiness
initializeTheme();

// Defer heavy Phaser initialization to reduce main-thread blocking
async function initGame() {
    const { default: Phaser } = await import('phaser');
    const config = createConfig(Phaser);
    const game = new Phaser.Game(config);
    setupUIButtons(game);
    setupWindowResize(game);
    setupSettings(game);
}

// Use requestIdleCallback to defer game init to idle time, fallback to setTimeout
if ('requestIdleCallback' in window) {
    requestIdleCallback(() => initGame(), { timeout: 1000 });
} else {
    setTimeout(initGame, 100);
}
