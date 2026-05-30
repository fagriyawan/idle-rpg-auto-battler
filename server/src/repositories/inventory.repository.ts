import { query } from "../db/connection";

interface InventoryItemRow {
  id: string;
  player_id: string;
  item_type: string;
  item_data: Record<string, unknown>;
  created_at: Date;
}

export interface InventoryItem {
  id: string;
  playerId: string;
  itemType: string;
  itemData: Record<string, unknown>;
  createdAt: string;
}

function mapRowToItem(row: InventoryItemRow): InventoryItem {
  return {
    id: row.id,
    playerId: row.player_id,
    itemType: row.item_type,
    itemData: row.item_data,
    createdAt: row.created_at.toISOString(),
  };
}

export async function getInventory(
  playerId: string,
  itemType?: string
): Promise<InventoryItem[]> {
  if (itemType) {
    const result = await query<InventoryItemRow>(
      "SELECT * FROM player_inventory WHERE player_id = $1 AND item_type = $2 ORDER BY created_at DESC",
      [playerId, itemType]
    );
    return result.rows.map(mapRowToItem);
  }

  const result = await query<InventoryItemRow>(
    "SELECT * FROM player_inventory WHERE player_id = $1 ORDER BY created_at DESC",
    [playerId]
  );
  return result.rows.map(mapRowToItem);
}

export async function getItemById(
  itemId: string,
  playerId: string
): Promise<InventoryItem | null> {
  const result = await query<InventoryItemRow>(
    "SELECT * FROM player_inventory WHERE id = $1 AND player_id = $2",
    [itemId, playerId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapRowToItem(result.rows[0]);
}

export async function addItem(
  playerId: string,
  itemType: string,
  itemData: Record<string, unknown>
): Promise<InventoryItem> {
  const result = await query<InventoryItemRow>(
    "INSERT INTO player_inventory (player_id, item_type, item_data) VALUES ($1, $2, $3) RETURNING *",
    [playerId, itemType, JSON.stringify(itemData)]
  );

  return mapRowToItem(result.rows[0]);
}

export async function removeItem(
  itemId: string
): Promise<InventoryItem | null> {
  const result = await query<InventoryItemRow>(
    "DELETE FROM player_inventory WHERE id = $1 RETURNING *",
    [itemId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapRowToItem(result.rows[0]);
}
