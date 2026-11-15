import { preload, create, update, _setAudioLoaded } from '../src/game.js';
import { AUDIO_KEYS, GAME_CONSTANTS } from '../src/constants.js';
import { attachGameState, gameState, getGameState } from '../src/state.js';
import { settings } from '../src/settings.js';
import { createMockScene } from './mockScene.js';
import { createBricksFromResume, handleBrickCollision } from '../src/bricks.js';
import {
  createLivesDisplay,
  createScoreText,
  startCountdown,
  createCountdownText,
  showGameOver,
  showWinMessage,
  togglePause,
} from '../src/ui.js';

jest.mock('../src/bricks.js', () => ({
  createBricksFromResume: jest.fn(() => Promise.resolve()),
  handleBrickCollision: jest.fn(),
}));

jest.mock('../src/ui.js', () => ({
  createLivesDisplay: jest.fn(),
  createScoreText: jest.fn(),
  startCountdown: jest.fn(),
  createCountdownText: jest.fn(),
  showGameOver: jest.fn(),
  showWinMessage: jest.fn(),
  togglePause: jest.fn(),
  hideGameMessage: jest.fn(),
  setupUIButtons: jest.fn(),
  setupWindowResize: jest.fn(),
}));

describe('game scene', () => {
  beforeAll(() => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type) {
      const ctx = originalGetContext.call(this, type) || {};
      [
        'roundRect',
        'stroke',
        'moveTo',
        'lineTo',
        'beginPath',
        'fill',
        'arc',
        'createRadialGradient',
        'createLinearGradient',
        'addColorStop',
      ].forEach((method) => {
        ctx[method] =
          ctx[method] || jest.fn(() => ({ addColorStop: jest.fn() }));
      });
      return ctx;
    };
  });

  beforeEach(() => {
    jest.clearAllMocks();
    gameState.reset();
    settings.soundEnabled = true;
    _setAudioLoaded(true); // Simulate audio being loaded for tests
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 800,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      value: 600,
    });
  });

  afterEach(() => {
    _setAudioLoaded(false); // Reset audio state after each test
  });

  test('preload is a no-op (audio loads lazily on user interaction)', () => {
    const load = { audio: jest.fn() };
    preload.call({ load });

    expect(load.audio).not.toHaveBeenCalled();
  });

  test('create configures scene, physics, and controls', async () => {
    jest.useFakeTimers();
    const scene = createMockScene();

    create.call(scene);
    await Promise.resolve();
    const state = getGameState(scene);

    expect(createLivesDisplay).toHaveBeenCalledWith(scene, state);
    expect(createScoreText).toHaveBeenCalledWith(scene, state);
    expect(createBricksFromResume).toHaveBeenCalledWith(scene, state);
    expect(createCountdownText).toHaveBeenCalledWith(scene, state);
    expect(startCountdown).toHaveBeenCalledWith(scene, state);
    expect(state.paddle).toBeDefined();
    expect(state.ball).toBeDefined();
    expect(scene.colliders.length).toBe(2);
    expect(scene.physics.world.on).toHaveBeenCalled();

    state.paused = false;
    const moveHandler = scene.input.events['pointermove'];
    moveHandler({ x: 1000 });
    expect(state.paddle.x).toBeLessThanOrEqual(
      window.innerWidth - state.paddle.width / 2
    );

    const pausedPosition = state.paddle.x;
    state.paused = true;
    moveHandler({ x: 200 });
    expect(state.paddle.x).toBe(pausedPosition);
    state.paused = false;

    scene.physics.world.emit('worldbounds', state.ball.body, false, false);

    scene.colliders[0]();
    expect(scene.sound.play).toHaveBeenCalledWith(AUDIO_KEYS.BALL_HIT);

    settings.soundEnabled = false;
    scene.sound.play.mockClear();
    scene.colliders[0]();
    expect(scene.sound.play).not.toHaveBeenCalled();
    settings.soundEnabled = true;

    scene.colliders[1]('ball', 'brick');
    expect(handleBrickCollision).toHaveBeenCalledWith(
      scene,
      'ball',
      'brick',
      state
    );
    expect(scene.sound.play).toHaveBeenCalledWith(AUDIO_KEYS.BRICK_HIT);

    const keyboardHandler = scene.input.events['keydown-P'];
    keyboardHandler();
    expect(togglePause).toHaveBeenCalledWith(scene, state);

    // A lost ball waits over the paddle, then launches at the set speed.
    const realSetVelocity = state.ball.setVelocity.bind(state.ball);
    state.ball.setPosition = jest.fn();
    state.ball.setVelocity = jest.fn(realSetVelocity);
    state.ball.setRotation = jest.fn();
    state.paddle.x = 260;
    scene.physics.world.emit('worldbounds', state.ball.body, false, true);
    expect(state.ball.setPosition).toHaveBeenCalledWith(
      260,
      expect.any(Number)
    );
    expect(state.ball.setVelocity).toHaveBeenLastCalledWith(0, 0);

    const speed = () =>
      Math.hypot(state.ball.body.velocity.x, state.ball.body.velocity.y);
    jest.advanceTimersByTime(GAME_CONSTANTS.LIFE_LOST_RESTART_DELAY - 1);
    expect(speed()).toBe(0);
    jest.advanceTimersByTime(1);
    expect(speed()).toBeCloseTo(
      GAME_CONSTANTS.BALL_SPEED * settings.ballSpeed,
      5
    );
    expect(state.ball.body.velocity.y).toBeLessThan(0);

    // No relaunch once the last life has gone in the meantime.
    jest.clearAllTimers();
    state.lives = 3;
    scene.physics.world.emit('worldbounds', state.ball.body, false, true);
    state.lives = 0;
    jest.runOnlyPendingTimers();
    expect(speed()).toBe(0);

    state.lives = 1;
    state.ball.destroy = jest.fn();
    scene.sound.play.mockClear();
    scene.physics.world.emit('worldbounds', state.ball.body, false, true);
    expect(showGameOver).toHaveBeenCalledWith(scene, state);
    expect(state.gameEnded).toBe(true);
    expect(state.ball.destroy).toHaveBeenCalled();
    expect(scene.sound.play).toHaveBeenCalledWith(AUDIO_KEYS.GAME_OVER);

    jest.useRealTimers();
  });

  test('the paddle aims the ball by where it lands', () => {
    const scene = createMockScene();
    create.call(scene);
    const state = getGameState(scene);
    state.paddle.x = 400;
    state.paddle.y = 500;
    state.paddle.displayWidth = 100;
    const speed = GAME_CONSTANTS.BALL_SPEED * settings.ballSpeed;

    state.ball.setPosition(400, 480);
    scene.colliders[0]();
    expect(state.ball.body.velocity.x).toBeCloseTo(0, 5);
    expect(state.ball.body.velocity.y).toBeCloseTo(-speed, 5);

    // The right end sends it out at the widest angle to the right.
    state.ball.setPosition(460, 480);
    scene.colliders[0]();
    const angle = GAME_CONSTANTS.PADDLE_MAX_BOUNCE_ANGLE * (Math.PI / 180);
    expect(state.ball.body.velocity.x).toBeCloseTo(speed * Math.sin(angle), 5);
    expect(state.ball.body.velocity.y).toBeCloseTo(-speed * Math.cos(angle), 5);

    // A ball clipping the paddle's side keeps the bounce physics gave it.
    state.ball.setVelocity(120, 80);
    state.ball.setPosition(455, 505);
    scene.colliders[0]();
    expect(state.ball.body.velocity).toEqual({ x: 120, y: 80 });
  });

  test('arrow keys and A/D steer the paddle while playing', () => {
    const scene = createMockScene();
    const keys = {
      LEFT: { isDown: false },
      RIGHT: { isDown: false },
      A: { isDown: false },
      D: { isDown: false },
    };
    scene.input.keyboard.addKeys = jest.fn(() => keys);
    create.call(scene);
    const state = getGameState(scene);
    state.paused = false;
    state.paddle.x = 400;

    keys.RIGHT.isDown = true;
    update.call(scene, 0, 100);
    expect(state.paddle.x).toBeCloseTo(
      400 + GAME_CONSTANTS.PADDLE_KEY_SPEED * 0.1,
      5
    );

    keys.RIGHT.isDown = false;
    keys.A.isDown = true;
    update.call(scene, 0, 10_000);
    expect(state.paddle.x).toBe(state.paddle.width / 2);

    state.paused = true;
    keys.A.isDown = false;
    keys.D.isDown = true;
    update.call(scene, 0, 100);
    expect(state.paddle.x).toBe(state.paddle.width / 2);
  });

  test('a game paused while the résumé loads counts in on resume', async () => {
    const scene = createMockScene();
    create.call(scene);
    const state = getGameState(scene);
    state.userPaused = true;
    await Promise.resolve();
    await Promise.resolve();

    expect(startCountdown).not.toHaveBeenCalled();
    expect(state.wasInCountdown).toBe(true);
  });

  test('update triggers win flow when bricks are cleared', () => {
    const scene = createMockScene();
    attachGameState(scene, gameState);

    update.call(scene);
    expect(showWinMessage).not.toHaveBeenCalled();

    gameState.bricksCreated = true;
    gameState.bricksGroup = { countActive: () => 0 };
    gameState.lives = 2;
    gameState.winText = null;
    gameState.ball = { setVelocity: jest.fn(), setRotation: jest.fn() };
    gameState.bricksByRow = new Map();

    update.call(scene);

    expect(showWinMessage).toHaveBeenCalledWith(scene, gameState);
    expect(gameState.ball.setVelocity).toHaveBeenCalledWith(0, 0);
    expect(scene.sound.play).toHaveBeenCalledWith(AUDIO_KEYS.WIN_GAME);
    expect(gameState.paused).toBe(true);
  });

  test('update draws ball and paddle trails while playing', () => {
    const scene = createMockScene();
    attachGameState(scene, gameState);

    gameState.paused = false;
    gameState.ball = scene.physics.add
      .image(100, 200, 'ball')
      .setDisplaySize(20, 20);
    gameState.paddle = scene.physics.add
      .image(300, 545, 'paddle')
      .setDisplaySize(120, 20);

    update.call(scene);

    expect(scene.add.graphics).toHaveBeenCalledTimes(2);
    expect(gameState.ballTrailGraphics.fillCircle).toHaveBeenCalled();
    expect(gameState.paddleTrailGraphics.fillRoundedRect).toHaveBeenCalled();
  });

  describe('trails for each look', () => {
    const play = (scene) => {
      attachGameState(scene, gameState);
      gameState.paused = false;
      gameState.ball = scene.physics.add
        .image(100, 200, 'ball')
        .setDisplaySize(20, 20);
      gameState.paddle = scene.physics.add
        .image(300, 545, 'paddle')
        .setDisplaySize(120, 20);
    };

    afterEach(() => {
      settings.theme = 'dark';
    });

    test('Glass glows in the colour of the last brick broken', () => {
      settings.theme = 'dark';
      const scene = createMockScene();
      play(scene);
      gameState.lastHitColor = 0x4caf50;

      update.call(scene);

      const colors = gameState.ballTrailGraphics.fillStyle.mock.calls.map(
        ([color]) => color
      );
      expect(new Set(colors)).toEqual(new Set([0x4caf50]));
      // One trail point plus the stacked halo and under-paddle glow.
      expect(gameState.ballTrailGraphics.fillCircle).toHaveBeenCalledTimes(6);
      expect(
        gameState.paddleTrailGraphics.fillRoundedRect
      ).toHaveBeenCalledTimes(4);
    });

    test('Paper leaves a plain ink smear with no glow', () => {
      settings.theme = 'light';
      settings.ballColor = 0x16181d;
      const scene = createMockScene();
      play(scene);
      gameState.lastHitColor = 0x4caf50;

      update.call(scene);

      expect(gameState.ballTrailGraphics.fillCircle).toHaveBeenCalledTimes(1);
      expect(gameState.ballTrailGraphics.fillStyle).toHaveBeenCalledWith(
        0x16181d,
        expect.any(Number)
      );
      expect(
        gameState.paddleTrailGraphics.fillRoundedRect
      ).toHaveBeenCalledTimes(1);
    });

    test('trails switch blend mode with the look and survive a bare renderer', () => {
      const scene = createMockScene();
      play(scene);
      const setBlendMode = jest.fn();
      gameState.ballTrailGraphics = {
        clear: jest.fn(),
        fillStyle: jest.fn(),
        fillCircle: jest.fn(),
        setBlendMode,
      };
      gameState.paddleTrailGraphics = {
        clear: jest.fn(),
        fillStyle: jest.fn(),
        fillRect: jest.fn(),
      };

      settings.theme = 'dark';
      update.call(scene);
      expect(setBlendMode).toHaveBeenLastCalledWith(1);
      expect(gameState.paddleTrailGraphics.fillRect).toHaveBeenCalledTimes(1);

      settings.theme = 'light';
      update.call(scene);
      expect(setBlendMode).toHaveBeenLastCalledWith(0);
    });
  });
});
