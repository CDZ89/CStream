const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.example") });

const commands = [];
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ("data" in command && "execute" in command) {
        commands.push(command.data.toJSON());
    }
}

const rest = new REST().setToken(
    process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN || "",
);

(async () => {
    try {
        const token =
            process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN;
        if (!token || token === "") {
            console.error(
                "Error: No valid Discord token provided in environment variables.",
            );
            return;
        }
        const clientId = process.env.CLIENT_ID || "1444721543484805132";

        console.log(
            `Started refreshing ${commands.length} application (/) commands.`,
        );

        const data = await rest.put(Routes.applicationCommands(clientId), {
            body: commands,
        });

        console.log(
            `Successfully reloaded ${data.length} application (/) commands.`,
        );
    } catch (error) {
        console.error(error);
    }
})();
