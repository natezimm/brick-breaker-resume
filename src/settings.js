import { gameState } from './state.js';

export const settings = {
    soundEnabled: true,
    ballColor: 0xA9A9A9,
    paddleColor: 0xA9A9A9,
    paddleWidth: 100,
    ballSpeed: 1.0,
};

export function setupSettings(game) {
    const modal = document.getElementById('settingsModal');
    const settingsButton = document.getElementById('settingsButton');
    const closeButton = document.getElementById('closeModal');
    const soundToggle = document.getElementById('soundToggle');
    const ballColorPicker = document.getElementById('ballColorPicker');
    const paddleColorPicker = document.getElementById('paddleColorPicker');
    const paddleWidthSlider = document.getElementById('paddleWidthSlider');
    const paddleWidthValue = document.getElementById('paddleWidthValue');
    const ballSpeedSlider = document.getElementById('ballSpeedSlider');
    const ballSpeedValue = document.getElementById('ballSpeedValue');
    const pauseButton = document.getElementById('pauseButton');


    settingsButton.addEventListener('click', () => {
        modal.classList.add('active');

        console.log('Settings clicked, gameState.paused:', gameState.paused);

        const scene = game.scene.scenes[0];

        if (scene && scene.physics) {
            if (gameState.countdownInterval) {
                console.log('Stopping countdown...');
                clearInterval(gameState.countdownInterval);
                gameState.countdownInterval = null;
                gameState.wasInCountdown = true;
            }

            gameState.setPaused(true);
            scene.physics.world.isPaused = true;

            console.log('After pause - gameState.paused:', gameState.paused);
            console.log('After pause - physics.isPaused:', scene.physics.world.isPaused);

            if (pauseButton) {
                pauseButton.innerHTML = '<i class="fas fa-play"></i>';
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
