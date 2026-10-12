import { calculateBrickLayouts } from './brickLayout.js';
import { renderLayout } from './brickDom.js';

/**
 * Draws the résumé into every look pane on the start screen. Each pane names
 * the layout it shows with `data-mode`, and all of them share one request.
 */
export async function renderOverlayBricks() {
  const overlay = document.getElementById('startOverlay');
  if (!overlay) return;

  const panes = [...overlay.querySelectorAll('.look-resume[data-mode]')];
  if (panes.length === 0) return;

  try {
    const layouts = await calculateBrickLayouts(
      panes.map((pane) => pane.dataset.mode)
    );
    panes.forEach((pane, index) => renderLayout(pane, layouts[index]));
  } catch (e) {
    console.warn('Could not render overlay bricks:', e);
  }
}
