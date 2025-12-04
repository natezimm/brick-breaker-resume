# Source Code Structure

This directory contains the modular game code for the Brick Breaker Resume game.

## File Organization

### Core Modules

- **`constants.js`** - All game constants, colors, and configuration values
  - Game settings (lives, score, ball speed, etc.)
  - Color definitions
  - Audio and texture keys

- **`state.js`** - Centralized game state management
  - GameState class for managing all game variables
  - Singleton instance exported for global access
  - Methods for updating score, lives, and pause state

- **`config.js`** - Phaser game configuration
  - Canvas settings
  - Physics configuration
  - Scene setup

- **`game.js`** - Main game logic
  - `preload()` - Load assets
  - `create()` - Initialize game scene
  - `update()` - Game loop
  - Helper functions for game objects and collisions

- **`bricks.js`** - Brick creation and management
  - Resume parsing and brick generation
  - Brick collision handling
  - Scoring logic

- **`ui.js`** - User interface elements
  - Lives display
  - Score display
  - Countdown timer
  - Game messages (win/lose)
  - Controls and event handlers

## Module Dependencies

```
main.js (entry point)
  ├── config.js
  │   ├── constants.js
  │   └── game.js
  │       ├── constants.js
  │       ├── state.js
  │       ├── bricks.js
  │       │   ├── constants.js
  │       │   └── state.js
  │       └── ui.js
  │           ├── constants.js
  │           └── state.js
  └── ui.js
```

## Benefits of This Structure

1. **Separation of Concerns** - Each module has a single, clear responsibility
2. **Maintainability** - Easy to find and update specific functionality
3. **Reusability** - Modules can be imported where needed
4. **Testability** - Individual modules can be tested in isolation
5. **Scalability** - Easy to add new features without cluttering existing code
