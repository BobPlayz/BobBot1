import {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  type Interaction,
  type Message,
  EmbedBuilder,
} from "discord.js";

import { logger } from "./logger.js";
import { registerCommands } from "./register-commands.js";
import { seedShop } from "./seed-shop.js";
import { handleAICommand } from "./commands/ai.js";

import {
  handleActionCommand,
  handleActionMessage,
} from "./commands/actions.js";
import {
  handleBankCommand,
  handleDepositCommand,
  handleWithdrawCommand,
  handleUpgradeBankCommand,
} from "./commands/bank.js";
import {
  handleProfileCommand,
} from "./commands/profile.js";

import type { ActionType } from "./utils/nekos.js";

import { handleAnnounce } from "./commands/announce.js";

import {
  handleGiveawayCommand,
  handleGiveawayEnter,
} from "./commands/giveaway.js";

import {
  handleBalance,
  handlePay,
  handleWork,
  handleFish,
  handleHunt,
  handleShop,
  handleBuy,
  handleInventory,
  handleBuyAutocomplete,
  handleDaily,
  handleLeaderboard,
  handleRob,
  handleCoinflip,
  handleDice,
} from "./commands/economy.js";

import {
  handleTicTacToe,
  handleConnectFour,
  handleTTButton,
  handleCFButton,
} from "./commands/games.js";

import {
  handleEightBall,
  handlePoll,
  handlePollButton,
  handleUserInfo,
  handleServerInfo,
} from "./commands/fun.js";

import { handleProposeCommand } from "./commands/propose.js";
import { handleMarriageButton } from "./commands/marriage-buttons.js";
import { handlePartnerCommand } from "./commands/partner.js";
import {
  handleDivorceCommand,
  handleDivorceButton,
} from "./commands/divorce.js";

import { addXP } from "./database/server-levels.js";

const ACTION_COMMANDS: ActionType[] = [
  "slap",
  "bite",
  "pinch",
  "kill",
];

const PREFIX = "bob";

export async function startBot(): Promise<void> {
  const token = process.env.DISCORD_BOT_TOKEN;

  if (!token) {
    logger.warn(
      "DISCORD_BOT_TOKEN not set — bot will not start.",
    );
    return;
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
    partials: [
      Partials.Message,
      Partials.Channel,
    ],
  });

  client.once(Events.ClientReady, async (c) => {
    logger.info(
      { tag: c.user.tag },
      "Discord bot logged in",
    );

    await registerCommands();
    await seedShop();
  });

  client.on(
    Events.MessageCreate,
    async (message: Message) => {
      if (message.author.bot) return;
      if (!message.guild) return;

      // ==========================
      // XP SYSTEM
      // ==========================

      try {
        const result = await addXP(
          message.guild.id,
          message.author.id,
          Math.floor(Math.random() * 11) + 15,
        );

        if (result.newLevel > result.oldLevel) {
          const embed = new EmbedBuilder()
            .setColor(0xf1c40f)
            .setTitle("🎉 Level Up!")
            .setDescription(
              `${message.author} reached **Level ${result.newLevel}**!`,
            )
            .setThumbnail(
              message.author.displayAvatarURL(),
            )
            .setFooter({
              text: "More custom level cards coming soon...",
            });

          await message.reply({
            embeds: [embed],
          });
        }
      } catch (err) {
        logger.error(
          { err },
          "Failed to award XP",
        );
      }

      // ==========================
      // PREFIX COMMANDS
      // ==========================

      const content = message.content
        .trim()
        .toLowerCase();

      if (!content.startsWith(PREFIX + " "))
        return;

      const sub = content
        .slice(PREFIX.length)
        .trim()
        .split(/\s+/)[0] as ActionType;

      if (
        (ACTION_COMMANDS as string[]).includes(sub)
      ) {
        await handleActionMessage(
          message,
          sub,
        ).catch((err) => {
          logger.error(
            { err },
            "Prefix command error",
          );

          message
            .reply(
              "❌ Something went wrong!",
            )
            .catch(() => {});
        });
      }
    },
  );

  client.on(
    Events.InteractionCreate,
    async (interaction: Interaction) => {
      try {
        if (interaction.isAutocomplete()) {
          if (
            interaction.commandName === "buy"
          ) {
            await handleBuyAutocomplete(
              interaction,
            );
          }

          return;
        }

        if (interaction.isButton()) {
          if (
            interaction.customId.startsWith(
              "ttt_",
            )
          ) {
            await handleTTButton(
              interaction,
            );
          } else if (
            interaction.customId.startsWith(
              "cf_",
            )
          ) {
            await handleCFButton(
              interaction,
            );
          } else if (
            interaction.customId ===
            "giveaway_enter"
          ) {
            await handleGiveawayEnter(
              interaction,
            );
          } else if (
            interaction.customId.startsWith(
              "poll_",
            )
          ) {
            await handlePollButton(
              interaction,
            );
          } else if (
            interaction.customId.startsWith(
              "marry_accept_",
            ) ||
            interaction.customId.startsWith(
              "marry_decline_",
            )
          ) {
            await handleMarriageButton(
              interaction,
            );
          } else if (
            interaction.customId.startsWith(
              "divorce_confirm_",
            ) ||
            interaction.customId.startsWith(
              "divorce_cancel_",
            )
          ) {
            await handleDivorceButton(
              interaction,
            );
          }

          return;
        }

        if (
          !interaction.isChatInputCommand()
        )
          return;

        const { commandName } =
          interaction;

        if (
          (
            ACTION_COMMANDS as string[]
          ).includes(commandName)
        ) {
          await handleActionCommand(
            interaction,
            commandName as ActionType,
          );

          return;
        }

        switch (commandName) {
          case "announce":
            await handleAnnounce(interaction);
            break;

          case "giveaway":
            await handleGiveawayCommand(interaction);
            break;

          
   case "balance":
  await handleBalance(interaction);
  break;

case "pay":
  await handlePay(interaction);
  break;

case "profile":
  await handleProfileCommand(interaction);
  break;

case "daily":
  await handleDaily(interaction);
  break;

          case "work":
            await handleWork(interaction);
            break;

          case "fish":
            await handleFish(interaction);
            break;

          case "hunt":
            await handleHunt(interaction);
            break;

          case "rob":
            await handleRob(interaction);
            break;
case "ai":
  await handleAICommand(interaction);
  break;
          case "shop":
            await handleShop(interaction);
            break;

          case "buy":
            await handleBuy(interaction);
            break;
            case "bank":
  await handleBankCommand(interaction);
  break;

case "deposit":
  await handleDepositCommand(interaction);
  break;

case "withdraw":
  await handleWithdrawCommand(interaction);
  break;

case "upgradebank":
  await handleUpgradeBankCommand(interaction);
  break;

          case "inventory":
            await handleInventory(interaction);
            break;

          case "leaderboard":
            await handleLeaderboard(interaction);
            break;

          case "coinflip":
            await handleCoinflip(interaction);
            break;

          case "dice":
            await handleDice(interaction);
            break;

          case "tictactoe":
            await handleTicTacToe(interaction);
            break;

          case "connectfour":
            await handleConnectFour(interaction);
            break;

          case "8ball":
            await handleEightBall(interaction);
            break;

          case "poll":
            await handlePoll(interaction);
            break;

          case "userinfo":
            await handleUserInfo(interaction);
            break;

          case "serverinfo":
            await handleServerInfo(interaction);
            break;

          case "propose":
            await handleProposeCommand(interaction);
            break;

          case "partner":
            await handlePartnerCommand(interaction);
            break;

          case "divorce":
            await handleDivorceCommand(interaction);
            break;

          default:
            logger.warn(
              { commandName },
              "Unknown command",
            );
        }
      } catch (err) {
        logger.error(
          { err },
          "Interaction error",
        );

        const msg =
          "❌ Something went wrong. Please try again.";

        if (interaction.isRepliable()) {
          if (
            interaction.deferred ||
            interaction.replied
          ) {
            await interaction
              .editReply(msg)
              .catch(() => {});
          } else {
            await interaction
              .reply({
                content: msg,
                ephemeral: true,
              })
              .catch(() => {});
          }
        }
      }
    },
  );

  await client.login(token);
}
