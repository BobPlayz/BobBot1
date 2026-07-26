import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";

import { getMarriage } from "../database/marriages.js";
import {
  createProposal,
  deleteExpiredProposals,
  getIncomingProposal,
  getOutgoingProposal,
} from "../database/proposals.js";

export const proposeCommand = new SlashCommandBuilder()
  .setName("propose")
  .setDescription("Propose to another user 💍")
  .addUserOption(option =>
    option
      .setName("user")
      .setDescription("The person you want to marry")
      .setRequired(true),
  );

export async function handleProposeCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const proposer = interaction.user;
  const target = interaction.options.getUser("user", true);

  // Clean up expired proposals first
  await deleteExpiredProposals();

  if (target.bot) {
    await interaction.reply({
      content: "❌ You can't marry a bot.",
      ephemeral: true,
    });
    return;
  }

  if (target.id === proposer.id) {
    await interaction.reply({
      content: "❌ You can't marry yourself.",
      ephemeral: true,
    });
    return;
  }

  // Already married?
  const proposerMarriage = await getMarriage(proposer.id);
  if (proposerMarriage) {
    await interaction.reply({
      content: "💍 You're already married.",
      ephemeral: true,
    });
    return;
  }

  const targetMarriage = await getMarriage(target.id);
  if (targetMarriage) {
    await interaction.reply({
      content: "💍 That user is already married.",
      ephemeral: true,
    });
    return;
  }

  // Already has an outgoing proposal?
  const outgoing = await getOutgoingProposal(proposer.id);
  if (outgoing) {
    await interaction.reply({
      content: "❌ You already have a pending proposal.",
      ephemeral: true,
    });
    return;
  }

  // Target already has an incoming proposal?
  const incoming = await getIncomingProposal(target.id);
  if (incoming) {
    await interaction.reply({
      content: "❌ That user already has a pending proposal.",
      ephemeral: true,
    });
    return;
  }

  // Save proposal
  await createProposal(proposer.id, target.id);

  const embed = new EmbedBuilder()
    .setColor(0xff69b4)
    .setTitle("💍 Marriage Proposal")
    .setDescription(
      `### ${proposer} has proposed to ${target}!\n\n` +
      `Will you accept this proposal?\n\n` +
      `⌛ This proposal expires in **5 minutes**.`,
    )
    .addFields(
      {
        name: "Proposed By",
        value: proposer.toString(),
        inline: true,
      },
      {
        name: "Proposed To",
        value: target.toString(),
        inline: true,
      },
    )
    .setFooter({
      text: "Only the mentioned user can respond.",
    })
    .setTimestamp();

  const row =
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`marry_accept_${proposer.id}_${target.id}`)
        .setLabel("Accept")
        .setEmoji("💚")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId(`marry_decline_${proposer.id}_${target.id}`)
        .setLabel("Decline")
        .setEmoji("💔")
        .setStyle(ButtonStyle.Danger),
    );

  await interaction.reply({
    embeds: [embed],
    components: [row],
  });
}