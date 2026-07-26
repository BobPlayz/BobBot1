import { REST, Routes } from "discord.js";
import { actionCommands } from "./commands/actions.js";
import { announceCommand } from "./commands/announce.js";
import { giveawayCommand } from "./commands/giveaway.js";
import {
  balanceCommand,
  workCommand,
  fishCommand,
  huntCommand,
  shopCommand,
  buyCommand,
  inventoryCommand,
} from "./commands/economy.js";
import {
  tictactoeCommand,
  connectfourCommand,
} from "./commands/games.js";
import {
  eightBallCommand,
  pollCommand,
  userInfoCommand,
  serverInfoCommand,
  coinflipCommand,
  diceCommand,
  leaderboardCommand,
  dailyCommand,
  robCommand,
} from "./commands/fun.js";
import { proposeCommand } from "./commands/propose.js";
import { partnerCommand } from "./commands/partner.js";
import { divorceCommand } from "./commands/divorce.js";
import { logger } from "./logger.js";

const allCommands = [
  ...actionCommands,

  announceCommand,
  giveawayCommand,

  balanceCommand,
  dailyCommand,
  workCommand,
  fishCommand,
  huntCommand,
  robCommand,
  shopCommand,
  buyCommand,
  inventoryCommand,
  leaderboardCommand,

  coinflipCommand,
  diceCommand,

  tictactoeCommand,
  connectfourCommand,

  eightBallCommand,
  pollCommand,
  userInfoCommand,
  serverInfoCommand,

  proposeCommand,
  partnerCommand,
  divorceCommand,
].map((c) => c.toJSON());

export async function registerCommands(): Promise<void> {
  const token = process.env.DISCORD_BOT_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;

  if (!token || !clientId) {
    logger.error("Missing DISCORD_BOT_TOKEN or DISCORD_CLIENT_ID.");
    return;
  }

  const rest = new REST({ version: "10" }).setToken(token);

  try {
    logger.info(
      { count: allCommands.length },
      "Registering slash commands...",
    );

    await rest.put(
      Routes.applicationCommands(clientId),
      { body: allCommands },
    );

    logger.info("Slash commands registered successfully.");
  } catch (err) {
    logger.error(
      { err },
      "Failed to register slash commands",
    );
  }
}