import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";

import {
  getOrCreateUser,
} from "../utils/economy.js";

import {
  getServerLevel,
} from "../database/server-levels.js";

import {
  getMarriage,
} from "../database/marriages.js";

export const profileCommand =
  new SlashCommandBuilder()
    .setName("profile")
    .setDescription("View your profile")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("User to view")
        .setRequired(false),
    );

export async function handleProfileCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  await interaction.deferReply();

  const target =
    interaction.options.getUser("user") ??
    interaction.user;

  const economy =
    await getOrCreateUser(target.id);

  const server =
    interaction.guild
      ? await getServerLevel(
          interaction.guild.id,
          target.id,
        )
      : null;

  const marriage =
    await getMarriage(target.id);

  let relationship = "Single 💔";

  if (marriage) {
    const partner =
      marriage.user1 === target.id
        ? marriage.user2
        : marriage.user1;

    relationship =
      `Married to <@${partner}> 💍`;
  }

  const embed =
    new EmbedBuilder()
      .setColor(0x5865f2)
      .setAuthor({
        name: `${target.username}'s Profile`,
        iconURL: target.displayAvatarURL(),
      })
      .setThumbnail(
        target.displayAvatarURL(),
      )
      .addFields(
        {
          name: "💰 Economy",
          value:
            `Balance: **${economy.balance.toLocaleString()}** 🪙`,
          inline: false,
        },
        {
          name: "⭐ Server Level",
          value:
            server
              ? `Level **${server.level}**\nXP: **${server.xp}**`
              : "Level **0**",
          inline: true,
        },
        {
          name: "💬 Messages",
          value:
            server
              ? server.messages.toLocaleString()
              : "0",
          inline: true,
        },
        {
          name: "❤️ Relationship",
          value: relationship,
          inline: false,
        },
      )
      .setFooter({
        text: "BobBot Profile",
      })
      .setTimestamp();

  await interaction.editReply({
    embeds: [embed],
  });
}