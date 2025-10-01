import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const saveScannedCard = mutation({
  args: {
    cardName: v.string(),
    cardId: v.string(),
    type: v.string(),
    hp: v.optional(v.number()),
    rarity: v.string(),
    description: v.optional(v.string()),
    imagePath: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if this card has already been scanned by this user
    const existing = await ctx.db
      .query("scannedCards")
      .withIndex("by_user_and_card", (q) =>
        q.eq("userId", args.userId).eq("cardName", args.cardName)
      )
      .first();

    if (existing) {
      // Update the scanned timestamp
      await ctx.db.patch(existing._id, {
        scannedAt: Date.now(),
      });
      return existing._id;
    } else {
      // Insert new scanned card
      const cardId = await ctx.db.insert("scannedCards", {
        ...args,
        scannedAt: Date.now(),
      });
      return cardId;
    }
  },
});

export const getScannedCards = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("scannedCards")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const getScannedCard = query({
  args: { userId: v.string(), cardName: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("scannedCards")
      .withIndex("by_user_and_card", (q) =>
        q.eq("userId", args.userId).eq("cardName", args.cardName)
      )
      .first();
  },
});

export const deleteScannedCard = mutation({
  args: { cardId: v.id("scannedCards") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.cardId);
  },
});
