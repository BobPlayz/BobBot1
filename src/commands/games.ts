import {
  SlashCommandBuilder,
  EmbedBuilder,
  type ChatInputCommandInteraction,
  type ButtonInteraction,
} from "discord.js";
import { db, gamesTable } from "../db.js";
import { eq, and } from "drizzle-orm";
import { emptyTTBoard, encodeTTBoard, decodeTTBoard, checkTTWinner, buildTTComponents } from "../utils/tictactoe.js";
import { emptyCFBoard, encodeCFBoard, decodeCFBoard, dropPiece, checkCFWinner, renderCFBoard, buildCFComponents } from "../utils/connectfour.js";

export const tictactoeCommand = new SlashCommandBuilder()
  .setName("tictactoe").setDescription("Challenge someone to Tic Tac Toe!")
  .addUserOption((o) => o.setName("opponent").setDescription("Who to challenge").setRequired(true));

export const connectfourCommand = new SlashCommandBuilder()
  .setName("connectfour").setDescription("Challenge someone to Connect Four!")
  .addUserOption((o) => o.setName("opponent").setDescription("Who to challenge").setRequired(true));

// ─── Tic Tac Toe ─────────────────────────────────────────────────────────────

export async function handleTicTacToe(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  const challenger = interaction.user;
  const opponent   = interaction.options.getUser("opponent", true);
  if (opponent.id === challenger.id) { await interaction.editReply("You can't play against yourself!"); return; }
  if (opponent.bot)                  { await interaction.editReply("You can't challenge a bot!");       return; }

  const board   = emptyTTBoard();
  const [game]  = await db.insert(gamesTable).values({
    type: "tictactoe", guildId: interaction.guildId!, channelId: interaction.channelId,
    player1Id: challenger.id, player2Id: opponent.id, boardState: encodeTTBoard(board),
    currentTurn: challenger.id, isActive: true,
  }).returning();

  const msg = await interaction.editReply({ embeds: [buildTTEmbed(game.id, challenger.id, opponent.id, challenger.id, null, null)], components: buildTTComponents(board) });
  await db.update(gamesTable).set({ messageId: msg.id }).where(eq(gamesTable.id, game.id));
}

export async function handleTTButton(interaction: ButtonInteraction): Promise<void> {
  const idx    = parseInt(interaction.customId.replace("ttt_", ""), 10);
  const [game] = await db.select().from(gamesTable).where(and(eq(gamesTable.messageId, interaction.message.id), eq(gamesTable.type, "tictactoe"), eq(gamesTable.isActive, true)));
  if (!game)                                         { await interaction.reply({ content: "This game is no longer active.", ephemeral: true }); return; }
  if (interaction.user.id !== game.currentTurn)      { await interaction.reply({ content: "It's not your turn!", ephemeral: true });             return; }

  const board = decodeTTBoard(game.boardState);
  if (board[idx] !== null)                           { await interaction.reply({ content: "That cell is already taken!", ephemeral: true });      return; }

  const piece    = interaction.user.id === game.player1Id ? "X" : "O";
  board[idx]     = piece;
  const encoded  = encodeTTBoard(board);
  const nextTurn = interaction.user.id === game.player1Id ? game.player2Id : game.player1Id;
  const result   = checkTTWinner(board);

  if (result) {
    const winnerId = result === "draw" ? null : interaction.user.id;
    await db.update(gamesTable).set({ boardState: encoded, isActive: false, winnerId }).where(eq(gamesTable.id, game.id));
    await interaction.update({ embeds: [buildTTEmbed(game.id, game.player1Id, game.player2Id, nextTurn, result, winnerId)], components: buildTTComponents(board, true) });
  } else {
    await db.update(gamesTable).set({ boardState: encoded, currentTurn: nextTurn }).where(eq(gamesTable.id, game.id));
    await interaction.update({ embeds: [buildTTEmbed(game.id, game.player1Id, game.player2Id, nextTurn, null, null)], components: buildTTComponents(board) });
  }
}

function buildTTEmbed(gameId: number, p1: string, p2: string, turn: string, result: "X" | "O" | "draw" | null, winnerId: string | null) {
  const embed = new EmbedBuilder().setTitle("❌⭕ Tic Tac Toe")
    .addFields({ name: "❌ Player 1", value: `<@${p1}>`, inline: true }, { name: "⭕ Player 2", value: `<@${p2}>`, inline: true })
    .setFooter({ text: `Game #${gameId}` });
  if (result === "draw") embed.setColor(0x99aab5).setDescription("**It's a draw!** 🤝");
  else if (result)       embed.setColor(0x57f287).setDescription(`🏆 **<@${winnerId}> wins!**`);
  else                   embed.setColor(0x5865f2).setDescription(`⏳ **<@${turn}>'s turn**`);
  return embed;
}

// ─── Connect Four ────────────────────────────────────────────────────────────

export async function handleConnectFour(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  const challenger = interaction.user;
  const opponent   = interaction.options.getUser("opponent", true);
  if (opponent.id === challenger.id) { await interaction.editReply("You can't play against yourself!"); return; }
  if (opponent.bot)                  { await interaction.editReply("You can't challenge a bot!");       return; }

  const board  = emptyCFBoard();
  const [game] = await db.insert(gamesTable).values({
    type: "connectfour", guildId: interaction.guildId!, channelId: interaction.channelId,
    player1Id: challenger.id, player2Id: opponent.id, boardState: encodeCFBoard(board),
    currentTurn: challenger.id, isActive: true,
  }).returning();

  const msg = await interaction.editReply({ embeds: [buildCFEmbed(game.id, challenger.id, opponent.id, challenger.id, null, null, board)], components: buildCFComponents(board) });
  await db.update(gamesTable).set({ messageId: msg.id }).where(eq(gamesTable.id, game.id));
}

export async function handleCFButton(interaction: ButtonInteraction): Promise<void> {
  const col    = parseInt(interaction.customId.replace("cf_", ""), 10);
  const [game] = await db.select().from(gamesTable).where(and(eq(gamesTable.messageId, interaction.message.id), eq(gamesTable.type, "connectfour"), eq(gamesTable.isActive, true)));
  if (!game)                                    { await interaction.reply({ content: "This game is no longer active.", ephemeral: true }); return; }
  if (interaction.user.id !== game.currentTurn) { await interaction.reply({ content: "It's not your turn!", ephemeral: true });            return; }

  const board    = decodeCFBoard(game.boardState);
  const piece    = interaction.user.id === game.player1Id ? "R" : "Y";
  const newBoard = dropPiece(board, col, piece);
  if (!newBoard) { await interaction.reply({ content: "That column is full!", ephemeral: true }); return; }

  const encoded  = encodeCFBoard(newBoard);
  const nextTurn = interaction.user.id === game.player1Id ? game.player2Id : game.player1Id;
  const result   = checkCFWinner(newBoard);

  if (result) {
    const winnerId = result === "draw" ? null : interaction.user.id;
    await db.update(gamesTable).set({ boardState: encoded, isActive: false, winnerId }).where(eq(gamesTable.id, game.id));
    await interaction.update({ embeds: [buildCFEmbed(game.id, game.player1Id, game.player2Id, nextTurn, result, winnerId, newBoard)], components: buildCFComponents(newBoard, true) });
  } else {
    await db.update(gamesTable).set({ boardState: encoded, currentTurn: nextTurn }).where(eq(gamesTable.id, game.id));
    await interaction.update({ embeds: [buildCFEmbed(game.id, game.player1Id, game.player2Id, nextTurn, null, null, newBoard)], components: buildCFComponents(newBoard) });
  }
}

function buildCFEmbed(gameId: number, p1: string, p2: string, turn: string, result: "R" | "Y" | "draw" | null, winnerId: string | null, board: ReturnType<typeof emptyCFBoard>) {
  const embed = new EmbedBuilder().setTitle("🔴🟡 Connect Four")
    .addFields({ name: "🔴 Player 1", value: `<@${p1}>`, inline: true }, { name: "🟡 Player 2", value: `<@${p2}>`, inline: true })
    .setFooter({ text: `Game #${gameId}` });
  const boardStr = renderCFBoard(board);
  if (result === "draw") embed.setColor(0x99aab5).setDescription(`**It's a draw!** 🤝\n\n${boardStr}`);
  else if (result)       embed.setColor(0x57f287).setDescription(`🏆 **<@${winnerId}> wins!**\n\n${boardStr}`);
  else                   embed.setColor(turn === p1 ? 0xff4444 : 0xffd700).setDescription(`⏳ **<@${turn}>'s turn** ${turn === p1 ? "🔴" : "🟡"}\n\n${boardStr}`);
  return embed;
}
