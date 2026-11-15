import {
  AUDIO_KEYS,
  TEXTURE_KEYS,
  GAME_CONSTANTS,
  THEMES,
  THEME_LOOKS,
} from './constants.js';
import { attachGameState, createGameState } from './state.js';
import { createBricksFromResume, handleBrickCollision } from './bricks.js';
import {
  createLivesDisplay,
  createScoreText,
  startCountdown,
  createCountdownText,
  showGameOver,
  showWinMessage,
  hasNextLevel,
  finishLevel,
  togglePause,
  hideGameMessage,
} from './ui.js';
import { applyThemeToScene, settings } from './settings.js';
import { registerGameTextures } from './textures.js';
import { getBallRestY, getPaddleY } from './playfield.js';
import {
  ballSpeed,
  isBallMoving,
  launchBall,
  paddleBounceVelocity,
} from './ballPhysics.js';

let audioLoaded = false;
let audioLoadPromise = null;

export function _setAudioLoaded(loaded) {
  audioLoaded = loaded;
  if (!loaded) audioLoadPromise = null;
}

function loadAudioLazy(scene) {
  if (audioLoaded || audioLoadPromise) return audioLoadPromise;

  audioLoadPromise = new Promise((resolve) => {
    scene.load.audio(AUDIO_KEYS.BALL_HIT, 'assets/sounds/ball-hit.wav');
    scene.load.audio(AUDIO_KEYS.BRICK_HIT, 'assets/sounds/brick-hit.wav');
    scene.load.audio(AUDIO_KEYS.LOSE_LIFE, 'assets/sounds/lose-life.wav');
    scene.load.audio(AUDIO_KEYS.WIN_GAME, 'assets/sounds/win-game.wav');
    scene.load.audio(AUDIO_KEYS.GAME_OVER, 'assets/sounds/game-over.wav');

    scene.load.once('complete', () => {
      audioLoaded = true;
      resolve();
    });
    scene.load.start();
  });

  return audioLoadPromise;
}

function playSound(scene, key) {
  if (settings.soundEnabled && scene.sound && audioLoaded) {
    scene.sound.play(key);
  }
}

export function preload() {}

function createPaddle(scene, state) {
  state.paddle = scene.physics.add
    .image(window.innerWidth / 2, getPaddleY(), TEXTURE_KEYS.PADDLE)
    .setDepth(2)
    .setImmovable(true)
    .setCollideWorldBounds(true);
}

function createBall(scene, state) {
  state.ball = scene.physics.add
    .image(window.innerWidth / 2, getBallRestY(), TEXTURE_KEYS.BALL)
    .setDisplaySize(GAME_CONSTANTS.BALL_SIZE, GAME_CONSTANTS.BALL_SIZE)
    .setDepth(3)
    .setVelocity(0, 0)
    .setBounce(1)
    .setCollideWorldBounds(true);

  state.ball.body.allowRotation = false;

  state.ball.body.onWorldBounds = true;
  state.ball.body.setCollideWorldBounds(true, 1, 1, true);
}

function setupCollisions(scene, state) {
  scene.physics.add.collider(state.ball, state.paddle, () => {
    playSound(scene, AUDIO_KEYS.BALL_HIT);
    aimOffPaddle(state);
  });

  scene.physics.add.collider(state.ball, state.bricksGroup, (ball, brick) => {
    playSound(scene, AUDIO_KEYS.BRICK_HIT);
    handleBrickCollision(scene, ball, brick, state);
  });

  scene.physics.world.on('worldbounds', (body, up, down) => {
    if (down && body.gameObject === state.ball) {
      playSound(scene, AUDIO_KEYS.LOSE_LIFE);
      loseLife(scene, state);
    }
  });
}

/** A ball landing on the paddle's top leaves at the angle the player aimed. */
function aimOffPaddle(state) {
  const { ball, paddle } = state;
  if (!ball?.body || !paddle || ball.y >= paddle.y) return;

  const { x, y } = paddleBounceVelocity(
    ball,
    paddle,
    ballSpeed(settings.ballSpeed)
  );
  ball.setVelocity(x, y);
}

function clampPaddleX(state, x) {
  const half = state.paddle.width / 2;
  return Math.max(half, Math.min(x, window.innerWidth - half));
}

/** Arrow keys and A/D steer the paddle, so the game plays without a mouse. */
function movePaddleWithKeys(state, delta = 16) {
  const keys = state.keys;
  if (!keys || !state.paddle || state.paused) return;

  const direction =
    (keys.RIGHT?.isDown || keys.D?.isDown ? 1 : 0) -
    (keys.LEFT?.isDown || keys.A?.isDown ? 1 : 0);
  if (direction === 0) return;

  state.paddle.x = clampPaddleX(
    state,
    state.paddle.x +
      (direction * GAME_CONSTANTS.PADDLE_KEY_SPEED * delta) / 1000
  );
}

function setupControls(scene, state) {
  let audioTriggered = false;
  const triggerAudioLoad = () => {
    if (!audioTriggered) {
      audioTriggered = true;
      loadAudioLazy(scene);
    }
  };

  scene.input.on('pointermove', (pointer) => {
    triggerAudioLoad();
    if (!state.paused) {
      state.paddle.x = clampPaddleX(state, pointer.x);
    }
  });

  const keyboard = scene.input.keyboard;
  state.keys = keyboard?.addKeys?.('LEFT,RIGHT,A,D') ?? null;
  keyboard?.on('keydown', triggerAudioLoad);
  keyboard?.on('keydown-P', () => {
    togglePause(scene, state);
  });
}

function loseLife(scene, state) {
  state.decrementLives();

  if (state.lives > 0) {
    // The next ball waits over the paddle, wherever the player left it.
    state.ball.setPosition(
      state.paddle?.x ?? window.innerWidth / 2,
      getBallRestY()
    );
    state.ball.setVelocity(0, 0);

    const relaunch = () => {
      // A countdown that ended in the meantime has already launched it.
      if (state.ball?.body && state.lives > 0 && !isBallMoving(state.ball)) {
        launchBall(state.ball, settings.ballSpeed);
      }
    };
    // The scene clock stops while the game is paused; a bare timer would not.
    if (scene.time?.delayedCall) {
      scene.time.delayedCall(GAME_CONSTANTS.LIFE_LOST_RESTART_DELAY, relaunch);
    } else {
      setTimeout(relaunch, GAME_CONSTANTS.LIFE_LOST_RESTART_DELAY);
    }
  } else {
    state.gameEnded = true;
    showGameOver(scene, state);
    state.ball.destroy();
    playSound(scene, AUDIO_KEYS.GAME_OVER);
  }
}

const BLEND_NORMAL = 0;
const BLEND_ADD = 1;

function getOrCreateTrailGraphics(scene, state, key) {
  if (!state[key]) {
    state[key] = scene.add.graphics({ x: 0, y: 0 });
    state[key].setDepth?.(1);
  }

  return state[key];
}

function addTrailPoint(points, point) {
  return [point, ...points]
    .map((trailPoint, index) => ({
      ...trailPoint,
      alpha: Math.max(0.04, trailPoint.alpha * (1 - index * 0.1)),
    }))
    .slice(0, GAME_CONSTANTS.TRAIL_LENGTH);
}

function isGlassTheme() {
  return settings.theme !== THEMES.LIGHT;
}

/** Glass lights the ball and paddle with the last colour they broke. */
function getGlowColor(state) {
  return state.lastHitColor ?? THEME_LOOKS[THEMES.DARK].accent;
}

function drawBallTrail(scene, state) {
  if (!state.ball || !state.ball.body) return;

  const graphics = getOrCreateTrailGraphics(scene, state, 'ballTrailGraphics');
  if (!graphics.clear || !graphics.fillStyle || !graphics.fillCircle) return;

  const glass = isGlassTheme();
  state.ballTrailPoints = addTrailPoint(state.ballTrailPoints, {
    x: state.ball.x,
    y: state.ball.y,
    radius: GAME_CONSTANTS.BALL_RADIUS,
    alpha: glass ? 0.3 : 0.16,
  });

  graphics.clear();
  graphics.setBlendMode?.(glass ? BLEND_ADD : BLEND_NORMAL);

  if (!glass) {
    // Paper: a smear of ink behind the ball.
    state.ballTrailPoints.forEach((point, index) => {
      graphics.fillStyle(settings.ballColor, point.alpha * 0.7);
      graphics.fillCircle(
        point.x,
        point.y,
        Math.max(2, point.radius - 2 - index * 0.9)
      );
    });
    return;
  }

  const glow = getGlowColor(state);
  state.ballTrailPoints.forEach((point, index) => {
    const radius = Math.max(2, point.radius - index * 1.1);

    graphics.fillStyle(glow, point.alpha * 0.34);
    graphics.fillCircle(point.x, point.y, radius + 5 - index * 0.4);
    graphics.fillStyle(glow, point.alpha * 0.6);
    graphics.fillCircle(point.x, point.y, radius);
  });

  // A soft halo, built from stacked discs since Graphics has no blur.
  [30, 23, 17, 12].forEach((radius, index) => {
    graphics.fillStyle(glow, 0.05 + index * 0.035);
    graphics.fillCircle(state.ball.x, state.ball.y, radius);
  });
}

function drawPaddleTrail(scene, state) {
  if (!state.paddle) return;

  const graphics = getOrCreateTrailGraphics(
    scene,
    state,
    'paddleTrailGraphics'
  );
  if (!graphics.clear || !graphics.fillStyle) return;

  const glass = isGlassTheme();
  const paddleWidth = state.paddle.displayWidth || state.paddle.width;
  const paddleHeight = state.paddle.displayHeight || state.paddle.height;
  state.paddleTrailPoints = addTrailPoint(state.paddleTrailPoints, {
    x: state.paddle.x,
    y: state.paddle.y,
    width: paddleWidth,
    height: paddleHeight,
    alpha: glass ? 0.2 : 0.07,
  });

  graphics.clear();
  graphics.setBlendMode?.(glass ? BLEND_ADD : BLEND_NORMAL);

  const color = glass ? getGlowColor(state) : settings.paddleColor;

  if (!graphics.fillRoundedRect) {
    const [point] = state.paddleTrailPoints;
    graphics.fillStyle(color, point.alpha * 0.62);
    graphics.fillRect(
      point.x - point.width / 2,
      point.y - point.height / 2,
      point.width,
      point.height
    );
    return;
  }

  state.paddleTrailPoints.forEach((point, index) => {
    const height = Math.max(4, point.height - index * 2);
    const width = Math.max(12, point.width - index * 4);

    graphics.fillStyle(color, point.alpha * (glass ? 0.5 : 0.6));
    graphics.fillRoundedRect(
      point.x - width / 2,
      point.y - height / 2,
      width,
      height,
      glass ? height / 2 : 1
    );
  });

  if (!glass) return;

  // Glow beneath the glass paddle, stacked like the ball's halo.
  [14, 9, 5].forEach((spread, index) => {
    const width = paddleWidth + spread * 2;
    const height = paddleHeight + spread * 2;

    graphics.fillStyle(color, 0.05 + index * 0.04);
    graphics.fillRoundedRect(
      state.paddle.x - width / 2,
      state.paddle.y - height / 2,
      width,
      height,
      height / 2
    );
  });
}

function updateTrails(scene, state) {
  if (state?.paused) return;
  drawBallTrail(scene, state);
  drawPaddleTrail(scene, state);
}

export function create() {
  const scene = this;
  const state = attachGameState(scene, createGameState());
  applyThemeToScene(scene, settings.theme, state);

  hideGameMessage();
  state.gameEnded = false;
  // A restarted scene keeps its clock; make sure it runs.
  if (scene.time) scene.time.paused = false;

  state.score = GAME_CONSTANTS.INITIAL_SCORE;
  state.lives = GAME_CONSTANTS.INITIAL_LIVES;
  state.bricksCreated = false;
  state.bricksGroup = scene.physics.add.staticGroup();

  registerGameTextures(scene, settings);
  createPaddle(scene, state);
  createBall(scene, state);
  setupCollisions(scene, state);
  setupControls(scene, state);

  createLivesDisplay(scene, state);
  createScoreText(scene, state);

  (async () => {
    await createBricksFromResume(scene, state);
    state.bricksReady = true;
    // Paused while the résumé loaded: count in once the player resumes.
    if (state.userPaused) {
      state.wasInCountdown = true;
      return;
    }
    createCountdownText(scene, state);
    startCountdown(scene, state);
  })();
}

export function update(time, delta) {
  const scene = this;
  const state = scene.gameState;

  if (state) movePaddleWithKeys(state, delta);

  if (
    state?.bricksCreated &&
    state.bricksGroup.countActive() === 0 &&
    state.lives > 0 &&
    !state.gameEnded
  ) {
    if (hasNextLevel(state)) {
      finishLevel(scene, state);
    } else {
      showWinMessage(scene, state);
      state.ball.setVelocity(0, 0);
      playSound(scene, AUDIO_KEYS.WIN_GAME);
      state.setPaused(true);
    }
  }

  if (state?.ball) {
    state.ball.setRotation(0);
  }

  updateTrails(scene, state);
}
