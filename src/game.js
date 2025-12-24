import Phaser from 'phaser';
import { AUDIO_KEYS, TEXTURE_KEYS, COLORS, GAME_CONSTANTS } from './constants.js';
import { gameState } from './state.js';
import { createBricksFromResume, handleBrickCollision } from './bricks.js';
import {
    createLivesDisplay,
    createScoreText,
    startCountdown,
    createCountdownText,
    showGameOver,
    showWinMessage,
    togglePause
} from './ui.js';
import { applyThemeToScene, settings } from './settings.js';

// Track audio loading state
let audioLoaded = false;
let audioLoadPromise = null;

// Test helper to set audio loaded state (exported for testing)
export function _setAudioLoaded(loaded) {
    audioLoaded = loaded;
    if (!loaded) audioLoadPromise = null;
}

// Lazy-load audio on first user interaction to reduce initial main-thread work
function loadAudioLazy(scene) {
    if (audioLoaded || audioLoadPromise) return audioLoadPromise;

    audioLoadPromise = new Promise((resolve) => {
        scene.load.audio(AUDIO_KEYS.BALL_HIT, 'assets/sounds/ball-hit.wav');
        scene.load.audio(AUDIO_KEYS.BRICK_HIT, 'assets/sounds/brick-hit.wav');
        scene.load.audio(AUDIO_KEYS.LOSE_LIFE, 'assets/sounds/lose-life.wav');
        scene.load.audio(AUDIO_KEYS.WIN_GAME, 'assets/sounds/win-game.wav');
        scene.load.audio(AUDIO_KEYS.GAME_OVER, 'assets/sounds/game-over.wav');

        scene.load.once('complete', () => {
            audioLoaded = true;
            resolve();
        });
        scene.load.start();
    });

    return audioLoadPromise;
}

function playSound(scene, key) {
    if (settings.soundEnabled && scene.sound && audioLoaded) {
        scene.sound.play(key);
    }
}

// Preload is now minimal - audio loads lazily on first interaction
export function preload() {
    // Audio loading deferred to first user interaction
}

function createTextures(scene) {
    const pW = settings.paddleWidth;
    const pH = GAME_CONSTANTS.PADDLE_HEIGHT;

    const paddleCanvas = document.createElement('canvas');
    paddleCanvas.width = pW;
    paddleCanvas.height = pH;
    const paddleCtx = paddleCanvas.getContext('2d');

    const paddleColorHex = '#' + settings.paddleColor.toString(16).padStart(6, '0');

    // Base color
    paddleCtx.fillStyle = paddleColorHex;
    paddleCtx.fillRect(0, 0, pW, pH);

    // 3D effect: vertical gradient
    const paddleGrad = paddleCtx.createLinearGradient(0, 0, 0, pH);
    paddleGrad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    paddleGrad.addColorStop(0.2, 'rgba(255, 255, 255, 0.2)');
    paddleGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
    paddleGrad.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
    paddleCtx.fillStyle = paddleGrad;
    paddleCtx.fillRect(0, 0, pW, pH);

    // Slight border for definition
    paddleCtx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    paddleCtx.lineWidth = 1;
    paddleCtx.strokeRect(0, 0, pW, pH);

    scene.textures.addCanvas(TEXTURE_KEYS.PADDLE, paddleCanvas);

    const bSize = GAME_CONSTANTS.BALL_SIZE;
    const bRadius = GAME_CONSTANTS.BALL_RADIUS;

    const ballCanvas = document.createElement('canvas');
    ballCanvas.width = bSize;
    ballCanvas.height = bSize;
    const ballCtx = ballCanvas.getContext('2d');

    const ballColorHex = '#' + settings.ballColor.toString(16).padStart(6, '0');

    // Base color
    ballCtx.fillStyle = ballColorHex;
    ballCtx.beginPath();
    ballCtx.arc(bRadius, bRadius, bRadius, 0, Math.PI * 2);
    ballCtx.fill();

    // 3D effect: radial gradient highlight
    const ballGrad = ballCtx.createRadialGradient(
        bRadius - bRadius * 0.3, bRadius - bRadius * 0.3, 0,
        bRadius, bRadius, bRadius
    );
    ballGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    ballGrad.addColorStop(0.2, 'rgba(255, 255, 255, 0.3)');
    ballGrad.addColorStop(0.4, 'rgba(0, 0, 0, 0)');
    ballGrad.addColorStop(1, 'rgba(0, 0, 0, 0.3)'); // Shadow at edges

    ballCtx.fillStyle = ballGrad;
    ballCtx.beginPath();
    ballCtx.arc(bRadius, bRadius, bRadius, 0, Math.PI * 2);
    ballCtx.fill();

    scene.textures.addCanvas(TEXTURE_KEYS.BALL, ballCanvas);
}

function createPaddle(scene) {
    gameState.paddle = scene.physics.add.image(
        window.innerWidth / 2,
        window.innerHeight - 55,
        TEXTURE_KEYS.PADDLE
    )
        .setImmovable(true)
        .setCollideWorldBounds(true);
}

function createBall(scene) {
    gameState.ball = scene.physics.add.image(
        window.innerWidth / 2,
        window.innerHeight - 80,
        TEXTURE_KEYS.BALL
    )
        .setDisplaySize(GAME_CONSTANTS.BALL_SIZE, GAME_CONSTANTS.BALL_SIZE)
        .setVelocity(0, 0)
        .setBounce(1)
        .setCollideWorldBounds(true);

    gameState.ball.body.onWorldBounds = true;
    gameState.ball.body.setCollideWorldBounds(true, 1, 1, true);
}

function setupCollisions(scene) {
    scene.physics.add.collider(gameState.ball, gameState.paddle, () => {
        playSound(scene, AUDIO_KEYS.BALL_HIT);
    });

    scene.physics.add.collider(gameState.ball, gameState.bricksGroup, (ball, brick) => {
        playSound(scene, AUDIO_KEYS.BRICK_HIT);
        handleBrickCollision(scene, ball, brick);
    });

    scene.physics.world.on('worldbounds', (body, up, down) => {
        if (down && body.gameObject === gameState.ball) {
            playSound(scene, AUDIO_KEYS.LOSE_LIFE);
            loseLife(scene);
        }
    });
}

function setupControls(scene) {
    // Load audio lazily on first user interaction
    let audioTriggered = false;
    const triggerAudioLoad = () => {
        if (!audioTriggered) {
            audioTriggered = true;
            loadAudioLazy(scene);
        }
    };

    scene.input.on('pointermove', pointer => {
        triggerAudioLoad();
        if (!gameState.paused) {
            const paddleWidth = gameState.paddle.width;
            gameState.paddle.x = Phaser.Math.Clamp(
                pointer.x,
                paddleWidth / 2,
                window.innerWidth - paddleWidth / 2
            );
        }
    });

    scene.input.keyboard.on('keydown-P', () => {
        triggerAudioLoad();
        togglePause(scene);
    });
}

function loseLife(scene) {
    gameState.decrementLives();

    if (gameState.lives > 0) {
        gameState.ball.setPosition(window.innerWidth / 2, window.innerHeight - 80);
        gameState.ball.setVelocity(0, 0);

        setTimeout(() => {
            if (gameState.ball && gameState.lives > 0) {
                gameState.ball.setVelocity(
                    GAME_CONSTANTS.BALL_INITIAL_VELOCITY.x * settings.ballSpeed,
                    GAME_CONSTANTS.BALL_INITIAL_VELOCITY.y * settings.ballSpeed
                );
            }
        }, 1000);
    } else {
        showGameOver(scene);
        gameState.ball.destroy();
        playSound(scene, AUDIO_KEYS.GAME_OVER);
    }
}

export function create() {
    const scene = this;
    applyThemeToScene(scene);

    if (gameState.winText) {
        gameState.winText.destroy();
        gameState.winText = null;
    }

    gameState.score = GAME_CONSTANTS.INITIAL_SCORE;
    gameState.lives = GAME_CONSTANTS.INITIAL_LIVES;
    gameState.bricksCreated = false;
    gameState.bricksGroup = scene.physics.add.staticGroup();

    createTextures(scene);
    createPaddle(scene);
    createBall(scene);
    setupCollisions(scene);
    setupControls(scene);

    createLivesDisplay(scene);
    createScoreText(scene);

    (async () => {
        await createBricksFromResume(scene);
        createCountdownText(scene);
        startCountdown(scene);
    })();
}

export function update() {
    const scene = this;

    if (gameState.bricksCreated &&
        gameState.bricksGroup.countActive() === 0 &&
        gameState.lives > 0 &&
        !gameState.winText) {

        showWinMessage(scene);
        gameState.ball.setVelocity(0, 0);
        playSound(scene, AUDIO_KEYS.WIN_GAME);
        gameState.setPaused(true);
    }
}
