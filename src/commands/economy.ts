import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  type ChatInputCommandInteraction,
} from "discord.js";
import { db, discordUsersTable, itemsTable } from "../db.js";
import { eq, desc } from "drizzle-orm";
import {
  getOrCreateUser,
  modifyBalance,
  getUserInventory,
  msToHms,
  FISH_COOLDOWN_MS,
  WORK_COOLDOWN_MS,
  HUNT_COOLDOWN_MS,
  FISH_TABLE,
  HUNT_TABLE,
  JOBS,
  weightedRandom,
  randInt,
} from "../utils/economy.js";

export const balanceCommand = new SlashCommandBuilder()
  .setName("balance")
  .setDescription("Check your coin balance")
  .addUserOption(o =>
    o.setName("user").setDescription("Check another user's balance").setRequired(false),
  );

export const payCommand = new SlashCommandBuilder()
  .setName("pay")
  .setDescription("Send coins to another user")
  .addUserOption(o =>
    o.setName("user").setDescription("Who's getting the bag").setRequired(true),
  )
  .addIntegerOption(o =>
    o.setName("amount").setDescription("How many coins").setRequired(true).setMinValue(1),
  );

export const workCommand = new SlashCommandBuilder().setName("work").setDescription("Work a job to earn coins (1hr cooldown)");
export const fishCommand = new SlashCommandBuilder().setName("fish").setDescription("Go fishing to earn coins (30min cooldown)");
export const huntCommand = new SlashCommandBuilder().setName("hunt").setDescription("Go hunting to earn coins (45min cooldown)");
export const shopCommand = new SlashCommandBuilder().setName("shop").setDescription("Browse the shop");
export const inventoryCommand = new SlashCommandBuilder()
  .setName("inventory")
  .setDescription("View your inventory")
  .addUserOption(o =>
    o.setName("user").setDescription("View another user's inventory").setRequired(false),
  );

export const buyCommand = new SlashCommandBuilder()
  .setName("buy")
  .setDescription("Buy an item from the shop")
  .addStringOption(o =>
    o.setName("item").setDescription("Item name to buy").setRequired(true).setAutocomplete(true),
  );

export async function handleBalance(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const target = interaction.options.getUser("user") ?? interaction.user;
  const user = await getOrCreateUser(target.id);

  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(0xffd700)
        .setTitle(`💰 ${target.username}'s Balance`)
        .setThumbnail(target.displayAvatarURL())
        .addFields({
          name: "Coins",
          value: `**${user.balance.toLocaleString()}** 🪙`,
          inline: true,
        })
        .setTimestamp(),
    ],
  });
}

export async function handlePay(interaction: ChatInputCommandInteraction): Promise<void> {
  const target = interaction.options.getUser("user", true);
  const amount = interaction.options.getInteger("amount", true);

  if (target.id === interaction.user.id) {
    await interaction.reply({
      content: "bro you can't pay yourself 💀",
      ephemeral: true,
    });

    return;
  }

  const sender = await getOrCreateUser(interaction.user.id);

  if (sender.balance < amount) {
    await interaction.reply({
      content: `you only have **${sender.balance.toLocaleString()}** 🪙 damn`,
      ephemeral: true,
    });

    return;
  }

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`pay_yes_${interaction.user.id}_${target.id}_${amount}`)
      .setLabel("Yes")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`pay_no_${interaction.user.id}`)
      .setLabel("No")
      .setStyle(ButtonStyle.Danger),
  );

  const embed = new EmbedBuilder()
    .setColor(0xf1c40f)
    .setTitle("💸 Confirm Payment")
    .setDescription(`Send **${amount.toLocaleString()}** 🪙 to ${target}?`);

  const msg = await interaction.reply({
    embeds: [embed],
    components: [row],
    fetchReply: true,
  });

  const collector = msg.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 30_000,
  });

  collector.on("collect", async i => {
    if (i.user.id !== interaction.user.id) {
      await i.reply({
        content: "not your payment, chill 😭",
        ephemeral: true,
      });

      return;
    }

    if (i.customId.startsWith("pay_no_")) {
      collector.stop("cancelled");

      await i.update({
        embeds: [
          new EmbedBuilder()
            .setColor(0xed4245)
            .setTitle("❌ Payment Cancelled")
            .setDescription("No coins were transferred."),
        ],
        components: [],
      });

      return;
    }

    const latestSender = await getOrCreateUser(interaction.user.id);

    if (latestSender.balance < amount) {
      collector.stop("failed");

      await i.update({
        embeds: [
          new EmbedBuilder()
            .setColor(0xed4245)
            .setTitle("❌ Payment Failed")
            .setDescription("You don't have enough coins anymore."),
        ],
        components: [],
      });

      return;
    }

    await modifyBalance(interaction.user.id, -amount);
    await modifyBalance(target.id, amount);

    collector.stop("paid");

    await i.update({
      embeds: [
        new EmbedBuilder()
          .setColor(0x57f287)
          .setTitle("✅ Payment Sent")
          .setDescription(`Sent **${amount.toLocaleString()}** 🪙 to ${target}. easy.`),
      ],
      components: [],
    });
  });

  collector.on("end", async (_c, reason) => {
    if (reason === "time") {
      await interaction
        .editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(0x95a5a6)
              .setTitle("⌛ Payment Expired")
              .setDescription("Took too long. shit expired."),
          ],
          components: [],
        })
        .catch(() => {});
    }
  });
}
export async function handleWork(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const user = await getOrCreateUser(interaction.user.id);

  if (user.lastWork) {
    const elapsed = Date.now() - new Date(user.lastWork).getTime();
    if (elapsed < WORK_COOLDOWN_MS) {
      await interaction.editReply(
        `⏳ you're cooked, come back in **${msToHms(WORK_COOLDOWN_MS - elapsed)}**.`,
      );
      return;
    }
  }

  const job = JOBS[Math.floor(Math.random() * JOBS.length)];
  const earned = randInt(job.minPay, job.maxPay);

  await modifyBalance(interaction.user.id, earned);
  await db
    .update(discordUsersTable)
    .set({ lastWork: new Date() })
    .where(eq(discordUsersTable.discordId, interaction.user.id));

  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(0x57f287)
        .setTitle(`${job.emoji} Work Complete`)
        .setDescription(`You worked as a **${job.name}** and earned **${earned}** 🪙.`)
        .addFields({
          name: "Balance",
          value: `${(user.balance + earned).toLocaleString()} 🪙`,
        }),
    ],
  });
}

export async function handleFish(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const user = await getOrCreateUser(interaction.user.id);

  if (user.lastFish) {
    const elapsed = Date.now() - new Date(user.lastFish).getTime();
    if (elapsed < FISH_COOLDOWN_MS) {
      await interaction.editReply(
        `⏳ fish aren't spawning yet, wait **${msToHms(FISH_COOLDOWN_MS - elapsed)}**.`,
      );
      return;
    }
  }

  if (Math.random() < 0.2) {
    await db
      .update(discordUsersTable)
      .set({ lastFish: new Date() })
      .where(eq(discordUsersTable.discordId, interaction.user.id));

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x99aab5)
          .setTitle("🎣 Nothing")
          .setDescription("you caught absolutely fuck all."),
      ],
    });

    return;
  }

  const fish = weightedRandom(FISH_TABLE);
  const earned = randInt(fish.minCoins, fish.maxCoins);

  await modifyBalance(interaction.user.id, earned);
  await db
    .update(discordUsersTable)
    .set({
      lastFish: new Date(),
      totalFishCaught: user.totalFishCaught + 1,
    })
    .where(eq(discordUsersTable.discordId, interaction.user.id));

  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle("🎣 Fish Caught")
        .setDescription(`You caught a **${fish.name}** and got **${earned}** 🪙.`)
        .addFields(
          {
            name: "Balance",
            value: `${(user.balance + earned).toLocaleString()} 🪙`,
            inline: true,
          },
          {
            name: "Total Caught",
            value: `${user.totalFishCaught + 1} 🐟`,
            inline: true,
          },
        ),
    ],
  });
}

export async function handleHunt(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const user = await getOrCreateUser(interaction.user.id);

  if (user.lastHunt) {
    const elapsed = Date.now() - new Date(user.lastHunt).getTime();
    if (elapsed < HUNT_COOLDOWN_MS) {
      await interaction.editReply(
        `⏳ everything dipped, wait **${msToHms(HUNT_COOLDOWN_MS - elapsed)}**.`,
      );
      return;
    }
  }

  if (Math.random() < 0.15) {
    await db
      .update(discordUsersTable)
      .set({ lastHunt: new Date() })
      .where(eq(discordUsersTable.discordId, interaction.user.id));

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x99aab5)
          .setTitle("🏹 Missed")
          .setDescription("your aim was ass."),
      ],
    });

    return;
  }

  const prey = weightedRandom(HUNT_TABLE);
  const earned = randInt(prey.minCoins, prey.maxCoins);

  await modifyBalance(interaction.user.id, earned);
  await db
    .update(discordUsersTable)
    .set({
      lastHunt: new Date(),
      totalHunted: user.totalHunted + 1,
    })
    .where(eq(discordUsersTable.discordId, interaction.user.id));

  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(0x8b4513)
        .setTitle("🏹 Hunt Successful")
        .setDescription(`You hunted a **${prey.name}** and earned **${earned}** 🪙.`)
        .addFields(
          {
            name: "Balance",
            value: `${(user.balance + earned).toLocaleString()} 🪙`,
            inline: true,
          },
          {
            name: "Total Hunted",
            value: `${user.totalHunted + 1} 🎯`,
            inline: true,
          },
        ),
    ],
  });
}

export async function handleShop(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const items = await db.select().from(itemsTable);

  if (!items.length) {
    await interaction.editReply("shop is empty rn.");
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0xeb459e)
    .setTitle("🛒 Shop")
    .setDescription("use `/buy <item>` to buy shit.");

  for (const item of items) {
    embed.addFields({
      name: `${item.emoji} ${item.name} — ${item.price} 🪙`,
      value: item.description,
    });
  }

  await interaction.editReply({ embeds: [embed] });
}

export async function handleBuy(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const itemName = interaction.options.getString("item", true);
  const user = await getOrCreateUser(interaction.user.id);
  const [item] = await db
    .select()
    .from(itemsTable)
    .where(eq(itemsTable.name, itemName));

  if (!item) {
    await interaction.editReply(`❌ **${itemName}** doesn't exist.`);
    return;
  }

  if (user.balance < item.price) {
    await interaction.editReply(
      `❌ you need **${item.price} 🪙** but only have **${user.balance} 🪙**.`,
    );
    return;
  }

  await modifyBalance(interaction.user.id, -item.price);

  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(0x57f287)
        .setTitle(`${item.emoji} Purchased`)
        .setDescription(`Bought **${item.name}** for **${item.price}** 🪙.`)
        .addFields({
          name: "Balance",
          value: `${(user.balance - item.price).toLocaleString()} 🪙`,
        }),
    ],
  });
}

export async function handleInventory(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const target = interaction.options.getUser("user") ?? interaction.user;
  const inv = await getUserInventory(target.id);

  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(0x9b59b6)
        .setTitle(`🎒 ${target.username}'s Inventory`)
        .setThumbnail(target.displayAvatarURL())
        .setDescription(
          inv.length
            ? inv.map(e => `${e.item.emoji} **${e.item.name}** × ${e.quantity}`).join("\n")
            : "nothing here. broke inventory fr.",
        ),
    ],
  });
}
export async function handleDaily(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const DAILY = 24 * 60 * 60 * 1000;
  const user = await getOrCreateUser(interaction.user.id);

  if (user.lastDaily) {
    const elapsed = Date.now() - new Date(user.lastDaily).getTime();
    if (elapsed < DAILY) {
      await interaction.editReply(
        `⏳ already claimed, chill. come back in **${msToHms(DAILY - elapsed)}**.`,
      );
      return;
    }
  }

  const earned = randInt(200, 500);

  await modifyBalance(interaction.user.id, earned);
  await db
    .update(discordUsersTable)
    .set({ lastDaily: new Date() })
    .where(eq(discordUsersTable.discordId, interaction.user.id));

  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(0xffd700)
        .setTitle("🌟 Daily Reward")
        .setDescription(`You got **${earned}** 🪙.`)
        .addFields({
          name: "Balance",
          value: `${(user.balance + earned).toLocaleString()} 🪙`,
        }),
    ],
  });
}

export async function handleLeaderboard(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const top = await db
    .select({
      discordId: discordUsersTable.discordId,
      balance: discordUsersTable.balance,
    })
    .from(discordUsersTable)
    .orderBy(desc(discordUsersTable.balance))
    .limit(10);

  const medals = ["🥇", "🥈", "🥉"];

  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(0xffd700)
        .setTitle("🏆 Economy Leaderboard")
        .setDescription(
          top.length
            ? top
                .map(
                  (u, i) =>
                    `${medals[i] ?? `**${i + 1}.**`} <@${u.discordId}> — **${u.balance.toLocaleString()}** 🪙`,
                )
                .join("\n")
            : "nobody's got money yet 💀",
        ),
    ],
  });
}

export async function handleRob(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const COOLDOWN = 60 * 60 * 1000;
  const robber = await getOrCreateUser(interaction.user.id);
  const targetUser = interaction.options.getUser("target", true);

  if (targetUser.id === interaction.user.id) {
    await interaction.editReply("bro you can't rob yourself 😭");
    return;
  }

  if (robber.lastRob) {
    const elapsed = Date.now() - new Date(robber.lastRob).getTime();
    if (elapsed < COOLDOWN) {
      await interaction.editReply(
        `⏳ lay low for **${msToHms(COOLDOWN - elapsed)}**.`,
      );
      return;
    }
  }

  const victim = await getOrCreateUser(targetUser.id);

  if (victim.balance < 50) {
    await interaction.editReply(`❌ **${targetUser.username}** is broke as hell.`);
    return;
  }

  await db
    .update(discordUsersTable)
    .set({ lastRob: new Date() })
    .where(eq(discordUsersTable.discordId, interaction.user.id));

  if (Math.random() < 0.35) {
    const stolen = Math.floor(victim.balance * (randInt(10, 30) / 100));

    await modifyBalance(targetUser.id, -stolen);
    await modifyBalance(interaction.user.id, stolen);

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xff6600)
          .setTitle("🦹 Heist Successful")
          .setDescription(`You stole **${stolen}** 🪙 from ${targetUser}.`),
      ],
    });

    return;
  }

  const fine = Math.floor(robber.balance * 0.1);

  await modifyBalance(interaction.user.id, -fine);

  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(0xed4245)
        .setTitle("🚔 Caught")
        .setDescription(`you got caught and lost **${fine}** 🪙.`),
    ],
  });
}

export async function handleCoinflip(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const bet = interaction.options.getInteger("amount", true);
  const user = await getOrCreateUser(interaction.user.id);

  if (user.balance < bet) {
    await interaction.editReply(`❌ you only have **${user.balance}** 🪙.`);
    return;
  }

  const win = Math.random() < 0.5;
  const delta = win ? bet : -bet;

  await modifyBalance(interaction.user.id, delta);

  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(win ? 0x57f287 : 0xed4245)
        .setTitle(win ? "🪙 You Win" : "🪙 You Lose")
        .setDescription(
          win
            ? `Won **${bet}** 🪙. lucky bastard.`
            : `Lost **${bet}** 🪙. rip.`,
        ),
    ],
  });
}

const DICE = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣"];

export async function handleDice(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const bet = interaction.options.getInteger("bet", true);
  const user = await getOrCreateUser(interaction.user.id);

  if (user.balance < bet) {
    await interaction.editReply(`❌ you only have **${user.balance}** 🪙.`);
    return;
  }

  const roll = randInt(1, 6);

  let winnings = -bet;

  if (roll === 6) winnings = bet * 3;
  else if (roll >= 4) winnings = bet;

  await modifyBalance(interaction.user.id, winnings);

  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(winnings > 0 ? 0x57f287 : 0xed4245)
        .setTitle(`🎲 ${DICE[roll - 1]}`)
        .setDescription(
          winnings > 0
            ? `You won **${winnings}** 🪙.`
            : `You lost **${bet}** 🪙.`,
        ),
    ],
  });
}

export async function handleBuyAutocomplete(interaction: any): Promise<void> {
  const focused = interaction.options.getFocused().toLowerCase();

  const items = await db.select().from(itemsTable);

  await interaction.respond(
    items
      .filter(i => i.name.toLowerCase().includes(focused))
      .slice(0, 25)
      .map(i => ({
        name: `${i.emoji} ${i.name} (${i.price} 🪙)`,
        value: i.name,
      })),
  );
}