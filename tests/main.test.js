jest.mock('../src/ui.js', () => ({
  setupUIButtons: jest.fn(),
  setupWindowResize: jest.fn(),
}));

jest.mock('../src/settings.js', () => ({
  setupSettings: jest.fn(),
  initializeTheme: jest.fn(),
}));

describe('main entrypoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
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
