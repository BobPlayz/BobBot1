import http from "node:http";
import { logger } from "./logger.js";
import { startBot } from "./bot.js";

// Minimal HTTP health-check server — Railway requires a port to stay open
const PORT = parseInt(process.env.PORT ?? "3000", 10);
const server = http.createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("BobBot is running 🤖");
});

server.listen(PORT, () => {
  logger.info({ port: PORT }, "Health check server listening");
});

startBot().catch((err) => {
  logger.error({ err }, "Failed to start bot");
  process.exit(1);
});
