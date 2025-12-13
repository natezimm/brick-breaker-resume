import * as ui from '../src/ui.js';
import { gameState } from '../src/state.js';
import { settings } from '../src/settings.js';
import { createMockScene, MockImage } from './mockScene.js';
import { GAME_CONSTANTS } from '../src/constants.js';

function captureResizeHandler() {
  const originalAddEventListener = window.addEventListener;
  let handler;
  window.addEventListener = jest.fn((event, callback) => {
    if (event === 'resize') {
      handler = callback;
    }
  });
  return {
    get handler() {
      return handler;
    },
    restore() {
      window.addEventListener = originalAddEventListener;
    },
  };
}

describe('ui helpers', () => {
  let scene;

  beforeEach(() => {
    jest.useRealTimers();
    document.body.innerHTML = `
      <button id="pauseButton"></button>
      <button id="highScoreButton"></button>
      <div id="highScoreModal" class="modal"></div>
      <button id="closeHighScoreModal"></button>
      <span id="highScoreValue"></span>
    `;
    gameState.reset();
    scene = createMockScene();
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 800 });
    Object.defineProperty(window, 'innerHeight', { writable: true, value: 600 });
  });

  test('createLivesDisplay refreshes life icons for varying screen sizes', () => {
    gameState.lives = 2;
    gameState.livesBalls = [{ destroy: jest.fn() }];

    window.innerWidth = 500;
    ui.createLivesDisplay(scene);
    expect(gameState.livesBalls).toHaveLength(2);
    expect(gameState.livesBalls[0]).toBeInstanceOf(MockImage);

    window.innerWidth = 900;
    ui.createLivesDisplay(scene);
    expect(gameState.livesBalls).toHaveLength(2);
  });

  test('createLivesDisplay handles an empty lives list without error', () => {
    gameState.lives = 3;
    gameState.livesBalls = [];

    ui.createLivesDisplay(scene);
    expect(gameState.livesBalls).toHaveLength(3);
  });

  test('createScoreText positions and refreshes score label', () => {
    window.innerWidth = 300;
    ui.createScoreText(scene);
    expect(gameState.scoreText).toBeDefined();

    const destroySpy = jest.fn();
    gameState.scoreText.destroy = destroySpy;
    window.innerWidth = 900;
    ui.createScoreText(scene);
    expect(destroySpy).toHaveBeenCalled();
  });

  test('startCountdown counts down then launches the ball', () => {
    jest.useFakeTimers();
    gameState.ball = { setVelocity: jest.fn() };
    gameState.countdownText = { setText: jest.fn(), destroy: jest.fn() };
    gameState.currentCountdown = GAME_CONSTANTS.COUNTDOWN_START;

    ui.startCountdown(scene);

    jest.advanceTimersByTime(GAME_CONSTANTS.COUNTDOWN_INTERVAL * GAME_CONSTANTS.COUNTDOWN_START);

    expect(gameState.ball.setVelocity).toHaveBeenCalledWith(
      GAME_CONSTANTS.BALL_INITIAL_VELOCITY.x * settings.ballSpeed,
      GAME_CONSTANTS.BALL_INITIAL_VELOCITY.y * settings.ballSpeed
    );
    expect(gameState.paused).toBe(false);
    expect(gameState.countdownInterval).toBeNull();
    expect(gameState.currentCountdown).toBe(GAME_CONSTANTS.COUNTDOWN_START);
  });

  test('createCountdownText renders countdown indicator', () => {
    ui.createCountdownText(scene);
    expect(gameState.countdownText.text).toBe(gameState.currentCountdown.toString());
  });

  test('showGameOver and showWinMessage render messages', () => {
    ui.showGameOver(scene);
    expect(scene.add.text).toHaveBeenCalledWith(
      window.innerWidth / 2,
      window.innerHeight - 100,
      'Game Over',
      expect.any(Object)
    );

    ui.showWinMessage(scene);
    expect(gameState.winText.text).toBe('YOU BROKE IT! YOU WIN!');
  });

  test('togglePause toggles physics pause and restarts countdown when resuming', () => {
    jest.useFakeTimers();
    const pauseButton = document.getElementById('pauseButton');
    gameState.ball = { setVelocity: jest.fn() };
    gameState.countdownText = { setText: jest.fn(), destroy: jest.fn(), active: false };

    gameState.wasInCountdown = true;
    ui.togglePause(scene);
    expect(scene.physics.world.isPaused).toBe(false);
    expect(pauseButton.innerHTML).toContain('fa-pause');
    expect(gameState.countdownInterval).not.toBeNull();

    ui.togglePause(scene);
    expect(scene.physics.world.isPaused).toBe(true);
    expect(pauseButton.innerHTML).toContain('fa-play');

    jest.runOnlyPendingTimers();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test('togglePause skips DOM updates when pause button is missing and countdown is already active', () => {
    document.getElementById('pauseButton').remove();

    gameState.ball = { setVelocity: jest.fn() };
    gameState.countdownText = { active: true, setText: jest.fn() };
    gameState.wasInCountdown = true;
    gameState.paused = true;

    const createCountdownTextSpy = jest.spyOn(ui, 'createCountdownText');

    jest.useFakeTimers();
    ui.togglePause(scene);
    jest.useRealTimers();
    jest.clearAllTimers();

    expect(scene.physics.world.isPaused).toBe(false);
    expect(createCountdownTextSpy).not.toHaveBeenCalled();
    expect(gameState.countdownInterval).not.toBeNull();

    clearInterval(gameState.countdownInterval);
    gameState.countdownInterval = null;
    createCountdownTextSpy.mockRestore();
  });

  test('setupUIButtons wires pause and high score controls', () => {
    const game = { scene: { scenes: [scene] } };

    ui.setupUIButtons(game);

    gameState.paused = true;
    document.getElementById('pauseButton').click();
    expect(gameState.paused).toBe(false);

    gameState.highScore = 42;
    gameState.paused = false;
    document.getElementById('highScoreButton').click();
    expect(document.getElementById('highScoreModal').classList.contains('active')).toBe(true);
    expect(document.getElementById('highScoreValue').textContent).toBe('42');

    document.getElementById('highScoreModal').click();
    expect(document.getElementById('highScoreModal').classList.contains('active')).toBe(false);

    document.getElementById('highScoreModal').classList.add('active');
    document.getElementById('closeHighScoreModal').click();
    expect(document.getElementById('highScoreModal').classList.contains('active')).toBe(false);
  });

  test('setupUIButtons tolerates missing pause button and high score modal', () => {
    document.getElementById('pauseButton').remove();
    document.getElementById('highScoreModal').remove();
    document.getElementById('closeHighScoreModal').remove();

    const game = { scene: { scenes: [scene] } };

    expect(() => ui.setupUIButtons(game)).not.toThrow();

    document.getElementById('highScoreButton').click();
    expect(document.getElementById('highScoreModal')).toBeNull();
  });

  test('setupUIButtons handles missing close button and high score value while paused', () => {
    document.getElementById('closeHighScoreModal').remove();
    document.getElementById('highScoreValue').remove();

    const game = { scene: { scenes: [scene] } };
    gameState.paused = true;

    const togglePauseSpy = jest.spyOn(ui, 'togglePause');

    ui.setupUIButtons(game);
    document.getElementById('highScoreButton').click();

    expect(document.getElementById('highScoreModal').classList.contains('active')).toBe(true);
    expect(togglePauseSpy).not.toHaveBeenCalled();

    togglePauseSpy.mockRestore();
  });

  test('setupUIButtons ignores inside-modal clicks so the overlay stays open', () => {
    const game = { scene: { scenes: [scene] } };

    ui.setupUIButtons(game);
    const modal = document.getElementById('highScoreModal');
    modal.classList.add('active');
    const child = document.createElement('span');
    modal.appendChild(child);

    child.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(modal.classList.contains('active')).toBe(true);
  });

  test('setupWindowResize updates UI elements on resize', () => {
    const game = { scale: { resize: jest.fn() }, scene: { scenes: [scene] } };
    gameState.scoreText = { setStyle: jest.fn(), setPosition: jest.fn() };
    gameState.livesBalls = [new MockImage(0, 0), new MockImage(0, 0)];
    gameState.countdownText = { setPosition: jest.fn() };
    gameState.paddle = { width: 200, x: 500, y: 0 };

    const interceptor = captureResizeHandler();
    ui.setupWindowResize(game);
    const resizeHandler = interceptor.handler;
    interceptor.restore();

    expect(resizeHandler).toBeDefined();

    window.innerWidth = 300;
    window.innerHeight = 400;
    resizeHandler();

    expect(game.scale.resize).toHaveBeenCalledWith(300, 400);
    expect(scene.physics.world.setBounds).toHaveBeenCalledWith(0, 0, 300, 400);
    expect(gameState.scoreText.setStyle).toHaveBeenCalledWith({ fontSize: '16px' });
    expect(gameState.scoreText.setPosition).toHaveBeenCalledWith(300 - 10, 400 - 20);
    expect(gameState.livesBalls[0].x).toBe(15);
    expect(gameState.countdownText.setPosition).toHaveBeenCalledWith(150, 260);
    expect(gameState.paddle.y).toBe(345);
    expect(gameState.paddle.x).toBeLessThanOrEqual(200);
  });

  test('setupWindowResize widens spacing on larger screens', () => {
    const game = { scale: { resize: jest.fn() }, scene: { scenes: [scene] } };
    gameState.scoreText = { setStyle: jest.fn(), setPosition: jest.fn() };
    gameState.livesBalls = [new MockImage(0, 0)];
    gameState.countdownText = { setPosition: jest.fn() };
    gameState.paddle = { width: 200, x: 400, y: 0 };

    const interceptor = captureResizeHandler();
    ui.setupWindowResize(game);
    const resizeHandler = interceptor.handler;
    interceptor.restore();

    expect(resizeHandler).toBeDefined();

    window.innerWidth = 800;
    window.innerHeight = 600;
    resizeHandler();

    expect(game.scale.resize).toHaveBeenCalledWith(800, 600);
    expect(gameState.scoreText.setStyle).toHaveBeenCalledWith({ fontSize: '20px' });
    expect(gameState.scoreText.setPosition).toHaveBeenCalledWith(800 - 20, 600 - 20);
    expect(gameState.livesBalls[0].x).toBe(30);
    expect(gameState.countdownText.setPosition).toHaveBeenCalledWith(400, 460);
    expect(gameState.paddle.y).toBe(545);
  });

  test('setupWindowResize ignores missing UI components', () => {
    const game = { scale: { resize: jest.fn() }, scene: { scenes: [scene] } };
    gameState.scoreText = null;
    gameState.livesBalls = null;
    gameState.countdownText = null;
    gameState.paddle = null;

    const interceptor = captureResizeHandler();
    ui.setupWindowResize(game);
    const resizeHandler = interceptor.handler;
    interceptor.restore();

    expect(resizeHandler).toBeDefined();

    window.innerWidth = 500;
    window.innerHeight = 400;
    resizeHandler();

    expect(game.scale.resize).toHaveBeenCalledWith(500, 400);
    expect(scene.physics.world.setBounds).toHaveBeenCalledWith(0, 0, 500, 400);
  });

  test('setupWindowResize does nothing when scene is unavailable', () => {
    const game = { scale: { resize: jest.fn() }, scene: { scenes: [null] } };

    const interceptor = captureResizeHandler();
    ui.setupWindowResize(game);
    const resizeHandler = interceptor.handler;
    interceptor.restore();

    expect(resizeHandler).toBeDefined();

    window.innerWidth = 420;
    window.innerHeight = 310;
    resizeHandler();

    expect(game.scale.resize).toHaveBeenCalledWith(420, 310);
  });
});
