jest.mock('../src/ui.js', () => ({
  setupUIButtons: jest.fn(),
  setupWindowResize: jest.fn(),
}));

jest.mock('../src/settings.js', () => ({
  setupSettings: jest.fn(),
  initializeTheme: jest.fn(),
}));

describe('main entrypoint', () => {
  let originalRequestIdleCallback;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    // Store original and mock requestIdleCallback to execute immediately
    originalRequestIdleCallback = window.requestIdleCallback;
    window.requestIdleCallback = (cb) => cb();

    // Mock global fetch for overlay.js
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      })
    );
  });

  afterEach(() => {
    window.requestIdleCallback = originalRequestIdleCallback;
  });

  test('initializes Phaser game and wiring on start button click', async () => {
    // Mock Phaser
    jest.mock('phaser', () => ({
      Game: jest.fn(() => ({})),
      AUTO: 'AUTO',
    }), { virtual: true });

    // Mock DOM elements
    const startButton = document.createElement('button');
    startButton.id = 'startButton';
    document.body.appendChild(startButton);

    const startOverlay = document.createElement('div');
    startOverlay.id = 'startOverlay';
    document.body.appendChild(startOverlay);

    // Mock dependencies
    const { setupUIButtons, setupWindowResize } = await import('../src/ui.js');
    const { setupSettings, initializeTheme } = await import('../src/settings.js');

    // Load main module (attaches listeners)
    await import('../main.js');

    // Verify game NOT initialized yet
    const { default: Phaser } = await import('phaser');
    expect(Phaser.Game).not.toHaveBeenCalled();

    // Click start button
    startButton.click();

    // Allow async init to proceed
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(initializeTheme).toHaveBeenCalled();
    expect(Phaser.Game).toHaveBeenCalled();

    // Check overlay interaction
    expect(startOverlay.classList.contains('hidden')).toBe(true);
    expect(startButton.disabled).toBe(true);

    const gameInstance = Phaser.Game.mock.instances[0];
    expect(setupUIButtons).toHaveBeenCalledWith(gameInstance);
    expect(setupWindowResize).toHaveBeenCalledWith(gameInstance);
    expect(setupSettings).toHaveBeenCalledWith(gameInstance);
  });
});
