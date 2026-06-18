import { COLORS, GAME_CONSTANTS, TEXTURE_KEYS } from './constants.js';

function toCssHex(color) {
  return `#${color.toString(16).padStart(6, '0')}`;
}

function toRgb(color) {
  return {
    r: (color >> 16) & 255,
    g: (color >> 8) & 255,
    b: color & 255,
  };
}

function rgba(color, alpha) {
  const { r, g, b } = toRgb(color);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function fillRoundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fill();
}

function strokeRoundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.stroke();
}

export function createPaddleCanvas({
  width = GAME_CONSTANTS.PADDLE_WIDTH,
  height = GAME_CONSTANTS.PADDLE_HEIGHT,
  color = COLORS.PADDLE,
} = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  const inset = 1;
  const bodyX = inset;
  const bodyY = inset;
  const bodyWidth = Math.max(1, width - inset * 2);
  const bodyHeight = Math.max(1, height - inset * 2);
  const bodyRadius = bodyHeight / 2;

  context.fillStyle = 'rgba(0, 0, 0, 0.24)';
  fillRoundedRect(
    context,
    bodyX,
    bodyY + 1,
    bodyWidth,
    bodyHeight - 1,
    bodyRadius
  );

  context.fillStyle = toCssHex(color);
  fillRoundedRect(context, bodyX, bodyY, bodyWidth, bodyHeight, bodyRadius);

  const faceGradient = context.createLinearGradient(
    0,
    bodyY,
    0,
    bodyY + bodyHeight
  );
  faceGradient.addColorStop(0, 'rgba(255, 255, 255, 0.46)');
  faceGradient.addColorStop(0.24, 'rgba(255, 255, 255, 0.16)');
  faceGradient.addColorStop(0.55, rgba(color, 0.08));
  faceGradient.addColorStop(0.82, 'rgba(0, 0, 0, 0.16)');
  faceGradient.addColorStop(1, 'rgba(0, 0, 0, 0.34)');

  context.fillStyle = faceGradient;
  fillRoundedRect(context, bodyX, bodyY, bodyWidth, bodyHeight, bodyRadius);

  const sideGradient = context.createLinearGradient(bodyX, 0, width - inset, 0);
  sideGradient.addColorStop(0, 'rgba(0, 0, 0, 0.22)');
  sideGradient.addColorStop(0.16, 'rgba(255, 255, 255, 0.12)');
  sideGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
  sideGradient.addColorStop(0.84, 'rgba(0, 0, 0, 0.02)');
  sideGradient.addColorStop(1, 'rgba(0, 0, 0, 0.28)');

  context.fillStyle = sideGradient;
  fillRoundedRect(context, bodyX, bodyY, bodyWidth, bodyHeight, bodyRadius);

  const railY = bodyY + Math.max(4, bodyHeight * 0.28);
  const railStart = bodyX + bodyRadius + 4;
  const railEnd = bodyX + bodyWidth - bodyRadius - 4;

  if (railEnd > railStart) {
    context.strokeStyle = 'rgba(255, 255, 255, 0.48)';
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(railStart, railY);
    context.lineTo(railEnd, railY);
    context.stroke();
  }

  context.strokeStyle = 'rgba(255, 255, 255, 0.34)';
  context.lineWidth = 1;
  strokeRoundedRect(
    context,
    bodyX + 0.5,
    bodyY + 0.5,
    bodyWidth - 1,
    bodyHeight - 1,
    Math.max(1, bodyRadius - 0.5)
  );

  context.strokeStyle = 'rgba(0, 0, 0, 0.24)';
  strokeRoundedRect(
    context,
    bodyX + 0.5,
    bodyY + 0.5,
    bodyWidth - 1,
    bodyHeight - 1,
    Math.max(1, bodyRadius - 0.5)
  );

  return canvas;
}

export function createBallCanvas({
  size = GAME_CONSTANTS.BALL_SIZE,
  radius = GAME_CONSTANTS.BALL_RADIUS,
  color = COLORS.BALL,
} = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext('2d');
  const center = size / 2;
  const visualRadius = Math.max(2, Math.min(radius, center) - 1);

  context.fillStyle = 'rgba(0, 0, 0, 0.18)';
  context.beginPath();
  context.arc(center + 0.75, center + 0.9, visualRadius, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = toCssHex(color);
  context.beginPath();
  context.arc(center, center, visualRadius, 0, Math.PI * 2);
  context.fill();

  const materialGradient = context.createRadialGradient(
    center - visualRadius * 0.42,
    center - visualRadius * 0.46,
    visualRadius * 0.12,
    center + visualRadius * 0.12,
    center + visualRadius * 0.1,
    visualRadius * 1.2
  );
  materialGradient.addColorStop(0, 'rgba(255, 255, 255, 0.74)');
  materialGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.22)');
  materialGradient.addColorStop(0.58, rgba(color, 0.05));
  materialGradient.addColorStop(0.82, 'rgba(0, 0, 0, 0.12)');
  materialGradient.addColorStop(1, 'rgba(0, 0, 0, 0.42)');

  context.fillStyle = materialGradient;
  context.beginPath();
  context.arc(center, center, visualRadius, 0, Math.PI * 2);
  context.fill();

  const rimGradient = context.createLinearGradient(0, 0, size, size);
  rimGradient.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
  rimGradient.addColorStop(0.45, 'rgba(255, 255, 255, 0)');
  rimGradient.addColorStop(1, 'rgba(0, 0, 0, 0.36)');

  context.fillStyle = rimGradient;
  context.beginPath();
  context.arc(center, center, visualRadius, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  context.lineWidth = 1;
  context.beginPath();
  context.arc(center, center, visualRadius - 0.5, 0, Math.PI * 2);
  context.stroke();

  context.strokeStyle = 'rgba(0, 0, 0, 0.22)';
  context.beginPath();
  context.arc(center, center, visualRadius - 0.5, 0, Math.PI * 2);
  context.stroke();

  context.fillStyle = 'rgba(255, 255, 255, 0.88)';
  context.beginPath();
  context.arc(
    center - visualRadius * 0.36,
    center - visualRadius * 0.4,
    Math.max(1.2, visualRadius * 0.16),
    0,
    Math.PI * 2
  );
  context.fill();

  return canvas;
}

function replaceTexture(scene, textureKey, canvas) {
  if (scene.textures.exists(textureKey)) {
    scene.textures.remove(textureKey);
  }

  scene.textures.addCanvas(textureKey, canvas);
}

export function registerGameTextures(scene, settings) {
  replaceTexture(
    scene,
    TEXTURE_KEYS.PADDLE,
    createPaddleCanvas({
      width: settings.paddleWidth,
      height: GAME_CONSTANTS.PADDLE_HEIGHT,
      color: settings.paddleColor,
    })
  );

  replaceTexture(
    scene,
    TEXTURE_KEYS.BALL,
    createBallCanvas({
      size: GAME_CONSTANTS.BALL_SIZE,
      radius: GAME_CONSTANTS.BALL_RADIUS,
      color: settings.ballColor,
    })
  );
}

export function refreshBallTexture(scene, state, settings) {
  if (!scene || !state?.ball) return;

  replaceTexture(
    scene,
    TEXTURE_KEYS.BALL,
    createBallCanvas({
      size: GAME_CONSTANTS.BALL_SIZE,
      radius: GAME_CONSTANTS.BALL_RADIUS,
      color: settings.ballColor,
    })
  );

  state.ball.setTexture(TEXTURE_KEYS.BALL);
  state.ball.setDisplaySize(GAME_CONSTANTS.BALL_SIZE, GAME_CONSTANTS.BALL_SIZE);

  state.livesBalls?.forEach((ball) => {
    ball.setTexture(TEXTURE_KEYS.BALL);
    ball.setDisplaySize(GAME_CONSTANTS.BALL_SIZE, GAME_CONSTANTS.BALL_SIZE);
  });
}

export function refreshPaddleTexture(scene, state, settings) {
  if (!scene || !state?.paddle) return;

  replaceTexture(
    scene,
    TEXTURE_KEYS.PADDLE,
    createPaddleCanvas({
      width: settings.paddleWidth,
      height: GAME_CONSTANTS.PADDLE_HEIGHT,
      color: settings.paddleColor,
    })
  );

  const { x, y } = state.paddle;
  state.paddle.setTexture(TEXTURE_KEYS.PADDLE);
  state.paddle.setDisplaySize(
    settings.paddleWidth,
    GAME_CONSTANTS.PADDLE_HEIGHT
  );
  state.paddle.setPosition(x, y);
  state.paddle.body.setSize(settings.paddleWidth, GAME_CONSTANTS.PADDLE_HEIGHT);
}
