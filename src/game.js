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

export function preload() {
    this.load.audio(AUDIO_KEYS.BALL_HIT, 'assets/sounds/ball-hit.wav');
    this.load.audio(AUDIO_KEYS.BRICK_HIT, 'assets/sounds/brick-hit.wav');
    this.load.audio(AUDIO_KEYS.LOSE_LIFE, 'assets/sounds/lose-life.wav');
    this.load.audio(AUDIO_KEYS.WIN_GAME, 'assets/sounds/win-game.wav');
    this.load.audio(AUDIO_KEYS.GAME_OVER, 'assets/sounds/game-over.wav');
}

function createTextures(scene) {
    const paddleGraphics = scene.add.graphics({ fillStyle: { color: COLORS.PADDLE } });
    paddleGraphics.fillRect(0, 0, GAME_CONSTANTS.PADDLE_WIDTH, GAME_CONSTANTS.PADDLE_HEIGHT);
    paddleGraphics.generateTexture(TEXTURE_KEYS.PADDLE, GAME_CONSTANTS.PADDLE_WIDTH, GAME_CONSTANTS.PADDLE_HEIGHT);
    paddleGraphics.destroy();
    const ballGraphics = scene.add.graphics({ fillStyle: { color: COLORS.BALL } });
    ballGraphics.fillCircle(GAME_CONSTANTS.BALL_RADIUS, GAME_CONSTANTS.BALL_RADIUS, GAME_CONSTANTS.BALL_RADIUS);
    ballGraphics.generateTexture(TEXTURE_KEYS.BALL, GAME_CONSTANTS.BALL_SIZE, GAME_CONSTANTS.BALL_SIZE);
    ballGraphics.destroy();
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
        window.innerHeight - 75,
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
        scene.sound.play(AUDIO_KEYS.BALL_HIT);
    });

    scene.physics.add.collider(gameState.ball, gameState.bricksGroup, (ball, brick) => {
        scene.sound.play(AUDIO_KEYS.BRICK_HIT);
        handleBrickCollision(scene, ball, brick);
    });

    scene.physics.world.on('worldbounds', (body, up, down) => {
        if (down && body.gameObject === gameState.ball) {
            scene.sound.play(AUDIO_KEYS.LOSE_LIFE);
            loseLife(scene);
        }
    });
}

function setupControls(scene) {
    scene.input.on('pointermove', pointer => {
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
        togglePause(scene);
    });
}

function loseLife(scene) {
    gameState.decrementLives();

    if (gameState.lives > 0) {
        gameState.ball.setPosition(window.innerWidth / 2, window.innerHeight - 75);
        gameState.ball.setVelocity(0, 0);
        gameState.setPaused(true);
        startCountdown(scene);
    } else {
        showGameOver(scene);
        gameState.ball.destroy();
        scene.sound.play(AUDIO_KEYS.GAME_OVER);
    }
}

export function create() {
    const scene = this;

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
        scene.sound.play(AUDIO_KEYS.WIN_GAME);
        gameState.setPaused(true);
    }
}
