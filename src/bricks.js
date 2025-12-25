
import { GAME_CONSTANTS, COLORS } from './constants.js';
import { gameState } from './state.js';

export function createBrick(scene, x, y, text, brickWidth, color, isLastInRow = false) {
    const height = GAME_CONSTANTS.BRICK_HEIGHT;

    // 1. Visuals (Graphics)
    // 1. Visuals (Graphics)
    const graphics = scene.add.graphics({ x, y });

    // Base Fill (Background color)
    graphics.fillStyle(color);
    graphics.fillRect(0, 0, brickWidth, height);

    // Top Border: 1px solid rgba(255, 255, 255, 0.4)
    graphics.fillStyle(0xFFFFFF, 0.4);
    graphics.fillRect(0, 0, brickWidth, 1);

    // Left Border: 1px solid rgba(255, 255, 255, 0.2)
    graphics.fillStyle(0xFFFFFF, 0.2);
    graphics.fillRect(0, 0, 1, height);

    // Bottom Border: 2px solid rgba(0, 0, 0, 0.4)
    graphics.fillStyle(0x000000, 0.4);
    graphics.fillRect(0, height - 2, brickWidth, 2);

    // Right Border: 2px solid rgba(0, 0, 0, 0.4)
    graphics.fillStyle(0x000000, 0.4);
    graphics.fillRect(brickWidth - 2, 0, 2, height);

    // Simulate CSS box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.1);
    // We can't do a real blur efficiently, but a subtle inner fill helps match the "depth"
    graphics.fillStyle(0x000000, 0.1);
    graphics.fillRect(2, 2, brickWidth - 4, height - 4);

    // 2. Physics Hitbox (Invisible Rectangle)
    // Using alpha 0 instead of transparent color to ensure it's invisible but active
    const brick = scene.add.rectangle(x, y, brickWidth, height, 0x000000, 0);
    brick.setOrigin(0, 0);

    scene.physics.add.existing(brick, true);
    gameState.bricksGroup.add(brick);

    // Link visuals to physics object
    brick.setData('graphics', graphics);

    if (text) {
        const textElement = scene.add.text(
            x + brickWidth / 2,
            y + height / 2,
            text,
            {
                color: '#FFFFFF',
                fontSize: '13px',
                fontStyle: 'bold',
                fontFamily: 'Arial, sans-serif'
            }
        )
            .setOrigin(0.5, 0.5)
            .setDepth(1)
            .setResolution(window.devicePixelRatio); // Explicitly ensure high-DPI text
        textElement.setScrollFactor(0);
        brick.setData('textElement', textElement);
    }

    brick.setData('row', Math.floor((y - GAME_CONSTANTS.MARGIN_TOP) / (height + GAME_CONSTANTS.BRICK_PADDING)));
    brick.setData('isLastInRow', isLastInRow);

    return brick;
}

export async function createBricksFromResume(scene) {
    const response = await fetch('assets/resume.json');
    const elements = await response.json();

    const { MARGIN_TOP, BRICK_HEIGHT, BRICK_PADDING, BASE_BRICK_WIDTH, MAX_BRICK_HEIGHT_RATIO } = GAME_CONSTANTS;
    const rightEdge = window.innerWidth - 10;
    let x = 10;
    let y = MARGIN_TOP;

    const bricksByRow = new Map();

    elements.forEach((el) => {
        const words = el.text.split(/\s+/).filter(w => w.length > 0);
        words.forEach((word) => {
            const brickWidth = word.length * BASE_BRICK_WIDTH + 10;

            if (x + brickWidth > rightEdge) {
                x = 10;
                y += BRICK_HEIGHT + BRICK_PADDING;
            }
            if (y + BRICK_HEIGHT > window.innerHeight * MAX_BRICK_HEIGHT_RATIO) return;

            const rowIndex = Math.floor((y - MARGIN_TOP) / (BRICK_HEIGHT + BRICK_PADDING));
            gameState.totalRows = Math.max(gameState.totalRows, rowIndex + 1);
            const rowColor = COLORS.BRICK_COLORS[rowIndex % COLORS.BRICK_COLORS.length];

            // Initial creation
            const brick = createBrick(scene, x, y, word, brickWidth, rowColor);

            if (!bricksByRow.has(rowIndex)) {
                bricksByRow.set(rowIndex, []);
            }
            // Store originalWidth to calculate distribution correctly
            bricksByRow.get(rowIndex).push({
                brick,
                x,
                y,
                word,
                brickWidth,
                originalWidth: brickWidth,
                rowColor
            });

            x += brickWidth + BRICK_PADDING;
        });
    });

    // Apply Full Justification to ALL rows
    bricksByRow.forEach((bricksInRow) => {
        if (bricksInRow.length === 0) return;

        const lastBrickData = bricksInRow[bricksInRow.length - 1];
        const currentRightEdge = lastBrickData.x + lastBrickData.brickWidth;
        const spaceRemaining = rightEdge - currentRightEdge;

        if (spaceRemaining > 0) {
            // Distribute space equally across all bricks in the row
            const extraPerBrick = spaceRemaining / bricksInRow.length;
            let accumulatedOffset = 0;

            bricksInRow.forEach((data) => {
                const newWidth = data.originalWidth + extraPerBrick;
                const newX = data.x + accumulatedOffset;

                // Destroy old brick visuals/physics
                data.brick.getData('textElement')?.destroy();
                data.brick.getData('graphics')?.destroy();
                data.brick.destroy();

                // Create new resized brick at new position
                // isLastInRow logic is simplified here; checking if it's the last element in array
                const isLast = (data === bricksInRow[bricksInRow.length - 1]);
                createBrick(scene, newX, data.y, data.word, newWidth, data.rowColor, isLast);

                accumulatedOffset += extraPerBrick;
            });
        }
    });

    gameState.bricksCreated = true;
}

export function handleBrickCollision(scene, ball, brick) {
    brick.getData('textElement')?.destroy();
    brick.getData('graphics')?.destroy();

    const row = brick.getData('row');
    const points = (gameState.totalRows - row) * 10;
    gameState.incrementScore(points);

    brick.destroy();
}
