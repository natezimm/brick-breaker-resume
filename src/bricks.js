import { extractTextFromFile } from '../parser.js';
import { GAME_CONSTANTS, COLORS } from './constants.js';
import { gameState } from './state.js';

export function createBrick(scene, x, y, text, brickWidth, color, isLastInRow = false) {
    const height = GAME_CONSTANTS.BRICK_HEIGHT;

    const brick = scene.add.rectangle(x, y, brickWidth, height, color)
        .setOrigin(0, 0)
        .setStrokeStyle(1, 0xFFFFFF, 0.3);

    scene.physics.add.existing(brick, true);
    gameState.bricksGroup.add(brick);

    if (text) {
        const textElement = scene.add.text(
            x + brickWidth / 2,
            y + height / 2,
            text,
            {
                color: '#FFFFFF',
                fontSize: '13px',
                fontStyle: 'bold',
                fontFamily: 'Arial'
            }
        )
            .setOrigin(0.5, 0.5)
            .setDepth(1);
        textElement.setScrollFactor(0);
        brick.setData('textElement', textElement);
    }

    brick.setData('row', Math.floor((y - GAME_CONSTANTS.MARGIN_TOP) / (height + GAME_CONSTANTS.BRICK_PADDING)));
    brick.setData('isLastInRow', isLastInRow);

    return brick;
}

export async function createBricksFromResume(scene) {
    const response = await fetch('assets/Nathan Zimmerman Resume.docx');
    const blob = await response.blob();
    const file = new File([blob], 'Nathan Zimmerman Resume.docx');
    const elements = await extractTextFromFile(file);

    const { MARGIN_TOP, BRICK_HEIGHT, BRICK_PADDING, BASE_BRICK_WIDTH, MAX_BRICK_HEIGHT_RATIO } = GAME_CONSTANTS;
    const rightEdge = window.innerWidth - 10;
    let x = 10;
    let y = MARGIN_TOP;

    const bricksByRow = new Map();

    elements.forEach((el) => {
        const words = el.text.split(/\s+/);
        words.forEach((word, wordIndex) => {
            const brickWidth = word.length * BASE_BRICK_WIDTH + 10;

            if (x + brickWidth > rightEdge) {
                x = 10;
                y += BRICK_HEIGHT + BRICK_PADDING;
            }
            if (y + BRICK_HEIGHT > window.innerHeight * MAX_BRICK_HEIGHT_RATIO) return;

            const rowIndex = Math.floor((y - MARGIN_TOP) / (BRICK_HEIGHT + BRICK_PADDING));
            gameState.totalRows = Math.max(gameState.totalRows, rowIndex + 1);
            const rowColor = COLORS.BRICK_COLORS[rowIndex % COLORS.BRICK_COLORS.length];

            const brick = createBrick(scene, x, y, word, brickWidth, rowColor);

            if (!bricksByRow.has(rowIndex)) {
                bricksByRow.set(rowIndex, []);
            }
            bricksByRow.get(rowIndex).push({ brick, x, y, word, brickWidth, rowColor });

            x += brickWidth + BRICK_PADDING;
        });
    });

    bricksByRow.forEach((bricks, rowIndex) => {
        if (bricks.length > 0) {
            const lastBrickData = bricks[bricks.length - 1];
            const { brick, x, y, word, brickWidth, rowColor } = lastBrickData;
            const currentRightEdge = x + brickWidth;
            const spaceRemaining = rightEdge - currentRightEdge;

            if (spaceRemaining > 10) {
                const newWidth = brickWidth + spaceRemaining;

                const oldText = brick.getData('textElement');
                if (oldText) oldText.destroy();
                brick.destroy();
                createBrick(scene, x, y, word, newWidth, rowColor, true);
            }
        }
    });

    gameState.bricksCreated = true;
}

export function handleBrickCollision(scene, ball, brick) {
    const textElement = brick.getData('textElement');
    if (textElement) {
        textElement.destroy();
    }

    const row = brick.getData('row');
    const points = (gameState.totalRows - row) * 10;
    gameState.incrementScore(points);

    brick.destroy();
}
