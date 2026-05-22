# Idle RPG Auto-Battler

A Web3-enabled idle RPG auto-battler game with MetaMask wallet authentication. Players connect their Ethereum wallet to sign in, and the server verifies ownership via signature verification (EIP-191).

## Prerequisites

- **Node.js** 20+
- **PostgreSQL** 15+
- **MetaMask** browser extension

## Getting Started

### Server Setup

```bash
cd idle-rpg-auto-battler/server
npm install
```

Copy the environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials and a secure JWT secret (see [Environment Variables](#environment-variables) below).

Run database migrations and start the dev server:

```bash
npm run migrate
npm run dev
```

The server runs on **http://localhost:3001**.

### Client Setup

```bash
cd idle-rpg-auto-battler/client
npm install
npm run dev
```

The client runs on **http://localhost:5173**.

## Environment Variables

Configure these in `server/.env` (see `server/.env.example`):

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:password@localhost:5432/idle_rpg` |
| `JWT_SECRET` | Secret key for signing JWT tokens (use a strong random string) | — |
| `JWT_EXPIRATION` | JWT token expiration time | `24h` |
| `PORT` | Server port | `3001` |
| `CLIENT_URL` | Frontend URL for CORS configuration | `http://localhost:5173` |

## Development Workflow

Run both the server and client in separate terminals:

**Terminal 1 — Server:**
```bash
cd idle-rpg-auto-battler/server
npm run dev
```

**Terminal 2 — Client:**
```bash
cd idle-rpg-auto-battler/client
npm run dev
```

The client proxies API requests to the server. Open http://localhost:5173 in a browser with MetaMask installed to use the app.

## Available Scripts

### Server (`server/`)

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `npm run dev` | Start dev server with hot reload (nodemon + ts-node) |
| `build` | `npm run build` | Compile TypeScript to JavaScript |
| `start` | `npm run start` | Run compiled production build |
| `migrate` | `npm run migrate` | Run database migrations |
| `test` | `npm test` | Run tests with Vitest |

### Client (`client/`)

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `npm run dev` | Start Vite dev server with HMR |
| `build` | `npm run build` | Type-check and build for production |
| `preview` | `npm run preview` | Preview production build locally |
| `lint` | `npm run lint` | Run ESLint |
| `test` | `npm test` | Run tests with Vitest |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, React Router |
| Backend | Express, TypeScript, Node.js |
| Database | PostgreSQL, pg (node-postgres) |
| Auth | MetaMask wallet, ethers.js (EIP-191 signature verification), JWT |
| Validation | Zod |
| Testing | Vitest |

## Testing

Run server tests:

```bash
cd idle-rpg-auto-battler/server
npm test
```

Run client tests:

```bash
cd idle-rpg-auto-battler/client
npm test
```
