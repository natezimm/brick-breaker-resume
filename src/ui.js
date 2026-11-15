import { getGameState } from './state.js';
import { settings } from './settings.js';
import { GAME_CONSTANTS, COLORS, THEMES } from './constants.js';
import { rebuildBricks } from './bricks.js';
import { hexToCss } from './brickLayout.js';
import { isBallMoving, launchBall } from './ballPhysics.js';
import { getBallRestY, getPaddleY, isCoarsePointer } from './playfield.js';
import { closeDialog, closeOnBackdropClick, openDialog } from './dialogs.js';

/*
 * The HUD (lives, controls, score), the messages over the playfield and the
 * game's dialogs are DOM, styled per look in styles/. These helpers keep them
 * in step with the scene state.
 */

const SCORE_BUMP_CLASS = 'is-bumped';
const CONFETTI_COUNT = 60;

export const RESUME_DOWNLOAD_URL = 'assets/Nathan%20Zimmerman%20Resume.docx';
export const PORTFOLIO_URL = 'https://nathanzimmerman.com';

function formatScore(score) {
  return Number(score).toLocaleString('en-US');
}

function describeLives(container, count) {
  container.setAttribute(
    'aria-label',
    `${count} ${count === 1 ? 'life' : 'lives'} left`
  );
}

function getLivesTrack(container) {
  let track = container.querySelector('.hud-pips');
  if (!track) {
    track = document.createElement('span');
    track.className = 'hud-pips';
    container.appendChild(track);
  }
  return track;
}

/**
 * Draws one pip per life. Each entry in `state.livesBalls` can be destroyed
 * like a game object; a lost life stays in its slot as an empty ring so the
 * row shows how many are gone.
 */
export function createLivesDisplay(scene, state = getGameState(scene)) {
  state.livesBalls = [];

  const container = document.getElementById('hudLives');
  const track = container ? getLivesTrack(container) : null;
  if (track) track.textContent = '';

  for (let i = 0; i < state.lives; i++) {
    const pip = document.createElement('span');
    pip.className = 'hud-pip';
    track?.appendChild(pip);

    state.livesBalls.push({
      element: pip,
      destroy() {
        pip.classList.add('is-lost');
        if (container) describeLives(container, state.livesBalls.length);
      },
    });
  }

  if (container) describeLives(container, state.livesBalls.length);
}

/**
 * Binds the score readout. `state.scoreText` keeps the small interface the
 * state and settings modules already call, backed by DOM instead of canvas.
 */
export function createScoreText(scene, state = getGameState(scene)) {
  if (state.scoreText) state.scoreText.destroy();

  const group = document.getElementById('hudScore');
  const value = document.getElementById('hudScoreValue');
  const best = document.getElementById('hudBestValue');
  let shown = null;

  const render = (score = state.score) => {
    const points = Number(score) || 0;
    const highScore = Math.max(state.highScore, points);

    if (value) {
      value.textContent = formatScore(points);
      if (shown !== null && points !== shown) {
        // Restart the bump animation on every change.
        value.classList.remove(SCORE_BUMP_CLASS);
        void value.offsetWidth;
        value.classList.add(SCORE_BUMP_CLASS);
      }
    }
    if (best) best.textContent = formatScore(highScore);
    group?.classList.toggle('is-best', points > 0 && points >= highScore);
    shown = points;
  };

  state.scoreText = {
    setText: render,
    updateScoreLabel: render,
    destroy() {
      value?.classList.remove(SCORE_BUMP_CLASS);
    },
  };
  render();
}

/* ---------- Messages over the playfield ---------- */

function getMessageOverlay() {
  return document.getElementById('gameMessageOverlay');
}

/** Clears the overlay and returns it ready for a new message, if it exists. */
function showMessageOverlay() {
  const overlay = getMessageOverlay();
  if (!overlay) return null;
  overlay.classList.remove('hidden');
  overlay.textContent = '';
  return overlay;
}

export function hideGameMessage() {
  const overlay = getMessageOverlay();
  if (overlay) {
    overlay.classList.add('hidden');
    overlay.textContent = '';
  }
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/**
 * A card over the playfield: a small label, a headline, supporting lines and
 * actions. Actions are buttons (`onClick`) or links (`href`).
 */
function createMessageCard({ variant, eyebrow, title, lines = [], actions }) {
  const card = element('div', `gm-card gm-card--${variant}`);
  card.setAttribute('role', 'group');

  if (eyebrow) card.appendChild(element('p', 'gm-eyebrow', eyebrow));
  const heading = element('h2', 'gm-title', title);
  heading.id = `gmTitle-${variant}`;
  card.setAttribute('aria-labelledby', heading.id);
  card.appendChild(heading);
  lines.forEach((line) => card.appendChild(element('p', 'gm-line', line)));

  const row = element('div', 'gm-actions');
  actions.forEach(({ label, onClick, href, download, primary }) => {
    const action = element(
      href ? 'a' : 'button',
      primary ? 'gm-action gm-action--primary' : 'gm-action',
      label
    );
    if (href) {
      action.href = href;
      if (download) action.setAttribute('download', '');
      else {
        action.target = '_blank';
        action.rel = 'noopener noreferrer';
      }
    } else {
      action.type = 'button';
      action.addEventListener('click', onClick);
    }
    row.appendChild(action);
  });
  card.appendChild(row);

  return card;
}

/** Moves focus to a card's main action so a keyboard can answer it at once. */
function focusPrimaryAction(card) {
  card.querySelector('.gm-action--primary')?.focus({ preventScroll: true });
}

function steeringHint() {
  return isCoarsePointer()
    ? 'Drag anywhere to steer the paddle.'
    : 'Steer with the mouse or ← →. P pauses.';
}

function updateCountdownDisplay(value) {
  const overlay = showMessageOverlay();
  if (!overlay) return;

  const messageDiv = element('div', 'game-message gm-countdown');
  messageDiv.textContent =
    Number.isInteger(value) && value > 0 && value <= 9 ? value : '';
  overlay.appendChild(messageDiv);
  overlay.appendChild(element('p', 'gm-hint', steeringHint()));
}

export function createCountdownText(scene, state = getGameState(scene)) {
  updateCountdownDisplay(state.currentCountdown);
}

/**
 * Counts 3-2-1, then plays: a resting ball is launched, a ball paused in
 * flight carries on where it was.
 */
export function startCountdown(scene, state = getGameState(scene)) {
  let countdown = state.currentCountdown;

  state.countdownInterval = setInterval(() => {
    countdown--;
    state.currentCountdown = countdown;

    if (countdown > 0) {
      updateCountdownDisplay(countdown);
      return;
    }

    hideGameMessage();
    clearInterval(state.countdownInterval);
    state.countdownInterval = null;
    state.currentCountdown = GAME_CONSTANTS.COUNTDOWN_START;

    if (!isBallMoving(state.ball)) launchBall(state.ball, settings.ballSpeed);
    setEnginePaused(scene, false);
    state.setPaused(false);
  }, GAME_CONSTANTS.COUNTDOWN_INTERVAL);
}

function bricksBrokenLine(state) {
  const broken = state.brokenWords?.size ?? 0;
  const total = state.totalBricks || broken;
  return `${formatScore(broken)} of ${formatScore(total)} bricks broken`;
}

function bestLine(state) {
  return state.score > 0 && state.score >= state.highScore
    ? 'A new best score'
    : `Best ${formatScore(state.highScore)}`;
}

function endActions(scene) {
  return [
    { label: 'Play again', onClick: () => restartGame(scene), primary: true },
    { label: 'Download résumé', href: RESUME_DOWNLOAD_URL, download: true },
    { label: 'Portfolio', href: PORTFOLIO_URL },
  ];
}

export function showGameOver(scene, state = getGameState(scene)) {
  const overlay = showMessageOverlay();
  if (!overlay) return;

  const card = createMessageCard({
    variant: 'gameover',
    eyebrow: 'Game over',
    title: `${formatScore(state.score)} points`,
    lines: [bestLine(state), bricksBrokenLine(state)],
    actions: endActions(scene),
  });
  overlay.appendChild(card);
  focusPrimaryAction(card);
}

/** Glass celebrates in the wall's own colours; Paper keeps to its ink. */
function addConfetti(overlay) {
  if (settings.theme === THEMES.LIGHT) return;

  const colors = COLORS.BRICK_COLORS.map(hexToCss);
  for (let i = 0; i < CONFETTI_COUNT; i++) {
    const piece = element('span', 'confetti-piece');
    piece.setAttribute('aria-hidden', 'true');
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.setProperty('--confetti-color', colors[i % colors.length]);
    piece.style.setProperty('--confetti-size', `${6 + Math.random() * 6}px`);
    piece.style.setProperty(
      '--confetti-drift',
      `${(Math.random() - 0.5) * 160}px`
    );
    piece.style.animationDuration = `${2.4 + Math.random() * 2.4}s`;
    piece.style.animationDelay = `${Math.random() * 1.6}s`;
    overlay.appendChild(piece);
  }
}

export function showWinMessage(scene, state = getGameState(scene)) {
  state.gameEnded = true;
  const overlay = showMessageOverlay();
  if (!overlay) return;

  addConfetti(overlay);
  const card = createMessageCard({
    variant: 'win',
    eyebrow: 'Résumé cleared',
    title: `${formatScore(state.score)} points`,
    lines: [bestLine(state), 'Every brick broken. Thanks for reading.'],
    actions: endActions(scene),
  });
  overlay.appendChild(card);
  focusPrimaryAction(card);
}

function showPausedMessage(scene, state) {
  const overlay = showMessageOverlay();
  if (!overlay) return;

  const card = createMessageCard({
    variant: 'paused',
    eyebrow: 'Paused',
    title: 'Take your time',
    lines: [
      isCoarsePointer()
        ? 'Tap Resume to carry on.'
        : 'Press P or Resume to carry on.',
    ],
    actions: [
      {
        label: 'Resume',
        onClick: () => resumeGame(scene, state),
        primary: true,
      },
    ],
  });
  overlay.appendChild(card);
}

/* ---------- Pause and resume ---------- */

/** Stops physics and the scene clock (so timed relaunches wait too). */
function setEnginePaused(scene, paused) {
  if (scene?.physics?.world) scene.physics.world.isPaused = paused;
  if (scene?.time) scene.time.paused = paused;
}

/** The pause button shows play while paused; both icons live in its markup. */
export function renderPauseButton(paused) {
  const pauseButton = document.getElementById('pauseButton');
  if (!pauseButton) return;

  pauseButton.setAttribute('aria-label', paused ? 'Resume game' : 'Pause game');
  pauseButton.setAttribute('aria-pressed', paused ? 'true' : 'false');
  pauseButton.title = paused ? 'Resume' : 'Pause';
}

/**
 * Pauses play. A countdown in progress is stopped and picks up again on
 * resume. `message: false` leaves the overlay clear, for when a dialog covers
 * the game anyway.
 * @returns {boolean} whether this call paused the game
 */
export function pauseGame(
  scene,
  state = getGameState(scene),
  { message = true } = {}
) {
  if (!scene?.physics || state.gameEnded || state.userPaused) return false;

  if (state.countdownInterval) {
    clearInterval(state.countdownInterval);
    state.countdownInterval = null;
    state.wasInCountdown = true;
  }

  state.userPaused = true;
  state.setPaused(true);
  setEnginePaused(scene, true);
  renderPauseButton(true);

  if (message) showPausedMessage(scene, state);
  else hideGameMessage();
  return true;
}

/**
 * Resumes play. After a dialog (`countdown: true`) or an interrupted
 * countdown, the game counts back in so the player is ready.
 */
export function resumeGame(
  scene,
  state = getGameState(scene),
  { countdown = false } = {}
) {
  if (!scene || !state.userPaused) return;

  state.userPaused = false;
  renderPauseButton(false);
  hideGameMessage();

  if (countdown || state.wasInCountdown) {
    state.wasInCountdown = false;
    createCountdownText(scene, state);
    startCountdown(scene, state);
    return;
  }

  setEnginePaused(scene, false);
  state.setPaused(false);
}

export function togglePause(scene, state = getGameState(scene)) {
  if (state.userPaused) resumeGame(scene, state);
  else pauseGame(scene, state);
}

/** Starts a fresh game in the same look. */
export function restartGame(scene) {
  hideGameMessage();
  renderPauseButton(false);
  scene?.scene?.restart?.();
}

/* ---------- Dialogs, buttons and window events ---------- */

/**
 * Wires a dialog to the game: opening it pauses play, and closing it (by its
 * button, Escape or the backdrop) counts back in, unless the player had
 * paused before opening it.
 */
export function bindGameDialog(dialog, { opener, closer, getScene, onOpen }) {
  if (!dialog) return;
  let pausedForDialog = false;

  opener?.addEventListener('click', () => {
    const scene = getScene();
    pausedForDialog = pauseGame(scene, getGameState(scene), { message: false });
    onOpen?.(scene);
    openDialog(dialog);
  });

  closer?.addEventListener('click', () => closeDialog(dialog));
  closeOnBackdropClick(dialog);

  dialog.addEventListener('close', () => {
    if (!pausedForDialog) return;
    pausedForDialog = false;
    const scene = getScene();
    resumeGame(scene, getGameState(scene), { countdown: true });
  });
}

export function setupUIButtons(game) {
  const getScene = () => game.scene.scenes[0];

  const pauseButton = document.getElementById('pauseButton');
  pauseButton?.addEventListener('click', () => {
    const scene = getScene();
    togglePause(scene, getGameState(scene));
  });

  const highScoreValue = document.getElementById('highScoreValue');
  bindGameDialog(document.getElementById('highScoreModal'), {
    opener: document.getElementById('highScoreButton'),
    closer: document.getElementById('closeHighScoreModal'),
    getScene,
    onOpen(scene) {
      if (highScoreValue) {
        highScoreValue.textContent = formatScore(getGameState(scene).highScore);
      }
    },
  });

  bindGameDialog(document.getElementById('settingsModal'), {
    opener: document.getElementById('settingsButton'),
    closer: document.getElementById('closeModal'),
    getScene,
  });

  // A hidden tab pauses the game; the player resumes when they are back.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'hidden') return;
    const scene = getScene();
    if (scene) pauseGame(scene, getGameState(scene));
  });
}

/**
 * Keeps the playfield fitted to the window. The canvas, bounds and paddle
 * follow at once; the bricks are laid out again once resizing settles, since
 * the layout depends on the window's size.
 */
export function setupWindowResize(game) {
  let relayoutTimer = null;

  window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    game.scale.resize(width, height);

    const scene = game.scene.scenes[0];
    if (!scene) return;

    const state = getGameState(scene);
    scene.physics.world.setBounds(0, 0, width, height);

    if (state.paddle) {
      state.paddle.y = getPaddleY(height);
      state.paddle.x = Math.max(
        state.paddle.width / 2,
        Math.min(state.paddle.x, width - state.paddle.width / 2)
      );
    }

    // A ball left outside the new bounds is brought back into play.
    if (state.ball && typeof state.ball.setPosition === 'function') {
      const x = Math.min(Math.max(state.ball.x, 0), width);
      const y = state.ball.y > height ? getBallRestY(height) : state.ball.y;
      if (x !== state.ball.x || y !== state.ball.y)
        state.ball.setPosition(x, y);
    }

    clearTimeout(relayoutTimer);
    relayoutTimer = setTimeout(() => {
      const current = game.scene.scenes[0];
      if (current) rebuildBricks(current, getGameState(current));
    }, GAME_CONSTANTS.RELAYOUT_DELAY);
  });
}
