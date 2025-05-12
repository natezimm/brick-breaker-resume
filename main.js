import { extractTextFromFile } from './parser.js';

let bricksGroup;
let paddle;
let ball;
let lives = 3;
let livesBalls = [];
let score = 0;
let scoreText;
let totalRows = 0;
let paused = true;
let countdownText;
let winText;
let bricksCreated = false;

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#FFFFFF',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false,
        }
    },
    scene: {
        preload,
        create,
        update
    }
};

const game = new Phaser.Game(config);

function preload() {
    this.load.audio('ballHit', 'assets/sounds/ball-hit.wav');
    this.load.audio('brickHit', 'assets/sounds/brick-hit.wav');
    this.load.audio('loseLife', 'assets/sounds/lose-life.wav');
    this.load.audio('winGame', 'assets/sounds/win-game.wav');
    this.load.audio('gameOver', 'assets/sounds/game-over.wav');
}

function createBrick(scene, x, y, text, type, brickWidth, color) {
    const height = 24;

    const brick = scene.add.rectangle(x, y, brickWidth, height, color)
        .setOrigin(0, 0);
    scene.physics.add.existing(brick, true);
    bricksGroup.add(brick);

    if (text) {
        const textElement = scene.add.text(x + brickWidth / 2, y + height / 2, text, { color: '#000000', fontSize: '12px' })
            .setOrigin(0.5, 0.5)
            .setDepth(1);
        textElement.setScrollFactor(0);
        brick.setData('textElement', textElement);
    }

    brick.setData('row', Math.floor((y - 10) / (height + 4)));
}

async function create() {
    const scene = this;

    if (winText) {
        winText.destroy();
        winText = null;
    }

    score = 0;
    lives = 3;
    bricksCreated = false;

    bricksGroup = scene.physics.add.staticGroup();

    const paddleGraphics = scene.add.graphics({ fillStyle: { color: 0xA9A9A9 } });
    paddleGraphics.fillRect(0, 0, 100, 20);
    const paddleTextureKey = 'paddleTexture';
    paddleGraphics.generateTexture(paddleTextureKey, 100, 20);
    paddleGraphics.destroy();

    paddle = scene.physics.add.image(window.innerWidth / 2, window.innerHeight - 55, paddleTextureKey)
        .setImmovable(true)
        .setCollideWorldBounds(true);

    const ballGraphics = scene.add.graphics({ fillStyle: { color: 0xA9A9A9 } });
    ballGraphics.fillCircle(10, 10, 10);
    const ballTextureKey = 'ballTexture';
    ballGraphics.generateTexture(ballTextureKey, 20, 20);
    ballGraphics.destroy();

    ball = scene.physics.add.image(window.innerWidth / 2, window.innerHeight - 75, ballTextureKey)
        .setDisplaySize(20, 20)
        .setVelocity(0, 0)
        .setBounce(1)
        .setCollideWorldBounds(true);
    // Enable world bounds event for ball
    ball.body.onWorldBounds = true;

    scene.physics.add.collider(ball, paddle, () => {
        scene.sound.play('ballHit');
    });

    scene.physics.add.collider(ball, bricksGroup, (ball, brick) => {
        scene.sound.play('brickHit');
        const textElement = brick.getData('textElement');
        if (textElement) {
            textElement.destroy();
        }
        const row = brick.getData('row');
        score += (totalRows - row) * 10;
        scoreText.setText(`Score: ${score}`);
        brick.destroy();
    });

    scene.physics.world.on('worldbounds', (body, up, down) => {
        if (down && body.gameObject === ball) {
            scene.sound.play('loseLife');
            loseLife(scene);
        }
    });

    ball.body.setCollideWorldBounds(true, 1, 1, true);

    scene.input.on('pointermove', pointer => {
        if (!paused) {
            const paddleWidth = paddle.width;
            paddle.x = Phaser.Math.Clamp(pointer.x, paddleWidth / 2, window.innerWidth - paddleWidth / 2);
        }
    });

    for (let i = 0; i < lives; i++) {
        const lifeBall = scene.add.image(30 + i * 30, window.innerHeight - 20, ballTextureKey)
            .setDisplaySize(20, 20);
        livesBalls.push(lifeBall);
    }

    scoreText = scene.add.text(window.innerWidth - 150, window.innerHeight - 30, `Score: ${score}`, { fontSize: '20px', fill: '#000' });

    await (async () => {
        const response = await fetch('assets/Nathan Zimmerman Resume.docx');
        const blob = await response.blob();
        const file = new File([blob], 'Nathan Zimmerman Resume.docx');
        const elements = await extractTextFromFile(file);

        const marginTop = 10;
        const brickHeight = 24;
        const brickPadding = 4;
        const baseBrickWidth = 10;
        let x = 10;
        let y = marginTop;

        const colors = [0xf44336, 0xffc107, 0x4caf50, 0x2196f3];

        elements.forEach((el) => {
            const words = el.text.split(/\s+/);
            words.forEach((word) => {
                const brickWidth = word.length * baseBrickWidth + 10;
                if (x + brickWidth > window.innerWidth - 10) {
                    x = 10;
                    y += brickHeight + brickPadding;
                }
                if (y + brickHeight > window.innerHeight * 0.75) return;
                const rowIndex = Math.floor((y - marginTop) / (brickHeight + brickPadding));
                totalRows = Math.max(totalRows, rowIndex + 1);
                const rowColor = colors[rowIndex % colors.length];
                createBrick(scene, x, y, word, 'word', brickWidth, rowColor);
                x += brickWidth + brickPadding;
            });
        });

        bricksCreated = true;
    })();

    scene.input.keyboard.on('keydown-P', () => {
        togglePause(scene);
    });

    countdownText = scene.add.text(window.innerWidth / 2, window.innerHeight - 150, '3', { fontSize: '64px', fill: '#A9A9A9' }).setOrigin(0.5);
    startCountdown(scene);
}

function startCountdown(scene) {
    let countdown = 3;
    const countdownInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            countdownText.setText(countdown.toString());
        } else {
            countdownText.destroy();
            ball.setVelocity(200, -200);
            paused = false;
            clearInterval(countdownInterval);
        }
    }, 1000);
}

function loseLife(scene) {
    lives--;
    if (livesBalls.length > 0) {
        const lifeBall = livesBalls.pop();
        lifeBall.destroy();
    }
    if (lives > 0) {
        ball.setPosition(window.innerWidth / 2, window.innerHeight - 75);
        ball.setVelocity(0, 0);
        paused = true;
        startCountdown(scene);
    } else {
        scene.add.text(window.innerWidth / 2, window.innerHeight - 100, 'Game Over', { fontSize: '64px', fill: '#f00' }).setOrigin(0.5).setDepth(2);
        ball.destroy();
    }
}

function togglePause(scene) {
    paused = !paused;
    scene.physics.world.isPaused = paused;
    const pauseButton = document.getElementById('pauseButton');
    pauseButton.textContent = paused ? 'Play' : 'Pause';
}

function update() {
    const scene = this;
    if (bricksCreated && bricksGroup.countActive() === 0 && lives > 0 && !winText) {
        winText = scene.add.text(window.innerWidth / 2, window.innerHeight / 2, 'YOU BROKE IT! YOU WIN!', { fontSize: '64px', fill: '#A9A9A9' }).setOrigin(0.5).setDepth(2);
        ball.setVelocity(0, 0);
        scene.sound.play('winGame');
        paused = true;
    }
}

document.getElementById('pauseButton').addEventListener('click', () => {
    togglePause(game.scene.scenes[0]);
});

window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
});