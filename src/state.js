
import { GAME_CONSTANTS } from './constants.js';

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
            this.highScore = sanitizeHighScore(localStorage.getItem('brickBreakerHighScore'));
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
        this.countdownText = null;
        this.countdownInterval = null;
        this.wasInCountdown = false;
        this.currentCountdown = GAME_CONSTANTS.COUNTDOWN_START;
        this.winText = null;
        this.gameEnded = false;
        this.bricksCreated = false;
    }

    incrementScore(points) {
        this.score += points;
        if (this.scoreText) {
            this.scoreText.setText(this.score);
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
            }
        }
    }

    togglePause() {
        this.paused = !this.paused;
        return this.paused;
    }
}

export const gameState = new GameState();
