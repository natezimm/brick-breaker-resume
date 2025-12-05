import { config } from './src/config.js';
import { setupPauseButton, setupWindowResize } from './src/ui.js';
import { setupSettings } from './src/settings.js';

const game = new Phaser.Game(config);

setupPauseButton(game);
setupWindowResize(game);
setupSettings(game);