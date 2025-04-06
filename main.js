import { extractTextFromFile } from './parser.js';

let bricksGroup;
let paddle;
let ball;
let lives = 3;
let livesBalls = [];

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

function preload() {}

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
}

async function create() {
    const scene = this;

    bricksGroup = scene.physics.add.staticGroup();

    const paddleGraphics = scene.add.graphics({ fillStyle: { color: 0xA9A9A9 } });
    paddleGraphics.fillRect(0, 0, 100, 20);
    const paddleTextureKey = 'paddleTexture';
    paddleGraphics.generateTexture(paddleTextureKey, 100, 20);
    paddleGraphics.destroy();

    paddle = scene.physics.add.image(window.innerWidth / 2, window.innerHeight - 50, paddleTextureKey)
        .setImmovable(true)
        .setCollideWorldBounds(true);

    const ballGraphics = scene.add.graphics({ fillStyle: { color: 0xA9A9A9 } });
    ballGraphics.fillCircle(10, 10, 10);
    const ballTextureKey = 'ballTexture';
    ballGraphics.generateTexture(ballTextureKey, 20, 20);
    ballGraphics.destroy();

    ball = scene.physics.add.image(window.innerWidth / 2, window.innerHeight - 70, ballTextureKey)
        .setDisplaySize(20, 20)
        .setVelocity(200, -200)
        .setBounce(1)
        .setCollideWorldBounds(true);

    scene.physics.add.collider(ball, paddle);
    scene.physics.add.collider(ball, bricksGroup, (ball, brick) => {
        const textElement = brick.getData('textElement');
        if (textElement) {
            textElement.destroy();
        }
        brick.destroy();
    });

    scene.physics.world.on('worldbounds', (body, up, down) => {
        if (down) {
            loseLife(scene);
        }
    });

    ball.body.setCollideWorldBounds(true, 1, 1, true);

    scene.input.on('pointermove', pointer => {
        const paddleWidth = paddle.width;
        paddle.x = Phaser.Math.Clamp(pointer.x, paddleWidth / 2, window.innerWidth - paddleWidth / 2);
    });

    // Display lives as balls at the bottom left of the screen
    for (let i = 0; i < lives; i++) {
        const lifeBall = scene.add.image(30 + i * 30, window.innerHeight - 20, ballTextureKey)
            .setDisplaySize(20, 20);
        livesBalls.push(lifeBall);
    }

    await (async () => {
        const response = await fetch('Nathan Zimmerman Resume.docx');
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
                const rowIndex = Math.floor((y - marginTop) / (brickHeight + brickPadding));
                const rowColor = colors[rowIndex % colors.length];
                createBrick(scene, x, y, word, 'word', brickWidth, rowColor);
                x += brickWidth + brickPadding;
            });
        });
    })();
}

function loseLife(scene) {
    lives--;
    if (livesBalls.length > 0) {
        const lifeBall = livesBalls.pop();
        lifeBall.destroy();
    }
    if (lives > 0) {
        ball.setPosition(window.innerWidth / 2, window.innerHeight - 70);
        ball.setVelocity(200, -200);
    } else {
        scene.add.text(window.innerWidth / 2, window.innerHeight - 100, 'Game Over', { fontSize: '64px', fill: '#f00' }).setOrigin(0.5);
        ball.destroy();
    }
}

function update() {}

window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
});