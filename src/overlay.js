import { GAME_CONSTANTS } from './constants.js';
import { calculateBrickLayout, hexToCss } from './brickLayout.js';

export async function renderOverlayBricks() {
    const overlay = document.getElementById('startOverlay');
    if (!overlay) return;

    let brickContainer = document.getElementById('brickContainer');
    if (!brickContainer) {
        brickContainer = document.createElement('div');
        brickContainer.id = 'brickContainer';
        overlay.insertBefore(brickContainer, overlay.firstChild);
    }

    try {
        const { bricks } = await calculateBrickLayout();
        const { BRICK_HEIGHT } = GAME_CONSTANTS;

        bricks.forEach((brickData) => {
            const cssColor = hexToCss(brickData.color);

            const brickDiv = document.createElement('div');
            brickDiv.className = 'overlay-brick';
            brickDiv.textContent = brickData.text;
            brickDiv.style.left = `${brickData.x}px`;
            brickDiv.style.top = `${brickData.y}px`;
            brickDiv.style.width = `${brickData.width}px`;
            brickDiv.style.height = `${BRICK_HEIGHT}px`;
            brickDiv.style.backgroundColor = cssColor;
            brickDiv.style.display = 'flex';
            brickDiv.style.justifyContent = 'center';
            brickDiv.style.alignItems = 'center';
            brickDiv.style.margin = '0';
            brickDiv.style.lineHeight = '1';
            brickDiv.style.boxSizing = 'border-box';

            brickContainer.appendChild(brickDiv);
        });

    } catch (e) {
        console.warn('Could not render overlay bricks:', e);
    }
}
