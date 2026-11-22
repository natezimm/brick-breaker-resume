import { GAME_CONSTANTS } from './constants.js';

const RADIANS_PER_DEGREE = Math.PI / 180;

/** Ball speed in px/s for the Ball Speed setting. */
export function ballSpeed(speedSetting = 1) {
  return GAME_CONSTANTS.BALL_SPEED * speedSetting;
}

/** A velocity of `speed` heading up, tilted `degrees` from vertical (negative is left). */
export function velocityAtAngle(speed, degrees) {
  const radians = degrees * RADIANS_PER_DEGREE;
  return { x: speed * Math.sin(radians), y: -speed * Math.cos(radians) };
}

/** A launch heads up and to one side, never straight up and never the same twice. */
export function launchVelocity(speed, random = Math.random) {
  const { LAUNCH_MIN_ANGLE: min, LAUNCH_MAX_ANGLE: max } = GAME_CONSTANTS;
  const side = random() < 0.5 ? -1 : 1;
  return velocityAtAngle(speed, side * (min + random() * (max - min)));
}

/**
 * The player aims with the paddle: the ball leaves at an angle set by where it
 * landed, straight up from the centre and wider toward either end. Speed stays
 * the same, so aiming never speeds the game up or slows it down.
 */
export function paddleBounceVelocity(ball, paddle, speed) {
  const halfWidth = (paddle.displayWidth || paddle.width || 1) / 2;
  const offset = Math.max(-1, Math.min(1, (ball.x - paddle.x) / halfWidth));
  return velocityAtAngle(
    speed,
    offset * GAME_CONSTANTS.PADDLE_MAX_BOUNCE_ANGLE
  );
}

export function isBallMoving(ball) {
  const velocity = ball?.body?.velocity;
  return Boolean(velocity && (velocity.x !== 0 || velocity.y !== 0));
}

export function launchBall(ball, speedSetting, random) {
  if (!ball) return;
  const { x, y } = launchVelocity(ballSpeed(speedSetting), random);
  ball.setVelocity(x, y);
}

/**
 * Stops the ball and parks it at (x, y). The body is reset along with the
 * image: moving only the image leaves the body's last step to be applied on
 * top, which can drop a resting ball onto the paddle and bounce it away.
 */
export function restBall(ball, x, y) {
  if (!ball) return;
  if (typeof ball.body?.reset === 'function') {
    ball.body.reset(x, y);
    return;
  }
  ball.setPosition?.(x, y);
  ball.setVelocity?.(0, 0);
}
