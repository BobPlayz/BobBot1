import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export type TTCell  = "X" | "O" | null;
export type TTBoard = TTCell[];

export function emptyTTBoard(): TTBoard { return Array(9).fill(null); }

export function encodeTTBoard(board: TTBoard): string {
  return board.map((c) => c ?? ".").join("");
}

export function decodeTTBoard(s: string): TTBoard {
  return s.split("").map((c) => (c === "." ? null : (c as TTCell)));
}

export function checkTTWinner(board: TTBoard): TTCell | "draw" | null {
  const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for (const [a,b,c] of wins) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  if (board.every((c) => c !== null)) return "draw";
  return null;
}

export function buildTTComponents(board: TTBoard, disabled = false): ActionRowBuilder<ButtonBuilder>[] {
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  for (let r = 0; r < 3; r++) {
    const row = new ActionRowBuilder<ButtonBuilder>();
    for (let c = 0; c < 3; c++) {
      const idx  = r * 3 + c;
      const cell = board[idx];
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`ttt_${idx}`)
          .setLabel(cell ?? "·")
          .setStyle(cell === "X" ? ButtonStyle.Danger : cell === "O" ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setDisabled(disabled || cell !== null),
      );
    }
    rows.push(row);
  }
  return rows;
}
