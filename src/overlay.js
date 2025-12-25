import { GAME_CONSTANTS, COLORS } from './constants.js';

function hexToCss(hex) {
    return '#' + hex.toString(16).padStart(6, '0');
}

export async function renderOverlayBricks() {
    const overlay = document.getElementById('startOverlay');
    if (!overlay) return;

    // Create a container for bricks if it doesn't exist
    let brickContainer = document.getElementById('brickContainer');
    if (!brickContainer) {
        brickContainer = document.createElement('div');
        brickContainer.id = 'brickContainer';
        // Insert as first child so it stays behind text
        overlay.insertBefore(brickContainer, overlay.firstChild);
    }

    try {
        const response = await fetch('./assets/resume.json');
        if (!response.ok) throw new Error('Failed to load resume.json');
        const elements = await response.json();

        const { MARGIN_TOP, BRICK_HEIGHT, BRICK_PADDING, BASE_BRICK_WIDTH, MAX_BRICK_HEIGHT_RATIO } = GAME_CONSTANTS;
        const rightEdge = window.innerWidth - 10;
        let x = 10;
        let y = MARGIN_TOP;

        // Track bricks by row to handle full justification
        const bricksByRow = new Map();

        elements.forEach((el) => {
            const words = el.text.split(/\s+/).filter(w => w.length > 0);

            words.forEach((word) => {
                const brickWidth = word.length * BASE_BRICK_WIDTH + 10;

                // Wrap to new line if matches
                if (x + brickWidth > rightEdge) {
                    x = 10;
                    y += BRICK_HEIGHT + BRICK_PADDING;
                }

                // Stop if too tall
                if (y + BRICK_HEIGHT > window.innerHeight * MAX_BRICK_HEIGHT_RATIO) return;

                const rowIndex = Math.floor((y - MARGIN_TOP) / (BRICK_HEIGHT + BRICK_PADDING));

                const colorHex = COLORS.BRICK_COLORS[rowIndex % COLORS.BRICK_COLORS.length];
                const cssColor = hexToCss(colorHex);

                // Create DOM Brick
                const brickDiv = document.createElement('div');
                brickDiv.className = 'overlay-brick';
                brickDiv.textContent = word;
                brickDiv.style.left = `${x}px`;
                brickDiv.style.top = `${y}px`;
                brickDiv.style.width = `${brickWidth}px`;
                brickDiv.style.height = `${BRICK_HEIGHT}px`;
                brickDiv.style.backgroundColor = cssColor;

                brickContainer.appendChild(brickDiv);

                // Track for justification
                if (!bricksByRow.has(rowIndex)) {
                    bricksByRow.set(rowIndex, []);
                }
                bricksByRow.get(rowIndex).push({
                    element: brickDiv,
                    x,
                    width: brickWidth,
                    originalWidth: brickWidth
                });

                x += brickWidth + BRICK_PADDING;
            });
        });

        // Apply Full Justification to ALL rows
        bricksByRow.forEach((bricksInRow) => {
            if (bricksInRow.length === 0) return;

            const lastBrick = bricksInRow[bricksInRow.length - 1];
            const currentRightEdge = lastBrick.x + lastBrick.width;
            const spaceRemaining = rightEdge - currentRightEdge;

            if (spaceRemaining > 0) {
                // Distribute space equally across all bricks in the row
                // We add the extra width to each brick, and shift subsequent bricks
                const extraPerBrick = spaceRemaining / bricksInRow.length;

                let accumulatedOffset = 0;

                bricksInRow.forEach((brickData) => {
                    const newWidth = brickData.originalWidth + extraPerBrick;

                    // Update position based on accumulated width increases of previous bricks
                    const newX = brickData.x + accumulatedOffset;

                    brickData.element.style.width = `${newWidth}px`;
                    brickData.element.style.left = `${newX}px`;

                    // Add usage of extra width to offset for next brick
                    accumulatedOffset += extraPerBrick;
                });
            }
        });

    } catch (e) {
        console.warn('Could not render overlay bricks:', e);
    }
}
