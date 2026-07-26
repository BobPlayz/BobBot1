import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ButtonInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";

import {
  getMarriage,
  deleteMarriage,
} from "../database/marriages.js";

export const divorceCommand = new SlashCommandBuilder()
  .setName("divorce")
  .setDescription("Divorce your current partner 💔");

export async function handleDivorceCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const marriage = await getMarriage(interaction.user.id);

  if (!marriage) {
    await interaction.reply({
      content: "❌ You aren't married.",
      ephemeral: true,
    });

    return;
  }

  const partnerId =
    marriage.user1 === interaction.user.id
      ? marriage.user2
      : marriage.user1;

  const embed = new EmbedBuilder()
    .setColor(0xed4245)
    .setTitle("💔 Divorce")
    .setDescription(
      `Are you sure you want to divorce <@${partnerId}>?\n\n` +
      `**This action cannot be undone.**`,
    );

  const row =
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`divorce_confirm_${interaction.user.id}`)
        .setLabel("Confirm Divorce")
        .setEmoji("💔")
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId(`divorce_cancel_${interaction.user.id}`)
        .setLabel("Cancel")
        .setEmoji("❌")
        .setStyle(ButtonStyle.Secondary),
    );

  await interaction.reply({
    embeds: [embed],
    components: [row],
    ephemeral: true,
  });
}

export async function handleDivorceButton(
  interaction: ButtonInteraction,
): Promise<void> {
  const id = interaction.customId;

  if (
    !id.startsWith("divorce_confirm_") &&
    !id.startsWith("divorce_cancel_")
  ) {
    return;
  }

  const [, action, userId] = id.split("_");

  if (interaction.user.id !== userId) {
    await interaction.reply({
      content: "❌ Only you can use these buttons.",
      ephemeral: true,
    });

    return;
  }

  if (action === "cancel") {
    await interaction.update({
      content: "✅ Divorce cancelled.",
      embeds: [],
      components: [],
    });

    return;
  }

  const marriage = await getMarriage(userId);

  if (!marriage) {
    await interaction.update({
      content: "❌ You aren't married anymore.",
      embeds: [],
      components: [],
    });

    return;
  }

  const partnerId =
    marriage.user1 === userId
      ? marriage.user2
      : marriage.user1;

  await deleteMarriage(userId);

  await interaction.update({
    content: `💔 You are now divorced from <@${partnerId}>.`,
    embeds: [],
    components: [],
  });
}