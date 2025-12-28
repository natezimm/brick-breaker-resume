import { GAME_CONSTANTS } from './constants.js';
import { gameState } from './state.js';
import { calculateBrickLayout, hexToCss } from './brickLayout.js';

export function createBrick(scene, x, y, text, brickWidth, color, isLastInRow = false) {
    const height = GAME_CONSTANTS.BRICK_HEIGHT;

    let container = document.getElementById('gameBrickContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'gameBrickContainer';
        container.style.position = 'absolute';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.pointerEvents = 'none'; // Click through to canvas
        container.style.zIndex = '5'; // Above canvas, below controls/modals if needed
        document.getElementById('app')?.appendChild(container) || document.body.appendChild(container);
    }

    const brickDiv = document.createElement('div');
    brickDiv.className = 'overlay-brick'; // Reuse the class for identical styling
    brickDiv.textContent = text;
    
    brickDiv.style.position = 'absolute';
    brickDiv.style.left = `${x}px`;
    brickDiv.style.top = `${y}px`;
    brickDiv.style.width = `${brickWidth}px`;
    brickDiv.style.height = `${height}px`;
    brickDiv.style.backgroundColor = hexToCss(color);
    brickDiv.style.display = 'flex';
    brickDiv.style.justifyContent = 'center';
    brickDiv.style.alignItems = 'center';
    brickDiv.style.margin = '0';
    brickDiv.style.lineHeight = '1';
    brickDiv.style.boxSizing = 'border-box';

    container.appendChild(brickDiv);
    
    const brick = scene.add.rectangle(x, y, brickWidth, height, 0x000000, 0);
    brick.setOrigin(0, 0);

    scene.physics.add.existing(brick, true);
    gameState.bricksGroup.add(brick);

    brick.setData('domBrick', brickDiv);

    brick.setData('row', Math.floor((y - GAME_CONSTANTS.MARGIN_TOP) / (height + GAME_CONSTANTS.BRICK_PADDING)));
    brick.setData('isLastInRow', isLastInRow);

    return brick;
}

export async function createBricksFromResume(scene) {
    const existingContainer = document.getElementById('gameBrickContainer');
    if (existingContainer) {
        existingContainer.innerHTML = '';
    }

    const { bricks, totalRows } = await calculateBrickLayout();

    gameState.totalRows = totalRows;

    bricks.forEach((brickData) => {
        createBrick(
            scene,
            brickData.x,
            brickData.y,
            brickData.text,
            brickData.width,
            brickData.color,
            brickData.isLastInRow
        );
    });

    gameState.bricksCreated = true;
}

export function handleBrickCollision(scene, ball, brick) {
    const domBrick = brick.getData('domBrick');
    if (domBrick) {
        domBrick.remove(); // Standard DOM removal
    }

    const row = brick.getData('row');
    const points = (gameState.totalRows - row) * 10;
    gameState.incrementScore(points);

    brick.destroy(); // Phaser object destruction
}
