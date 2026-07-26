import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";

import {
  getMarriage,
  createMarriage,
} from "../database/marriages.js";

import {
  getProposal,
  deleteProposal,
} from "../database/proposals.js";

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

  // Only the target can respond
  if (interaction.user.id !== targetId) {
    await interaction.reply({
      content: "❌ Only the person being proposed to can respond.",
      ephemeral: true,
    });
    return;
  }

  const disabledRow =
    new ActionRowBuilder<ButtonBuilder>().addComponents(
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

  // Make sure the proposal still exists
  const proposal = await getProposal(
    proposerId,
    targetId,
  );

  if (!proposal) {
    await interaction.reply({
      content:
        "⌛ This proposal no longer exists or has expired.",
      ephemeral: true,
    });
    return;
  }

  // Expired?
  if (proposal.expiresAt.getTime() < Date.now()) {
    await deleteProposal(proposal.id);

    const embed = EmbedBuilder.from(
      interaction.message.embeds[0],
    )
      .setColor(0xfaa61a)
      .setTitle("⌛ Proposal Expired")
      .setDescription(
        "This marriage proposal has expired.",
      );

    await interaction.update({
      embeds: [embed],
      components: [disabledRow],
    });

    return;
  }

  if (action === "decline") {
    await deleteProposal(proposal.id);

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

  // Check whether either user got married while waiting
  const proposerMarriage = await getMarriage(
    proposerId,
  );

  const targetMarriage = await getMarriage(
    targetId,
  );

  if (proposerMarriage || targetMarriage) {
    await deleteProposal(proposal.id);

    await interaction.reply({
      content:
        "❌ One of you is already married.",
      ephemeral: true,
    });

    return;
  }

  // Create marriage
  await createMarriage(
    proposerId,
    targetId,
  );

  // Remove pending proposal
  await deleteProposal(proposal.id);

  const embed = EmbedBuilder.from(
    interaction.message.embeds[0],
  )
    .setColor(0x57f287)
    .setTitle("💍 Marriage!")
    .setDescription(
      `🎉 Congratulations!\n\n<@${proposerId}> and <@${targetId}> are now officially married! ❤️`,
    );

  await interaction.update({
    embeds: [embed],
    components: [disabledRow],
  });
}