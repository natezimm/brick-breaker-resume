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
  });

  afterEach(() => {
    window.requestIdleCallback = originalRequestIdleCallback;
  });

  test('initializes Phaser game and wiring', async () => {
    // Mock Phaser to be available for dynamic import
    jest.mock('phaser', () => ({
      Game: jest.fn(() => ({})),
      AUTO: 'AUTO',
    }), { virtual: true });

    const { setupUIButtons, setupWindowResize } = await import('../src/ui.js');
    const { setupSettings, initializeTheme } = await import('../src/settings.js');

    // We need to capture the promise returned by requestIdleCallback's callback
    let initPromise;
    window.requestIdleCallback = (cb) => {
      initPromise = cb();
    };

    await import('../main.js');

    // Wait for the async initGame to complete
    if (initPromise) await initPromise;

    // Importing the mocked module to check expectations
    const { default: Phaser } = await import('phaser');

    expect(initializeTheme).toHaveBeenCalled();
    expect(Phaser.Game).toHaveBeenCalled();
    const gameInstance = Phaser.Game.mock.instances[0];
    expect(setupUIButtons).toHaveBeenCalledWith(gameInstance);
    expect(setupWindowResize).toHaveBeenCalledWith(gameInstance);
    expect(setupSettings).toHaveBeenCalledWith(gameInstance);
  });
});
