import { GAME_CONSTANTS, TEXTURE_KEYS } from '../src/constants.js';
import {
  createBallCanvas,
  createPaddleCanvas,
  refreshBallTexture,
  refreshPaddleTexture,
  registerGameTextures,
} from '../src/textures.js';
import { createMockScene, MockImage, MockPhysicsImage } from './mockScene.js';

describe('texture factory', () => {
  const settings = {
    ballColor: 0xff0000,
    paddleColor: 0x00ff00,
    paddleWidth: 140,
  };

  test('creates default paddle and ball canvases', () => {
    const paddleCanvas = createPaddleCanvas();
    const ballCanvas = createBallCanvas();

    expect(paddleCanvas.width).toBe(GAME_CONSTANTS.PADDLE_WIDTH);
    expect(paddleCanvas.height).toBe(GAME_CONSTANTS.PADDLE_HEIGHT);
    expect(ballCanvas.width).toBe(GAME_CONSTANTS.BALL_SIZE);
    expect(ballCanvas.height).toBe(GAME_CONSTANTS.BALL_SIZE);
  });

  test('registerGameTextures replaces existing Phaser textures', () => {
    const scene = createMockScene();
    scene.textures.exists = jest.fn(() => true);

    registerGameTextures(scene, settings);

    expect(scene.textures.remove).toHaveBeenCalledWith(TEXTURE_KEYS.PADDLE);
    expect(scene.textures.remove).toHaveBeenCalledWith(TEXTURE_KEYS.BALL);
    expect(scene.textures.addCanvas).toHaveBeenCalledTimes(2);
  });

  test('refreshBallTexture updates active ball and life icons', () => {
    const scene = createMockScene();
    const ball = new MockPhysicsImage(0, 0);
    const lifeBall = new MockImage(0, 0);
    const state = {
      ball,
      livesBalls: [lifeBall],
    };

    refreshBallTexture(scene, state, settings);

    expect(ball.texture).toBe(TEXTURE_KEYS.BALL);
    expect(ball.width).toBe(GAME_CONSTANTS.BALL_SIZE);
    expect(lifeBall.texture).toBe(TEXTURE_KEYS.BALL);
  });

  test('refreshPaddleTexture updates active paddle and body size', () => {
    const scene = createMockScene();
    const paddle = new MockPhysicsImage(10, 20);
    const state = { paddle };

    refreshPaddleTexture(scene, state, settings);

    expect(paddle.texture).toBe(TEXTURE_KEYS.PADDLE);
    expect(paddle.width).toBe(settings.paddleWidth);
    expect(paddle.height).toBe(GAME_CONSTANTS.PADDLE_HEIGHT);
    expect(paddle.body.setSize).toHaveBeenCalledWith(
      settings.paddleWidth,
      GAME_CONSTANTS.PADDLE_HEIGHT
    );
  });

  test('refresh helpers short-circuit without scene objects', () => {
    expect(() =>
      refreshBallTexture(null, { ball: new MockPhysicsImage(0, 0) }, settings)
    ).not.toThrow();
    expect(() =>
      refreshBallTexture(createMockScene(), { ball: null }, settings)
    ).not.toThrow();
    expect(() =>
      refreshPaddleTexture(
        null,
        { paddle: new MockPhysicsImage(0, 0) },
        settings
      )
    ).not.toThrow();
    expect(() =>
      refreshPaddleTexture(createMockScene(), { paddle: null }, settings)
    ).not.toThrow();
  });
});
