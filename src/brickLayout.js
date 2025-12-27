import { GAME_CONSTANTS, COLORS } from './constants.js';

// Allowed asset paths for security - only permit known local resources
const ALLOWED_ASSET_PATHS = Object.freeze([
    'assets/resume.json',
    './assets/resume.json'
]);

function isAllowedAssetPath(path) {
    return ALLOWED_ASSET_PATHS.includes(path);
}

/**
 * Loads resume.json and calculates brick layout with full justification.
 * Returns an array of brick data objects with position, size, text, and color info.
 * @returns {Promise<{bricks: Array<{x: number, y: number, width: number, text: string, color: number, rowIndex: number, isLastInRow: boolean}>, totalRows: number}>}
 */
export async function calculateBrickLayout() {
    const assetPath = 'assets/resume.json';

    // Security: Validate the asset path before fetching
    if (!isAllowedAssetPath(assetPath)) {
        console.error('Security: Attempted to load unauthorized asset path');
        return { bricks: [], totalRows: 0 };
    }

    const response = await fetch(assetPath);
    if (!response.ok) {
        throw new Error(`Failed to load resume data: ${response.status}`);
    }
    const elements = await response.json();

    const { MARGIN_TOP, BRICK_HEIGHT, BRICK_PADDING, BASE_BRICK_WIDTH, MAX_BRICK_HEIGHT_RATIO } = GAME_CONSTANTS;
    const rightEdge = window.innerWidth - 10;
    let x = 10;
    let y = MARGIN_TOP;
    let totalRows = 0;

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
            totalRows = Math.max(totalRows, rowIndex + 1);
            const rowColor = COLORS.BRICK_COLORS[rowIndex % COLORS.BRICK_COLORS.length];

            if (!bricksByRow.has(rowIndex)) {
                bricksByRow.set(rowIndex, []);
            }
            bricksByRow.get(rowIndex).push({
                x,
                y,
                width: brickWidth,
                originalWidth: brickWidth,
                text: word,
                color: rowColor,
                rowIndex
            });

            x += brickWidth + BRICK_PADDING;
        });
    });

    // Apply Full Justification to ALL rows
    const justifiedBricks = [];

    bricksByRow.forEach((bricksInRow, rowIndex) => {
        if (bricksInRow.length === 0) return;

        const lastBrickData = bricksInRow[bricksInRow.length - 1];
        const currentRightEdge = lastBrickData.x + lastBrickData.width;
        const spaceRemaining = rightEdge - currentRightEdge;

        if (spaceRemaining > 0) {
            // Distribute space equally across all bricks in the row
            const extraPerBrick = spaceRemaining / bricksInRow.length;
            let accumulatedOffset = 0;

            bricksInRow.forEach((data, index) => {
                const newWidth = data.originalWidth + extraPerBrick;
                const newX = data.x + accumulatedOffset;
                const isLastInRow = index === bricksInRow.length - 1;

                justifiedBricks.push({
                    x: newX,
                    y: data.y,
                    width: newWidth,
                    text: data.text,
                    color: data.color,
                    rowIndex: data.rowIndex,
                    isLastInRow
                });

                accumulatedOffset += extraPerBrick;
            });
        } else {
            // No justification needed, just mark last brick
            bricksInRow.forEach((data, index) => {
                const isLastInRow = index === bricksInRow.length - 1;
                justifiedBricks.push({
                    x: data.x,
                    y: data.y,
                    width: data.width,
                    text: data.text,
                    color: data.color,
                    rowIndex: data.rowIndex,
                    isLastInRow
                });
            });
        }
    });

    return { bricks: justifiedBricks, totalRows };
}

/**
 * Converts a hex color number to a CSS color string.
 * @param {number} hex - Hex color number (e.g., 0xf44336)
 * @returns {string} CSS color string (e.g., '#f44336')
 */
export function hexToCss(hex) {
    return '#' + hex.toString(16).padStart(6, '0');
}

