import { gameState } from './state.js';

const THEME_STORAGE_KEY = 'brickBreakerTheme';
const THEMES = Object.freeze({
    LIGHT: 'light',
    DARK: 'dark',
});
const DEFAULT_THEME = THEMES.LIGHT;

function updateDocumentTheme(theme) {
    if (typeof document === 'undefined' || !document.documentElement) {
        return;
    }

    document.documentElement.dataset.theme = theme;
}

if (typeof document !== 'undefined') {
    updateDocumentTheme(DEFAULT_THEME);
}

export const settings = {
    soundEnabled: true,
    ballColor: 0xA9A9A9,
    paddleColor: 0xA9A9A9,
    paddleWidth: 100,
    ballSpeed: 1.0,
    theme: DEFAULT_THEME,
};

function sanitizeTheme(theme) {
    if (theme === THEMES.DARK) {
        return THEMES.DARK;
    }
    if (theme === THEMES.LIGHT) {
        return THEMES.LIGHT;
    }
    return DEFAULT_THEME;
}

function readStoredTheme() {
    try {
        return sanitizeTheme(localStorage.getItem(THEME_STORAGE_KEY));
    } catch {
        return DEFAULT_THEME;
    }
}

function writeStoredTheme(theme) {
    try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
        // Ignore storage failures (private mode, blocked storage, etc).
    }
}

export function getThemeColors(theme = settings.theme) {
    const normalizedTheme = sanitizeTheme(theme);
    return normalizedTheme === THEMES.DARK
        ? {
            theme: THEMES.DARK,
            background: '#111111',
            hudText: '#ffffff',
            hudTextMuted: '#a9a9a9',
        }
        : {
            theme: THEMES.LIGHT,
            background: '#ffffff',
            hudText: '#000000',
            hudTextMuted: '#4b5563',
        };
}

function setTextFill(text, fill) {
    if (!text) return;
    if (typeof text.setStyle === 'function') {
        text.setStyle({ fill });
        return;
    }
    if (typeof text.setColor === 'function') {
        text.setColor(fill);
        return;
    }
    if (text.style) {
        text.style.fill = fill;
    }
}

export function applyThemeToScene(scene, theme = settings.theme) {
    if (!scene) return;
    const colors = getThemeColors(theme);

    const camera = scene.cameras?.main;
    if (camera && typeof camera.setBackgroundColor === 'function') {
        camera.setBackgroundColor(colors.background);
    }

    setTextFill(gameState.scoreText, colors.hudText);
    setTextFill(gameState.countdownText, colors.hudTextMuted);
    setTextFill(gameState.winText, colors.hudTextMuted);
}

export function initializeTheme() {
    const storedTheme = readStoredTheme();
    settings.theme = storedTheme;

    updateDocumentTheme(storedTheme);

    return storedTheme;
}

export function applyTheme(theme, game) {
    const normalizedTheme = sanitizeTheme(theme);
    settings.theme = normalizedTheme;

    updateDocumentTheme(normalizedTheme);

    writeStoredTheme(normalizedTheme);

    const scene = game?.scene?.scenes?.[0];
    applyThemeToScene(scene, normalizedTheme);
}

export function setupSettings(game) {
    const modal = document.getElementById('settingsModal');
    const settingsButton = document.getElementById('settingsButton');
    const closeButton = document.getElementById('closeModal');
    const soundToggle = document.getElementById('soundToggle');
    const themeToggle = document.getElementById('themeToggle');
    const ballColorPicker = document.getElementById('ballColorPicker');
    const paddleColorPicker = document.getElementById('paddleColorPicker');
    const paddleWidthSlider = document.getElementById('paddleWidthSlider');
    const paddleWidthValue = document.getElementById('paddleWidthValue');
    const ballSpeedSlider = document.getElementById('ballSpeedSlider');
    const ballSpeedValue = document.getElementById('ballSpeedValue');
    const pauseButton = document.getElementById('pauseButton');

    if (themeToggle) {
        themeToggle.checked = settings.theme === THEMES.DARK;
        themeToggle.addEventListener('change', (e) => {
            applyTheme(e.target.checked ? THEMES.DARK : THEMES.LIGHT, game);
        });
    }

    settingsButton.addEventListener('click', () => {
        modal.classList.add('active');

        const scene = game.scene.scenes[0];

        if (scene && scene.physics) {
            if (gameState.countdownInterval) {
                clearInterval(gameState.countdownInterval);
                gameState.countdownInterval = null;
                gameState.wasInCountdown = true;
            }

            gameState.setPaused(true);
            scene.physics.world.isPaused = true;

            if (pauseButton) {
                pauseButton.innerHTML = '<i class="fas fa-play"></i>';
                pauseButton.setAttribute('aria-label', 'Resume game');
                pauseButton.title = 'Resume';
            }
        } else {
            console.error('Scene or physics not available');
        }
    });

    const closeModal = () => {
        modal.classList.remove('active');
    };

    closeButton.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    soundToggle.addEventListener('change', (e) => {
        settings.soundEnabled = e.target.checked;
        const scene = game.scene.scenes[0];
        if (scene && scene.sound) {
            scene.sound.mute = !settings.soundEnabled;
        }
    });

    ballColorPicker.addEventListener('input', (e) => {
        const color = e.target.value;
        settings.ballColor = parseInt(color.replace('#', '0x'));
        updateBallTexture(game.scene.scenes[0]);
    });

    paddleColorPicker.addEventListener('input', (e) => {
        const color = e.target.value;
        settings.paddleColor = parseInt(color.replace('#', '0x'));
        updatePaddleTexture(game.scene.scenes[0]);
    });

    paddleWidthSlider.addEventListener('input', (e) => {
        const newWidth = parseInt(e.target.value);
        settings.paddleWidth = newWidth;
        paddleWidthValue.textContent = newWidth;
        updatePaddleTexture(game.scene.scenes[0]);
    });

    ballSpeedSlider.addEventListener('input', (e) => {
        const newSpeed = parseFloat(e.target.value);
        settings.ballSpeed = newSpeed;
        ballSpeedValue.textContent = newSpeed.toFixed(1);
        updateBallSpeed(game.scene.scenes[0]);
    });

    const screenWidth = window.innerWidth;
    const maxPaddleWidth = Math.floor(screenWidth / 3);
    paddleWidthSlider.max = maxPaddleWidth;
}

function updateBallTexture(scene) {
    if (!scene || !gameState.ball) return;

    const bSize = 20;
    const bRadius = 10;

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

    if (scene.textures.exists('ballTexture')) {
        scene.textures.remove('ballTexture');
    }
    scene.textures.addCanvas('ballTexture', ballCanvas);

    gameState.ball.setTexture('ballTexture');
    gameState.ball.setDisplaySize(bSize, bSize);

    if (gameState.livesBalls) {
        gameState.livesBalls.forEach(ball => {
            ball.setTexture('ballTexture');
            ball.setDisplaySize(bSize, bSize);
        });
    }
}

function updatePaddleTexture(scene) {
    if (!scene || !gameState.paddle) return;

    const pW = settings.paddleWidth;
    const pH = 20;

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

    if (scene.textures.exists('paddleTexture')) {
        scene.textures.remove('paddleTexture');
    }
    scene.textures.addCanvas('paddleTexture', paddleCanvas);

    const currentX = gameState.paddle.x;
    const currentY = gameState.paddle.y;
    gameState.paddle.setTexture('paddleTexture');
    gameState.paddle.setDisplaySize(pW, pH);
    gameState.paddle.setPosition(currentX, currentY);
    gameState.paddle.body.setSize(pW, pH);
}

function updateBallSpeed(scene) {
    if (!scene || !gameState.ball || !gameState.ball.body) return;

    // Only update speed if the ball is currently moving
    const currentVelocity = gameState.ball.body.velocity;
    if (currentVelocity.x !== 0 || currentVelocity.y !== 0) {
        // Get the current direction (normalized)
        const speed = Math.sqrt(currentVelocity.x * currentVelocity.x + currentVelocity.y * currentVelocity.y);
        const dirX = currentVelocity.x / speed;
        const dirY = currentVelocity.y / speed;

        // Apply new speed with the same direction
        const baseSpeed = 200; // Base speed from GAME_CONSTANTS.BALL_INITIAL_VELOCITY
        const newSpeed = baseSpeed * settings.ballSpeed;
        gameState.ball.setVelocity(dirX * newSpeed, dirY * newSpeed);
    }
}

export {
    updateBallTexture,
    updatePaddleTexture,
    updateBallSpeed,
};
