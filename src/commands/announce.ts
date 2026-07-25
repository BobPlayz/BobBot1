import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
  ChannelType,
} from "discord.js";

export const announceCommand = new SlashCommandBuilder()
  .setName("announce")
  .setDescription("Send an announcement to a channel")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .addChannelOption((o) =>
    o.setName("channel").setDescription("Channel to announce in").setRequired(true).addChannelTypes(ChannelType.GuildText),
  )
  .addStringOption((o) => o.setName("message").setDescription("The announcement message").setRequired(true))
  .addStringOption((o) => o.setName("title").setDescription("Embed title (optional)").setRequired(false))
  .addStringOption((o) => o.setName("color").setDescription("Embed color hex (e.g. #ff0000)").setRequired(false));

export async function handleAnnounce(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });
  const channel  = interaction.options.getChannel("channel", true);
  const message  = interaction.options.getString("message", true);
  const title    = interaction.options.getString("title") ?? "📢 Announcement";
  const colorHex = interaction.options.getString("color") ?? "#5865F2";
  const colorNum = parseInt(colorHex.replace("#", ""), 16);

  const embed = new EmbedBuilder()
    .setColor(isNaN(colorNum) ? 0x5865f2 : colorNum)
    .setTitle(title)
    .setDescription(message)
    .setTimestamp()
    .setFooter({ text: `Announced by ${interaction.user.username}` });

  if (!("send" in channel)) { await interaction.editReply("That channel doesn't support messages."); return; }
  await channel.send({ embeds: [embed] });
  await interaction.editReply(`✅ Announcement sent to <#${channel.id}>!`);
}
