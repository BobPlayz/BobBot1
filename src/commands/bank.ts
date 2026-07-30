import {
SlashCommandBuilder,
ChatInputCommandInteraction,
EmbedBuilder,
} from "discord.js";

import {
getOrCreateUser,
getOrCreateBank,
depositCoins,
withdrawCoins,
upgradeBank,
} from "../utils/economy.js";

export const bankCommand = new SlashCommandBuilder()
.setName("bank")
.setDescription("View your bank account");

export const depositCommand = new SlashCommandBuilder()
.setName("deposit")
.setDescription("Deposit coins into your bank")
.addStringOption((option) =>
option
.setName("amount")
.setDescription("Amount to deposit or 'all'")
.setRequired(true),
);

export const withdrawCommand = new SlashCommandBuilder()
.setName("withdraw")
.setDescription("Withdraw coins from your bank")
.addStringOption((option) =>
option
.setName("amount")
.setDescription("Amount to withdraw or 'all'")
.setRequired(true),
);

export const upgradeBankCommand = new SlashCommandBuilder()
.setName("upgradebank")
.setDescription("Upgrade your bank");

export async function handleBankCommand(
interaction: ChatInputCommandInteraction,
): Promise<void> {
const user = await getOrCreateUser(interaction.user.id);
const bank = await getOrCreateBank(interaction.user.id);

const embed = new EmbedBuilder()
.setColor(0x5865f2)
.setTitle("🏦 Bank Account")
.addFields(
{
name: "💰 Wallet",
value: `${user.balance.toLocaleString()} coins`,
inline: true,
},
{
name: "🏦 Bank",
value: `${bank.balance.toLocaleString()} / ${bank.maxStorage.toLocaleString()} coins`,
inline: true,
},
{
name: "⭐ Bank Level",
value: bank.bankLevel.toString(),
inline: true,
},
{
name: "📈 Interest",
value: `${bank.interestRate}%`,
inline: true,
},
);

await interaction.reply({ embeds: [embed] });
}

export async function handleDepositCommand(
interaction: ChatInputCommandInteraction,
): Promise<void> {
const input = interaction.options.getString(
"amount",
true,
);

const user = await getOrCreateUser(interaction.user.id);

let amount: number;

if (input.toLowerCase() === "all") {
amount = user.balance;
} else {
amount = Number(input);
}

if (!Number.isFinite(amount)) {
await interaction.reply({
content: "❌ Invalid amount.",
ephemeral: true,
});
return;
}

const result = await depositCoins(interaction.user.id, amount);

if (!result.success) {
await interaction.reply({
content: `❌ ${result.message}`,
ephemeral: true,
});
return;
}

const embed = new EmbedBuilder()
.setColor(0x57f287)
.setTitle("🏦 Deposit Successful")
.addFields(
{
name: "Deposited",
value: `${amount.toLocaleString()} coins`,
inline: true,
},
{
name: "Wallet",
value: `${result.wallet!.toLocaleString()} coins`,
inline: true,
},
{
name: "Bank",
value: `${result.bank!.toLocaleString()} coins`,
inline: true,
},
);

await interaction.reply({ embeds: [embed] });
}

export async function handleWithdrawCommand(
interaction: ChatInputCommandInteraction,
): Promise<void> {
const input = interaction.options.getString(
"amount",
true,
);

const bank = await getOrCreateBank(interaction.user.id);

let amount: number;

if (input.toLowerCase() === "all") {
amount = bank.balance;
} else {
amount = Number(input);
}

if (!Number.isFinite(amount)) {
await interaction.reply({
content: "❌ Invalid amount.",
ephemeral: true,
});
return;
}

const result = await withdrawCoins(interaction.user.id, amount);

if (!result.success) {
await interaction.reply({
content: `❌ ${result.message}`,
ephemeral: true,
});
return;
}

const embed = new EmbedBuilder()
.setColor(0x3498db)
.setTitle("💸 Withdrawal Successful")
.addFields(
{
name: "Withdrawn",
value: `${amount.toLocaleString()} coins`,
inline: true,
},
{
name: "Wallet",
value: `${result.wallet!.toLocaleString()} coins`,
inline: true,
},
{
name: "Bank",
value: `${result.bank!.toLocaleString()} coins`,
inline: true,
},
);

await interaction.reply({ embeds: [embed] });
}

export async function handleUpgradeBankCommand(
interaction: ChatInputCommandInteraction,
): Promise<void> {
const result = await upgradeBank(interaction.user.id);

if (!result.success) {
await interaction.reply({
content: `❌ You need **${result.cost!.toLocaleString()} coins** to upgrade your bank.`,
ephemeral: true,
});
return;
}

const embed = new EmbedBuilder()
.setColor(0xf1c40f)
.setTitle("⭐ Bank Upgraded!")
.setDescription(
`Your bank is now **Level ${result.newLevel!}**!`,
)
.addFields({
name: "New Storage Capacity",
value: `${result.newStorage!.toLocaleString()} coins`,
inline: true,
});

await interaction.reply({ embeds: [embed] });
}
