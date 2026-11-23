import { GAME_CONSTANTS } from './constants.js';

/**
 * Where things sit on the playfield. The HUD is laid out by CSS (and grows on
 * touch screens and over a phone's home indicator), so positions are measured
 * from it rather than from fixed offsets.
 */

/** True on touch screens, where a thumb on the paddle covers part of the screen. */
export function isCoarsePointer() {
  return window.matchMedia?.('(pointer: coarse)').matches ?? false;
}

/** The paddle's centre line: just above the HUD, higher on touch screens. */
export function getPaddleY(height = window.innerHeight) {
  const hudHeight =
    document.getElementById('hud')?.offsetHeight || GAME_CONSTANTS.HUD_HEIGHT;
  const gap = isCoarsePointer()
    ? GAME_CONSTANTS.PADDLE_GAP_TOUCH
    : GAME_CONSTANTS.PADDLE_GAP;

  return height - hudHeight - gap - GAME_CONSTANTS.PADDLE_HEIGHT / 2;
}

/** Where the ball waits before a launch. */
export function getBallRestY(height = window.innerHeight) {
  return getPaddleY(height) - GAME_CONSTANTS.BALL_REST_OFFSET;
}

/**
 * The lowest the bricks may reach: three quarters of the way down, but on a
 * short screen (a phone on its side) not so close to the paddle that the
 * ball has no room to travel. The bricks always keep the top half.
 */
export function getBrickZoneBottom(height = window.innerHeight) {
  const paddleTop = getPaddleY(height) - GAME_CONSTANTS.PADDLE_HEIGHT / 2;
  const clear = paddleTop - GAME_CONSTANTS.BRICK_PADDLE_CLEARANCE;
  return Math.min(
    height * GAME_CONSTANTS.MAX_BRICK_HEIGHT_RATIO,
    Math.max(height / 2, clear)
  );
}
