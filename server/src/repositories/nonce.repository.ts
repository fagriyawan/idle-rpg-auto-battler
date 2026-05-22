import { query } from "../db/connection";
import { AuthNonce } from "../types";

interface AuthNonceRow {
  id: string;
  wallet_address: string;
  nonce: string;
  created_at: Date;
  expires_at: Date;
  used: boolean;
}

function mapRowToAuthNonce(row: AuthNonceRow): AuthNonce {
  return {
    id: row.id,
    walletAddress: row.wallet_address,
    nonce: row.nonce,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    used: row.used,
  };
}

export async function createNonce(
  walletAddress: string,
  nonce: string,
  expiresAt: Date
): Promise<AuthNonce> {
  const normalized = walletAddress.toLowerCase();
  const result = await query<AuthNonceRow>(
    "INSERT INTO auth_nonces (wallet_address, nonce, expires_at) VALUES ($1, $2, $3) RETURNING *",
    [normalized, nonce, expiresAt]
  );

  return mapRowToAuthNonce(result.rows[0]);
}

export async function findValidNonce(
  nonce: string
): Promise<AuthNonce | null> {
  const result = await query<AuthNonceRow>(
    "SELECT * FROM auth_nonces WHERE nonce = $1 AND used = FALSE AND expires_at > NOW()",
    [nonce]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapRowToAuthNonce(result.rows[0]);
}

export async function markNonceUsed(nonce: string): Promise<void> {
  await query(
    "UPDATE auth_nonces SET used = TRUE WHERE nonce = $1",
    [nonce]
  );
}
