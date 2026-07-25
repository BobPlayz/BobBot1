import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export type CF_Cell  = "R" | "Y" | null;
export type CF_Board = CF_Cell[][];

export const COLS = 7;
export const ROWS = 6;

export function emptyCFBoard(): CF_Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

export function encodeCFBoard(board: CF_Board): string {
  return board.map((row) => row.map((c) => c ?? ".").join("")).join("|");
}

export function decodeCFBoard(s: string): CF_Board {
  return s.split("|").map((row) => row.split("").map((c) => (c === "." ? null : (c as CF_Cell))));
}

export function dropPiece(board: CF_Board, col: number, piece: CF_Cell): CF_Board | null {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row][col] === null) {
      const newBoard = board.map((r) => [...r]);
      newBoard[row][col] = piece;
      return newBoard;
    }
  }
  return null;
}

export function checkCFWinner(board: CF_Board): CF_Cell | "draw" | null {
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c <= COLS - 4; c++) {
      const cell = board[r][c];
      if (cell && cell === board[r][c+1] && cell === board[r][c+2] && cell === board[r][c+3]) return cell;
    }
  for (let r = 0; r <= ROWS - 4; r++)
    for (let c = 0; c < COLS; c++) {
      const cell = board[r][c];
      if (cell && cell === board[r+1][c] && cell === board[r+2][c] && cell === board[r+3][c]) return cell;
    }
  for (let r = 0; r <= ROWS - 4; r++)
    for (let c = 0; c <= COLS - 4; c++) {
      const cell = board[r][c];
      if (cell && cell === board[r+1][c+1] && cell === board[r+2][c+2] && cell === board[r+3][c+3]) return cell;
    }
  for (let r = 0; r <= ROWS - 4; r++)
    for (let c = 3; c < COLS; c++) {
      const cell = board[r][c];
      if (cell && cell === board[r+1][c-1] && cell === board[r+2][c-2] && cell === board[r+3][c-3]) return cell;
    }
  if (board[0].every((c) => c !== null)) return "draw";
  return null;
}

export function renderCFBoard(board: CF_Board): string {
  const colNums = "1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣";
  return board.map((row) => row.map((c) => (c === "R" ? "🔴" : c === "Y" ? "🟡" : "⚫")).join("")).join("\n") + "\n" + colNums;
}

export function buildCFComponents(board: CF_Board, disabled = false): ActionRowBuilder<ButtonBuilder>[] {
  const row = new ActionRowBuilder<ButtonBuilder>();
  for (let c = 0; c < COLS; c++) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`cf_${c}`)
        .setLabel(`${c + 1}`)
        .setStyle(ButtonStyle.Primary)
        .setDisabled(disabled || board[0][c] !== null),
    );
  }
  return [row];
}
