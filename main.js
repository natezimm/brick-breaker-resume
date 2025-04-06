import { extractTextFromFile } from './parser.js';

let bricksGroup;
let paddle;
let ball;

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

    ball = scene.physics.add.image(400, 550, ballTextureKey)
        .setDisplaySize(20, 20)
        .setVelocity(200, -200)
        .setBounce(1)
        .setCollideWorldBounds(true);

    scene.physics.add.collider(ball, paddle);
    scene.physics.add.collider(ball, bricksGroup, (ball, brick) => {
        const children = scene.children.getChildren();
        children.forEach(child => {
            if (child.type === 'Text' && Math.abs(child.x - brick.x) <= 5 && Math.abs(child.y - brick.y) <= 5) {
                child.destroy();
            }
        });
        brick.destroy();
    });

    scene.input.on('pointermove', pointer => {
        const paddleWidth = paddle.width;
        paddle.x = Phaser.Math.Clamp(pointer.x, paddleWidth / 2, window.innerWidth - paddleWidth / 2);
    });

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

        elements.forEach((el) => {
            const words = el.text.split(/\s+/);
            const rowIndex = Math.floor((y - marginTop) / (brickHeight + brickPadding));
            const colors = [0xf44336, 0xffc107, 0x4caf50, 0x2196f3]; // red, yellow, green, blue
            const rowColor = colors[rowIndex % colors.length];
            words.forEach((word) => {
                const brickWidth = word.length * baseBrickWidth + 10;
                if (x + brickWidth > window.innerWidth) {
                    x = 10;
                    y += brickHeight + brickPadding;
                }
                createBrick(scene, x, y, word, 'word', brickWidth, rowColor);
                x += brickWidth + brickPadding;
            });
        });
    })();
}
function update() {}

function createBrick(scene, x, y, text, type, brickWidth, color) {
    const height = 24;

    const brick = scene.add.rectangle(x, y, brickWidth, height, color)
        .setOrigin(0, 0);
    scene.physics.add.existing(brick, true);
    bricksGroup.add(brick);

    const textElement = scene.add.text(x + 5, y + 4, text, { color: '#000000', fontSize: '12px' })
        .setDepth(1);
    textElement.setScrollFactor(0);
}

window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
});
