import { createBrick, createBricksFromResume, handleBrickCollision } from '../src/bricks.js';
import { gameState } from '../src/state.js';
import { createMockScene } from './mockScene.js';
import { extractTextFromFile } from '../parser.js';

jest.mock('../parser.js', () => ({
  extractTextFromFile: jest.fn(),
}));

describe('bricks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    gameState.reset();
    gameState.bricksGroup = null;
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 120 });
    Object.defineProperty(window, 'innerHeight', { writable: true, value: 80 });
  });

  test('createBrick builds brick visuals and metadata', () => {
    const scene = createMockScene();
    gameState.bricksGroup = scene.physics.add.staticGroup();

    const brick = createBrick(scene, 10, 10, 'Hello', 50, 0xff0000, true);

    expect(brick.getData('textElement').text).toBe('Hello');
    expect(brick.getData('graphics')).toBeDefined();
    expect(brick.getData('isLastInRow')).toBe(true);
    expect(gameState.bricksGroup.items).toContain(brick);
  });

  test('createBricksFromResume lays out and resizes bricks from resume text', async () => {
    const scene = createMockScene();
    gameState.bricksGroup = scene.physics.add.staticGroup();

    Object.defineProperty(window, 'innerWidth', { writable: true, value: 400 });
    Object.defineProperty(window, 'innerHeight', { writable: true, value: 100 });

    global.fetch = jest.fn().mockResolvedValue({
      blob: jest.fn().mockResolvedValue(new Blob(['dummy'])),
    });

    extractTextFromFile.mockResolvedValue([
      { text: 'firstword secondword thirdword' },
      { text: 'extra words to overflow rows anotherlongword hugeword largeword' },
    ]);

    await createBricksFromResume(scene);

    expect(global.fetch).toHaveBeenCalled();
    expect(extractTextFromFile).toHaveBeenCalled();
    expect(gameState.bricksGroup.items.length).toBeGreaterThan(0);
    expect(gameState.bricksCreated).toBe(true);
    expect(gameState.totalRows).toBeGreaterThan(0);
    const lastBrick = gameState.bricksGroup.items[gameState.bricksGroup.items.length - 1];
    expect(lastBrick.getData('isLastInRow')).toBe(true);
  });

  test('handleBrickCollision awards points and cleans up visuals', () => {
    const destroyText = jest.fn();
    const destroyGraphics = jest.fn();
    const brickData = new Map([
      ['textElement', { destroy: destroyText }],
      ['graphics', { destroy: destroyGraphics }],
      ['row', 0],
    ]);
    const brick = {
      getData: (key) => brickData.get(key),
      destroy: jest.fn(),
    };

    gameState.totalRows = 2;
    gameState.scoreText = { setText: jest.fn() };

    handleBrickCollision(createMockScene(), {}, brick);

    expect(destroyText).toHaveBeenCalled();
    expect(destroyGraphics).toHaveBeenCalled();
    expect(brick.destroy).toHaveBeenCalled();
    expect(gameState.score).toBe(20);
    expect(gameState.scoreText.setText).toHaveBeenCalledWith('Score: 20');
  });

  test('createBrick skips text when none is provided', () => {
    const scene = createMockScene();
    gameState.bricksGroup = scene.physics.add.staticGroup();

    const brick = createBrick(scene, 5, 5, null, 50, 0xff0000);

    expect(brick.getData('textElement')).toBeUndefined();
    expect(brick.getData('graphics')).toBeDefined();
  });

  test('createBricksFromResume leaves bricks alone when row already touches edge', async () => {
    const scene = createMockScene();
    gameState.bricksGroup = scene.physics.add.staticGroup();

    Object.defineProperty(window, 'innerWidth', { writable: true, value: 300 });
    Object.defineProperty(window, 'innerHeight', { writable: true, value: 100 });

    global.fetch = jest.fn().mockResolvedValue({
      blob: jest.fn().mockResolvedValue(new Blob(['dummy'])),
    });

    const oversizedWord = 'a'.repeat(27);
    extractTextFromFile.mockResolvedValue([{ text: oversizedWord }]);

    await createBricksFromResume(scene);

    const lastBrick = gameState.bricksGroup.items[0];
    expect(gameState.bricksGroup.items).toHaveLength(1);
    expect(lastBrick.getData('isLastInRow')).toBeFalsy();
  });
});
