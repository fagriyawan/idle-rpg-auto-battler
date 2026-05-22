# Implementation Plan

## Overview

Implementation of the Web3 wallet authentication system (Login + Dashboard) for the idle RPG auto-battler game. This covers project setup, backend auth service with PostgreSQL, and React frontend with MetaMask integration.

## Tasks

- [x] 1. Project Setup and Structure
  - [x] 1.1 Create the `idle-rpg-auto-battler/` project root directory with `client/` and `server/` subdirectories
  - [x] 1.2 Initialize the `server/` package with package.json including dependencies: express, ethers, jsonwebtoken, pg, zod, dotenv, cors, and dev dependencies: typescript, ts-node, @types/express, @types/cors, @types/jsonwebtoken, @types/pg, nodemon
  - [x] 1.3 Initialize the `client/` package with Vite + React + TypeScript template, adding dependencies: ethers, react-router-dom
  - [x] 1.4 Create `server/tsconfig.json` with strict TypeScript configuration targeting ES2022/Node
  - [x] 1.5 Create `server/.env.example` with required environment variables: DATABASE_URL, JWT_SECRET, JWT_EXPIRATION, PORT, CLIENT_URL
  - [x] 1.6 Create `server/src/config.ts` that loads and validates environment variables using zod
- [x] 2. Database Setup
  - [x] 2.1 Create `server/src/db/connection.ts` with PostgreSQL connection pool using pg library and DATABASE_URL from config
  - [x] 2.2 Create `server/src/db/migrations/001_create_players.sql` with the players table schema (id UUID PK, wallet_address VARCHAR(42) UNIQUE, created_at, last_login_at)
  - [x] 2.3 Create `server/src/db/migrations/002_create_auth_nonces.sql` with the auth_nonces table schema (id UUID PK, wallet_address, nonce UNIQUE, created_at, expires_at, used BOOLEAN)
  - [x] 2.4 Create `server/src/db/migrate.ts` script that reads and executes SQL migration files in order
- [x] 3. Backend Auth Service
  - [x] 3.1 Create `server/src/types/index.ts` with TypeScript interfaces: Player, AuthNonce, VerifyRequest, NonceResponse, AuthResponse
  - [x] 3.2 Create `server/src/repositories/player.repository.ts` with functions: findByWalletAddress, createPlayer, updateLastLogin
  - [x] 3.3 Create `server/src/repositories/nonce.repository.ts` with functions: createNonce, findValidNonce, markNonceUsed
  - [x] 3.4 Create `server/src/services/auth.service.ts` with functions: generateNonce (creates nonce with 5-min expiry), verifySignature (ecrecover + JWT issuance), validateToken (JWT verification)
  - [x] 3.5 Create `server/src/middleware/auth.middleware.ts` that validates JWT from Authorization header and attaches player data to request
- [x] 4. Backend Routes and App Setup
  - [x] 4.1 Create `server/src/routes/auth.ts` with Express router: GET /api/auth/nonce, POST /api/auth/verify, GET /api/auth/me (protected)
  - [x] 4.2 Create `server/src/app.ts` with Express app setup: CORS config, JSON body parser, auth routes, error handling middleware
  - [x] 4.3 Create `server/src/index.ts` as the entry point that starts the Express server on configured port
  - [x] 4.4 Add npm scripts to server package.json: "dev" (nodemon), "build" (tsc), "start" (node dist/index.js), "migrate" (ts-node src/db/migrate.ts)
- [x] 5. Frontend Wallet Service
  - [x] 5.1 Create `client/src/types/index.ts` with TypeScript interfaces: Player, AuthState, WalletState
  - [x] 5.2 Create `client/src/services/wallet.ts` with functions: connectMetaMask (eth_requestAccounts), isMetaMaskInstalled, getWalletAddress, signMessage (personal_sign), onAccountChanged, onChainChanged
  - [x] 5.3 Create `client/src/services/api.ts` with functions: getNonce(walletAddress), verifySignature(walletAddress, signature, nonce), getMe(token) — all calling backend REST endpoints
- [x] 6. Frontend Auth Context and Hooks
  - [x] 6.1 Create `client/src/context/AuthContext.tsx` with React context providing: authState, player, walletAddress, login, logout, checkSession functions; persists JWT in localStorage
  - [x] 6.2 Create `client/src/hooks/useAuth.ts` custom hook that consumes AuthContext and provides typed access to auth state and actions
- [x] 7. Frontend Login Page
  - [x] 7.1 Create `client/src/components/LoginPage.tsx` with three states: disconnected (shows Connect/Create/Import buttons), connecting (loading indicator), authenticated (shows wallet address + Start Game button); returning player state (shows address + Start Game + Logout)
  - [x] 7.2 Create `client/src/components/WalletButton.tsx` reusable button component for wallet actions with loading and disabled states
  - [x] 7.3 Add MetaMask not-installed detection with link to MetaMask download page
  - [x] 7.4 Add error display with retry functionality for connection/signing failures
  - [x] 7.5 Style the login page with CSS Modules: centered layout, game logo placeholder, responsive design
- [x] 8. Frontend Dashboard and Routing
  - [x] 8.1 Create `client/src/components/Dashboard.tsx` displaying: truncated wallet address, welcome message, last login timestamp, Logout button
  - [x] 8.2 Create `client/src/App.tsx` with React Router: "/" route (LoginPage), "/dashboard" route (Dashboard, protected)
  - [x] 8.3 Create a ProtectedRoute wrapper component that redirects to "/" if no valid session exists
  - [x] 8.4 Style the dashboard with CSS Modules: simple card layout, wallet address display, responsive
- [x] 9. Integration and Testing
  - [x] 9.1 Add Vite proxy configuration in `client/vite.config.ts` to forward /api requests to the backend server during development
  - [x] 9.2 Create `server/src/__tests__/auth.service.test.ts` with unit tests for nonce generation, signature verification logic, and JWT token validation
  - [x] 9.3 Create `client/src/__tests__/wallet.test.ts` with unit tests for wallet service functions (mocking window.ethereum)
  - [x] 9.4 Add a root-level README.md with project setup instructions, environment variable documentation, and development workflow (how to run both client and server)

## Task Dependency Graph

```
1 --> 2 --> 3 --> 4
1 --> 5 --> 6 --> 7 --> 8
4, 8 --> 9
```

## Notes

- All file paths are relative to the `idle-rpg-auto-battler/` project root
- The project will be created as a new directory inside the current workspace
- PostgreSQL must be available locally or via Docker for the backend to function
- MetaMask browser extension is required for frontend wallet interactions
