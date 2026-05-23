# Project Context — Idle RPG Auto-Battler

## Status: Phase 2 In Progress (Dashboard + Heroes Panel)

## What Has Been Built

### Backend (idle-rpg-auto-battler/server/)
- Express.js + TypeScript server on port 3001
- PostgreSQL database with `players` and `auth_nonces` tables
- Web3 wallet authentication (Sign-In with Ethereum pattern):
  - GET /api/auth/nonce — generates challenge nonce
  - POST /api/auth/verify — verifies signature, issues JWT
  - GET /api/auth/me — validates session, returns player
- JWT-based session management (24h expiry)
- Zod validation, CORS, error handling middleware
- Unit tests (10 tests, all passing via Vitest)

### Frontend (idle-rpg-auto-battler/client/)
- React 19 + TypeScript + Vite on port 5173
- Login page with video background (login_background_3d.mp4)
- Three login methods:
  1. Connect MetaMask (browser extension)
  2. Create New Wallet (generates private key client-side via ethers.js)
  3. Import Wallet (paste private key to login)
- Auth flow: Welcome → Start Play → Options → Login → Dashboard
- Protected routes with ProtectedRoute component
- **Dashboard** with game-style HUD:
  - Top-left: Player avatar + wallet address + level
  - Top-right: Resources (Gold, Gems, Energy)
  - Center: Arena/stage area with gradient landscape background
  - Bottom-right: Nav menu (Campaign, Heroes, Summon, Inventory, Formation)
- **Heroes Panel** (popup when clicking Heroes):
  - Grid layout with hero cards
  - Each card: level badge, name, class icon, character area, active badge, stars
  - Currently using SpineCharacter component (needs PixiJS integration)
- CSS Modules with game-friendly button styles
- Unit tests (10 tests, all passing via Vitest)

### Database
- PostgreSQL 18 running locally
- Database: idle_rpg
- Tables: players, auth_nonces
- Connection: postgresql://postgres:MoonlakeHigh123@localhost:5432/idle_rpg

## Key Technical Decisions
- No XAMPP needed — Node.js + PostgreSQL only
- ethers.js v6 for wallet operations (both client and server)
- Private keys for Create/Import wallet are handled client-side only
- Timestamp removed from sign message (was causing verification failures due to PostgreSQL precision)
- User-friendly error messages (raw MetaMask errors are caught and simplified)
- Dashboard bottom nav positioned bottom-right (chibi anime style)
- Video background on login page, gradient background on dashboard

## What's Next — Spine Integration (PRIORITY)

### Problem
Hero characters need to be rendered with Spine 2D animations (idle, walk, attack, etc.)

### Assets Structure
Located at: `client/public/assets/heroes/`
- **001/** — Spine 3.6 JSON format (`cream_arcade_000.json` + `.atlas` + `.png`)
- **003/** — Spine 3.6 Binary format (`L05001.skel` + `.atlas` + `.png`)
- **004/** — Spine 3.8 Binary format (`H30103.skel` + `.atlas` + `.png` + `H301032.png`)
- **005/** — Spine 3.6 Binary format (`crew110016.skel` + `.atlas` + `.png`)
- **006/** — Spine 3.6 Binary format (`crew110026.skel` + `.atlas` + `.png`)
- **007/** — Spine 3.6 Binary format (`crew130004.skel` + `.atlas` + `.png`)

### Reference Implementation
Working example at: https://github.com/fagriyawan/fagriyawan.github.io/tree/fix/character-select-spine-loading
- Uses PixiJS + pixi-spine
- Has custom `spine36-skel2json.js` for converting binary .skel to JSON
- Handles 3 formats: json36, skel36, skel38
- Key file: `heroes/character-select.html` (contains all loading logic)

### Approach for Integration
1. Install `pixi.js` + `pixi-spine` (or `@pixi-spine/all`)
2. Port the loading logic from character-select.html to a React component
3. Handle all 3 Spine formats (json36, skel36, skel38)
4. Include the `spine36-skel2json.js` converter
5. Create a PixiJS canvas per hero card (or shared canvas)
6. Play "Idle" animation by default (auto-detect: idle/wait/stand)

### Current SpineCharacter.tsx
Currently uses `@esotericsoftware/spine-player` which may NOT work with .skel binary format.
NEEDS TO BE REPLACED with PixiJS + pixi-spine approach.

## GitHub
- Repo: https://github.com/fagriyawan/idle-rpg-auto-battler (private)
- Account: fagriyawan
- Git + GitHub CLI installed and authenticated

## How to Run
1. Start server: `cd idle-rpg-auto-battler/server && npm run dev`
2. Start client: `cd idle-rpg-auto-battler/client && npm run dev`
3. Open http://localhost:5173

## Future Features (After Spine)
- Summon/Gacha system
- Campaign/Adventure stages
- Formation (drag & drop heroes)
- Inventory
- Player Profile (username setting)
