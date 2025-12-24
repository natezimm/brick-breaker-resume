import { COLORS } from './constants.js';
import { preload, create, update } from './game.js';

export const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'app',
    backgroundColor: COLORS.BACKGROUND,
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
