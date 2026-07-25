import {
  SlashCommandBuilder,
  EmbedBuilder,
  type ChatInputCommandInteraction,
  type Message,
} from "discord.js";
import { fetchAnimeGif, detectMood, actionColors, actionLabels, moodFooter, type ActionType } from "../utils/nekos.js";

export const actionCommands = [
  new SlashCommandBuilder().setName("slap").setDescription("Slap someone!")
    .addUserOption((o) => o.setName("target").setDescription("Who to slap").setRequired(true)),
  new SlashCommandBuilder().setName("bite").setDescription("Bite someone!")
    .addUserOption((o) => o.setName("target").setDescription("Who to bite").setRequired(true)),
  new SlashCommandBuilder().setName("pinch").setDescription("Pinch someone!")
    .addUserOption((o) => o.setName("target").setDescription("Who to pinch").setRequired(true)),
  new SlashCommandBuilder().setName("kill").setDescription("Kill someone!")
    .addUserOption((o) => o.setName("target").setDescription("Who to kill").setRequired(true)),
];

async function fetchRecentMessages(channel: any): Promise<Array<{ authorId: string; content: string }>> {
  try {
    if (channel && "messages" in channel) {
      const fetched = await channel.messages.fetch({ limit: 15 });
      return fetched.map((m: Message) => ({ authorId: m.author.id, content: m.content }));
    }
  } catch { /* mood will be random */ }
  return [];
}

export async function handleActionCommand(
  interaction: ChatInputCommandInteraction,
  action: ActionType,
): Promise<void> {
  await interaction.deferReply();
  const actor  = interaction.user;
  const target = interaction.options.getUser("target", true);

  if (target.id === actor.id) { await interaction.editReply("You can't use this on yourself!"); return; }

  const messages = await fetchRecentMessages(interaction.channel);
  const mood     = detectMood(messages, actor.id, target.id);
  const { url, animeName } = await fetchAnimeGif(action, mood);

  const embed = new EmbedBuilder()
    .setColor(actionColors[action][mood])
    .setTitle(`${actor.username} ${actionLabels[action][mood]} ${target.username}!`)
    .setDescription(mood === "mean"
      ? `💢 **${actor.username}** really went off on **${target.username}**...`
      : `✨ **${actor.username}** ${actionLabels[action][mood]} **${target.username}** in the most adorable way~`)
    .setImage(url)
    .setFooter({ text: `${moodFooter[mood]} • From: ${animeName}` });

  await interaction.editReply({ embeds: [embed] });
}

// Prefix handler — `bob slap @user`, `bob bite @user`, etc.
export async function handleActionMessage(message: Message, action: ActionType): Promise<void> {
  const target = message.mentions.users.first();
  if (!target) { await message.reply(`Mention someone! e.g. \`bob ${action} @user\``); return; }
  if (target.id === message.author.id) { await message.reply("You can't use this on yourself!"); return; }

  const messages = await fetchRecentMessages(message.channel);
  const mood     = detectMood(messages, message.author.id, target.id);
  const { url, animeName } = await fetchAnimeGif(action, mood);

  const embed = new EmbedBuilder()
    .setColor(actionColors[action][mood])
    .setTitle(`${message.author.username} ${actionLabels[action][mood]} ${target.username}!`)
    .setDescription(mood === "mean"
      ? `💢 **${message.author.username}** really went off on **${target.username}**...`
      : `✨ **${message.author.username}** ${actionLabels[action][mood]} **${target.username}** in the most adorable way~`)
    .setImage(url)
    .setFooter({ text: `${moodFooter[mood]} • From: ${animeName}` });

  await message.reply({ embeds: [embed] });
}
