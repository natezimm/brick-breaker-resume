import { GAME_CONSTANTS } from './constants.js';

/**
 * Mutable runtime state for one Brick Breaker scene.
 *
 * @typedef {Object} GameStateFields
 * @property {number} highScore
 * @property {number} lives
 * @property {number} score
 * @property {number} totalRows
 * @property {boolean} paused
 * @property {boolean} wasInCountdown
 * @property {number} currentCountdown
 * @property {boolean} gameEnded
 * @property {boolean} bricksCreated
 * @property {boolean} bricksReady
 * @property {Object[] | null} levels
 * @property {number} levelIndex
 * @property {Set<number>} brokenWords
 * @property {number | null} lastHitColor
 */

function sanitizeHighScore(value) {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0 || parsed > Number.MAX_SAFE_INTEGER) {
    return 0;
  }
  return parsed;
}

class GameState {
  constructor() {
    try {
      this.highScore = sanitizeHighScore(
        localStorage.getItem('brickBreakerHighScore')
      );
    } catch {
      this.highScore = 0;
    }
    this.reset();
  }

  reset() {
    this.bricksGroup = null;
    this.paddle = null;
    this.ball = null;
    this.lives = GAME_CONSTANTS.INITIAL_LIVES;
    this.livesBalls = [];
    this.score = GAME_CONSTANTS.INITIAL_SCORE;
    this.scoreText = null;
    this.totalRows = 0;
    this.paused = true;
    // Paused by the player (or for them, by a dialog or a hidden tab), as
    // opposed to the engine's own waits such as the countdown.
    this.userPaused = false;
    this.keys = null;
    this.totalBricks = 0;
    this.countdownText = null;
    this.countdownInterval = null;
    this.wasInCountdown = false;
    this.currentCountdown = GAME_CONSTANTS.COUNTDOWN_START;
    this.winText = null;
    this.gameEnded = false;
    this.bricksCreated = false;
    // The first résumé load has finished. Unlike bricksCreated, a theme
    // switch's rebuild does not clear it.
    this.bricksReady = false;
    // The résumé split into levels for this screen (see src/levels.js), the
    // one being played, and the screen size the split was made for.
    this.resumeElements = null;
    this.levels = null;
    this.levelIndex = 0;
    this.levelsViewport = null;
    // Between levels: the card for the next one is showing.
    this.betweenLevels = false;
    // Bricks broken, and laid, in the levels already cleared.
    this.brokenBefore = 0;
    this.bricksBefore = 0;
    this.ballTrailGraphics = null;
    this.ballTrailPoints = [];
    this.paddleTrailGraphics = null;
    this.paddleTrailPoints = [];
    // Keys of the bricks already broken (a word's position in the résumé), so
    // a theme switch can lay the rest out again without restoring them.
    this.brokenWords = new Set();
    // Broken bricks a new split moved into a later level (see bricks.js).
    this.brokenAhead = new Set();
    this.rebuildingBricks = null;
    this.lastHitColor = null;
  }

  incrementScore(points) {
    this.score += points;
    if (this.scoreText) {
      if (typeof this.scoreText.updateScoreLabel === 'function') {
        this.scoreText.updateScoreLabel(this.score);
      } else {
        this.scoreText.setText(this.score);
      }
    }
    this.updateHighScore();
  }

  decrementLives() {
    this.lives--;
    const lifeBall = this.livesBalls.pop();
    lifeBall?.destroy();
  }

  setPaused(paused) {
    this.paused = paused;
  }

  updateHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      try {
        localStorage.setItem('brickBreakerHighScore', String(this.highScore));
      } catch {
        // Ignore storage failures so scoring still works when localStorage is unavailable.
      }
    }
  }

  togglePause() {
    this.paused = !this.paused;
    return this.paused;
  }
}

export function createGameState() {
  return new GameState();
}

export function attachGameState(scene, state = createGameState()) {
  if (scene) {
    scene.gameState = state;
  }

  return state;
}

export function getGameState(scene) {
  return scene?.gameState ?? gameState;
}

export { GameState };

export const gameState = createGameState();
