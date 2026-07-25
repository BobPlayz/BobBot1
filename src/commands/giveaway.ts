import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
  type ButtonInteraction,
  ChannelType,
} from "discord.js";
import { db, giveawaysTable } from "../db.js";
import { eq } from "drizzle-orm";
import { logger } from "../logger.js";

export const giveawayCommand = new SlashCommandBuilder()
  .setName("giveaway")
  .setDescription("Giveaway management")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .addSubcommand((s) =>
    s.setName("start").setDescription("Start a new giveaway")
      .addStringOption((o) => o.setName("duration").setDescription("Duration e.g. 1h, 30m, 2d").setRequired(true))
      .addStringOption((o) => o.setName("prize").setDescription("What is the prize?").setRequired(true))
      .addChannelOption((o) => o.setName("channel").setDescription("Channel to post in (defaults to current)").setRequired(false).addChannelTypes(ChannelType.GuildText))
      .addIntegerOption((o) => o.setName("winners").setDescription("Number of winners (default 1)").setRequired(false).setMinValue(1).setMaxValue(10)),
  )
  .addSubcommand((s) =>
    s.setName("end").setDescription("End a giveaway early")
      .addIntegerOption((o) => o.setName("id").setDescription("Giveaway ID").setRequired(true)),
  )
  .addSubcommand((s) =>
    s.setName("reroll").setDescription("Reroll the winner of a giveaway")
      .addIntegerOption((o) => o.setName("id").setDescription("Giveaway ID").setRequired(true)),
  );

function parseDuration(s: string): number | null {
  const match = s.match(/^(\d+)(s|m|h|d)$/i);
  if (!match) return null;
  const val = parseInt(match[1], 10);
  const mult: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return val * mult[match[2].toLowerCase()];
}

function buildGiveawayEmbed(prize: string, endTime: Date, hostId: string, entries: string[], winnerCount: number, active: boolean, winners?: string[]) {
  const timeStr = `<t:${Math.floor(endTime.getTime() / 1000)}:R>`;
  const embed = new EmbedBuilder()
    .setColor(active ? 0xff73fa : 0x99aab5)
    .setTitle("🎉 GIVEAWAY 🎉")
    .setDescription(`**Prize:** ${prize}\n**Ends:** ${active ? timeStr : "Ended"}\n**Hosted by:** <@${hostId}>\n**Entries:** ${entries.length}\n**Winners:** ${winnerCount}`)
    .setTimestamp(endTime);
  if (!active && winners && winners.length > 0)
    embed.addFields({ name: "🏆 Winner(s)", value: winners.map((w) => `<@${w}>`).join(", ") });
  return embed;
}

function buildEnterButton(disabled = false) {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("giveaway_enter").setLabel("🎉 Enter").setStyle(ButtonStyle.Success).setDisabled(disabled),
  );
}

async function endGiveaway(giveawayId: number, msg: any) {
  const [giveaway] = await db.select().from(giveawaysTable).where(eq(giveawaysTable.id, giveawayId));
  if (!giveaway || !giveaway.isActive) return;

  const pool = [...giveaway.entries];
  const winners: string[] = [];
  for (let i = 0; i < Math.min(giveaway.winnerCount, pool.length); i++) {
    const idx = Math.floor(Math.random() * pool.length);
    winners.push(pool[idx]);
    pool.splice(idx, 1);
  }

  await db.update(giveawaysTable).set({ isActive: false, winnerId: winners[0] ?? null }).where(eq(giveawaysTable.id, giveawayId));

  if (msg) {
    const embed = buildGiveawayEmbed(giveaway.prize, giveaway.endTime, giveaway.hostId, giveaway.entries, giveaway.winnerCount, false, winners);
    embed.setFooter({ text: `ID: ${giveaway.id}` });
    await msg.edit({ embeds: [embed], components: [buildEnterButton(true)] }).catch(() => {});
    if (winners.length > 0)
      await msg.channel.send(`🎉 Congratulations ${winners.map((w) => `<@${w}>`).join(", ")}! You won **${giveaway.prize}**!`);
  }
}

export async function handleGiveawayCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  const sub = interaction.options.getSubcommand();

  if (sub === "start") {
    await interaction.deferReply({ ephemeral: true });
    const durationMs = parseDuration(interaction.options.getString("duration", true));
    if (!durationMs || durationMs < 10_000) { await interaction.editReply("❌ Invalid duration. Use e.g. `1h`, `30m`, `2d`. Min 10 seconds."); return; }

    const prize       = interaction.options.getString("prize", true);
    const targetCh    = interaction.options.getChannel("channel") ?? interaction.channel;
    const winnerCount = interaction.options.getInteger("winners") ?? 1;
    const endTime     = new Date(Date.now() + durationMs);

    const [giveaway] = await db.insert(giveawaysTable).values({
      guildId: interaction.guildId!, channelId: targetCh!.id, prize,
      hostId: interaction.user.id, winnerCount, entries: [], endTime, isActive: true,
    }).returning();

    const embed = buildGiveawayEmbed(prize, endTime, interaction.user.id, [], winnerCount, true);
    embed.setFooter({ text: `ID: ${giveaway.id}` });

    if (!targetCh || !("send" in targetCh)) { await interaction.editReply("❌ Cannot send to that channel."); return; }
    const msg = await targetCh.send({ embeds: [embed], components: [buildEnterButton()] });
    await db.update(giveawaysTable).set({ messageId: msg.id }).where(eq(giveawaysTable.id, giveaway.id));

    setTimeout(() => endGiveaway(giveaway.id, msg).catch((e) => logger.error({ err: e }, "Giveaway auto-end error")), durationMs);
    await interaction.editReply(`✅ Giveaway started in <#${targetCh.id}>! (ID: \`${giveaway.id}\`)`);
    return;
  }

  if (sub === "end") {
    await interaction.deferReply({ ephemeral: true });
    const id = interaction.options.getInteger("id", true);
    const [giveaway] = await db.select().from(giveawaysTable).where(eq(giveawaysTable.id, id));
    if (!giveaway || !giveaway.isActive) { await interaction.editReply("❌ Giveaway not found or already ended."); return; }
    const ch = interaction.client.channels.cache.get(giveaway.channelId);
    if (ch && "messages" in ch && giveaway.messageId) {
      const msg = await ch.messages.fetch(giveaway.messageId).catch(() => null);
      if (msg) await endGiveaway(id, msg);
    } else await endGiveaway(id, null);
    await interaction.editReply("✅ Giveaway ended.");
    return;
  }

  if (sub === "reroll") {
    await interaction.deferReply({ ephemeral: true });
    const id = interaction.options.getInteger("id", true);
    const [giveaway] = await db.select().from(giveawaysTable).where(eq(giveawaysTable.id, id));
    if (!giveaway) { await interaction.editReply("❌ Giveaway not found."); return; }
    if (giveaway.entries.length === 0) { await interaction.editReply("❌ No entries to reroll."); return; }
    const newWinner = giveaway.entries[Math.floor(Math.random() * giveaway.entries.length)];
    await db.update(giveawaysTable).set({ winnerId: newWinner }).where(eq(giveawaysTable.id, id));
    await interaction.editReply(`🎉 New winner: <@${newWinner}>!`);
  }
}

export async function handleGiveawayEnter(interaction: ButtonInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });
  const footer  = interaction.message.embeds[0]?.footer?.text;
  const idMatch = footer?.match(/ID: (\d+)/);
  if (!idMatch) { await interaction.editReply("❌ Could not find this giveaway."); return; }

  const giveawayId = parseInt(idMatch[1], 10);
  const [giveaway] = await db.select().from(giveawaysTable).where(eq(giveawaysTable.id, giveawayId));
  if (!giveaway || !giveaway.isActive) { await interaction.editReply("❌ This giveaway has ended."); return; }
  if (giveaway.entries.includes(interaction.user.id)) { await interaction.editReply("You're already entered!"); return; }

  const newEntries = [...giveaway.entries, interaction.user.id];
  await db.update(giveawaysTable).set({ entries: newEntries }).where(eq(giveawaysTable.id, giveawayId));

  const newEmbed = buildGiveawayEmbed(giveaway.prize, giveaway.endTime, giveaway.hostId, newEntries, giveaway.winnerCount, true);
  newEmbed.setFooter({ text: `ID: ${giveaway.id}` });
  await interaction.message.edit({ embeds: [newEmbed] }).catch(() => {});
  await interaction.editReply("🎉 You've entered the giveaway! Good luck!");
}
