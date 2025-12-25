import { GAME_CONSTANTS, COLORS, TEXTURE_KEYS } from './constants.js';
import { gameState } from './state.js';
import { settings, getThemeColors } from './settings.js';

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

    const themeColors = getThemeColors();
    const fontSize = window.innerWidth < 400 ? '16px' : '20px';
    const margin = window.innerWidth < 400 ? 10 : 20;

    gameState.scoreText = scene.add.text(
        window.innerWidth - margin,
        window.innerHeight - 20,
        gameState.score,
        { fontSize: fontSize, fill: themeColors.hudText }
    ).setOrigin(1, 0.5);
}


export function hideGameMessage() {
    const overlay = document.getElementById('gameMessageOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.innerHTML = '';
    }
}

export function startCountdown(scene) {
    let countdown = gameState.currentCountdown;

    gameState.countdownInterval = setInterval(() => {
        countdown--;
        gameState.currentCountdown = countdown;

        if (countdown > 0) {
            updateCountdownDisplay(countdown);
        } else {
            hideGameMessage();
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

function updateCountdownDisplay(value) {
    const overlay = document.getElementById('gameMessageOverlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        overlay.innerHTML = `<div class="game-message gm-countdown">${value}</div>`;
    }
}

export function createCountdownText(scene) {
    updateCountdownDisplay(gameState.currentCountdown);
}

export function showGameOver(scene) {
    const overlay = document.getElementById('gameMessageOverlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        overlay.innerHTML = `
            <div class="game-message gm-gameover">
                <div>GAME OVER</div>
                <div class="sub-text">Refresh to Try Again</div>
            </div>`;
    }
}

export function showWinMessage(scene) {
    gameState.gameEnded = true;
    const overlay = document.getElementById('gameMessageOverlay');
    if (overlay) {
        overlay.classList.remove('hidden');

        // Structure for the message
        overlay.innerHTML = `
            <div class="gm-win-container">
                <div class="game-message gm-win">VICTORY!</div>
                <div class="game-message gm-win-sub">ALL BRICKS DESTROYED</div>
            </div>
        `;

        // Generate visual confetti
        const colors = ['#ff0055', '#00ddff', '#00ffaa', '#ff9900', '#ffd300', '#ff00cc'];

        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.classList.add('confetti-piece');
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.animation = `fall ${Math.random() * 3 + 2}s linear infinite`;
            confetti.style.animationDelay = Math.random() * 5 + 's';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

            // Random size/shape variations
            const size = Math.random() * 10 + 5;
            confetti.style.width = size + 'px';
            confetti.style.height = size + 'px';
            if (Math.random() > 0.5) confetti.style.borderRadius = '50%';

            overlay.appendChild(confetti);
        }
    }
}

export function togglePause(scene) {
    const paused = gameState.togglePause();
    scene.physics.world.isPaused = paused;

    const pauseButton = document.getElementById('pauseButton');
    if (pauseButton) {
        pauseButton.innerHTML = paused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
        pauseButton.setAttribute('aria-label', paused ? 'Resume game' : 'Pause game');
        pauseButton.title = paused ? 'Resume' : 'Pause';
    }

    if (!paused && gameState.wasInCountdown) {
        gameState.wasInCountdown = false;
        createCountdownText(scene);
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

// Update to remove Phaser dependency
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

            // Update Paddle Y Position to stay at bottom
            if (gameState.paddle) {
                gameState.paddle.y = height - 55;
                // Keep paddle within bounds if screen shrank
                gameState.paddle.x = Math.max(
                    gameState.paddle.width / 2,
                    Math.min(gameState.paddle.x, width - gameState.paddle.width / 2)
                );
            }
        }
    });
}
