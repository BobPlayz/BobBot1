import {
SlashCommandBuilder,
ChatInputCommandInteraction,
EmbedBuilder,
} from "discord.js";

import {
getOrCreateUser,
applyBankInterest,
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
.addStringOption(o =>
o.setName("amount").setDescription("Amount or 'all'").setRequired(true),
);

export const withdrawCommand = new SlashCommandBuilder()
.setName("withdraw")
.setDescription("Withdraw coins from your bank")
.addStringOption(o =>
o.setName("amount").setDescription("Amount or 'all'").setRequired(true),
);

export const upgradeBankCommand = new SlashCommandBuilder()
.setName("upgradebank")
.setDescription("Upgrade your bank");

export async function handleBankCommand(
interaction: ChatInputCommandInteraction,
): Promise<void> {
const user = await getOrCreateUser(interaction.user.id);
const bank = await applyBankInterest(interaction.user.id);

await interaction.reply({
embeds: [
new EmbedBuilder()
.setColor(0x5865f2)
.setTitle("🏦 Bank")
.setDescription("your money is literally making money while you sleep 😭")
.addFields(
{
name: "💰 Wallet",
value: `${user.balance.toLocaleString()} 🪙`,
inline: true,
},
{
name: "🏦 Bank",
value: `${bank.balance.toLocaleString()} / ${bank.maxStorage.toLocaleString()} 🪙`,
inline: true,
},
{
name: "📈 Interest",
value: `${bank.interestRate}% per day`,
inline: true,
},
{
name: "⭐ Level",
value: bank.bankLevel.toString(),
inline: true,
},
),
],
});
}

export async function handleDepositCommand(
interaction: ChatInputCommandInteraction,
): Promise<void> {
const input = interaction.options.getString("amount", true);
const user = await getOrCreateUser(interaction.user.id);

const amount =
input.toLowerCase() === "all" ? user.balance : Number(input);

if (!Number.isFinite(amount)) {
await interaction.reply({
content: "❌ that amount is cursed bro",
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

await interaction.reply({
embeds: [
new EmbedBuilder()
.setColor(0x57f287)
.setTitle("🏦 Deposit Successful")
.addFields(
{
name: "Deposited",
value: `${amount.toLocaleString()} 🪙`,
inline: true,
},
{
name: "Wallet",
value: `${result.wallet.toLocaleString()} 🪙`,
inline: true,
},
{
name: "Bank",
value: `${result.bank.toLocaleString()} 🪙`,
inline: true,
},
),
],
});
}

export async function handleWithdrawCommand(
interaction: ChatInputCommandInteraction,
): Promise<void> {
const input = interaction.options.getString("amount", true);
const bank = await applyBankInterest(interaction.user.id);

const amount =
input.toLowerCase() === "all" ? bank.balance : Number(input);

if (!Number.isFinite(amount)) {
await interaction.reply({
content: "❌ that amount is cursed bro",
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

await interaction.reply({
embeds: [
new EmbedBuilder()
.setColor(0x3498db)
.setTitle("💸 Withdrawal Successful")
.addFields(
{
name: "Withdrawn",
value: `${amount.toLocaleString()} 🪙`,
inline: true,
},
{
name: "Wallet",
value: `${result.wallet.toLocaleString()} 🪙`,
inline: true,
},
{
name: "Bank",
value: `${result.bank.toLocaleString()} 🪙`,
inline: true,
},
),
],
});
}

export async function handleUpgradeBankCommand(
interaction: ChatInputCommandInteraction,
): Promise<void> {
const result = await upgradeBank(interaction.user.id);

if (!result.success) {
await interaction.reply({
content: `❌ need **${result.cost.toLocaleString()} 🪙** first`,
ephemeral: true,
});
return;
}

await interaction.reply({
embeds: [
new EmbedBuilder()
.setColor(0xf1c40f)
.setTitle("⭐ Bank Upgraded")
.setDescription(`Level **${result.newLevel}** unlocked.`)
.addFields({
name: "New Storage",
value: `${result.newStorage.toLocaleString()} 🪙`,
inline: true,
}),
],
});
}
