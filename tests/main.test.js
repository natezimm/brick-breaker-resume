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
    originalRequestIdleCallback = window.requestIdleCallback;
    window.requestIdleCallback = (cb) => cb();

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
    jest.mock('phaser', () => ({
      Game: jest.fn(() => ({})),
      AUTO: 'AUTO',
    }), { virtual: true });

    const startButton = document.createElement('button');
    startButton.id = 'startButton';
    document.body.appendChild(startButton);

    const startOverlay = document.createElement('div');
    startOverlay.id = 'startOverlay';
    document.body.appendChild(startOverlay);

    const { setupUIButtons, setupWindowResize } = await import('../src/ui.js');
    const { setupSettings, initializeTheme } = await import('../src/settings.js');

    await import('../main.js');

    const { default: Phaser } = await import('phaser');
    expect(Phaser.Game).not.toHaveBeenCalled();

    startButton.click();

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(initializeTheme).toHaveBeenCalled();
    expect(Phaser.Game).toHaveBeenCalled();

    expect(startOverlay.classList.contains('hidden')).toBe(true);
    expect(startButton.disabled).toBe(true);

    const gameInstance = Phaser.Game.mock.instances[0];
    expect(setupUIButtons).toHaveBeenCalledWith(gameInstance);
    expect(setupWindowResize).toHaveBeenCalledWith(gameInstance);
    expect(setupSettings).toHaveBeenCalledWith(gameInstance);
  });
});
