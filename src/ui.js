import { GAME_CONSTANTS, TEXTURE_KEYS } from './constants.js';
import { gameState } from './state.js';
import { settings } from './settings.js';

export function createLivesDisplay(scene) {
    if (gameState.livesBalls && gameState.livesBalls.length > 0) {
        gameState.livesBalls.forEach(ball => ball.destroy());
    }
    gameState.livesBalls = [];

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

    const margin = window.innerWidth < 400 ? 10 : 20;
    const prefix = window.innerWidth >= 405 ? 'SCORE: ' : '';

    gameState.scoreText = scene.add.text(
        window.innerWidth - margin,
        window.innerHeight - 20,
        `${prefix}${gameState.score}`,
        {
            fontSize: '24px',
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fill: '#FFD700',
            stroke: '#000000',
            strokeThickness: 4,
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#000',
                blur: 2,
                stroke: true,
                fill: true
            }
        }
    ).setOrigin(1, 0.5);
}


export function hideGameMessage() {
    const overlay = document.getElementById('gameMessageOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.textContent = '';
    }
}

export function startCountdown(_scene) {
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
            overlay.textContent = '';

            const messageDiv = document.createElement('div');
            messageDiv.className = 'game-message gm-countdown';
            messageDiv.textContent = Number.isInteger(value) && value > 0 && value <= 9 ? value : '';
            overlay.appendChild(messageDiv);
        }
}

export function createCountdownText(_scene) {
    updateCountdownDisplay(gameState.currentCountdown);
}

export function showGameOver(_scene) {
    const overlay = document.getElementById('gameMessageOverlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        overlay.textContent = '';

        const messageDiv = document.createElement('div');
        messageDiv.className = 'game-message gm-gameover';

        const gameOverText = document.createElement('div');
        gameOverText.textContent = 'GAME OVER';

        const subText = document.createElement('div');
        subText.className = 'sub-text';
        subText.textContent = 'Refresh to Try Again';

        messageDiv.appendChild(gameOverText);
        messageDiv.appendChild(subText);
        overlay.appendChild(messageDiv);
    }
}

export function showWinMessage(_scene) {
    gameState.gameEnded = true;
    const overlay = document.getElementById('gameMessageOverlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        overlay.textContent = '';

        const container = document.createElement('div');
        container.className = 'gm-win-container';

        const victoryText = document.createElement('div');
        victoryText.className = 'game-message gm-win';
        victoryText.textContent = 'VICTORY!';

        const subText = document.createElement('div');
        subText.className = 'game-message gm-win-sub';
        subText.textContent = 'ALL BRICKS DESTROYED';

        container.appendChild(victoryText);
        container.appendChild(subText);
        overlay.appendChild(container);

        const colors = ['#ff0055', '#00ddff', '#00ffaa', '#ff9900', '#ffd300', '#ff00cc'];

        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.classList.add('confetti-piece');
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.animation = `fall ${Math.random() * 3 + 2}s linear infinite`;
            confetti.style.animationDelay = Math.random() * 5 + 's';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

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
        pauseButton.textContent = '';
        const icon = document.createElement('i');
        icon.className = paused ? 'fas fa-play' : 'fas fa-pause';
        icon.setAttribute('aria-hidden', 'true');
        pauseButton.appendChild(icon);

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

            if (gameState.scoreText) {
                const margin = width < 400 ? 10 : 20;
                const prefix = width >= 405 ? 'SCORE: ' : '';
                gameState.scoreText.setText(`${prefix}${gameState.score}`);
                gameState.scoreText.setPosition(width - margin, height - 20);
            }



            if (gameState.livesBalls) {
                const isSmall = width < 600;
                const spacing = isSmall ? 20 : 30;
                const startX = isSmall ? 15 : 30;
                gameState.livesBalls.forEach((ball, i) => {
                    ball.setPosition(startX + i * spacing, height - 20);
                });
            }

            if (gameState.paddle) {
                gameState.paddle.y = height - 55;
                
                gameState.paddle.x = Math.max(
                    gameState.paddle.width / 2,
                    Math.min(gameState.paddle.x, width - gameState.paddle.width / 2)
                );
            }
        }
    });
}
