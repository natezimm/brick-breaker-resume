import { restBall } from '../src/ballPhysics.js';

describe('restBall', () => {
  test('resets the physics body so no leftover step moves the ball', () => {
    const ball = { body: { reset: jest.fn() }, setPosition: jest.fn() };

    restBall(ball, 120, 300);

    expect(ball.body.reset).toHaveBeenCalledWith(120, 300);
    expect(ball.setPosition).not.toHaveBeenCalled();
  });

  test('falls back to moving and stopping a ball without a body', () => {
    const ball = { setPosition: jest.fn(), setVelocity: jest.fn() };

    restBall(ball, 10, 20);

    expect(ball.setPosition).toHaveBeenCalledWith(10, 20);
    expect(ball.setVelocity).toHaveBeenCalledWith(0, 0);
  });

  test('ignores a missing ball', () => {
    expect(() => restBall(null, 0, 0)).not.toThrow();
  });
});
