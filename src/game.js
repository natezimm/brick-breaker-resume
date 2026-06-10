import { AUDIO_KEYS, TEXTURE_KEYS, GAME_CONSTANTS } from './constants.js';
import { attachGameState, createGameState } from './state.js';
import { createBricksFromResume, handleBrickCollision } from './bricks.js';
import {
  createLivesDisplay,
  createScoreText,
  startCountdown,
  createCountdownText,
  showGameOver,
  showWinMessage,
  togglePause,
  hideGameMessage,
} from './ui.js';
import { applyThemeToScene, settings } from './settings.js';
import { registerGameTextures } from './textures.js';

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
    .image(window.innerWidth / 2, window.innerHeight - 55, TEXTURE_KEYS.PADDLE)
    .setImmovable(true)
    .setCollideWorldBounds(true);
}

function createBall(scene, state) {
  state.ball = scene.physics.add
    .image(window.innerWidth / 2, window.innerHeight - 80, TEXTURE_KEYS.BALL)
    .setDisplaySize(GAME_CONSTANTS.BALL_SIZE, GAME_CONSTANTS.BALL_SIZE)
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
      const paddleWidth = state.paddle.width;
      state.paddle.x = Math.max(
        paddleWidth / 2,
        Math.min(pointer.x, window.innerWidth - paddleWidth / 2)
      );
    }
  });

  scene.input.keyboard.on('keydown-P', () => {
    triggerAudioLoad();
    togglePause(scene, state);
  });
}

function loseLife(scene, state) {
  state.decrementLives();

  if (state.lives > 0) {
    state.ball.setPosition(window.innerWidth / 2, window.innerHeight - 80);
    state.ball.setVelocity(0, 0);

    setTimeout(() => {
      if (state.ball && state.lives > 0) {
        state.ball.setVelocity(
          GAME_CONSTANTS.BALL_INITIAL_VELOCITY.x * settings.ballSpeed,
          GAME_CONSTANTS.BALL_INITIAL_VELOCITY.y * settings.ballSpeed
        );
      }
    }, 1000);
  } else {
    showGameOver(scene, state);
    state.ball.destroy();
    playSound(scene, AUDIO_KEYS.GAME_OVER);
  }
}

export function create() {
  const scene = this;
  const state = attachGameState(scene, createGameState());
  applyThemeToScene(scene, settings.theme, state);

  hideGameMessage();
  state.gameEnded = false;

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
    createCountdownText(scene, state);
    startCountdown(scene, state);
  })();
}

export function update() {
  const scene = this;
  const state = scene.gameState;

  if (
    state?.bricksCreated &&
    state.bricksGroup.countActive() === 0 &&
    state.lives > 0 &&
    !state.gameEnded
  ) {
    showWinMessage(scene, state);
    state.ball.setVelocity(0, 0);
    playSound(scene, AUDIO_KEYS.WIN_GAME);
    state.setPaused(true);
  }

  if (state?.ball) {
    state.ball.setRotation(0);
  }
}
