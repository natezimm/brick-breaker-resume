import { COLORS, GAME_CONSTANTS, TEXTURE_KEYS } from './constants.js';

function toCssHex(color) {
    return `#${color.toString(16).padStart(6, '0')}`;
}

export function createPaddleCanvas({
    width = GAME_CONSTANTS.PADDLE_WIDTH,
    height = GAME_CONSTANTS.PADDLE_HEIGHT,
    color = COLORS.PADDLE
} = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    context.fillStyle = toCssHex(color);

    context.beginPath();
    context.roundRect(0, 0, width, height, height / 2);
    context.fill();

    const gradient = context.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');

    context.fillStyle = gradient;
    context.beginPath();
    context.roundRect(0, 0, width, height, height / 2);
    context.fill();

    context.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(height / 2, height * 0.3);
    context.lineTo(width - height / 2, height * 0.3);
    context.stroke();

    return canvas;
}

export function createBallCanvas({
    size = GAME_CONSTANTS.BALL_SIZE,
    radius = GAME_CONSTANTS.BALL_RADIUS,
    color = COLORS.BALL
} = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext('2d');
    context.fillStyle = toCssHex(color);
    context.beginPath();
    context.arc(radius, radius, radius, 0, Math.PI * 2);
    context.fill();

    const highlightGradient = context.createRadialGradient(
        radius - radius * 0.3,
        radius - radius * 0.3,
        2,
        radius - radius * 0.3,
        radius - radius * 0.3,
        radius
    );
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    context.fillStyle = highlightGradient;
    context.beginPath();
    context.arc(radius, radius, radius, 0, Math.PI * 2);
    context.fill();

    const shadowGradient = context.createLinearGradient(0, 0, size, size);
    shadowGradient.addColorStop(0.7, 'rgba(0, 0, 0, 0)');
    shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');

    context.fillStyle = shadowGradient;
    context.beginPath();
    context.arc(radius, radius, radius, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = 'rgba(255, 255, 255, 0.8)';
    context.beginPath();
    context.arc(radius - 3, radius - 3, 1.5, 0, Math.PI * 2);
    context.fill();

    return canvas;
}

function replaceTexture(scene, textureKey, canvas) {
    if (scene.textures.exists(textureKey)) {
        scene.textures.remove(textureKey);
    }

    scene.textures.addCanvas(textureKey, canvas);
}

export function registerGameTextures(scene, settings) {
    replaceTexture(
        scene,
        TEXTURE_KEYS.PADDLE,
        createPaddleCanvas({
            width: settings.paddleWidth,
            height: GAME_CONSTANTS.PADDLE_HEIGHT,
            color: settings.paddleColor
        })
    );

    replaceTexture(
        scene,
        TEXTURE_KEYS.BALL,
        createBallCanvas({
            size: GAME_CONSTANTS.BALL_SIZE,
            radius: GAME_CONSTANTS.BALL_RADIUS,
            color: settings.ballColor
        })
    );
}

export function refreshBallTexture(scene, state, settings) {
    if (!scene || !state?.ball) return;

    replaceTexture(
        scene,
        TEXTURE_KEYS.BALL,
        createBallCanvas({
            size: GAME_CONSTANTS.BALL_SIZE,
            radius: GAME_CONSTANTS.BALL_RADIUS,
            color: settings.ballColor
        })
    );

    state.ball.setTexture(TEXTURE_KEYS.BALL);
    state.ball.setDisplaySize(
        GAME_CONSTANTS.BALL_SIZE,
        GAME_CONSTANTS.BALL_SIZE
    );

    state.livesBalls?.forEach((ball) => {
        ball.setTexture(TEXTURE_KEYS.BALL);
        ball.setDisplaySize(GAME_CONSTANTS.BALL_SIZE, GAME_CONSTANTS.BALL_SIZE);
    });
}

export function refreshPaddleTexture(scene, state, settings) {
    if (!scene || !state?.paddle) return;

    replaceTexture(
        scene,
        TEXTURE_KEYS.PADDLE,
        createPaddleCanvas({
            width: settings.paddleWidth,
            height: GAME_CONSTANTS.PADDLE_HEIGHT,
            color: settings.paddleColor
        })
    );

    const { x, y } = state.paddle;
    state.paddle.setTexture(TEXTURE_KEYS.PADDLE);
    state.paddle.setDisplaySize(
        settings.paddleWidth,
        GAME_CONSTANTS.PADDLE_HEIGHT
    );
    state.paddle.setPosition(x, y);
    state.paddle.body.setSize(
        settings.paddleWidth,
        GAME_CONSTANTS.PADDLE_HEIGHT
    );
}
