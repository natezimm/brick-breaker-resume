import { GAME_CONSTANTS, COLORS, TEXTURE_KEYS } from './constants.js';
import { gameState } from './state.js';
import { settings } from './settings.js';

export function createLivesDisplay(scene) {
    if (gameState.livesBalls && gameState.livesBalls.length > 0) {
        gameState.livesBalls.forEach(ball => ball.destroy());
    }
    gameState.livesBalls = [];

    // Tighter spacing for small screens (covering mobile/tablets)
    const isSmall = window.innerWidth < 600;
    const spacing = isSmall ? 20 : 30;
    const startX = isSmall ? 15 : 30;

    for (let i = 0; i < gameState.lives; i++) {
        const lifeBall = scene.add.image(
            startX + i * spacing,
            window.innerHeight - 20,
            TEXTURE_KEYS.BALL
        ).setDisplaySize(GAME_CONSTANTS.BALL_SIZE, GAME_CONSTANTS.BALL_SIZE)
            .setOrigin(0.5, 0.5);
        gameState.livesBalls.push(lifeBall);
    }
}

export function createScoreText(scene) {
    if (gameState.scoreText) gameState.scoreText.destroy();

    const fontSize = window.innerWidth < 400 ? '16px' : '20px';
    const margin = window.innerWidth < 400 ? 10 : 20;

    gameState.scoreText = scene.add.text(
        window.innerWidth - margin,
        window.innerHeight - 20,
        `Score: ${gameState.score}`,
        { fontSize: fontSize, fill: COLORS.TEXT }
    ).setOrigin(1, 0.5);
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
                GAME_CONSTANTS.BALL_INITIAL_VELOCITY.x * settings.ballSpeed,
                GAME_CONSTANTS.BALL_INITIAL_VELOCITY.y * settings.ballSpeed
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
        pauseButton.innerHTML = paused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
    }

    if (!paused && gameState.wasInCountdown) {
        gameState.wasInCountdown = false;
        if (!gameState.countdownText || !gameState.countdownText.active) {
            createCountdownText(scene);
        }
        startCountdown(scene);
    }
}

export function setupUIButtons(game) {
    const pauseButton = document.getElementById('pauseButton');
    if (pauseButton) {
        pauseButton.addEventListener('click', () => {
            togglePause(game.scene.scenes[0]);
        });
    }

    const highScoreButton = document.getElementById('highScoreButton');
    const highScoreModal = document.getElementById('highScoreModal');
    const closeHighScoreButton = document.getElementById('closeHighScoreModal');
    const highScoreValue = document.getElementById('highScoreValue');

    if (highScoreButton && highScoreModal) {
        highScoreButton.addEventListener('click', () => {
            highScoreModal.classList.add('active');
            if (highScoreValue) {
                highScoreValue.textContent = gameState.highScore;
            }

            // Pause game if running
            const scene = game.scene.scenes[0];
            if (scene && !gameState.paused) {
                togglePause(scene);
            }
        });
    }

    if (closeHighScoreButton && highScoreModal) {
        closeHighScoreButton.addEventListener('click', () => {
            highScoreModal.classList.remove('active');
        });
    }

    if (highScoreModal) {
        highScoreModal.addEventListener('click', (e) => {
            if (e.target === highScoreModal) {
                highScoreModal.classList.remove('active');
            }
        });
    }
}

export function setupWindowResize(game) {
    window.addEventListener('resize', () => {
        const width = window.innerWidth;
        const height = window.innerHeight;

        game.scale.resize(width, height);

        const scene = game.scene.scenes[0];
        if (scene) {
            scene.physics.world.setBounds(0, 0, width, height);

            // Update Score Position & Style
            if (gameState.scoreText) {
                const margin = width < 400 ? 10 : 20;
                const fontSize = width < 400 ? '16px' : '20px';
                gameState.scoreText.setStyle({ fontSize: fontSize });
                gameState.scoreText.setPosition(width - margin, height - 20);
            }



            // Update Lives Position
            if (gameState.livesBalls) {
                const isSmall = width < 600;
                const spacing = isSmall ? 20 : 30;
                const startX = isSmall ? 15 : 30;
                gameState.livesBalls.forEach((ball, i) => {
                    ball.setPosition(startX + i * spacing, height - 20);
                });
            }

            // Update Countdown Position
            if (gameState.countdownText) {
                gameState.countdownText.setPosition(width / 2, height - 140);
            }

            // Update Paddle Y Position to stay at bottom
            if (gameState.paddle) {
                gameState.paddle.y = height - 55;
                // Keep paddle within bounds if screen shrank
                gameState.paddle.x = Phaser.Math.Clamp(
                    gameState.paddle.x,
                    gameState.paddle.width / 2,
                    width - gameState.paddle.width / 2
                );
            }
        }
    });
}
