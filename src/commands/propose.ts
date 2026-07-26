import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";

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

  const embed = new EmbedBuilder()
    .setColor(0xff69b4)
    .setTitle("💍 Marriage Proposal")
    .setDescription(
      `### ${proposer} has proposed to ${target}!\n\n` +
      `Will you accept this proposal? ❤️`,
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