import { preload, create, update, _setAudioLoaded } from '../src/game.js';
import { AUDIO_KEYS, GAME_CONSTANTS } from '../src/constants.js';
import { gameState } from '../src/state.js';
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
  setupUIButtons: jest.fn(),
  setupWindowResize: jest.fn(),
}));

describe('game scene', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    gameState.reset();
    settings.soundEnabled = true;
    _setAudioLoaded(true); // Simulate audio being loaded for tests
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 800 });
    Object.defineProperty(window, 'innerHeight', { writable: true, value: 600 });
  });

  afterEach(() => {
    _setAudioLoaded(false); // Reset audio state after each test
  });

  test('preload is a no-op (audio loads lazily on user interaction)', () => {
    const load = { audio: jest.fn() };
    preload.call({ load });

    // Audio loading is now deferred to first user interaction
    expect(load.audio).not.toHaveBeenCalled();
  });

  test('create configures scene, physics, and controls', async () => {
    jest.useFakeTimers();
    const scene = createMockScene();

    create.call(scene);
    await Promise.resolve();

    expect(createLivesDisplay).toHaveBeenCalledWith(scene);
    expect(createScoreText).toHaveBeenCalledWith(scene);
    expect(createBricksFromResume).toHaveBeenCalledWith(scene);
    expect(createCountdownText).toHaveBeenCalledWith(scene);
    expect(startCountdown).toHaveBeenCalledWith(scene);
    expect(gameState.paddle).toBeDefined();
    expect(gameState.ball).toBeDefined();
    expect(scene.colliders.length).toBe(2);
    expect(scene.physics.world.on).toHaveBeenCalled();

    gameState.paused = false;
    const moveHandler = scene.input.events['pointermove'];
    moveHandler({ x: 1000 });
    expect(gameState.paddle.x).toBeLessThanOrEqual(window.innerWidth - gameState.paddle.width / 2);

    const pausedPosition = gameState.paddle.x;
    gameState.paused = true;
    moveHandler({ x: 200 });
    expect(gameState.paddle.x).toBe(pausedPosition);
    gameState.paused = false;

    scene.physics.world.emit('worldbounds', gameState.ball.body, false, false);

    scene.colliders[0]();
    expect(scene.sound.play).toHaveBeenCalledWith(AUDIO_KEYS.BALL_HIT);

    settings.soundEnabled = false;
    scene.sound.play.mockClear();
    scene.colliders[0]();
    expect(scene.sound.play).not.toHaveBeenCalled();
    settings.soundEnabled = true;

    scene.colliders[1]('ball', 'brick');
    expect(handleBrickCollision).toHaveBeenCalled();
    expect(scene.sound.play).toHaveBeenCalledWith(AUDIO_KEYS.BRICK_HIT);

    const keyboardHandler = scene.input.events['keydown-P'];
    keyboardHandler();
    expect(togglePause).toHaveBeenCalledWith(scene);

    gameState.ball.setPosition = jest.fn();
    gameState.ball.setVelocity = jest.fn();
    scene.physics.world.emit('worldbounds', gameState.ball.body, false, true);
    jest.runOnlyPendingTimers();
    const expectedX = GAME_CONSTANTS.BALL_INITIAL_VELOCITY.x * settings.ballSpeed;
    const expectedY = GAME_CONSTANTS.BALL_INITIAL_VELOCITY.y * settings.ballSpeed;
    expect(gameState.ball.setVelocity).toHaveBeenCalledWith(expectedX, expectedY);

    const expectedCallsBeforeFalseBranch = gameState.ball.setVelocity.mock.calls.filter(
      ([x, y]) => x === expectedX && y === expectedY
    ).length;

    jest.clearAllTimers();
    gameState.lives = 3;
    scene.physics.world.emit('worldbounds', gameState.ball.body, false, true);
    gameState.lives = 0;
    jest.runOnlyPendingTimers();

    const expectedCallsAfterFalseBranch = gameState.ball.setVelocity.mock.calls.filter(
      ([x, y]) => x === expectedX && y === expectedY
    ).length;

    expect(expectedCallsAfterFalseBranch).toBe(expectedCallsBeforeFalseBranch);

    gameState.lives = 1;
    gameState.ball.destroy = jest.fn();
    scene.sound.play.mockClear();
    scene.physics.world.emit('worldbounds', gameState.ball.body, false, true);
    expect(showGameOver).toHaveBeenCalledWith(scene);
    expect(gameState.ball.destroy).toHaveBeenCalled();
    expect(scene.sound.play).toHaveBeenCalledWith(AUDIO_KEYS.GAME_OVER);

    jest.useRealTimers();
  });

  test('create clears a stale win text before initializing', async () => {
    const scene = createMockScene();
    const winText = { destroy: jest.fn() };
    gameState.winText = winText;

    create.call(scene);

    expect(winText.destroy).toHaveBeenCalled();
    expect(gameState.winText).toBeNull();
  });

  test('update triggers win flow when bricks are cleared', () => {
    const scene = createMockScene();

    update.call(scene);
    expect(showWinMessage).not.toHaveBeenCalled();

    gameState.bricksCreated = true;
    gameState.bricksGroup = { countActive: () => 0 };
    gameState.lives = 2;
    gameState.winText = null;
    gameState.ball = { setVelocity: jest.fn() };

    update.call(scene);

    expect(showWinMessage).toHaveBeenCalledWith(scene);
    expect(gameState.ball.setVelocity).toHaveBeenCalledWith(0, 0);
    expect(scene.sound.play).toHaveBeenCalledWith(AUDIO_KEYS.WIN_GAME);
    expect(gameState.paused).toBe(true);
  });
});
