# BobBot 🤖

A full-featured Discord bot with economy, anime action commands, minigames, giveaways, and more.

## Features

### Action Commands (slash or `bob <action> @user`)
- `/slap`, `/bite`, `/pinch`, `/kill` — anime GIFs that change based on chat mood (playful vs mean)
- Prefix: `bob slap @user`, `bob bite @user`, etc.

### Economy
| Command | Description |
|---|---|
| `/balance` | Check your coin balance |
| `/daily` | Claim 200–500 🪙 every 24 hours |
| `/work` | Work a job for coins (1hr cooldown) |
| `/fish` | Go fishing (30min cooldown) |
| `/hunt` | Go hunting (45min cooldown) |
| `/rob @user` | Attempt to steal coins (risky!) |
| `/coinflip <amount>` | Double or nothing |
| `/dice <bet>` | Roll dice — 4–5 wins 1×, 6 wins 3× |
| `/shop` | Browse the item shop |
| `/buy <item>` | Buy an item |
| `/inventory` | View your inventory |
| `/leaderboard` | Top 10 richest users |

### Games
| Command | Description |
|---|---|
| `/tictactoe @user` | Interactive Tic Tac Toe with buttons |
| `/connectfour @user` | Interactive Connect Four with buttons |

### Fun & Utility
| Command | Description |
|---|---|
| `/8ball <question>` | Magic 8-ball answer |
| `/poll <question>` | Create a yes/no/maybe poll |
| `/userinfo [@user]` | Show user details |
| `/serverinfo` | Show server details |
| `/announce` | Send an announcement embed |
| `/giveaway start/end/reroll` | Manage giveaways |

---

## Setup

### 1. Discord Developer Portal
1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. Create a new application → go to **Bot**
3. Click **Reset Token** → copy the token
4. Under **Privileged Gateway Intents**, enable:
   - ✅ **Message Content Intent** (required for `bob slap @user` prefix commands)
5. Go to **OAuth2 → URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Bot permissions: `Send Messages`, `Embed Links`, `Read Message History`, `Use Slash Commands`
6. Copy the generated URL and invite the bot to your server

### 2. Local development
```bash
cp .env.example .env
# Fill in your credentials in .env

npm install
npm run db:push      # Push schema to your database
npm run dev          # Run with hot reload
```

### 3. Deploy to Railway

1. Push this `bot/` folder to a GitHub repo (or the whole repo)
2. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo**
3. Select your repo (and set **Root Directory** to `bot` if it's a subfolder)
4. Add a **PostgreSQL** plugin — Railway auto-sets `DATABASE_URL`
5. Add environment variables in Railway's **Variables** tab:
   - `DISCORD_BOT_TOKEN`
   - `DISCORD_CLIENT_ID`
   - `NODE_ENV=production`
6. Railway will auto-run `npm run build && npm start`

> **Build command:** `npm run build`
> **Start command:** `npm start`

After first deploy, run the DB migration once:
```bash
# In Railway's shell (or locally with Railway's DATABASE_URL)
npm run db:push
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DISCORD_BOT_TOKEN` | ✅ | Bot token from Developer Portal |
| `DISCORD_CLIENT_ID` | ✅ | Application ID from Developer Portal |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `NODE_ENV` | Optional | Set to `production` on Railway |
