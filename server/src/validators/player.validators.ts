import { z } from "zod";
import { MAX_FORMATION_SIZE, RUNE_SLOTS_PER_HERO } from "../config/game-constants";

// Display name: 3–20 characters, alphanumeric and underscores only
// Validates: Requirements 1.3, 1.4
export const displayNameSchema = z
  .string()
  .min(3, { message: "Must be at least 3 characters" })
  .max(20, { message: "Must be at most 20 characters" })
  .regex(/^[a-zA-Z0-9_]+$/, {
    message: "Must contain only letters, digits, and underscores",
  });

// UUID helper for reuse
const uuidSchema = z.string().uuid({ message: "Must be a valid UUID" });

// Formation: array of 1–5 unique UUIDs
// Validates: Requirements 5.4, 5.6, 5.7
export const formationSchema = z
  .array(uuidSchema)
  .min(1, { message: "Formation must contain at least 1 hero" })
  .max(MAX_FORMATION_SIZE, {
    message: `Formation must contain at most ${MAX_FORMATION_SIZE} heroes`,
  })
  .refine((ids) => new Set(ids).size === ids.length, {
    message: "Formation must not contain duplicate hero IDs",
  });

// Equip rune: heroId, slotIndex (1–4), runeId
// Validates: Requirements 6.5
export const equipRuneSchema = z.object({
  heroId: uuidSchema,
  slotIndex: z
    .number()
    .int({ message: "Slot index must be an integer" })
    .min(1, { message: "Slot index must be at least 1" })
    .max(RUNE_SLOTS_PER_HERO, {
      message: `Slot index must be at most ${RUNE_SLOTS_PER_HERO}`,
    }),
  runeId: uuidSchema,
});

// Skill upgrade: heroId, skillIndex
// Validates: Requirements 6.5
export const skillUpgradeSchema = z.object({
  heroId: uuidSchema,
  skillIndex: z
    .number()
    .int({ message: "Skill index must be an integer" })
    .min(0, { message: "Skill index must be non-negative" }),
});

// Resource operation: resourceType, amount (positive integer)
// Validates: Requirements 8.5
export const resourceOperationSchema = z.object({
  resourceType: z.enum(["gold", "gems", "energy"], {
    message: "Resource type must be one of: gold, gems, energy",
  }),
  amount: z
    .number()
    .int({ message: "Amount must be an integer" })
    .positive({ message: "Amount must be a positive integer" }),
});

// Numeric field validation per Requirement 8.5
// Validates bounds for different numeric field types
export const numericFieldSchema = {
  level: z
    .number()
    .int({ message: "Level must be an integer" })
    .min(1, { message: "Level must be at least 1" })
    .max(999, { message: "Level must be at most 999" }),

  experience: z
    .number()
    .int({ message: "Experience must be an integer" })
    .min(0, { message: "Experience must be non-negative" })
    .max(2_147_483_647, { message: "Experience must be at most 2,147,483,647" }),

  resourceAmount: z
    .number()
    .int({ message: "Resource amount must be an integer" })
    .min(0, { message: "Resource amount must be non-negative" })
    .max(999_999_999, { message: "Resource amount must be at most 999,999,999" }),

  attributeValue: z
    .number()
    .int({ message: "Attribute value must be an integer" })
    .min(0, { message: "Attribute value must be non-negative" })
    .max(9_999, { message: "Attribute value must be at most 9,999" }),
};
