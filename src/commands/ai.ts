import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { askAI } from "../ai/openai.js";

export const aiCommand =
  new SlashCommandBuilder()
    .setName("ai")
    .setDescription("Talk to BobBot AI")
    .addStringOption((o) =>
      o
        .setName("prompt")
        .setDescription(
          "Ask literally anything",
        )
        .setRequired(true),
    );

export async function handleAICommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  await interaction.deferReply();

  const prompt =
    interaction.options.getString(
      "prompt",
      true,
    );

  const reply = await askAI({
    serverId: interaction.guildId,
    userId: interaction.user.id,
    prompt,
  });

  await interaction.editReply(
    reply.slice(0, 2000),
  );
}
