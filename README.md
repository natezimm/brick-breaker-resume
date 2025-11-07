# Brick Breaker Resume

Brick Breaker Resume is a browser-based game built with Phaser.js. The game dynamically generates bricks from the content of a `.docx` resume file, allowing players to break bricks while interacting with the text of the resume.

## Features

- **Dynamic Brick Generation**: Bricks are created from the text content of a `.docx` file.
- **Interactive Gameplay**: Use a paddle to bounce the ball and break bricks.
- **Pause/Play Functionality**: Pause and resume the game with a button or the `P` key.
- **Responsive Design**: The game adjusts to the browser window size.
- **Sound Effects**: Includes sound effects for ball hits, brick destruction, and game events.

## Technologies Used

- **Phaser.js**: Game framework for rendering and physics.
- **Mammoth.js**: Library for extracting text from `.docx` files.
- **HTML/CSS/JavaScript**: Core web technologies for the game interface.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/natezimm/brick-breaker-resume.git
   cd brick-breaker-resume
   ```

2. Install dependencies (if any):
   ```bash
   npm install
   ```

3. Start a local server to serve the static files. For example, using `http-server`:
   ```bash
   npx http-server
   ```

4. Open the game in your browser:
   ```
   http://localhost:8080
   ```

## How to Play

1. Upload a `.docx` file (e.g., a resume) to generate bricks.
2. Use your mouse to move the paddle and bounce the ball.
3. Break all the bricks to win the game.
4. Use the `Pause` button or press the `P` key to pause/resume the game.

## Deployment on Render

To deploy this project as a static site on Render:

- **Root Directory**: `/`
- **Build Command**: None
- **Publish Directory**: `/`

## File Structure

- `index.html`: Main HTML file for the game.
- `style.css`: Styles for the game interface.
- `main.js`: Game logic and Phaser.js configuration.
- `parser.js`: Handles text extraction from `.docx` files.
- `assets/`: Contains game assets like sounds and the sample resume file.
