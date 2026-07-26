import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";

import { getMarriage } from "../database/marriages.js";

export const partnerCommand = new SlashCommandBuilder()
  .setName("partner")
  .setDescription("View your partner and relationship stats.");

export async function handlePartnerCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const marriage = await getMarriage(interaction.user.id);

  if (!marriage) {
    await interaction.reply({
      content: "💔 You aren't married.",
      ephemeral: true,
    });

    return;
  }

  const partnerId =
    marriage.user1 === interaction.user.id
      ? marriage.user2
      : marriage.user1;

  const embed = new EmbedBuilder()
    .setColor(0xff69b4)
    .setTitle("💍 Your Partner")
    .addFields(
      {
        name: "❤️ Partner",
        value: `<@${partnerId}>`,
        inline: false,
      },
      {
        name: "📅 Married Since",
        value: `<t:${Math.floor(
          marriage.marriedAt.getTime() / 1000,
        )}:D>`,
        inline: false,
      },
      {
        name: "❤️ Love Points",
        value: marriage.lovePoints.toString(),
        inline: true,
      },
      {
        name: "🤗 Hugs",
        value: marriage.hugs.toString(),
        inline: true,
      },
      {
        name: "💋 Kisses",
        value: marriage.kisses.toString(),
        inline: true,
      },
      {
        name: "🫂 Cuddles",
        value: marriage.cuddles.toString(),
        inline: true,
      },
      {
        name: "🎁 Gifts",
        value: marriage.gifts.toString(),
        inline: true,
      },
    )
    .setTimestamp();

  await interaction.reply({
    embeds: [embed],
  });
}