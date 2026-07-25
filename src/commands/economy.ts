import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import { db, discordUsersTable, itemsTable } from "../db.js";
import { eq, desc } from "drizzle-orm";
import {
  getOrCreateUser, modifyBalance, getUserInventory, msToHms,
  FISH_COOLDOWN_MS, WORK_COOLDOWN_MS, HUNT_COOLDOWN_MS,
  FISH_TABLE, HUNT_TABLE, JOBS, weightedRandom, randInt,
} from "../utils/economy.js";

export const balanceCommand = new SlashCommandBuilder()
  .setName("balance").setDescription("Check your coin balance")
  .addUserOption((o) => o.setName("user").setDescription("Check another user's balance").setRequired(false));

export const workCommand    = new SlashCommandBuilder().setName("work").setDescription("Work a job to earn coins (1hr cooldown)");
export const fishCommand    = new SlashCommandBuilder().setName("fish").setDescription("Go fishing to earn coins (30min cooldown)");
export const huntCommand    = new SlashCommandBuilder().setName("hunt").setDescription("Go hunting to earn coins (45min cooldown)");
export const shopCommand    = new SlashCommandBuilder().setName("shop").setDescription("Browse the shop");
export const inventoryCommand = new SlashCommandBuilder().setName("inventory").setDescription("View your inventory")
  .addUserOption((o) => o.setName("user").setDescription("View another user's inventory").setRequired(false));
export const buyCommand = new SlashCommandBuilder().setName("buy").setDescription("Buy an item from the shop")
  .addStringOption((o) => o.setName("item").setDescription("Item name to buy").setRequired(true).setAutocomplete(true));

export async function handleBalance(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  const target = interaction.options.getUser("user") ?? interaction.user;
  const user   = await getOrCreateUser(target.id);
  const embed  = new EmbedBuilder().setColor(0xffd700).setTitle(`💰 ${target.username}'s Balance`)
    .setThumbnail(target.displayAvatarURL()).addFields({ name: "Coins", value: `**${user.balance.toLocaleString()}** 🪙`, inline: true }).setTimestamp();
  await interaction.editReply({ embeds: [embed] });
}

export async function handleWork(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  const user = await getOrCreateUser(interaction.user.id);
  if (user.lastWork) {
    const elapsed = Date.now() - new Date(user.lastWork).getTime();
    if (elapsed < WORK_COOLDOWN_MS) { await interaction.editReply(`⏳ You're tired! Come back in **${msToHms(WORK_COOLDOWN_MS - elapsed)}**.`); return; }
  }
  const job    = JOBS[Math.floor(Math.random() * JOBS.length)];
  const earned = randInt(job.minPay, job.maxPay);
  await modifyBalance(interaction.user.id, earned);
  await db.update(discordUsersTable).set({ lastWork: new Date() }).where(eq(discordUsersTable.discordId, interaction.user.id));
  const embed = new EmbedBuilder().setColor(0x57f287).setTitle(`${job.emoji} Work Complete!`)
    .setDescription(`You worked as a **${job.name}** and earned **${earned}** 🪙!`)
    .addFields({ name: "New Balance", value: `${user.balance + earned} 🪙` }).setFooter({ text: "Come back in 1 hour!" });
  await interaction.editReply({ embeds: [embed] });
}

export async function handleFish(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  const user = await getOrCreateUser(interaction.user.id);
  if (user.lastFish) {
    const elapsed = Date.now() - new Date(user.lastFish).getTime();
    if (elapsed < FISH_COOLDOWN_MS) { await interaction.editReply(`⏳ Fish need time to come back! Try in **${msToHms(FISH_COOLDOWN_MS - elapsed)}**.`); return; }
  }
  if (Math.random() < 0.2) {
    await db.update(discordUsersTable).set({ lastFish: new Date() }).where(eq(discordUsersTable.discordId, interaction.user.id));
    await interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x99aab5).setTitle("🎣 Nothing...").setDescription("Nothing bit. Better luck next time!").setFooter({ text: "Come back in 30 min." })] });
    return;
  }
  const fish   = weightedRandom(FISH_TABLE);
  const earned = randInt(fish.minCoins, fish.maxCoins);
  await modifyBalance(interaction.user.id, earned);
  await db.update(discordUsersTable).set({ lastFish: new Date(), totalFishCaught: user.totalFishCaught + 1 }).where(eq(discordUsersTable.discordId, interaction.user.id));
  const embed = new EmbedBuilder().setColor(0x3498db).setTitle("🎣 Fish Caught!")
    .setDescription(`You caught a **${fish.name}** and sold it for **${earned}** 🪙!`)
    .addFields({ name: "New Balance", value: `${user.balance + earned} 🪙`, inline: true }, { name: "Total Caught", value: `${user.totalFishCaught + 1} 🐟`, inline: true })
    .setFooter({ text: "Come back in 30 minutes!" });
  await interaction.editReply({ embeds: [embed] });
}

export async function handleHunt(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  const user = await getOrCreateUser(interaction.user.id);
  if (user.lastHunt) {
    const elapsed = Date.now() - new Date(user.lastHunt).getTime();
    if (elapsed < HUNT_COOLDOWN_MS) { await interaction.editReply(`⏳ Animals fled! Try in **${msToHms(HUNT_COOLDOWN_MS - elapsed)}**.`); return; }
  }
  if (Math.random() < 0.15) {
    await db.update(discordUsersTable).set({ lastHunt: new Date() }).where(eq(discordUsersTable.discordId, interaction.user.id));
    await interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x99aab5).setTitle("🏹 Missed!").setDescription("Everything scattered before you could aim.").setFooter({ text: "Come back in 45 min." })] });
    return;
  }
  const prey   = weightedRandom(HUNT_TABLE);
  const earned = randInt(prey.minCoins, prey.maxCoins);
  await modifyBalance(interaction.user.id, earned);
  await db.update(discordUsersTable).set({ lastHunt: new Date(), totalHunted: user.totalHunted + 1 }).where(eq(discordUsersTable.discordId, interaction.user.id));
  const embed = new EmbedBuilder().setColor(0x8b4513).setTitle("🏹 Hunt Successful!")
    .setDescription(`You tracked down a **${prey.name}** and earned **${earned}** 🪙!`)
    .addFields({ name: "New Balance", value: `${user.balance + earned} 🪙`, inline: true }, { name: "Total Hunted", value: `${user.totalHunted + 1} 🎯`, inline: true })
    .setFooter({ text: "Come back in 45 minutes!" });
  await interaction.editReply({ embeds: [embed] });
}

export async function handleShop(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  const items = await db.select().from(itemsTable);
  if (items.length === 0) { await interaction.editReply("The shop is empty right now!"); return; }
  const embed = new EmbedBuilder().setColor(0xeb459e).setTitle("🛒 Shop").setDescription("Use `/buy <item>` to purchase!").setTimestamp();
  for (const item of items) embed.addFields({ name: `${item.emoji} ${item.name} — ${item.price} 🪙`, value: item.description });
  await interaction.editReply({ embeds: [embed] });
}

export async function handleBuy(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  const itemName = interaction.options.getString("item", true);
  const user     = await getOrCreateUser(interaction.user.id);
  const [item]   = await db.select().from(itemsTable).where(eq(itemsTable.name, itemName));
  if (!item)              { await interaction.editReply(`❌ Item **${itemName}** not found. Use \`/shop\` to browse.`); return; }
  if (user.balance < item.price) { await interaction.editReply(`❌ Need **${item.price} 🪙** but you have **${user.balance} 🪙**.`); return; }
  await modifyBalance(interaction.user.id, -item.price);
  const embed = new EmbedBuilder().setColor(0x57f287).setTitle(`${item.emoji} Purchase Successful!`)
    .setDescription(`You bought **${item.name}** for **${item.price} 🪙**!`)
    .addFields({ name: "Item", value: item.description }, { name: "Remaining Balance", value: `${user.balance - item.price} 🪙`, inline: true });
  await interaction.editReply({ embeds: [embed] });
}

export async function handleInventory(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  const target = interaction.options.getUser("user") ?? interaction.user;
  const inv    = await getUserInventory(target.id);
  const embed  = new EmbedBuilder().setColor(0x9b59b6).setTitle(`🎒 ${target.username}'s Inventory`).setThumbnail(target.displayAvatarURL()).setTimestamp();
  embed.setDescription(inv.length === 0 ? "Nothing here! Use `/shop` to buy items." : inv.map((e) => `${e.item.emoji} **${e.item.name}** × ${e.quantity}`).join("\n"));
  await interaction.editReply({ embeds: [embed] });
}

export async function handleDaily(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  const DAILY_COOLDOWN_MS = 24 * 60 * 60 * 1000;
  const user = await getOrCreateUser(interaction.user.id);
  if (user.lastDaily) {
    const elapsed = Date.now() - new Date(user.lastDaily).getTime();
    if (elapsed < DAILY_COOLDOWN_MS) { await interaction.editReply(`⏳ Already claimed! Come back in **${msToHms(DAILY_COOLDOWN_MS - elapsed)}**.`); return; }
  }
  const earned = randInt(200, 500);
  await modifyBalance(interaction.user.id, earned);
  await db.update(discordUsersTable).set({ lastDaily: new Date() }).where(eq(discordUsersTable.discordId, interaction.user.id));
  const embed = new EmbedBuilder().setColor(0xffd700).setTitle("🌟 Daily Reward!")
    .setDescription(`You claimed **${earned}** 🪙!`)
    .addFields({ name: "New Balance", value: `${user.balance + earned} 🪙`, inline: true })
    .setFooter({ text: "Come back tomorrow!" }).setTimestamp();
  await interaction.editReply({ embeds: [embed] });
}

export async function handleLeaderboard(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  const top = await db.select({ discordId: discordUsersTable.discordId, balance: discordUsersTable.balance })
    .from(discordUsersTable).orderBy(desc(discordUsersTable.balance)).limit(10);
  const medals = ["🥇", "🥈", "🥉"];
  const rows   = top.map((u, i) => `${medals[i] ?? `**${i + 1}.**`} <@${u.discordId}> — **${u.balance.toLocaleString()}** 🪙`);
  const embed  = new EmbedBuilder().setColor(0xffd700).setTitle("🏆 Economy Leaderboard")
    .setDescription(rows.length > 0 ? rows.join("\n") : "No users yet!").setTimestamp();
  await interaction.editReply({ embeds: [embed] });
}

export async function handleRob(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  const ROB_COOLDOWN_MS = 60 * 60 * 1000;
  const robber     = await getOrCreateUser(interaction.user.id);
  const targetUser = interaction.options.getUser("target", true);
  if (targetUser.id === interaction.user.id) { await interaction.editReply("❌ You can't rob yourself!"); return; }
  if (robber.lastRob) {
    const elapsed = Date.now() - new Date(robber.lastRob).getTime();
    if (elapsed < ROB_COOLDOWN_MS) { await interaction.editReply(`⏳ Laying low after last heist. Try in **${msToHms(ROB_COOLDOWN_MS - elapsed)}**.`); return; }
  }
  const victim = await getOrCreateUser(targetUser.id);
  if (victim.balance < 50) { await interaction.editReply(`❌ **${targetUser.username}** is too broke to rob (< 50 🪙).`); return; }
  await db.update(discordUsersTable).set({ lastRob: new Date() }).where(eq(discordUsersTable.discordId, interaction.user.id));
  if (Math.random() < 0.35) {
    const stolen = Math.floor(victim.balance * (randInt(10, 30) / 100));
    await modifyBalance(targetUser.id, -stolen);
    await modifyBalance(interaction.user.id, stolen);
    await interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xff6600).setTitle("🦹 Heist Successful!")
      .setDescription(`You stole **${stolen}** 🪙 from <@${targetUser.id}>!`)
      .addFields({ name: "Your Balance", value: `${robber.balance + stolen} 🪙`, inline: true }, { name: "Victim Balance", value: `${victim.balance - stolen} 🪙`, inline: true })
      .setFooter({ text: "Crime pays... this time." })] });
  } else {
    const fine = Math.floor(robber.balance * 0.1);
    await modifyBalance(interaction.user.id, -fine);
    await interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xed4245).setTitle("🚔 Caught Red-Handed!")
      .setDescription(`Got caught robbing <@${targetUser.id}> — paid **${fine}** 🪙 fine!`)
      .addFields({ name: "New Balance", value: `${robber.balance - fine} 🪙` }).setFooter({ text: "Maybe stick to fishing." })] });
  }
}

export async function handleCoinflip(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  const bet  = interaction.options.getInteger("amount", true);
  const user = await getOrCreateUser(interaction.user.id);
  if (user.balance < bet) { await interaction.editReply(`❌ Only have **${user.balance}** 🪙, tried to bet **${bet}** 🪙.`); return; }
  const win   = Math.random() < 0.5;
  const delta = win ? bet : -bet;
  await modifyBalance(interaction.user.id, delta);
  await interaction.editReply({ embeds: [new EmbedBuilder().setColor(win ? 0x57f287 : 0xed4245)
    .setTitle(win ? "🪙 Heads! You Win!" : "🪙 Tails! You Lose!")
    .setDescription(win ? `Won **${bet}** 🪙!` : `Lost **${bet}** 🪙.`)
    .addFields({ name: "New Balance", value: `${user.balance + delta} 🪙` }).setTimestamp()] });
}

const DICE_FACES = ["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣"];
export async function handleDice(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  const bet  = interaction.options.getInteger("bet", true);
  const user = await getOrCreateUser(interaction.user.id);
  if (user.balance < bet) { await interaction.editReply(`❌ Only have **${user.balance}** 🪙.`); return; }
  const roll = randInt(1, 6);
  let winnings = 0, resultText = "";
  if (roll === 6)      { winnings = bet * 3; resultText = `🎉 Jackpot! Rolled **6** — won **${winnings}** 🪙 (3×)!`; }
  else if (roll >= 4)  { winnings = bet;     resultText = `✅ Rolled **${roll}** — won **${winnings}** 🪙!`; }
  else                 { winnings = -bet;    resultText = `❌ Rolled **${roll}** — lost **${bet}** 🪙.`; }
  await modifyBalance(interaction.user.id, winnings);
  await interaction.editReply({ embeds: [new EmbedBuilder().setColor(winnings > 0 ? 0x57f287 : 0xed4245)
    .setTitle(`🎲 Dice Roll — ${DICE_FACES[roll - 1]}`).setDescription(resultText)
    .addFields({ name: "New Balance", value: `${user.balance + winnings} 🪙`, inline: true }, { name: "Odds", value: "4–5 = 1×, 6 = 3×", inline: true }).setTimestamp()] });
}

export async function handleBuyAutocomplete(interaction: any): Promise<void> {
  const focused  = interaction.options.getFocused().toLowerCase();
  const items    = await db.select().from(itemsTable);
  const choices  = items.filter((i) => i.name.toLowerCase().includes(focused)).slice(0, 25)
    .map((i) => ({ name: `${i.emoji} ${i.name} (${i.price} 🪙)`, value: i.name }));
  await interaction.respond(choices);
}
