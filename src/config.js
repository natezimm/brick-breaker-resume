import { COLORS } from './constants.js';
import { preload, create, update } from './game.js';

export function createConfig(Phaser) {
    return {
        type: Phaser.AUTO,
        width: window.innerWidth,
        height: window.innerHeight,
        parent: 'app',
        backgroundColor: COLORS.BACKGROUND,
        // Match device pixel ratio for crisp text
        resolution: window.devicePixelRatio,
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 0 },
                debug: false,
            }
        },
        scene: {
            preload,
            create,
            update
        }
    };
}
