# Design Document

## Overview

This design covers the Web3 wallet authentication system for the idle RPG auto-battler game. The system consists of a React-based frontend with ethers.js for wallet interactions and a Node.js/Express backend with PostgreSQL for player data persistence. Authentication uses the Sign-In with Ethereum (SIWE) pattern: the backend issues a nonce challenge, the player signs it with MetaMask, and the backend verifies the signature to issue a JWT.

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Game Client (Frontend)                 │
│  React + TypeScript + Vite + ethers.js                   │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐             │
│  │Login Page│  │Auth Flow │  │ Dashboard │             │
│  │Component │  │ Service  │  │ Component │             │
│  └──────────┘  └──────────┘  └───────────┘             │
│        │              │              │                    │
│        └──────────────┼──────────────┘                   │
│                       │                                  │
│              ┌────────────────┐                          │
│              │  Wallet Service │                          │
│              │  (ethers.js)    │                          │
│              └────────────────┘                          │
└───────────────────────┼─────────────────────────────────┘
                        │ HTTP/REST
┌───────────────────────┼─────────────────────────────────┐
│                 Backend Service                           │
│  Node.js + Express + TypeScript                          │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐         │
│  │Auth Route│  │Auth      │  │Session        │         │
│  │Controller│  │Service   │  │Middleware     │         │
│  └──────────┘  └──────────┘  └───────────────┘         │
│        │              │              │                    │
│        └──────────────┼──────────────┘                   │
│                       │                                  │
│              ┌────────────────┐                          │
│              │Player Repository│                          │
│              │  (PostgreSQL)   │                          │
│              └────────────────┘                          │
└─────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
Player          Game_Client         Backend_Service        Database
  │                  │                    │                    │
  │─Click Connect──▶│                    │                    │
  │                  │─eth_requestAccounts▶│                   │
  │◀─Sign Popup────│ (MetaMask)          │                    │
  │─Approve────────▶│                    │                    │
  │                  │─GET /auth/nonce───▶│                    │
  │                  │◀─nonce + message──│                    │
  │                  │─personal_sign─────▶│                   │
  │◀─Sign Popup────│ (MetaMask)          │                    │
  │─Sign───────────▶│                    │                    │
  │                  │─POST /auth/verify─▶│                    │
  │                  │                    │─ecrecover──────────│
  │                  │                    │─upsert player─────▶│
  │                  │                    │◀─player record─────│
  │                  │◀─JWT token────────│                    │
  │◀─Show Address──│                    │                    │
  │  + Start Game   │                    │                    │
```

### Returning Player Flow

```
Player          Game_Client         Backend_Service
  │                  │                    │
  │─Open Game──────▶│                    │
  │                  │─Check localStorage─│
  │                  │  (JWT exists?)      │
  │                  │─GET /auth/me───────▶│
  │                  │  (validate JWT)     │
  │                  │◀─player data───────│
  │◀─Show Address──│                    │
  │  + Start Game   │                    │
  │  + Logout       │                    │
  │                  │                    │
  │─Click Start────▶│                    │
  │◀─Dashboard─────│                    │
```

## Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Wallet Library**: ethers.js v6 (for MetaMask interaction, signature verification)
- **HTTP Client**: fetch API (native)
- **Routing**: React Router v6
- **State Management**: React Context + useReducer (lightweight, sufficient for auth state)
- **Styling**: CSS Modules (simple, no extra dependency)

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js with TypeScript
- **Authentication**: JWT (jsonwebtoken library)
- **Signature Verification**: ethers.js v6 (verifyMessage)
- **Database**: PostgreSQL with pg (node-postgres) driver
- **Validation**: zod (request validation)
- **Environment Config**: dotenv

### Database
- **Engine**: PostgreSQL 15+
- **Schema Management**: Raw SQL migrations (simple for initial phase)

## Database Schema

```sql
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(42) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_players_wallet_address ON players(wallet_address);

CREATE TABLE auth_nonces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(42) NOT NULL,
    nonce VARCHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_auth_nonces_nonce ON auth_nonces(nonce);
CREATE INDEX idx_auth_nonces_wallet ON auth_nonces(wallet_address);
```

## API Design

### Endpoints

#### `GET /api/auth/nonce?walletAddress={address}`
Request a signature challenge nonce.

**Response 200:**
```json
{
  "nonce": "a1b2c3d4...",
  "message": "Sign this message to authenticate with Idle RPG.\n\nWallet: 0x1234...abcd\nNonce: a1b2c3d4...\nTimestamp: 2024-01-15T10:30:00Z"
}
```

#### `POST /api/auth/verify`
Verify signed message and authenticate.

**Request:**
```json
{
  "walletAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "signature": "0x...",
  "nonce": "a1b2c3d4..."
}
```

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "player": {
    "id": "uuid",
    "walletAddress": "0x1234567890abcdef1234567890abcdef12345678",
    "createdAt": "2024-01-15T10:30:00Z",
    "lastLoginAt": "2024-01-15T10:30:00Z"
  }
}
```

**Response 401:**
```json
{
  "error": "Invalid signature"
}
```

#### `GET /api/auth/me`
Get current authenticated player info (validates session).

**Headers:** `Authorization: Bearer {token}`

**Response 200:**
```json
{
  "player": {
    "id": "uuid",
    "walletAddress": "0x1234567890abcdef1234567890abcdef12345678",
    "createdAt": "2024-01-15T10:30:00Z",
    "lastLoginAt": "2024-01-15T10:30:00Z"
  }
}
```

**Response 401:**
```json
{
  "error": "Invalid or expired token"
}
```

## Project Structure

```
idle-rpg-auto-battler/
├── client/                     # Frontend (React + Vite)
│   ├── public/
│   │   └── assets/            # Game logo, icons
│   ├── src/
│   │   ├── components/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   └── WalletButton.tsx
│   │   ├── services/
│   │   │   ├── wallet.ts      # MetaMask interaction
│   │   │   └── api.ts         # Backend API calls
│   │   ├── context/
│   │   │   └── AuthContext.tsx # Auth state management
│   │   ├── hooks/
│   │   │   └── useAuth.ts     # Auth hook
│   │   ├── types/
│   │   │   └── index.ts       # Shared types
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── server/                     # Backend (Express)
│   ├── src/
│   │   ├── routes/
│   │   │   └── auth.ts        # Auth endpoints
│   │   ├── services/
│   │   │   └── auth.service.ts # Auth business logic
│   │   ├── middleware/
│   │   │   └── auth.middleware.ts # JWT validation
│   │   ├── repositories/
│   │   │   └── player.repository.ts # DB queries
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── db/
│   │   │   ├── connection.ts  # PG pool setup
│   │   │   └── migrations/
│   │   │       └── 001_create_players.sql
│   │   ├── config.ts          # Environment config
│   │   └── app.ts             # Express app setup
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
└── README.md
```

## Component Design

### Frontend Components

#### LoginPage
- **State**: `disconnected` | `connecting` | `connected` | `authenticating` | `authenticated`
- **Disconnected view**: Shows game logo, "Connect with MetaMask", "Create Wallet", "Import Wallet" buttons
- **Connected view**: Shows wallet address (truncated), "Start Game" button
- **Returning player view**: Shows wallet address, "Start Game" button, "Logout" button
- **Error handling**: Displays error messages with retry option

#### Dashboard
- **Protected route**: Redirects to login if no valid session
- **Displays**: Wallet address, welcome message, last login time, "Logout" button
- **Placeholder**: Space for future game content

#### AuthContext
- **Manages**: JWT token, player data, wallet connection state
- **Persists**: Token in localStorage
- **Provides**: login, logout, checkSession functions

### Backend Services

#### AuthService
- `generateNonce(walletAddress)`: Creates and stores a nonce with 5-minute expiration
- `verifySignature(walletAddress, signature, nonce)`: Validates signature, marks nonce as used, creates/updates player, issues JWT
- `validateToken(token)`: Verifies JWT and returns player data

#### PlayerRepository
- `findByWalletAddress(address)`: Lookup player by normalized wallet address
- `createPlayer(walletAddress)`: Insert new player record
- `updateLastLogin(walletAddress)`: Update last_login_at timestamp

## Security Considerations

1. **Nonce expiration**: Nonces expire after 5 minutes to limit replay window
2. **One-time nonces**: Each nonce can only be used once (marked as `used` after verification)
3. **Wallet address normalization**: All addresses stored and compared in lowercase
4. **JWT secret**: Stored in environment variable, never committed to code
5. **CORS**: Backend restricts origins to the frontend domain
6. **Input validation**: All request bodies validated with zod schemas
7. **SQL injection prevention**: Parameterized queries via node-postgres

## Correctness Properties

1. **Round-trip: Wallet address normalization** — For all valid Ethereum addresses, normalizing (lowercasing) then comparing two representations of the same address SHALL produce equality
2. **Idempotence: Player lookup** — Looking up the same wallet address multiple times SHALL return the same player record
3. **Invariant: Nonce single-use** — After a nonce is used for verification, attempting to use the same nonce again SHALL fail
4. **Invariant: JWT validation** — A JWT issued by the Backend_Service SHALL validate successfully until expiration; a tampered JWT SHALL always fail validation
5. **Error condition: Invalid signature** — A signature produced by a different wallet than the claimed address SHALL always fail verification
