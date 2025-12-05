import { GAME_CONSTANTS, COLORS, TEXTURE_KEYS } from './constants.js';
import { gameState } from './state.js';

export function createLivesDisplay(scene) {
    gameState.livesBalls = [];
    for (let i = 0; i < gameState.lives; i++) {
        const lifeBall = scene.add.image(
            20 + i * 30,
            window.innerHeight - 20,
            TEXTURE_KEYS.BALL
        ).setDisplaySize(GAME_CONSTANTS.BALL_SIZE, GAME_CONSTANTS.BALL_SIZE);
        gameState.livesBalls.push(lifeBall);
    }
}

export function createScoreText(scene) {
    gameState.scoreText = scene.add.text(
        window.innerWidth - 150,
        window.innerHeight - 30,
        `Score: ${gameState.score}`,
        { fontSize: '20px', fill: COLORS.TEXT }
    );
}

export function startCountdown(scene) {
    let countdown = gameState.currentCountdown;

    gameState.countdownInterval = setInterval(() => {
        countdown--;
        gameState.currentCountdown = countdown;

        if (countdown > 0) {
            gameState.countdownText.setText(countdown.toString());
        } else {
            gameState.countdownText.destroy();
            gameState.ball.setVelocity(
                GAME_CONSTANTS.BALL_INITIAL_VELOCITY.x,
                GAME_CONSTANTS.BALL_INITIAL_VELOCITY.y
            );
            gameState.setPaused(false);
            clearInterval(gameState.countdownInterval);
            gameState.countdownInterval = null;
            gameState.currentCountdown = GAME_CONSTANTS.COUNTDOWN_START;
        }
    }, GAME_CONSTANTS.COUNTDOWN_INTERVAL);
}

export function createCountdownText(scene) {
    gameState.countdownText = scene.add.text(
        window.innerWidth / 2,
        window.innerHeight - 140,
        gameState.currentCountdown.toString(),
        { fontSize: '64px', fill: COLORS.TEXT_LIGHT }
    ).setOrigin(0.5);
}

export function showGameOver(scene) {
    scene.add.text(
        window.innerWidth / 2,
        window.innerHeight - 100,
        'Game Over',
        { fontSize: '64px', fill: COLORS.GAME_OVER }
    ).setOrigin(0.5).setDepth(2);
}

export function showWinMessage(scene) {
    gameState.winText = scene.add.text(
        window.innerWidth / 2,
        window.innerHeight / 2,
        'YOU BROKE IT! YOU WIN!',
        { fontSize: '64px', fill: COLORS.TEXT_LIGHT }
    ).setOrigin(0.5).setDepth(2);
}

export function togglePause(scene) {
    const paused = gameState.togglePause();
    scene.physics.world.isPaused = paused;

    const pauseButton = document.getElementById('pauseButton');
    if (pauseButton) {
        pauseButton.textContent = paused ? 'Play' : 'Pause';
    }

    if (!paused && gameState.wasInCountdown) {
        gameState.wasInCountdown = false;
        if (!gameState.countdownText || !gameState.countdownText.active) {
            createCountdownText(scene);
        }
        startCountdown(scene);
    }
}

export function setupPauseButton(game) {
    const pauseButton = document.getElementById('pauseButton');
    if (pauseButton) {
        pauseButton.addEventListener('click', () => {
            togglePause(game.scene.scenes[0]);
        });
    }
}

export function setupWindowResize(game) {
    window.addEventListener('resize', () => {
        game.scale.resize(window.innerWidth, window.innerHeight);
    });
}
