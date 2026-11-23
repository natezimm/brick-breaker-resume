import { GAME_CONSTANTS } from '../src/constants.js';
import { getBrickZoneBottom, getPaddleY } from '../src/playfield.js';

describe('playfield', () => {
  test('bricks reach three quarters of the way down a tall screen', () => {
    expect(getBrickZoneBottom(900)).toBe(900 * 0.75);
  });

  test('on a short screen the bricks leave the ball room above the paddle', () => {
    const paddleTop = getPaddleY(375) - GAME_CONSTANTS.PADDLE_HEIGHT / 2;

    expect(getBrickZoneBottom(375)).toBe(
      paddleTop - GAME_CONSTANTS.BRICK_PADDLE_CLEARANCE
    );
  });

  test('the bricks always keep the top half', () => {
    expect(getBrickZoneBottom(120)).toBe(60);
  });
});
