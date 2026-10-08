# Brick Breaker Resume agent guide

## Scope and workspace

This is a static Phaser 3 game built with Vite. Resume text becomes breakable bricks; browser storage holds the theme and high score. It is linked from the separately maintained portfolio in `../nathanzimmerman.com` and deployed at `resume.nathanzimmerman.com`.

The portfolio, this repo, `../nerdle`, `../blackjack`, and `../sudoku` are independent Git repositories. Read each repo's guide before editing it. Check the working tree and preserve unrelated changes. See `docs/architecture.md` for design context; keep this guide aligned with executable configuration.

## Where to work

- `index.html` and `main.js`: browser entry and UI wiring. Phaser is imported and started only after the Start button is clicked.
- `src/game.js`: scene lifecycle and gameplay; `src/state.js`: scene-owned runtime state; `src/config.js` and `src/constants.js`: Phaser configuration and shared constants.
- `src/bricks.js`, `src/brickLayout.js`, and `src/textures.js`: brick creation, layout, and generated textures. The game and start overlay share the layout calculation.
- `src/ui.js`, `src/settings.js`, and `src/overlay.js`: DOM UI, settings, and overlays; `styles/*.css` are linked directly from `index.html` (`style.css` is only a placeholder).
- `scripts/generate_resume_json.js`: CommonJS resume parser using Mammoth and JSDOM.
- `public/assets/Nathan Zimmerman Resume.docx`: resume source; `public/assets/resume.json`: generated data. The README's older `assets/` paths omit `public/`.
- `tests/`: Jest units, including `mockScene.js` and `setupTests.js`; `e2e/brick-breaker.spec.js`: real-browser gameplay checks.

## Commands and runtime caveat

Run commands from the repository root. `.nvmrc` and CI select Node 22, but `package.json` declares Node 26. This unresolved mismatch may cause engine warnings or failures depending on npm configuration; record the runtime when diagnosing them.

- Install: `npm ci`.
- Develop: `npm run dev` (port **8080**, automatically opens a browser).
- Build: `npm run build` produces `dist/`; `npm start` previews the build.
- Regenerate resume data: `npm run generate:resume`. Both development and build commands invoke this through lifecycle hooks.
- Unit tests: `npm test`; target a file with `npm test -- --runInBand tests/bricks.test.js`.
- Lint/coverage: `npm run lint` and `npm run test:coverage`.
- Browser tests: `npm run test:e2e`; install Chromium with `npx playwright install chromium` if needed.
- Full CI gate: `npm run quality` runs formatting, lint, Jest coverage, and Playwright; Playwright invokes the production build and resume generation.
- Documentation-only checks: `npx prettier --check <files>`.

## Behavior to preserve

- Update resume source or parser logic before regenerating JSON; direct JSON edits are overwritten by the next development/build run. The parser emits an array of `{ tag, text }` entries; review the tracked `public/assets/resume.json` diff after regeneration.
- Preserve pause/resume and countdown behavior, settings-modal auto-pause, resize handling, mouse/touch controls, scoring, and persisted high scores.
- Access active scene state through the helpers in `src/state.js`; the exported `gameState` singleton is a fallback, while gameplay attaches its own state to the scene.
- Render resume text with `textContent` and retain validation of stored theme, high score, and asset paths. Other gameplay settings are currently session-only.
- Browser modules use ES imports. The resume parser and ESLint config use CommonJS; Jest transforms application imports with Babel (`jest.config.cjs`, `babel.config.cjs`). Changing package module type affects these boundaries.

## Verification and delivery

Run checks appropriate to the change, using `npm run quality` for broad application changes. Use `tests/mockScene.js` for logic tests and Playwright for canvas/DOM integration on desktop and mobile. Coverage thresholds live in `jest.config.cjs`. Report failures and unrun checks; format only changed files.

Playwright hardcodes port **4173**, shared with the sibling repos, and reuses an existing server outside CI. Stop unrelated preview servers before testing and run sibling browser suites sequentially to avoid testing the wrong app.

`.github/workflows/deploy.yml` runs CI on pull requests and pushes to `main`, then deploys the built `dist/` artifact to GCP only for successful pushes to `main`. Keep deployment within the requested scope and edit sources rather than generated build/test output.
