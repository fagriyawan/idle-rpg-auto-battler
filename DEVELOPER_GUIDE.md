# Idle RPG Auto-Battler — Developer Guide

Dokumentasi lengkap untuk programmer baru. Baca ini dari atas ke bawah.

---

## Quick Start (Cara Menjalankan)

### Prerequisites
- Node.js v18+
- PostgreSQL 18 (running di localhost:5432)
- Git + GitHub CLI (`gh`)

### Setup Database
```bash
# Buat database
psql -U postgres -c "CREATE DATABASE idle_rpg;"

# Jalankan semua migrations (dari folder server)
cd idle-rpg-auto-battler/server
npx ts-node src/db/migrate.ts

# Seed wave data (enemy per stage per difficulty)
npx ts-node src/db/seed-waves.ts
```

### Jalankan Server
```bash
cd idle-rpg-auto-battler/server
npm install
npm run dev
# Server jalan di http://localhost:3001
```

### Jalankan Client
```bash
cd idle-rpg-auto-battler/client
npm install
npm run dev
# Client jalan di http://localhost:5173
```

---

## Project Structure

```
idle-rpg-auto-battler/
├── client/                    # Frontend (React + Vite + TypeScript)
│   ├── public/assets/         # Static assets (spine characters, images)
│   │   ├── heroes/used_char/  # Spine JSON + Atlas + PNG per hero (folder = heroTemplateId)
│   │   ├── battle_bg.png      # Battle background image
│   │   └── ...
│   ├── src/
│   │   ├── components/        # React components (UI)
│   │   ├── context/           # React Context (PlayerDataContext)
│   │   ├── engine/            # BattleEngine (game logic, tick loop)
│   │   ├── hooks/             # Custom hooks (usePixiApp, useSpineLoader)
│   │   ├── services/          # API calls to server
│   │   ├── types/             # TypeScript interfaces
│   │   └── utils/             # Utilities (spine cache, VFX, hero display)
│   └── package.json
├── server/                    # Backend (Express + TypeScript + PostgreSQL)
│   ├── src/
│   │   ├── config/            # Game constants, env config
│   │   ├── db/                # Database connection, migrations, seed scripts
│   │   ├── middleware/        # Auth middleware (JWT)
│   │   ├── repositories/     # Database queries (SQL)
│   │   ├── routes/            # API endpoints
│   │   ├── services/          # Business logic
│   │   ├── types/             # TypeScript interfaces
│   │   ├── utils/             # Utilities
│   │   └── validators/        # Zod schemas
│   ├── .env                   # Environment variables (DB URL, JWT secret)
│   └── package.json
└── DEVELOPER_GUIDE.md         # File ini
```

---

## Database Tables

Connection: `postgresql://postgres:MoonlakeHigh123@localhost:5432/idle_rpg`

### Player Tables

| Table | Kegunaan |
|-------|----------|
| `players` | Data player: wallet_address, display_name, level, experience |
| `auth_nonces` | Challenge nonces untuk wallet authentication |
| `player_resources` | Gold, Gems, Energy per player |
| `player_heroes` | Hero yang dimiliki player (level, stars, attributes, skills, runes, **experience**) |
| `player_formations` | Formasi battle (array of hero IDs + positions) |
| `player_inventory` | Items (runes) yang dimiliki player |
| `player_messages` | Inbox messages (welcome gift, rewards) |

### Game Data Tables (Master Data)

| Table | Kegunaan |
|-------|----------|
| `hero_templates` | Master data 21 hero: nama, class, base stats, combat_type, attack_range, skills, spine_asset_key |
| `campaign_chapters` | Chapter info (id, title, description) |
| `campaign_stages` | Stage info (id, title, energy_cost, recommended_level, rewards, enemies) |
| `stage_waves` | **Enemy data per wave per difficulty** (stage_id, difficulty, wave_number, enemies JSONB) |
| `stage_difficulty_rewards` | **Rewards per stage per difficulty** (gold, gems, player_xp, hero_xp) |

### Progress Tables

| Table | Kegunaan |
|-------|----------|
| `player_stage_progress` | Legacy: track stage clear (stars, clear_count) |
| `player_difficulty_progress` | **New**: track clear per difficulty mode (easy/hard/nightmare) |

---

## Key Concepts

### Authentication Flow
1. Client connect MetaMask / create wallet / import wallet
2. `GET /api/auth/nonce` → server generate challenge
3. Client sign challenge with private key
4. `POST /api/auth/verify` → server verify signature, issue JWT (24h)
5. All subsequent API calls use `Authorization: Bearer <JWT>`

### Hero System
- 21 heroes total (6 removed karena animation bugs)
- Each hero punya: level, stars, experience, attributes (attack/armor/hp), skills, runes
- **combat_type**: melee, mage, ranged, support — determines battle behavior
- **Spine assets**: di `public/assets/heroes/used_char/{heroTemplateId}/`
- **Animation prefix**: mapping di `client/src/utils/hero-display.ts` (ANIM_PREFIX)

### Battle System (Multi-Wave)
1. Player pilih stage + difficulty di Campaign Panel
2. `GET /api/battle/stage/:stageId/init?difficulty=easy` → return 3 waves + player units
3. BattlePage creates BattleEngine for wave 1
4. When all enemies die → 2s transition → spawn wave 2 (HP persists, mana resets)
5. After wave 3 → Victory Screen → `POST /api/campaign/stages/:stageId/clear`
6. Server awards: gold, gems, player XP, hero XP

### Battle Engine (`client/src/engine/BattleEngine.ts`)
- Runs at 60fps (requestAnimationFrame), emits state at 30fps
- Units move in 2D toward nearest enemy
- Attack cooldown system (min 1.5s = animation duration)
- Damage queued with delay (melee: 0.5s, ranged: 0.8s) to sync with animation
- Ultimate/skill fires when mana full (1000 mana)
- No setTimeout — all timing via internal tick counters

### Difficulty Modes
- **Easy** (1.0x stats): always unlocked
- **Hard** (1.8x stats, 2x rewards): unlock after clearing ALL 10 Easy stages
- **Nightmare** (3.0x stats, 3.5x rewards): unlock after clearing ALL 10 Hard stages

### Hero XP System
- Formula: `heroXpForLevel(N) = 500 * N * (N-1) / 2`
- Level 1→2: 500 XP, Level 5→6: 2500 XP, Level 10→11: 5000 XP
- XP gained from battle = `hero_xp` from `stage_difficulty_rewards` table
- Auto level-up when accumulated XP crosses threshold

### Player XP System
- Formula: `experienceForLevel(N) = 100 * N * (N-1) / 2`
- XP gained from battle = `player_xp` from `stage_difficulty_rewards` table

---

## Important Files

### Client Components
| File | Kegunaan |
|------|----------|
| `Dashboard.tsx` | Main game screen (HUD, navigation, panels) |
| `BattlePage.tsx` | Full-screen battle (wave management, engine lifecycle) |
| `BattleCanvas.tsx` | PixiJS canvas rendering all spine heroes + HP bars |
| `VictoryScreen.tsx` | Win screen (hero joy animation, level progress, rewards) |
| `CampaignPanel.tsx` | Stage selection map + difficulty tabs |
| `HeroesPanel.tsx` | Hero grid (shared canvas for all heroes) |
| `FormationPanel.tsx` | Formation editor (drag heroes to slots) |
| `SpineRenderer/` | Individual spine renderer (for detail panels) |

### Client Utils
| File | Kegunaan |
|------|----------|
| `hero-display.ts` | Animation name mapping (ANIM_PREFIX, SKILL_MAP), spine asset URLs |
| `spine-asset-cache.ts` | Preload & cache spine skeleton data |
| `battle-vfx.ts` | Particle effects (slash, magic burst, heal, hit impact) |
| `spine/animation-resolver.ts` | Find best animation from available list |
| `spine/texture-cache.ts` | Shared texture cache for WebGL |

### Server Routes
| Route | Method | Kegunaan |
|-------|--------|----------|
| `/api/auth/nonce` | GET | Generate auth challenge |
| `/api/auth/verify` | POST | Verify wallet signature, issue JWT |
| `/api/player/profile` | GET | Get player profile + resources + heroes |
| `/api/player/heroes` | GET | Get all player heroes |
| `/api/player/formation` | GET/PUT | Get/save formation |
| `/api/battle/stage/:id/init` | GET | Init battle (waves + player units) |
| `/api/campaign/chapters/:id` | GET | Get chapter with stages + unlock status |
| `/api/campaign/stages/:id/clear` | POST | Record stage clear, award rewards |

---

## Database Migrations (in order)

Run all with: `npx ts-node src/db/migrate.ts` (dari folder server)

| # | File | Kegunaan |
|---|------|----------|
| 001 | create_players | Table players |
| 002 | create_auth_nonces | Auth nonces |
| 003 | extend_players | Add display_name, level, experience |
| 004 | create_player_resources | Gold, gems, energy |
| 005 | create_player_heroes | Player's owned heroes |
| 006 | create_player_formations | Formation slots |
| 007 | create_player_inventory | Items/runes |
| 008 | create_player_messages | Inbox messages |
| 009 | create_hero_templates | Master hero data |
| 010 | seed_hero_templates | Insert 8 original heroes |
| 011 | update_formations_with_positions | Add position data |
| 012 | create_campaign_tables | Chapters, stages, progress |
| 013 | seed_campaign_chapter1 | Insert 10 stages |
| 014 | add_combat_stats_to_hero_templates | Battle stats columns |
| 015 | add_battle_data_to_stages | Enemy combat data |
| 016 | update_campaign_enemies | Full enemy stats |
| 017 | replace_heroes_with_new_chars | Replace with 27 new heroes |
| 018 | fix_hero_combat_types | Fix combat_type from classMap |
| 019 | fix_hero_types_and_skills | Remove 6 bugged heroes, fix types |
| 020 | add_hero_experience | Add experience column to player_heroes |
| 021 | wave_and_difficulty_system | Create stage_waves, stage_difficulty_rewards, player_difficulty_progress |
| 022 | seed_waves_chapter1 | (Partial — use seed-waves.ts instead) |

**Important**: After migrations, run `npx ts-node src/db/seed-waves.ts` to populate wave data.

---

## Environment Variables (server/.env)

```
DATABASE_URL=postgresql://postgres:MoonlakeHigh123@localhost:5432/idle_rpg
JWT_SECRET=your-secret-key-here
```

---

## Common Tasks

### Add a new hero
1. Add spine files to `client/public/assets/heroes/used_char/{id}/`
2. Add ANIM_PREFIX mapping in `client/src/utils/hero-display.ts`
3. Add SKILL_MAP entry in same file
4. INSERT into `hero_templates` table via migration

### Add a new stage
1. INSERT into `campaign_stages`
2. INSERT 9 rows into `stage_waves` (3 waves × 3 difficulties)
3. INSERT 3 rows into `stage_difficulty_rewards`

### Change battle balance
- Enemy stats: edit `stage_waves.enemies` JSONB
- Rewards: edit `stage_difficulty_rewards`
- Hero stats: edit `hero_templates` (base_attack, base_armor, base_hp, etc.)
- XP formula: edit `server/src/config/game-constants.ts`

---

## Tech Stack
- **Frontend**: React 19, TypeScript, Vite, PixiJS 7, pixi-spine, CSS Modules
- **Backend**: Express.js, TypeScript, PostgreSQL 18, JWT, Zod
- **Auth**: Web3 wallet (MetaMask / ethers.js)
- **Animation**: Spine 3.6/3.8 (pixi-spine runtime)
- **Build**: Vite (client), ts-node + nodemon (server)
