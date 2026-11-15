import * as ui from '../src/ui.js';
import { gameState } from '../src/state.js';
import { settings } from '../src/settings.js';
import { createMockScene } from './mockScene.js';
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
      <div id="hudLives"></div>
      <div id="hudScore">
        <span id="hudBestValue"></span>
        <span id="hudScoreValue"></span>
      </div>
      <button id="pauseButton" aria-pressed="false"></button>
      <button id="highScoreButton"></button>
      <dialog id="highScoreModal">
        <button id="closeHighScoreModal"></button>
        <span id="highScoreValue"></span>
      </dialog>
      <button id="settingsButton"></button>
      <dialog id="settingsModal">
        <button id="closeModal"></button>
      </dialog>
      <div id="gameMessageOverlay" class="hidden"></div>
    `;
    gameState.reset();
    // Most tests play a game whose résumé has already loaded.
    gameState.bricksReady = true;
    scene = createMockScene();
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 800,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      value: 600,
    });
  });

  test('createLivesDisplay draws one pip per life in the HUD', () => {
    gameState.lives = 3;

    ui.createLivesDisplay(scene);

    const container = document.getElementById('hudLives');
    expect(gameState.livesBalls).toHaveLength(3);
    expect(container.querySelectorAll('.hud-pip')).toHaveLength(3);
    expect(container.getAttribute('aria-label')).toBe('3 lives left');

    // Drawing again replaces the row instead of adding to it.
    gameState.lives = 2;
    ui.createLivesDisplay(scene);
    expect(container.querySelectorAll('.hud-pip')).toHaveLength(2);
    expect(container.querySelectorAll('.hud-pips')).toHaveLength(1);
  });

  test('a lost life stays in its slot as an empty ring', () => {
    gameState.lives = 2;
    ui.createLivesDisplay(scene);
    const container = document.getElementById('hudLives');

    gameState.decrementLives();

    const pips = container.querySelectorAll('.hud-pip');
    expect(pips).toHaveLength(2);
    expect(pips[0].classList.contains('is-lost')).toBe(false);
    expect(pips[1].classList.contains('is-lost')).toBe(true);
    expect(container.getAttribute('aria-label')).toBe('1 life left');
    expect(gameState.lives).toBe(1);
  });

  test('createLivesDisplay reuses an existing pip track', () => {
    document.getElementById('hudLives').innerHTML =
      '<span class="hud-label">Lives</span><span class="hud-pips"><i>old</i></span>';
    gameState.lives = 1;

    ui.createLivesDisplay(scene);

    const track = document.querySelector('#hudLives .hud-pips');
    expect(track.children).toHaveLength(1);
    expect(document.querySelector('#hudLives .hud-label')).not.toBeNull();
  });

  test('lives still count down when the HUD is not on the page', () => {
    document.getElementById('hudLives').remove();
    gameState.lives = 2;

    ui.createLivesDisplay(scene);
    expect(gameState.livesBalls).toHaveLength(2);

    expect(() => gameState.decrementLives()).not.toThrow();
    expect(gameState.livesBalls).toHaveLength(1);
  });

  test('the score readout follows the score and the best score', () => {
    gameState.highScore = 500;
    ui.createScoreText(scene);

    const value = document.getElementById('hudScoreValue');
    const best = document.getElementById('hudBestValue');
    const group = document.getElementById('hudScore');
    expect(value.textContent).toBe('0');
    expect(best.textContent).toBe('500');
    expect(group.classList.contains('is-best')).toBe(false);
    expect(value.classList.contains('is-bumped')).toBe(false);

    gameState.incrementScore(1240);

    expect(value.textContent).toBe('1,240');
    expect(best.textContent).toBe('1,240');
    expect(group.classList.contains('is-best')).toBe(true);
    expect(value.classList.contains('is-bumped')).toBe(true);
  });

  test('createScoreText rebinds cleanly and tolerates a missing HUD', () => {
    ui.createScoreText(scene);
    gameState.incrementScore(10);
    const value = document.getElementById('hudScoreValue');
    expect(value.classList.contains('is-bumped')).toBe(true);

    gameState.score = 0;
    ui.createScoreText(scene);
    expect(value.classList.contains('is-bumped')).toBe(false);
    expect(value.textContent).toBe('0');

    document.getElementById('hudScore').remove();
    ui.createScoreText(scene);
    expect(() => gameState.incrementScore(20)).not.toThrow();
    expect(() => gameState.scoreText.setText('not a number')).not.toThrow();
    expect(gameState.score).toBe(20);
  });

  test('startCountdown counts down then launches a resting ball', () => {
    jest.useFakeTimers();
    gameState.ball = scene.physics.add.image(0, 0, 'ball');
    gameState.currentCountdown = GAME_CONSTANTS.COUNTDOWN_START;
    scene.physics.world.isPaused = true;

    ui.startCountdown(scene);
    jest.advanceTimersByTime(GAME_CONSTANTS.COUNTDOWN_INTERVAL);
    expect(document.querySelector('.gm-countdown').textContent).toBe('2');
    expect(document.querySelector('.gm-hint').textContent).toMatch(/steer/i);

    jest.advanceTimersByTime(
      GAME_CONSTANTS.COUNTDOWN_INTERVAL * (GAME_CONSTANTS.COUNTDOWN_START - 1)
    );

    const { x, y } = gameState.ball.body.velocity;
    expect(Math.hypot(x, y)).toBeCloseTo(
      GAME_CONSTANTS.BALL_SPEED * settings.ballSpeed,
      5
    );
    expect(y).toBeLessThan(0);
    expect(Math.abs(x)).toBeGreaterThan(0);
    expect(gameState.paused).toBe(false);
    expect(scene.physics.world.isPaused).toBe(false);
    expect(gameState.countdownInterval).toBeNull();
    expect(gameState.currentCountdown).toBe(GAME_CONSTANTS.COUNTDOWN_START);
    expect(
      document.getElementById('gameMessageOverlay').classList.contains('hidden')
    ).toBe(true);
  });

  test('a countdown after a pause lets a moving ball carry on', () => {
    jest.useFakeTimers();
    gameState.ball = scene.physics.add.image(0, 0, 'ball');
    gameState.ball.setVelocity(50, -120);

    ui.startCountdown(scene);
    jest.advanceTimersByTime(
      GAME_CONSTANTS.COUNTDOWN_INTERVAL * GAME_CONSTANTS.COUNTDOWN_START
    );

    expect(gameState.ball.body.velocity).toEqual({ x: 50, y: -120 });
  });

  test('createCountdownText renders countdown indicator', () => {
    document.body.innerHTML =
      '<div id="gameMessageOverlay" class="hidden"></div>';
    gameState.currentCountdown = 3;
    ui.createCountdownText(scene);

    const overlay = document.getElementById('gameMessageOverlay');
    expect(overlay.innerHTML).toContain('3');
    expect(overlay.classList.contains('hidden')).toBe(false);
  });

  test('game over shows the score with a way to play again', () => {
    gameState.score = 340;
    gameState.highScore = 900;
    gameState.totalBricks = 120;
    gameState.brokenWords = new Set([1, 2, 3]);
    scene.scene.restart = jest.fn();

    ui.showGameOver(scene);

    const overlay = document.getElementById('gameMessageOverlay');
    expect(overlay.classList.contains('hidden')).toBe(false);
    expect(overlay.querySelector('.gm-eyebrow').textContent).toBe('Game over');
    expect(overlay.querySelector('.gm-title').textContent).toBe('340 points');
    expect(overlay.textContent).toContain('Best 900');
    expect(overlay.textContent).toContain('3 of 120 bricks broken');

    const playAgain = overlay.querySelector('.gm-action--primary');
    expect(playAgain.textContent).toBe('Play again');
    expect(document.activeElement).toBe(playAgain);

    const links = [...overlay.querySelectorAll('a.gm-action')];
    expect(links.map((link) => link.textContent)).toEqual([
      'Download résumé',
      'Portfolio',
    ]);
    expect(links[0].hasAttribute('download')).toBe(true);
    expect(links[1].target).toBe('_blank');

    playAgain.click();
    expect(scene.scene.restart).toHaveBeenCalled();
    expect(overlay.classList.contains('hidden')).toBe(true);
  });

  test('a cleared résumé celebrates in the look', () => {
    gameState.score = 1200;
    gameState.highScore = 1200;
    settings.theme = 'dark';

    ui.showWinMessage(scene);

    const overlay = document.getElementById('gameMessageOverlay');
    expect(gameState.gameEnded).toBe(true);
    expect(overlay.querySelector('.gm-eyebrow').textContent).toBe(
      'Résumé cleared'
    );
    expect(overlay.textContent).toContain('A new best score');
    expect(overlay.querySelectorAll('.confetti-piece').length).toBeGreaterThan(
      0
    );

    // Paper keeps to its ink: no confetti.
    settings.theme = 'light';
    ui.showWinMessage(scene);
    expect(overlay.querySelectorAll('.confetti-piece')).toHaveLength(0);
    settings.theme = 'dark';
  });

  test('messages are skipped when the overlay is missing', () => {
    document.getElementById('gameMessageOverlay').remove();
    expect(() => {
      ui.showGameOver(scene);
      ui.showWinMessage(scene);
      ui.createCountdownText(scene);
      ui.hideGameMessage();
    }).not.toThrow();
  });

  test('pausing shows a paused card and resuming carries on', () => {
    scene.time = { paused: false };
    const pauseButton = document.getElementById('pauseButton');

    ui.togglePause(scene);
    expect(gameState.userPaused).toBe(true);
    expect(gameState.paused).toBe(true);
    expect(scene.physics.world.isPaused).toBe(true);
    expect(scene.time.paused).toBe(true);
    expect(pauseButton.getAttribute('aria-pressed')).toBe('true');
    expect(pauseButton.getAttribute('aria-label')).toBe('Resume game');
    const card = document.querySelector('.gm-card--paused');
    expect(card).not.toBeNull();

    card.querySelector('.gm-action--primary').click();
    expect(gameState.userPaused).toBe(false);
    expect(gameState.paused).toBe(false);
    expect(scene.physics.world.isPaused).toBe(false);
    expect(scene.time.paused).toBe(false);
    expect(pauseButton.getAttribute('aria-pressed')).toBe('false');
    expect(document.querySelector('.gm-card--paused')).toBeNull();
  });

  test('pausing mid-countdown counts in again on resume', () => {
    jest.useFakeTimers();
    gameState.ball = scene.physics.add.image(0, 0, 'ball');
    ui.startCountdown(scene);

    ui.togglePause(scene);
    expect(gameState.countdownInterval).toBeNull();
    expect(gameState.wasInCountdown).toBe(true);

    ui.togglePause(scene);
    expect(gameState.wasInCountdown).toBe(false);
    expect(gameState.countdownInterval).not.toBeNull();
    expect(document.querySelector('.gm-countdown')).not.toBeNull();
    // Physics waits for the countdown to finish.
    expect(gameState.paused).toBe(true);

    jest.runOnlyPendingTimers();
    jest.clearAllTimers();
  });

  test('pause does nothing once the game has ended or without a scene', () => {
    gameState.gameEnded = true;
    ui.togglePause(scene);
    expect(gameState.userPaused).toBe(false);

    expect(ui.pauseGame(null, gameState)).toBe(false);
    expect(() => ui.resumeGame(null, gameState)).not.toThrow();
  });

  test('a dialog pauses the game and counts back in when it closes', () => {
    jest.useFakeTimers();
    const game = { scene: { scenes: [scene] } };
    gameState.highScore = 4200;
    gameState.paused = false;
    ui.setupUIButtons(game);

    document.getElementById('highScoreButton').click();
    const dialog = document.getElementById('highScoreModal');
    expect(dialog.hasAttribute('open')).toBe(true);
    expect(gameState.userPaused).toBe(true);
    expect(document.getElementById('highScoreValue').textContent).toBe('4,200');
    // The dialog covers the game, so no paused card behind it.
    expect(document.querySelector('.gm-card--paused')).toBeNull();

    document.getElementById('closeHighScoreModal').click();
    expect(dialog.hasAttribute('open')).toBe(false);
    expect(gameState.userPaused).toBe(false);
    expect(gameState.countdownInterval).not.toBeNull();

    jest.runOnlyPendingTimers();
    jest.clearAllTimers();
  });

  test('a dialog closed while the résumé loads leaves the count-in to the load', () => {
    jest.useFakeTimers();
    gameState.bricksReady = false;
    const game = { scene: { scenes: [scene] } };
    ui.setupUIButtons(game);

    document.getElementById('settingsButton').click();
    expect(gameState.userPaused).toBe(true);
    document.getElementById('closeModal').click();

    expect(gameState.userPaused).toBe(false);
    expect(gameState.wasInCountdown).toBe(false);
    expect(gameState.countdownInterval).toBeNull();
    // Still waiting for the load, which starts the countdown itself.
    expect(gameState.paused).toBe(true);
    jest.clearAllTimers();
  });

  test('starting a countdown again replaces the running one', () => {
    jest.useFakeTimers();
    gameState.ball = scene.physics.add.image(0, 0, 'ball');
    ui.startCountdown(scene);
    const first = gameState.countdownInterval;
    ui.startCountdown(scene);
    expect(gameState.countdownInterval).not.toBe(first);

    jest.advanceTimersByTime(
      GAME_CONSTANTS.COUNTDOWN_INTERVAL * GAME_CONSTANTS.COUNTDOWN_START
    );
    expect(gameState.countdownInterval).toBeNull();
    expect(jest.getTimerCount()).toBe(0);
    expect(gameState.paused).toBe(false);
  });

  test('a dialog opened while paused leaves the game paused', () => {
    const game = { scene: { scenes: [scene] } };
    ui.setupUIButtons(game);
    document.getElementById('pauseButton').click();
    expect(gameState.userPaused).toBe(true);

    document.getElementById('settingsButton').click();
    document.getElementById('closeModal').click();

    expect(gameState.userPaused).toBe(true);
    expect(gameState.countdownInterval).toBeNull();
  });

  test('dialogs close on a backdrop click but not on a click inside', () => {
    const game = { scene: { scenes: [scene] } };
    ui.setupUIButtons(game);
    document.getElementById('settingsButton').click();
    const dialog = document.getElementById('settingsModal');
    dialog.getBoundingClientRect = () => ({
      left: 100,
      right: 300,
      top: 100,
      bottom: 300,
    });

    dialog.dispatchEvent(
      new MouseEvent('click', { bubbles: true, clientX: 150, clientY: 150 })
    );
    expect(dialog.hasAttribute('open')).toBe(true);

    document
      .getElementById('closeModal')
      .dispatchEvent(new MouseEvent('click', { bubbles: false }));
    dialog.setAttribute('open', '');
    dialog
      .querySelector('#closeModal')
      .parentElement.dispatchEvent(
        new MouseEvent('click', { bubbles: true, clientX: 20, clientY: 20 })
      );
    expect(dialog.hasAttribute('open')).toBe(false);
  });

  test('hiding the tab pauses the game', () => {
    const game = { scene: { scenes: [scene] } };
    ui.setupUIButtons(game);
    let visibility = 'visible';
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => visibility,
    });

    document.dispatchEvent(new Event('visibilitychange'));
    expect(gameState.userPaused).toBe(false);

    visibility = 'hidden';
    document.dispatchEvent(new Event('visibilitychange'));
    expect(gameState.userPaused).toBe(true);
    expect(document.querySelector('.gm-card--paused')).not.toBeNull();

    game.scene.scenes = [];
    expect(() =>
      document.dispatchEvent(new Event('visibilitychange'))
    ).not.toThrow();
    delete document.visibilityState;
  });

  test('setupUIButtons tolerates a page without its controls', () => {
    document.body.innerHTML = '';
    const game = { scene: { scenes: [scene] } };
    expect(() => ui.setupUIButtons(game)).not.toThrow();
  });

  test('setupWindowResize resizes the game and keeps the paddle on screen', () => {
    const game = {
      scale: { resize: jest.fn() },
      scene: { scenes: [scene] },
    };
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
    const clearance =
      GAME_CONSTANTS.HUD_HEIGHT +
      GAME_CONSTANTS.PADDLE_GAP +
      GAME_CONSTANTS.PADDLE_HEIGHT / 2;
    expect(gameState.paddle.y).toBe(400 - clearance);
    expect(gameState.paddle.x).toBe(200);

    window.innerWidth = 1000;
    window.innerHeight = 800;
    gameState.paddle.x = 50;
    resizeHandler();

    expect(gameState.paddle.y).toBe(800 - clearance);
    expect(gameState.paddle.x).toBe(100);
  });

  test('setupWindowResize lays the bricks out again once resizing settles', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.useFakeTimers();
    const game = {
      scale: { resize: jest.fn() },
      scene: { scenes: [scene] },
    };
    gameState.bricksGroup = { clear: jest.fn() };
    gameState.bricksCreated = true;
    gameState.ball = scene.physics.add.image(900, 700, 'ball');

    const interceptor = captureResizeHandler();
    ui.setupWindowResize(game);
    const resizeHandler = interceptor.handler;
    interceptor.restore();

    window.innerWidth = 500;
    window.innerHeight = 400;
    resizeHandler();
    resizeHandler();

    // A ball left outside the window comes back over the paddle.
    expect(gameState.ball.x).toBe(500);
    expect(gameState.ball.y).toBeLessThan(400);

    expect(gameState.bricksGroup.clear).not.toHaveBeenCalled();
    jest.advanceTimersByTime(GAME_CONSTANTS.RELAYOUT_DELAY);
    await Promise.resolve();
    await Promise.resolve();
    expect(gameState.bricksGroup.clear).toHaveBeenCalledTimes(1);

    game.scene.scenes = [];
    resizeHandler();
    expect(() =>
      jest.advanceTimersByTime(GAME_CONSTANTS.RELAYOUT_DELAY)
    ).not.toThrow();
    jest.useRealTimers();
    await new Promise((resolve) => setTimeout(resolve, 0));
    warn.mockRestore();
  });

  test('setupWindowResize ignores missing UI components', () => {
    const game = {
      scale: { resize: jest.fn() },
      scene: { scenes: [scene] },
    };
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
    const game = {
      scale: { resize: jest.fn() },
      scene: { scenes: [null] },
    };

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
