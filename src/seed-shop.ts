import { db, itemsTable } from "./db.js";
import { logger } from "./logger.js";

const DEFAULT_ITEMS = [
  { name: "Fishing Rod",   description: "A sturdy rod to help you catch better fish.",  price: 150,  emoji: "🎣", type: "tool",       effect: "fishing_boost" },
  { name: "Lucky Charm",   description: "Brings good luck in all your endeavors.",       price: 300,  emoji: "🍀", type: "accessory",  effect: "luck_boost" },
  { name: "VIP Badge",     description: "Shows everyone you're a high roller.",          price: 1000, emoji: "💎", type: "cosmetic",   effect: null },
  { name: "Premium Bait",  description: "Attracts rare fish. Single use.",               price: 75,   emoji: "🪱", type: "consumable", effect: "rare_fish" },
  { name: "Energy Drink",  description: "Halves your work cooldown once.",               price: 200,  emoji: "⚡", type: "consumable", effect: "work_cooldown_halve" },
  { name: "Treasure Map",  description: "Rumored to lead to a big payout.",              price: 500,  emoji: "🗺️", type: "special",    effect: "treasure_hunt" },
  { name: "Hunter's Trap", description: "Increases your hunting success rate.",          price: 250,  emoji: "🪤", type: "tool",       effect: "hunt_boost" },
];

export async function seedShop(): Promise<void> {
  try {
    const existing = await db.select().from(itemsTable);
    if (existing.length > 0) return;
    await db.insert(itemsTable).values(DEFAULT_ITEMS);
    logger.info({ count: DEFAULT_ITEMS.length }, "Shop seeded with default items.");
  } catch (err) {
    logger.error({ err }, "Failed to seed shop items");
  }
}
