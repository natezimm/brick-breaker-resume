import { config } from './src/config.js';
import { setupUIButtons, setupWindowResize } from './src/ui.js';
import { initializeTheme, setupSettings } from './src/settings.js';

initializeTheme();
const game = new Phaser.Game(config);

setupUIButtons(game);
setupWindowResize(game);
setupSettings(game);
