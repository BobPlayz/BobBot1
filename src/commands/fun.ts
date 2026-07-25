import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
  type ButtonInteraction,
  GuildMember,
} from "discord.js";

// ─── /8ball ────────────────────────────────────────────────────────────────
const EIGHT_BALL_ANSWERS = [
  { text: "It is certain.",            positive: true  },
  { text: "It is decidedly so.",        positive: true  },
  { text: "Without a doubt.",           positive: true  },
  { text: "Yes, definitely!",           positive: true  },
  { text: "You may rely on it.",        positive: true  },
  { text: "As I see it, yes.",          positive: true  },
  { text: "Most likely.",               positive: true  },
  { text: "Outlook good.",              positive: true  },
  { text: "Yes.",                       positive: true  },
  { text: "Signs point to yes.",        positive: true  },
  { text: "Reply hazy, try again.",     positive: null  },
  { text: "Ask again later.",           positive: null  },
  { text: "Better not tell you.",       positive: null  },
  { text: "Cannot predict now.",        positive: null  },
  { text: "Concentrate and ask again.", positive: null  },
  { text: "Don't count on it.",         positive: false },
  { text: "My reply is no.",            positive: false },
  { text: "My sources say no.",         positive: false },
  { text: "Outlook not so good.",       positive: false },
  { text: "Very doubtful.",             positive: false },
];

export const eightBallCommand = new SlashCommandBuilder()
  .setName("8ball").setDescription("Ask the magic 8-ball a question")
  .addStringOption((o) => o.setName("question").setDescription("Your yes/no question").setRequired(true));

export async function handleEightBall(interaction: ChatInputCommandInteraction): Promise<void> {
  const question = interaction.options.getString("question", true);
  const answer   = EIGHT_BALL_ANSWERS[Math.floor(Math.random() * EIGHT_BALL_ANSWERS.length)];
  const color    = answer.positive === true ? 0x57f287 : answer.positive === false ? 0xed4245 : 0xfee75c;
  const embed = new EmbedBuilder().setColor(color).setTitle("🎱 Magic 8-Ball")
    .addFields({ name: "Question", value: question }, { name: "Answer", value: `**${answer.text}**` }).setTimestamp();
  await interaction.reply({ embeds: [embed] });
}

// ─── /poll ─────────────────────────────────────────────────────────────────
export const pollCommand = new SlashCommandBuilder()
  .setName("poll").setDescription("Create a yes/no/maybe poll")
  .addStringOption((o) => o.setName("question").setDescription("The poll question").setRequired(true));

export async function handlePoll(interaction: ChatInputCommandInteraction): Promise<void> {
  const question = interaction.options.getString("question", true);
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("poll_yes").setLabel("✅ Yes").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("poll_no").setLabel("❌ No").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("poll_maybe").setLabel("🤷 Maybe").setStyle(ButtonStyle.Secondary),
  );
  const embed = new EmbedBuilder().setColor(0x5865f2).setTitle("📊 Poll").setDescription(`**${question}**`)
    .setFooter({ text: `Poll by ${interaction.user.username}` }).setTimestamp();
  await interaction.reply({ embeds: [embed], components: [row] });
}

export async function handlePollButton(interaction: ButtonInteraction): Promise<void> {
  await interaction.reply({ content: "✅ Vote recorded!", ephemeral: true });
}

// ─── /userinfo ─────────────────────────────────────────────────────────────
export const userInfoCommand = new SlashCommandBuilder()
  .setName("userinfo").setDescription("Get info about a user")
  .addUserOption((o) => o.setName("user").setDescription("Target user").setRequired(false));

export async function handleUserInfo(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  const target = (interaction.options.getMember("user") ?? interaction.member) as GuildMember | null;
  const user   = target?.user ?? interaction.options.getUser("user") ?? interaction.user;

  const roles = target && "roles" in target
    ? target.roles.cache.filter((r) => r.id !== interaction.guildId).map((r) => `<@&${r.id}>`).slice(0, 10).join(" ") || "None"
    : "N/A";
  const joinedAt = target && "joinedAt" in target && target.joinedAt
    ? `<t:${Math.floor(target.joinedAt.getTime() / 1000)}:F>`
    : "Unknown";

  const embed = new EmbedBuilder().setColor(0x5865f2).setTitle(`👤 ${user.username}`)
    .setThumbnail(user.displayAvatarURL({ size: 256 }))
    .addFields(
      { name: "Username",       value: user.username,                                                     inline: true },
      { name: "ID",             value: user.id,                                                           inline: true },
      { name: "Bot?",           value: user.bot ? "Yes" : "No",                                           inline: true },
      { name: "Account Created", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`,              inline: false },
      { name: "Joined Server",  value: joinedAt,                                                          inline: false },
      { name: `Roles (${target && "roles" in target ? target.roles.cache.size - 1 : 0})`, value: roles,  inline: false },
    ).setTimestamp();
  await interaction.editReply({ embeds: [embed] });
}

// ─── /serverinfo ───────────────────────────────────────────────────────────
export const serverInfoCommand = new SlashCommandBuilder()
  .setName("serverinfo").setDescription("Get info about this server");

export async function handleServerInfo(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  const guild = interaction.guild;
  if (!guild) { await interaction.editReply("This command can only be used in a server."); return; }
  await guild.fetch();
  const owner = await guild.fetchOwner();
  const embed = new EmbedBuilder().setColor(0x5865f2).setTitle(`🏠 ${guild.name}`)
    .setThumbnail(guild.iconURL({ size: 256 }) ?? null)
    .addFields(
      { name: "Owner",    value: owner.user.username,                                                                    inline: true },
      { name: "Members",  value: `${guild.memberCount}`,                                                                 inline: true },
      { name: "Roles",    value: `${guild.roles.cache.size}`,                                                            inline: true },
      { name: "Channels", value: `${guild.channels.cache.size} (${guild.channels.cache.filter((c) => c.type === 0).size} text, ${guild.channels.cache.filter((c) => c.type === 2).size} voice)`, inline: true },
      { name: "Boosts",   value: `${guild.premiumSubscriptionCount ?? 0} (Tier ${guild.premiumTier})`,                  inline: true },
      { name: "Created",  value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`,                                  inline: false },
    ).setTimestamp();
  await interaction.editReply({ embeds: [embed] });
}

// ─── Command builders for economy commands registered here for register-commands.ts ───
export const coinflipCommand = new SlashCommandBuilder()
  .setName("coinflip").setDescription("Bet coins on a coin flip — double or nothing")
  .addIntegerOption((o) => o.setName("amount").setDescription("How many coins to bet").setRequired(true).setMinValue(10));

export const diceCommand = new SlashCommandBuilder()
  .setName("dice").setDescription("Roll a dice — land on 6 to win big!")
  .addIntegerOption((o) => o.setName("bet").setDescription("Coins to bet").setRequired(true).setMinValue(10));

export const leaderboardCommand = new SlashCommandBuilder()
  .setName("leaderboard").setDescription("See the richest users in the economy");

export const dailyCommand = new SlashCommandBuilder()
  .setName("daily").setDescription("Claim your daily coin reward");

export const robCommand = new SlashCommandBuilder()
  .setName("rob").setDescription("Attempt to rob another user (risky!)")
  .addUserOption((o) => o.setName("target").setDescription("Who to rob").setRequired(true));
