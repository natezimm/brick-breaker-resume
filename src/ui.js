import { GAME_CONSTANTS, TEXTURE_KEYS } from './constants.js';
import { getGameState } from './state.js';
import { settings } from './settings.js';

const HUD_FONT_FAMILY =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

function formatScoreLabel(score, width = window.innerWidth) {
  return width >= 405 ? `SCORE ${score}` : `${score}`;
}

function getScoreTextStyle(width = window.innerWidth) {
  const isSmall = width < 405;

  return {
    fontSize: isSmall ? '20px' : '22px',
    fontFamily: HUD_FONT_FAMILY,
    fontStyle: 'bold',
    fill: '#FFD700',
    stroke: '#111827',
    strokeThickness: isSmall ? 3 : 4,
    padding: { left: 4, right: 4, top: 2, bottom: 2 },
    shadow: {
      offsetX: 0,
      offsetY: 2,
      color: 'rgba(0, 0, 0, 0.45)',
      blur: 5,
      stroke: true,
      fill: true,
    },
  };
}

function getScorePosition(
  width = window.innerWidth,
  height = window.innerHeight
) {
  const margin = width < 400 ? 20 : 30;
  return {
    x: width - margin,
    y: height - 20,
  };
}

function getScorePlateBounds(scoreText) {
  const width =
    scoreText?.width ?? scoreText?.displayWidth ?? scoreText?.text?.length * 13;
  const height = scoreText?.height ?? scoreText?.displayHeight ?? 29;
  const x = (scoreText?.x ?? 0) - width - 9;
  const y = (scoreText?.y ?? 0) - height / 2 - 5;

  return {
    x,
    y,
    width: width + 18,
    height: height + 10,
  };
}

function getScorePlateStyle() {
  return settings.theme === 'dark'
    ? {
        fill: 0x030712,
        fillAlpha: 0.82,
        borderAlpha: 0.34,
        glowAlpha: 0.1,
      }
    : {
        fill: 0x111827,
        fillAlpha: 0.74,
        borderAlpha: 0.15,
        glowAlpha: 0,
      };
}

function redrawScorePlate(state) {
  const scorePanel = state.scorePanel;
  const scoreText = state.scoreText;
  if (!scorePanel || !scoreText) return;

  const bounds = getScorePlateBounds(scoreText);
  const style = getScorePlateStyle();
  if (typeof scorePanel.clear === 'function') {
    scorePanel.clear();
  }
  if (
    style.glowAlpha > 0 &&
    typeof scorePanel.lineStyle === 'function' &&
    typeof scorePanel.strokeRoundedRect === 'function'
  ) {
    scorePanel.lineStyle(3, 0xffffff, style.glowAlpha);
    scorePanel.strokeRoundedRect(
      bounds.x - 1,
      bounds.y - 1,
      bounds.width + 2,
      bounds.height + 2,
      8
    );
  }
  if (typeof scorePanel.fillStyle === 'function') {
    scorePanel.fillStyle(style.fill, style.fillAlpha);
  }
  if (typeof scorePanel.fillRoundedRect === 'function') {
    scorePanel.fillRoundedRect(
      bounds.x,
      bounds.y,
      bounds.width,
      bounds.height,
      7
    );
  }
  if (typeof scorePanel.lineStyle === 'function') {
    scorePanel.lineStyle(1, 0xffffff, style.borderAlpha);
  }
  if (typeof scorePanel.strokeRoundedRect === 'function') {
    scorePanel.strokeRoundedRect(
      bounds.x,
      bounds.y,
      bounds.width,
      bounds.height,
      7
    );
  }
}

function updateScoreTextLabel(state, score = state.score) {
  if (!state.scoreText) return;
  state.scoreText.setText(formatScoreLabel(score));
  redrawScorePlate(state);
}

export function createLivesDisplay(scene, state = getGameState(scene)) {
  if (state.livesBalls && state.livesBalls.length > 0) {
    state.livesBalls.forEach((ball) => ball.destroy());
  }
  state.livesBalls = [];

  const isSmall = window.innerWidth < 600;
  const spacing = isSmall ? 20 : 30;
  const startX = isSmall ? 15 : 30;

  for (let i = 0; i < state.lives; i++) {
    const lifeBall = scene.add
      .image(startX + i * spacing, window.innerHeight - 20, TEXTURE_KEYS.BALL)
      .setDisplaySize(GAME_CONSTANTS.BALL_SIZE, GAME_CONSTANTS.BALL_SIZE)
      .setOrigin(0.5, 0.5);
    state.livesBalls.push(lifeBall);
  }
}

export function createScoreText(scene, state = getGameState(scene)) {
  if (state.scoreText) state.scoreText.destroy();
  if (state.scorePanel) state.scorePanel.destroy();

  const position = getScorePosition();
  state.scorePanel = scene.add.graphics({ x: 0, y: 0 });
  if (typeof state.scorePanel.setDepth === 'function') {
    state.scorePanel.setDepth(8);
  }

  state.scoreText = scene.add
    .text(
      position.x,
      position.y,
      formatScoreLabel(state.score),
      getScoreTextStyle()
    )
    .setOrigin(1, 0.5)
    .setDepth(9);
  if (typeof state.scoreText.setResolution === 'function') {
    state.scoreText.setResolution(2);
  }
  state.scoreText.updateScoreLabel = (score) =>
    updateScoreTextLabel(state, score);
  state.scoreText.refreshScoreChrome = () => redrawScorePlate(state);
  redrawScorePlate(state);
}

export function hideGameMessage() {
  const overlay = document.getElementById('gameMessageOverlay');
  if (overlay) {
    overlay.classList.add('hidden');
    overlay.textContent = '';
  }
}

export function startCountdown(scene, state = getGameState(scene)) {
  let countdown = state.currentCountdown;

  state.countdownInterval = setInterval(() => {
    countdown--;
    state.currentCountdown = countdown;

    if (countdown > 0) {
      updateCountdownDisplay(countdown);
    } else {
      hideGameMessage();
      state.ball.setVelocity(
        GAME_CONSTANTS.BALL_INITIAL_VELOCITY.x * settings.ballSpeed,
        GAME_CONSTANTS.BALL_INITIAL_VELOCITY.y * settings.ballSpeed
      );
      state.setPaused(false);
      clearInterval(state.countdownInterval);
      state.countdownInterval = null;
      state.currentCountdown = GAME_CONSTANTS.COUNTDOWN_START;
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
    messageDiv.textContent =
      Number.isInteger(value) && value > 0 && value <= 9 ? value : '';
    overlay.appendChild(messageDiv);
  }
}

export function createCountdownText(scene, state = getGameState(scene)) {
  updateCountdownDisplay(state.currentCountdown);
}

export function showGameOver() {
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

export function showWinMessage(scene, state = getGameState(scene)) {
  state.gameEnded = true;
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

    const colors = [
      '#ff0055',
      '#00ddff',
      '#00ffaa',
      '#ff9900',
      '#ffd300',
      '#ff00cc',
    ];

    for (let i = 0; i < 100; i++) {
      const confetti = document.createElement('div');
      confetti.classList.add('confetti-piece');
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.animation = `fall ${Math.random() * 3 + 2}s linear infinite`;
      confetti.style.animationDelay = Math.random() * 5 + 's';
      confetti.style.backgroundColor =
        colors[Math.floor(Math.random() * colors.length)];

      const size = Math.random() * 10 + 5;
      confetti.style.width = size + 'px';
      confetti.style.height = size + 'px';
      if (Math.random() > 0.5) confetti.style.borderRadius = '50%';

      overlay.appendChild(confetti);
    }
  }
}

export function togglePause(scene, state = getGameState(scene)) {
  const paused = state.togglePause();
  scene.physics.world.isPaused = paused;

  const pauseButton = document.getElementById('pauseButton');
  if (pauseButton) {
    pauseButton.textContent = '';
    const icon = document.createElement('i');
    icon.className = paused ? 'fas fa-play' : 'fas fa-pause';
    icon.setAttribute('aria-hidden', 'true');
    pauseButton.appendChild(icon);

    pauseButton.setAttribute(
      'aria-label',
      paused ? 'Resume game' : 'Pause game'
    );
    pauseButton.setAttribute('aria-pressed', paused ? 'true' : 'false');
    pauseButton.title = paused ? 'Resume' : 'Pause';
  }

  if (!paused && state.wasInCountdown) {
    state.wasInCountdown = false;
    createCountdownText(scene, state);
    startCountdown(scene, state);
  }
}

export function setupUIButtons(game) {
  const pauseButton = document.getElementById('pauseButton');
  if (pauseButton) {
    pauseButton.addEventListener('click', () => {
      const scene = game.scene.scenes[0];
      togglePause(scene, getGameState(scene));
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
        highScoreValue.textContent = getGameState(
          game.scene.scenes[0]
        ).highScore;
      }

      const scene = game.scene.scenes[0];
      const state = getGameState(scene);
      if (scene && !state.paused) {
        togglePause(scene, state);
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
    const state = getGameState(scene);
    if (scene) {
      scene.physics.world.setBounds(0, 0, width, height);

      if (state.scoreText) {
        const margin = width < 400 ? 10 : 20;
        const position = {
          x: width - margin,
          y: height - 20,
        };
        if (typeof state.scoreText.setStyle === 'function') {
          state.scoreText.setStyle(getScoreTextStyle(width));
        }
        if (typeof state.scoreText.updateScoreLabel === 'function') {
          state.scoreText.updateScoreLabel(state.score);
        } else {
          const prefix = width >= 405 ? 'SCORE: ' : '';
          state.scoreText.setText(`${prefix}${state.score}`);
        }
        state.scoreText.setPosition(position.x, position.y);
        redrawScorePlate(state);
      }

      if (state.livesBalls) {
        const isSmall = width < 600;
        const spacing = isSmall ? 20 : 30;
        const startX = isSmall ? 15 : 30;
        state.livesBalls.forEach((ball, i) => {
          ball.setPosition(startX + i * spacing, height - 20);
        });
      }

      if (state.paddle) {
        state.paddle.y = height - 55;

        state.paddle.x = Math.max(
          state.paddle.width / 2,
          Math.min(state.paddle.x, width - state.paddle.width / 2)
        );
      }
    }
  });
}
