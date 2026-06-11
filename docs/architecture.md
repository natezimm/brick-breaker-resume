# Architecture

## Runtime Topology

Brick Breaker Resume is a static Vite application powered by Phaser 3. The browser loads the generated resume data from `public/assets/resume.json`, starts the game scene from `main.js`, and serves production assets from `dist/`.

## Architecture Diagram

```mermaid
flowchart LR
  Player["Player browser"] --> Static["Vite static app<br/>index.html + main.js"]
  Static --> Phaser["Phaser 3 scene<br/>src/game.js"]
  Phaser --> Rules["Game modules<br/>bricks, layout, state, config"]
  Phaser --> UI["DOM UI helpers<br/>settings, overlays, HUD"]
  UI --> BrowserState["Browser persistence<br/>settings + high score"]
  Static --> Assets["Public assets<br/>sounds, icons, resume.json"]
  ResumeDoc["Resume .docx<br/>public/assets"] --> Generator["Resume parser<br/>scripts/generate_resume_json.js"]
  Generator --> Assets
  Repo["Repo quality gate<br/>npm run quality"] --> Prebuild["prebuild<br/>generate resume JSON"]
  Prebuild --> Build["Vite build<br/>dist/"]
  Build --> Deploy["GitHub Actions<br/>rsync to Lightsail"]

  classDef user fill:#f8fafc,stroke:#475569,color:#0f172a
  classDef site fill:#e0f2fe,stroke:#0369a1,color:#0c4a6e
  classDef server fill:#ffedd5,stroke:#c2410c,color:#7c2d12
  classDef repo fill:#eef2ff,stroke:#4338ca,color:#312e81
  classDef client fill:#dcfce7,stroke:#15803d,color:#14532d
  classDef data fill:#fef3c7,stroke:#b45309,color:#78350f
  classDef delivery fill:#f3e8ff,stroke:#7e22ce,color:#581c87
  classDef external fill:#fee2e2,stroke:#b91c1c,color:#7f1d1d
  class Player user
  class Static,Phaser,Rules,UI client
  class Assets,BrowserState,ResumeDoc data
  class Repo,Prebuild,Build,Deploy delivery
  class Generator server
```

## Source Boundaries

`main.js` wires app startup and UI integration. `src/` contains game state, Phaser scene logic, brick layout, UI helpers, settings, textures, and shared constants. `scripts/` owns resume document parsing and generated JSON refreshes.

## Quality Gates

Run `npm run quality` from the repo root. The gate checks Prettier formatting, ESLint, Jest coverage thresholds, resume generation through the Vite prebuild hook, and the production build.

## Deployment Flow

GitHub Actions runs the root quality gate for pull requests and pushes to `main`. Pushes to `main` upload the built `dist/` artifact, download it in the deploy job, sync it to Lightsail, and run a public health check.

## Workspace Connectivity

```mermaid
flowchart LR
  subgraph Workspace["Five repository workspace"]
    PortfolioRepo["nathanzimmerman.com<br/>portfolio"]
    BrickRepo["brick-breaker-resume<br/>Phaser resume game"]
    NerdleRepo["nerdle<br/>React + Express word game"]
    SudokuRepo["sudoku<br/>Angular + ASP.NET Core"]
    BlackjackRepo["blackjack<br/>React + Spring Boot"]
  end

  PortfolioRepo --> PortfolioSite["nathanzimmerman.com"]
  BrickRepo --> BrickSite["resume.nathanzimmerman.com"]
  NerdleRepo --> NerdleSite["nerdle.nathanzimmerman.com"]
  SudokuRepo --> SudokuSite["sudoku.nathanzimmerman.com"]
  BlackjackRepo --> BlackjackSite["blackjack.nathanzimmerman.com"]

  PortfolioSite --> BrickSite
  PortfolioSite --> NerdleSite
  PortfolioSite --> SudokuSite
  PortfolioSite --> BlackjackSite

  PortfolioRepo --> Actions["GitHub Actions<br/>quality + deploy workflows"]
  BrickRepo --> Actions
  NerdleRepo --> Actions
  SudokuRepo --> Actions
  BlackjackRepo --> Actions
  Actions --> Lightsail["AWS Lightsail<br/>static sites + app services"]
  Lightsail --> PortfolioSite
  Lightsail --> BrickSite
  Lightsail --> NerdleSite
  Lightsail --> SudokuSite
  Lightsail --> BlackjackSite

  classDef user fill:#f8fafc,stroke:#475569,color:#0f172a
  classDef site fill:#e0f2fe,stroke:#0369a1,color:#0c4a6e
  classDef server fill:#ffedd5,stroke:#c2410c,color:#7c2d12
  classDef repo fill:#eef2ff,stroke:#4338ca,color:#312e81
  classDef client fill:#dcfce7,stroke:#15803d,color:#14532d
  classDef data fill:#fef3c7,stroke:#b45309,color:#78350f
  classDef delivery fill:#f3e8ff,stroke:#7e22ce,color:#581c87
  classDef external fill:#fee2e2,stroke:#b91c1c,color:#7f1d1d
  class PortfolioRepo,BrickRepo,NerdleRepo,SudokuRepo,BlackjackRepo repo
  class PortfolioSite,BrickSite,NerdleSite,SudokuSite,BlackjackSite site
  class Actions,Lightsail delivery
```

## Deferred Architecture Follow-Ups

Keep Phaser module boundaries stable in this pass. Future work can separate rendering adapters from game rules more strictly and add a typed schema for generated resume data.
