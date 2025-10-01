import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  scannedCards: defineTable({
    cardName: v.string(),
    cardId: v.string(),
    type: v.string(),
    hp: v.optional(v.number()),
    rarity: v.string(),
    description: v.optional(v.string()),
    imagePath: v.string(),
    scannedAt: v.number(), // timestamp
    userId: v.string(), // Clerk user ID
  })
    .index("by_user", ["userId"])
    .index("by_card_name", ["cardName"])
    .index("by_user_and_card", ["userId", "cardName"]),
});
