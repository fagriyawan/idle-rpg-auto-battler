import { query } from "../db/connection";
import { Player } from "../types";

interface PlayerRow {
  id: string;
  wallet_address: string;
  created_at: Date;
  last_login_at: Date;
}

function mapRowToPlayer(row: PlayerRow): Player {
  return {
    id: row.id,
    walletAddress: row.wallet_address,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at,
  };
}

export async function findByWalletAddress(
  walletAddress: string
): Promise<Player | null> {
  const normalized = walletAddress.toLowerCase();
  const result = await query<PlayerRow>(
    "SELECT * FROM players WHERE wallet_address = $1",
    [normalized]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapRowToPlayer(result.rows[0]);
}

export async function createPlayer(walletAddress: string): Promise<Player> {
  const normalized = walletAddress.toLowerCase();
  const result = await query<PlayerRow>(
    "INSERT INTO players (wallet_address) VALUES ($1) RETURNING *",
    [normalized]
  );

  return mapRowToPlayer(result.rows[0]);
}

export async function updateLastLogin(walletAddress: string): Promise<void> {
  const normalized = walletAddress.toLowerCase();
  await query(
    "UPDATE players SET last_login_at = NOW() WHERE wallet_address = $1",
    [normalized]
  );
}
