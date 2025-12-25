import {
  setupSettings,
  settings,
  updateBallTexture,
  updatePaddleTexture,
  updateBallSpeed,
  initializeTheme,
} from '../src/settings.js';
import { gameState } from '../src/state.js';
import { createMockScene, MockPhysicsImage, MockImage } from './mockScene.js';

describe('settings modal interactions', () => {
  let scene;
  let game;

  beforeAll(() => {
    // Robustly mock getContext to ensure roundRect exists
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type) {
      const ctx = originalGetContext.call(this, type) || {};
      // Add missing methods
      ['roundRect', 'stroke', 'moveTo', 'lineTo', 'beginPath', 'fill', 'arc', 'createRadialGradient', 'createLinearGradient', 'addColorStop'].forEach(method => {
        ctx[method] = ctx[method] || jest.fn(() => ({ addColorStop: jest.fn() })); // Return generic object for gradients
      });
      return ctx;
    };
  });

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="settingsModal" class="modal"></div>
      <button id="settingsButton"></button>
      <button id="closeModal"></button>
      <input id="soundToggle" type="checkbox" checked />
      <input id="themeToggle" type="checkbox" />
      <input id="ballColorPicker" type="color" value="#a9a9a9" />
      <input id="paddleColorPicker" type="color" value="#a9a9a9" />
      <input id="paddleWidthSlider" type="range" value="100" />
      <span id="paddleWidthValue">100</span>
      <input id="ballSpeedSlider" type="range" value="1.0" />
      <span id="ballSpeedValue">1.0</span>
      <button id="pauseButton"></button>
    `;

    Object.defineProperty(window, 'innerWidth', { writable: true, value: 900 });
    Object.defineProperty(window, 'innerHeight', { writable: true, value: 700 });

    localStorage.removeItem('brickBreakerTheme');
    document.documentElement.removeAttribute('data-theme');
    settings.theme = 'light';

    scene = createMockScene();
    game = { scene: { scenes: [scene] } };

    gameState.reset();
    gameState.ball = new MockPhysicsImage(0, 0, 'ball');
    gameState.paddle = {
      setTexture: jest.fn(),
      setDisplaySize: jest.fn(),
      setPosition: jest.fn(),
      body: { setSize: jest.fn() },
      width: 100,
      x: 50,
      y: 0,
    };
    gameState.livesBalls = [new MockImage(0, 0)];
  });

  test('opening modal pauses game and stops countdown', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 300 });
    gameState.countdownInterval = setInterval(() => { }, 1000);
    gameState.paused = false;

    setupSettings(game);
    document.getElementById('settingsButton').click();

    expect(document.getElementById('settingsModal').classList.contains('active')).toBe(true);
    expect(gameState.paused).toBe(true);
    expect(scene.physics.world.isPaused).toBe(true);
    expect(gameState.countdownInterval).toBeNull();
    expect(gameState.wasInCountdown).toBe(true);
    expect(document.getElementById('pauseButton').innerHTML).toContain('fa-play');

    document.getElementById('settingsModal').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(document.getElementById('settingsModal').classList.contains('active')).toBe(false);

    document.getElementById('settingsButton').click();
    document.getElementById('closeModal').click();
    expect(document.getElementById('settingsModal').classList.contains('active')).toBe(false);
  });

  test('controls update visual settings and speeds', () => {
    setupSettings(game);

    expect(document.getElementById('paddleWidthSlider').max).toBe(String(Math.floor(window.innerWidth / 3)));

    const soundToggle = document.getElementById('soundToggle');
    soundToggle.checked = false;
    soundToggle.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    expect(settings.soundEnabled).toBe(false);
    expect(scene.sound.mute).toBe(true);

    gameState.ball.setTexture = jest.fn();
    gameState.ball.setDisplaySize = jest.fn();
    gameState.livesBalls[0].setTexture = jest.fn();
    gameState.livesBalls[0].setDisplaySize = jest.fn();
    document.getElementById('ballColorPicker').value = '#ff0000';
    document.getElementById('ballColorPicker').dispatchEvent(new Event('input'));
    expect(settings.ballColor).toBe(0xff0000);
    expect(gameState.ball.setTexture).toHaveBeenCalled();

    gameState.paddle.setTexture = jest.fn();
    gameState.paddle.setDisplaySize = jest.fn();
    gameState.paddle.setPosition = jest.fn();
    document.getElementById('paddleColorPicker').value = '#00ff00';
    document.getElementById('paddleColorPicker').dispatchEvent(new Event('input'));
    expect(settings.paddleColor).toBe(0x00ff00);
    expect(gameState.paddle.setTexture).toHaveBeenCalled();

    document.getElementById('paddleWidthSlider').value = '150';
    document.getElementById('paddleWidthSlider').dispatchEvent(new Event('input'));
    expect(settings.paddleWidth).toBe(150);
    expect(document.getElementById('paddleWidthValue').textContent).toBe('150');
    expect(gameState.paddle.setDisplaySize).toHaveBeenCalled();

    gameState.ball.body.velocity = { x: 0, y: 0 };
    document.getElementById('ballSpeedSlider').value = '1.5';
    document.getElementById('ballSpeedSlider').dispatchEvent(new Event('input'));
    expect(settings.ballSpeed).toBeCloseTo(1.5);
    expect(document.getElementById('ballSpeedValue').textContent).toBe('1.5');
    expect(gameState.ball.body.velocity).toEqual({ x: 0, y: 0 });

    gameState.ball.body.velocity = { x: 3, y: 4 };
    gameState.ball.setVelocity = jest.fn();
    document.getElementById('ballSpeedSlider').dispatchEvent(new Event('input'));
    expect(gameState.ball.setVelocity).toHaveBeenCalled();
  });

  test('theme toggle updates dataset and persists preference', () => {
    setupSettings(game);

    const themeToggle = document.getElementById('themeToggle');
    expect(themeToggle.checked).toBe(false);
    expect(settings.theme).toBe('light');

    themeToggle.checked = true;
    themeToggle.dispatchEvent(new Event('change', { bubbles: true }));
    expect(settings.theme).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('brickBreakerTheme')).toBe('dark');

    themeToggle.checked = false;
    themeToggle.dispatchEvent(new Event('change', { bubbles: true }));
    expect(settings.theme).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('brickBreakerTheme')).toBe('light');
  });

  test('initializeTheme defaults to light theme when no preference stored', () => {
    document.documentElement.removeAttribute('data-theme');
    localStorage.removeItem('brickBreakerTheme');
    settings.theme = 'dark';

    const resultingTheme = initializeTheme();

    expect(resultingTheme).toBe('light');
    expect(settings.theme).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  test('setupSettings logs when physics scene is missing', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => { });
    const gameWithoutScene = { scene: { scenes: [null] } };

    setupSettings(gameWithoutScene);
    document.getElementById('settingsButton').click();

    expect(consoleError).toHaveBeenCalledWith('Scene or physics not available');
    consoleError.mockRestore();
  });

  test('setupSettings tolerates a missing pause button', () => {
    document.getElementById('pauseButton').remove();

    setupSettings(game);
    document.getElementById('settingsButton').click();

    expect(scene.physics.world.isPaused).toBe(true);
    expect(document.getElementById('pauseButton')).toBeNull();
  });

  test('modal click from a child element does not close the settings', () => {
    setupSettings(game);
    document.getElementById('settingsButton').click();

    const modal = document.getElementById('settingsModal');
    const child = document.createElement('div');
    modal.appendChild(child);

    child.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(modal.classList.contains('active')).toBe(true);
  });

  test('sound toggle ignores missing scene sound', () => {
    scene.sound = null;

    setupSettings(game);
    const soundToggle = document.getElementById('soundToggle');
    soundToggle.checked = false;
    soundToggle.dispatchEvent(new Event('change', { bubbles: true }));

    expect(settings.soundEnabled).toBe(false);
    expect(scene.sound).toBeNull();
  });

  test('updateBallTexture refreshes ball texture and life icons', () => {
    const scene = createMockScene();
    scene.textures.exists = jest.fn(() => true);
    scene.textures.remove = jest.fn();
    scene.textures.addCanvas = jest.fn();

    const ball = new MockPhysicsImage(0, 0);
    ball.setTexture = jest.fn();
    ball.setDisplaySize = jest.fn();
    gameState.ball = ball;

    const lifeBalls = [new MockImage(0, 0), new MockImage(0, 0)];
    lifeBalls.forEach(ball => {
      ball.setTexture = jest.fn();
      ball.setDisplaySize = jest.fn();
    });
    gameState.livesBalls = lifeBalls;

    updateBallTexture(scene);

    expect(scene.textures.remove).toHaveBeenCalledWith('ballTexture');
    expect(ball.setTexture).toHaveBeenCalledWith('ballTexture');
    expect(lifeBalls[0].setTexture).toHaveBeenCalledWith('ballTexture');
  });

  test('updatePaddleTexture rebuilds paddle canvas and body bounds', () => {
    const scene = createMockScene();
    scene.textures.exists = jest.fn((key) => key === 'paddleTexture');
    scene.textures.remove = jest.fn();
    scene.textures.addCanvas = jest.fn();

    const paddle = {
      x: 200,
      y: 400,
      width: 100,
      setTexture: jest.fn(),
      setDisplaySize: jest.fn(),
      setPosition: jest.fn(),
      body: {
        setSize: jest.fn(),
      },
    };

    const originalWidth = settings.paddleWidth;
    settings.paddleWidth = 150;
    gameState.paddle = paddle;

    updatePaddleTexture(scene);

    expect(scene.textures.remove).toHaveBeenCalledWith('paddleTexture');
    expect(paddle.setDisplaySize).toHaveBeenCalledWith(150, 20);
    expect(paddle.body.setSize).toHaveBeenCalledWith(150, 20);

    settings.paddleWidth = originalWidth;
  });

  test('updateBallTexture short-circuits when ball is unavailable', () => {
    gameState.ball = null;
    expect(() => updateBallTexture(scene)).not.toThrow();
  });

  test('updateBallTexture handles missing life balls list', () => {
    const sceneWithoutBM = createMockScene();
    sceneWithoutBM.textures.exists = jest.fn(() => false);
    gameState.ball = new MockPhysicsImage(0, 0);
    gameState.livesBalls = null;

    expect(() => updateBallTexture(sceneWithoutBM)).not.toThrow();
  });

  test('updatePaddleTexture short-circuits when paddle is unavailable', () => {
    gameState.paddle = null;
    expect(() => updatePaddleTexture(scene)).not.toThrow();
  });

  test('updateBallSpeed short-circuits when there is no ball body', () => {
    gameState.ball = null;
    expect(() => updateBallSpeed(scene)).not.toThrow();
  });

  test('updateBallSpeed ignores zero velocity', () => {
    gameState.ball = {
      body: { velocity: { x: 0, y: 0 } },
      setVelocity: jest.fn(),
    };

    updateBallSpeed(scene);
    expect(gameState.ball.setVelocity).not.toHaveBeenCalled();
  });
});
