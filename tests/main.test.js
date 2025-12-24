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
    const { setupUIButtons, setupWindowResize } = await import('../src/ui.js');
    const { setupSettings, initializeTheme } = await import('../src/settings.js');

    await import('../main.js');

    expect(initializeTheme).toHaveBeenCalled();
    expect(Phaser.Game).toHaveBeenCalled();
    const gameInstance = Phaser.Game.mock.instances[0];
    expect(setupUIButtons).toHaveBeenCalledWith(gameInstance);
    expect(setupWindowResize).toHaveBeenCalledWith(gameInstance);
    expect(setupSettings).toHaveBeenCalledWith(gameInstance);
  });
});
