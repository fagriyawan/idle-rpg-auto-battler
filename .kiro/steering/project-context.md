# Project Context — Idle RPG Auto-Battler

## Status: Phase 1 Complete (Login + Dashboard)

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
- Auth flow: Welcome → Options → Login → Dashboard
- Protected routes with ProtectedRoute component
- Simple dashboard showing wallet address + logout
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

## What's Next (Phase 2)
- Dashboard redesign with game UI/menus
- User is looking for references/inspiration for the dashboard layout
- Potential features: hero collection, battle system, idle rewards, etc.

## How to Run
1. Start server: `cd idle-rpg-auto-battler/server && npm run dev`
2. Start client: `cd idle-rpg-auto-battler/client && npm run dev`
3. Open http://localhost:5173

## Not Yet Done
- Git/GitHub setup (Git not installed on this machine yet)
- Dashboard game UI design
- Any game mechanics (heroes, battles, gacha, etc.)
