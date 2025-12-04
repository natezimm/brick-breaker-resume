export const GAME_CONSTANTS = {
    INITIAL_LIVES: 5,
    INITIAL_SCORE: 0,
    PADDLE_WIDTH: 100,
    PADDLE_HEIGHT: 20,
    BALL_SIZE: 20,
    BALL_RADIUS: 10,
    BALL_INITIAL_VELOCITY: { x: 200, y: -200 },
    BRICK_HEIGHT: 24,
    BRICK_PADDING: 4,
    BASE_BRICK_WIDTH: 10,
    MARGIN_TOP: 10,
    COUNTDOWN_START: 3,
    COUNTDOWN_INTERVAL: 1000,
    MAX_BRICK_HEIGHT_RATIO: 0.75,
};

export const COLORS = {
    BACKGROUND: '#FFFFFF',
    PADDLE: 0xA9A9A9,
    BALL: 0xA9A9A9,
    TEXT: '#000000',
    TEXT_LIGHT: '#A9A9A9',
    GAME_OVER: '#f00',
    BRICK_COLORS: [0xf44336, 0xffc107, 0x4caf50, 0x2196f3],
};

export const AUDIO_KEYS = {
    BALL_HIT: 'ballHit',
    BRICK_HIT: 'brickHit',
    LOSE_LIFE: 'loseLife',
    WIN_GAME: 'winGame',
    GAME_OVER: 'gameOver',
};

export const TEXTURE_KEYS = {
    PADDLE: 'paddleTexture',
    BALL: 'ballTexture',
};
