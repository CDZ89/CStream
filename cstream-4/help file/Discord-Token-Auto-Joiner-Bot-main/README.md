# Discord Token Auto Joiner Bot

## Description

This project is a **Discord Token Auto Joiner Bot**, designed to allow multiple self-bot tokens to join a specified Discord server automatically. It utilizes the Discord OAuth2 authorization process and self-bot clients to facilitate the token joining process.

## Features

- Uses multiple Discord self-bot tokens from a `tokens.txt` file.
- Automates joining tokens to a specified Discord server.
- Implements OAuth2 authorization flow for token authentication.
- Logs successful and failed attempts.
- Provides a `/jointokens` command for easy execution via Discord interactions.

---

## Installation & Setup

### **1. Prerequisites**
- Node.js (latest LTS version recommended)
- npm or yarn
- A Discord bot account with OAuth2 setup

### **2. Clone the Repository**
```sh
git clone https://github.com/ferrymehdi/Discord-Token-Auto-Joiner-Bot.git
cd Discord-Token-Auto-Joiner-Bot
```

### **3. Install Dependencies**
```sh
npm install
```

### **4. Configure Environment Variables**
Create a `.env` file in the root directory and configure the following:
```env
CLIENT_TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_application_id
CLIENT_SECRET=your_discord_application_secret
REDIRECT_URL=http://localhost:3000
```

### **5. Setup Redirect URL in Discord Developer Portal**
1. Go to [Discord Developer Portal](https://discord.com/developers/applications).
2. Select your application.
3. Navigate to the **OAuth2** tab.
4. Scroll down to **Redirects**.
5. Click **Add Redirect** and enter:
   ```
   http://localhost:3000
   ```
6. Click **Save Changes** at the bottom of the page.

---

### **6. Add Discord Tokens**
Create a `tokens.txt` file in the root directory and add each self-bot token on a new line:
```
token_1
token_2
token_3
...
```

---

## Usage

### **Run the Bot**
You can start the bot using:
```sh
npm run dev
```
or
```sh
npm run build:run
```

### **Run with Batch File**
Alternatively, you can use the `run.bat` file for Windows users:
```sh
run.bat
```

### **Execute Command**
Once the bot is running, use the `/jointokens` command in Discord and provide the **guild ID** to start joining tokens.

```
/jointokens guildid: your guild id
```

---

## Project Structure

```
📂 discord-token-joiner
├── 📂 src
│   ├── index.ts (Main bot script)
│   ├── utils.ts (Helper functions)
├── tokens.txt (List of tokens)
├── .env (Environment variables)
├── package.json (Project dependencies & scripts)
├── run.bat (Windows batch file for execution)
├── README.md (Documentation)
```

---

## Troubleshooting

- **Bot not responding?**
  - Check if the bot is online.
  - Verify that the **CLIENT_TOKEN** in `.env` is correct.
  - Make sure the bot has the required permissions.

- **Tokens not joining?**
  - Ensure tokens are valid and active.
  - Check logs for errors related to invalid tokens.

- **OAuth2 URL returns errors?**
  - Confirm that `CLIENT_ID`, `CLIENT_SECRET`, and `REDIRECT_URL` are properly set in `.env`.

---

## Warning ⚠️
- **Self-bots are against Discord's Terms of Service.** Use this script **at your own risk**.
- Avoid using **mass token joiners** as it may result in bans.

---

## License
This project is for educational purposes only. Usage of this script is **at your own discretion**.
