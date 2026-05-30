import { query } from "../db/connection";

export interface MessageRow {
  id: string;
  player_id: string;
  sender: string;
  title: string;
  body: string;
  reward_type: string | null;
  reward_amount: number;
  claimed: boolean;
  read: boolean;
  created_at: Date;
}

export interface PlayerMessage {
  id: string;
  sender: string;
  title: string;
  body: string;
  rewardType: string | null;
  rewardAmount: number;
  claimed: boolean;
  read: boolean;
  createdAt: string;
}

function mapRowToMessage(row: MessageRow): PlayerMessage {
  return {
    id: row.id,
    sender: row.sender,
    title: row.title,
    body: row.body,
    rewardType: row.reward_type,
    rewardAmount: row.reward_amount,
    claimed: row.claimed,
    read: row.read,
    createdAt: row.created_at.toISOString(),
  };
}

export async function getMessages(playerId: string): Promise<PlayerMessage[]> {
  const result = await query<MessageRow>(
    "SELECT * FROM player_messages WHERE player_id = $1 ORDER BY created_at DESC",
    [playerId]
  );
  return result.rows.map(mapRowToMessage);
}

export async function getUnreadCount(playerId: string): Promise<number> {
  const result = await query<{ count: string }>(
    "SELECT COUNT(*) as count FROM player_messages WHERE player_id = $1 AND read = FALSE",
    [playerId]
  );
  return parseInt(result.rows[0].count, 10);
}

export async function getMessageById(
  messageId: string,
  playerId: string
): Promise<PlayerMessage | null> {
  const result = await query<MessageRow>(
    "SELECT * FROM player_messages WHERE id = $1 AND player_id = $2",
    [messageId, playerId]
  );
  if (result.rows.length === 0) return null;
  return mapRowToMessage(result.rows[0]);
}

export async function markAsRead(
  messageId: string,
  playerId: string
): Promise<PlayerMessage | null> {
  const result = await query<MessageRow>(
    "UPDATE player_messages SET read = TRUE WHERE id = $1 AND player_id = $2 RETURNING *",
    [messageId, playerId]
  );
  if (result.rows.length === 0) return null;
  return mapRowToMessage(result.rows[0]);
}

export async function markAsClaimed(
  messageId: string,
  playerId: string
): Promise<PlayerMessage | null> {
  const result = await query<MessageRow>(
    "UPDATE player_messages SET claimed = TRUE, read = TRUE WHERE id = $1 AND player_id = $2 AND claimed = FALSE RETURNING *",
    [messageId, playerId]
  );
  if (result.rows.length === 0) return null;
  return mapRowToMessage(result.rows[0]);
}

export async function createMessage(
  playerId: string,
  data: {
    sender: string;
    title: string;
    body: string;
    rewardType?: string;
    rewardAmount?: number;
  }
): Promise<PlayerMessage> {
  const result = await query<MessageRow>(
    `INSERT INTO player_messages (player_id, sender, title, body, reward_type, reward_amount)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      playerId,
      data.sender,
      data.title,
      data.body,
      data.rewardType || null,
      data.rewardAmount || 0,
    ]
  );
  return mapRowToMessage(result.rows[0]);
}

export async function deleteMessage(
  messageId: string,
  playerId: string
): Promise<boolean> {
  const result = await query(
    "DELETE FROM player_messages WHERE id = $1 AND player_id = $2",
    [messageId, playerId]
  );
  return (result.rowCount ?? 0) > 0;
}
