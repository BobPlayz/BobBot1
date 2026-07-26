import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";

import {
  areMarried,
  createMarriage,
} from "../database/marriages.js";

export async function handleMarriageButton(
  interaction: ButtonInteraction,
): Promise<void> {
  const id = interaction.customId;

  if (
    !id.startsWith("marry_accept_") &&
    !id.startsWith("marry_decline_")
  ) {
    return;
  }

  const [, action, proposerId, targetId] = id.split("_");

  // only the target can respond
  if (interaction.user.id !== targetId) {
    await interaction.reply({
      content: "❌ Only the person being proposed to can respond.",
      ephemeral: true,
    });
    return;
  }

  const disabledRow = new ActionRowBuilder<ButtonBuilder>();

  disabledRow.addComponents(
    new ButtonBuilder()
      .setCustomId("accepted")
      .setLabel("Accept")
      .setEmoji("💚")
      .setStyle(ButtonStyle.Success)
      .setDisabled(true),

    new ButtonBuilder()
      .setCustomId("declined")
      .setLabel("Decline")
      .setEmoji("💔")
      .setStyle(ButtonStyle.Danger)
      .setDisabled(true),
  );

  if (action === "decline") {
    const embed = EmbedBuilder.from(
      interaction.message.embeds[0],
    )
      .setColor(0xed4245)
      .setTitle("💔 Proposal Declined")
      .setDescription(
        `<@${targetId}> declined <@${proposerId}>'s proposal.`,
      );

    await interaction.update({
      embeds: [embed],
      components: [disabledRow],
    });

    return;
  }

  // already married?
  if (await areMarried(proposerId, targetId)) {
    await interaction.reply({
      content: "❌ One of you is already married.",
      ephemeral: true,
    });

    return;
  }

  await createMarriage(proposerId, targetId);

  const embed = EmbedBuilder.from(
    interaction.message.embeds[0],
  )
    .setColor(0x57f287)
    .setTitle("💍 Marriage!")
    .setDescription(
      `🎉 Congratulations!\n\n<@${proposerId}> and <@${targetId}> are now married! ❤️`,
    );

  await interaction.update({
    embeds: [embed],
    components: [disabledRow],
  });
}