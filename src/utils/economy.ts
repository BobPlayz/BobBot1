import { db, discordUsersTable, inventoryTable, itemsTable } from "../db.js";
import { eq, and } from "drizzle-orm";
import type { DiscordUser } from "../schema/discord-users.js";

export async function getOrCreateUser(discordId: string): Promise<DiscordUser> {
  const [existing] = await db.select().from(discordUsersTable).where(eq(discordUsersTable.discordId, discordId));
  if (existing) return existing;
  const [created] = await db.insert(discordUsersTable).values({ discordId, balance: 100 }).returning();
  return created;
}

export async function modifyBalance(
  discordId: string,
  amount: number,
): Promise<{ success: boolean; newBalance: number; oldBalance: number }> {
  const user = await getOrCreateUser(discordId);
  const newBalance = user.balance + amount;
  if (newBalance < 0) return { success: false, newBalance: user.balance, oldBalance: user.balance };
  await db.update(discordUsersTable).set({ balance: newBalance }).where(eq(discordUsersTable.discordId, discordId));
  return { success: true, newBalance, oldBalance: user.balance };
}

export async function addItemToInventory(discordId: string, itemId: number, qty = 1): Promise<void> {
  const [existing] = await db.select().from(inventoryTable)
    .where(and(eq(inventoryTable.discordId, discordId), eq(inventoryTable.itemId, itemId)));
  if (existing) {
    await db.update(inventoryTable).set({ quantity: existing.quantity + qty })
      .where(and(eq(inventoryTable.discordId, discordId), eq(inventoryTable.itemId, itemId)));
  } else {
    await db.insert(inventoryTable).values({ discordId, itemId, quantity: qty });
  }
}

export async function getUserInventory(discordId: string) {
  return db.select({ item: itemsTable, quantity: inventoryTable.quantity })
    .from(inventoryTable)
    .innerJoin(itemsTable, eq(inventoryTable.itemId, itemsTable.id))
    .where(eq(inventoryTable.discordId, discordId));
}

export function msToHms(ms: number): string {
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);
  return parts.join(" ");
}

export const FISH_COOLDOWN_MS  = 30 * 60 * 1000;
export const WORK_COOLDOWN_MS  = 60 * 60 * 1000;
export const HUNT_COOLDOWN_MS  = 45 * 60 * 1000;

export const HUNT_TABLE = [
  { name: "🐇 Rabbit",    minCoins: 15,  maxCoins: 35,  weight: 40 },
  { name: "🦊 Fox",       minCoins: 30,  maxCoins: 60,  weight: 25 },
  { name: "🦌 Deer",      minCoins: 40,  maxCoins: 80,  weight: 15 },
  { name: "🐗 Wild Boar", minCoins: 50,  maxCoins: 100, weight: 10 },
  { name: "🐻 Bear",      minCoins: 80,  maxCoins: 150, weight: 6  },
  { name: "🦁 Lion",      minCoins: 150, maxCoins: 300, weight: 3  },
  { name: "🐉 Dragon",    minCoins: 400, maxCoins: 800, weight: 1  },
];

export const FISH_TABLE = [
  { name: "🐟 Common Fish",   minCoins: 10,  maxCoins: 25,  weight: 50 },
  { name: "🐠 Tropical Fish", minCoins: 25,  maxCoins: 50,  weight: 25 },
  { name: "🐡 Blowfish",      minCoins: 20,  maxCoins: 40,  weight: 15 },
  { name: "🦈 Baby Shark",    minCoins: 50,  maxCoins: 100, weight: 7  },
  { name: "🐙 Octopus",       minCoins: 60,  maxCoins: 120, weight: 2  },
  { name: "💎 Diamond Fish",  minCoins: 200, maxCoins: 500, weight: 1  },
];

export const JOBS = [
  { name: "Software Engineer", minPay: 150, maxPay: 300, emoji: "💻" },
  { name: "Chef",               minPay: 100, maxPay: 200, emoji: "👨‍🍳" },
  { name: "Teacher",            minPay: 80,  maxPay: 160, emoji: "📚" },
  { name: "Artist",             minPay: 90,  maxPay: 180, emoji: "🎨" },
  { name: "Streamer",           minPay: 120, maxPay: 250, emoji: "🎮" },
  { name: "Doctor",             minPay: 200, maxPay: 400, emoji: "🏥" },
  { name: "Pirate",             minPay: 130, maxPay: 270, emoji: "🏴‍☠️" },
  { name: "Wizard",             minPay: 110, maxPay: 220, emoji: "🧙" },
];

export function weightedRandom<T extends { weight: number }>(items: T[]): T {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  let rand = Math.random() * total;
  for (const item of items) {
    rand -= item.weight;
    if (rand <= 0) return item;
  }
  return items[items.length - 1];
}

export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
