import { getGameState } from './state.js';
import { refreshBallTexture, refreshPaddleTexture } from './textures.js';

const THEME_STORAGE_KEY = 'brickBreakerTheme';
const THEMES = Object.freeze({
    LIGHT: 'light',
    DARK: 'dark'
});
const DEFAULT_THEME = THEMES.LIGHT;

/**
 * @typedef {Object} GameSettings
 * @property {boolean} soundEnabled
 * @property {number} ballColor
 * @property {number} paddleColor
 * @property {number} paddleWidth
 * @property {number} ballSpeed
 * @property {'light' | 'dark'} theme
 */

function updateDocumentTheme(theme) {
    if (typeof document === 'undefined' || !document.documentElement) {
        return;
    }

    document.documentElement.dataset.theme = theme;
}

if (typeof document !== 'undefined') {
    updateDocumentTheme(DEFAULT_THEME);
}

/** @type {GameSettings} */
export const settings = {
    soundEnabled: true,
    ballColor: 0xa9a9a9,
    paddleColor: 0xa9a9a9,
    paddleWidth: 100,
    ballSpeed: 1.0,
    theme: DEFAULT_THEME
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
        // Ignore storage failures so private browsing or quota errors do not break play.
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
              scoreText: '#FFD700'
          }
        : {
              theme: THEMES.LIGHT,
              background: '#ffffff',
              hudText: '#000000',
              hudTextMuted: '#4b5563',
              scoreText: '#FFD700'
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

export function applyThemeToScene(
    scene,
    theme = settings.theme,
    state = getGameState(scene)
) {
    if (!scene) return;
    const colors = getThemeColors(theme);

    const camera = scene.cameras?.main;
    if (camera && typeof camera.setBackgroundColor === 'function') {
        camera.setBackgroundColor(colors.background);
    }

    setTextFill(state.scoreText, colors.scoreText);
    setTextFill(state.countdownText, colors.hudTextMuted);
    setTextFill(state.winText, colors.hudTextMuted);
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
    applyThemeToScene(scene, normalizedTheme, getGameState(scene));
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
    const getScene = () => game.scene.scenes[0];

    if (themeToggle) {
        themeToggle.checked = settings.theme === THEMES.DARK;
        themeToggle.addEventListener('change', (e) => {
            applyTheme(e.target.checked ? THEMES.DARK : THEMES.LIGHT, game);
        });
    }

    settingsButton.addEventListener('click', () => {
        modal.classList.add('active');

        const scene = getScene();
        const state = getGameState(scene);

        if (scene && scene.physics) {
            if (state.countdownInterval) {
                clearInterval(state.countdownInterval);
                state.countdownInterval = null;
                state.wasInCountdown = true;

                // Hide the countdown overlay when opening settings
                const overlay = document.getElementById('gameMessageOverlay');
                if (overlay) {
                    overlay.classList.add('hidden');
                    overlay.textContent = '';
                }
            }

            state.setPaused(true);
            scene.physics.world.isPaused = true;

            if (pauseButton) {
                pauseButton.textContent = '';
                const icon = document.createElement('i');
                icon.className = 'fas fa-play';
                icon.setAttribute('aria-hidden', 'true');
                pauseButton.appendChild(icon);

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
        const scene = getScene();
        if (scene && scene.sound) {
            scene.sound.mute = !settings.soundEnabled;
        }
    });

    function isValidHexColor(color) {
        return /^#[0-9A-Fa-f]{6}$/.test(color);
    }

    ballColorPicker.addEventListener('input', (e) => {
        const color = e.target.value;
        if (!isValidHexColor(color)) {
            return;
        }
        settings.ballColor = parseInt(color.replace('#', '0x'));
        updateBallTexture(getScene());
    });

    paddleColorPicker.addEventListener('input', (e) => {
        const color = e.target.value;
        if (!isValidHexColor(color)) {
            return;
        }
        settings.paddleColor = parseInt(color.replace('#', '0x'));
        updatePaddleTexture(getScene());
    });

    paddleWidthSlider.addEventListener('input', (e) => {
        const newWidth = parseInt(e.target.value, 10);
        const minWidth = parseInt(paddleWidthSlider.min, 10) || 20;
        const maxWidth = parseInt(paddleWidthSlider.max, 10) || 200;
        if (
            Number.isNaN(newWidth) ||
            newWidth < minWidth ||
            newWidth > maxWidth
        ) {
            return;
        }
        settings.paddleWidth = newWidth;
        paddleWidthValue.textContent = newWidth;
        updatePaddleTexture(getScene());
    });

    ballSpeedSlider.addEventListener('input', (e) => {
        const newSpeed = parseFloat(e.target.value);
        const minSpeed = parseFloat(ballSpeedSlider.min) || 0.5;
        const maxSpeed = parseFloat(ballSpeedSlider.max) || 2.0;
        if (
            Number.isNaN(newSpeed) ||
            newSpeed < minSpeed ||
            newSpeed > maxSpeed
        ) {
            return;
        }
        settings.ballSpeed = newSpeed;
        ballSpeedValue.textContent = newSpeed.toFixed(1);
        updateBallSpeed(getScene());
    });

    paddleWidthSlider.max = Math.floor(window.innerWidth / 3);
}

function updateBallTexture(scene, state = getGameState(scene)) {
    refreshBallTexture(scene, state, settings);
}

function updatePaddleTexture(scene, state = getGameState(scene)) {
    refreshPaddleTexture(scene, state, settings);
}

function updateBallSpeed(scene, state = getGameState(scene)) {
    if (!scene || !state.ball || !state.ball.body) return;

    const currentVelocity = state.ball.body.velocity;
    if (currentVelocity.x !== 0 || currentVelocity.y !== 0) {
        const speed = Math.sqrt(
            currentVelocity.x * currentVelocity.x +
                currentVelocity.y * currentVelocity.y
        );
        const dirX = currentVelocity.x / speed;
        const dirY = currentVelocity.y / speed;

        const baseSpeed = 200;
        const newSpeed = baseSpeed * settings.ballSpeed;
        state.ball.setVelocity(dirX * newSpeed, dirY * newSpeed);
    }
}

export { updateBallTexture, updatePaddleTexture, updateBallSpeed };
