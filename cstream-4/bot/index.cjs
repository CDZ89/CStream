const {
    Client,
    GatewayIntentBits,
    Collection,
    Events,
    ActivityType,
    EmbedBuilder,
    PermissionFlagsBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const { getThreadHistory } = require("./utils/memory");
const { generateMediaCard } = require("./utils/tmdb");
require("dotenv").config({ path: path.join(__dirname, "..", "project", ".env") });

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
    ],
});

const statusFilePath = path.join(__dirname, "bot-status.json");
const dataFilePath = path.join(__dirname, "bot-data.json");

const updateBotStatus = (connected) => {
    try {
        fs.writeFileSync(
            statusFilePath,
            JSON.stringify({
                connected,
                lastUpdate: new Date().toISOString(),
                botTag: connected ? client.user?.tag : null,
            }),
        );
    } catch (e) {
        console.error("Error writing bot status:", e);
    }
};

const updateBotData = async () => {
    try {
        const guild = client.guilds.cache.first();
        if (!guild) return;

        const allChannels = guild.channels.cache
            .filter((c) => c.isTextBased())
            .map((c) => ({
                id: c.id,
                name: c.name,
                type: "text",
            }));

        await guild.members.fetch();
        const members = guild.members.cache
            .filter((m) => !m.user.bot)
            .map((m) => ({
                id: m.user.id,
                username: m.user.username,
                tag: m.user.tag,
                displayName: m.displayName,
                avatar: m.user.displayAvatarURL({ size: 64 }),
            }));

        const botData = {
            channels: allChannels,
            members: members,
            guildName: guild.name,
            guildId: guild.id,
            lastUpdate: new Date().toISOString(),
        };

        fs.writeFileSync(dataFilePath, JSON.stringify(botData));
        console.log(
            "Bot data updated with",
            members.length,
            "members and",
            allChannels.length,
            "channels",
        );

        fs.writeFileSync(
            statusFilePath,
            JSON.stringify({
                connected: true,
                lastUpdate: new Date().toISOString(),
                botTag: client.user?.tag,
            }),
        );
    } catch (e) {
        console.error("Error updating bot data:", e);
    }
};

client.commands = new Collection();
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ("data" in command && "execute" in command) {
        client.commands.set(command.data.name, command);
    }
}

client.on(Events.ClientReady, async (c) => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
    updateBotStatus(true);
    await updateBotData();

    // Auto-setup ticket channel 1467450056654323947
    try {
        const ticketChannel = await client.channels
            .fetch("1467450056654323947")
            .catch(() => null);
        if (ticketChannel && ticketChannel.isTextBased()) {
            const {
                ActionRowBuilder,
                ButtonBuilder,
                ButtonStyle,
            } = require("discord.js");
            const embed = new EmbedBuilder()
                .setTitle("🎫 Support CStream")
                .setDescription(
                    "👋 **Bienvenue sur CStream !**\n\nPour ouvrir un ticket de support, cliquez sur le bouton **Ticket** ci-dessous.\nUne équipe vous répondra en français ou en anglais.\n\n--- \n\n👋 **Welcome to CStream!**\n\nTo open a support ticket, click the **Ticket** button below.\nOur team will assist you in French or English.",
                )
                .setColor("#E50914")
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("open_ticket")
                    .setLabel("Ticket")
                    .setEmoji("🎫")
                    .setStyle(ButtonStyle.Primary),
            );

            await ticketChannel.send({ embeds: [embed], components: [row] });
        }
    } catch (e) {
        console.error("Error setting up ticket channel:", e);
    }

    setInterval(() => {
        if (client.isReady()) {
            updateBotStatus(true);
            updateBotData();
        }
    }, 30000);

    client.user.setActivity("Streaming CStream", {
        type: ActivityType.Streaming,
        url: "https://twitch.tv/cstream",
    });
});

client.on(Events.GuildMemberAdd, async (member) => {
    try {
        const welcomeEmbed = new EmbedBuilder()
            .setTitle("👋 Bienvenue sur le serveur CStream")
            .setDescription(
                `Explorez films, séries et anime, suivez les mises à jour et profitez d’outils exclusifs.

🌐 **Site :** https://cstream-1--outrra22.replit.app
💬 **Discord :** https://discord.gg/YSkhZubt3y

Bonne expérience sur CStream.

---

👋 **Welcome to CStream**
Explore movies, series and anime, follow updates and enjoy exclusive tools.

🌐 **Website:** https://cstream-1--outrra22.replit.app
💬 **Discord:** https://discord.gg/YSkhZubt3y

Enjoy your CStream experience.`,
            )
            .setColor("#E50914")
            .setThumbnail(member.guild.iconURL())
            .setTimestamp();

        await member.send({ embeds: [welcomeEmbed] }).catch(() => { });
    } catch (e) {
        console.error("Error sending welcome DM:", e);
    }
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isButton()) {
        if (interaction.customId === "open_ticket") {
            const ticketCommand = client.commands.get("ticket");
            if (ticketCommand) {
                try {
                    await ticketCommand.execute(interaction);
                } catch (e) {
                    console.error(
                        "Error executing ticket command from button:",
                        e,
                    );
                }
            }
            return;
        }
        if (
            interaction.customId === "close_ai_thread" ||
            interaction.customId === "close_ticket"
        ) {
            const channel = interaction.channel;

            const closeEmbed = new EmbedBuilder()
                .setTitle("🔒 Fermeture")
                .setDescription(
                    `Ce salon sera supprimé dans 5 secondes par ${interaction.user}.`,
                )
                .setColor("#FF0000")
                .setTimestamp();

            await interaction.reply({ embeds: [closeEmbed], flags: 64 });

            setTimeout(async () => {
                try {
                    await channel.delete();
                } catch (error) { }
            }, 5000);
            return;
        }
    }

    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(
            `No command matching ${interaction.commandName} was found.`,
        );
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        // Only log and attempt to reply if it's not a known interaction error that happened during execution
        if (error.code !== 10062) {
            console.error('Interaction Error:', error);
        }

        if (interaction.isRepliable()) {
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.followUp({
                        content: "Une erreur est survenue lors de l'exécution de cette commande !",
                        flags: 64
                    }).catch(() => { });
                } else {
                    await interaction.reply({
                        content: "Une erreur est survenue lors de l'exécution de cette commande !",
                        flags: 64
                    }).catch(() => { });
                }
            } catch (err) {
                // Silently ignore failed error reporting
            }
        }
    }
});

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;
    if (!message.channel.isThread()) return;
    if (!message.channel.name.startsWith("cai-chat-")) return;

    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    if (!GROQ_API_KEY) return;

    try {
        await message.channel.sendTyping();

        const history = await getThreadHistory(message.channel, 15);
        const systemPrompt = `Tu es CAi v4.5, l'assistant IA expert et protecteur de CStream.
STYLE: Amical, professionnel, expert en streaming, cinéma et tech.
TMDB: Si tu recommandes un média, ajoute TOUJOURS à la fin: [MEDIA_INFO]{"id": ID, "type": "movie"|"tv"}[/MEDIA_INFO]
CONTEXTE: Tu es sur le serveur Discord de CStream (films, séries, anime en HD). Tu peux aider les utilisateurs à trouver du contenu, expliquer le fonctionnement du site, ou simplement discuter.
RÈGLES: Ne mentionne pas de sites concurrents illégaux. Sois concis mais complet. Toujours prêt à aider.`;

        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${GROQ_API_KEY}`,
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        { role: "system", content: systemPrompt },
                        ...history
                    ],
                }),
            },
        );

        if (!response.ok) throw new Error(`Groq API Error: ${response.status}`);

        const data = await response.json();
        let reply = data.choices?.[0]?.message?.content || "...";

        const mediaMatch = reply.match(/\[MEDIA_INFO\](.*?)\[\/MEDIA_INFO\]/);
        let resultEmbeds = [];
        let resultComponents = [];

        if (mediaMatch) {
            try {
                const mediaInfo = JSON.parse(mediaMatch[1]);
                reply = reply.replace(/\[MEDIA_INFO\].*?\[\/MEDIA_INFO\]/, "").trim();
                const card = await generateMediaCard(mediaInfo.id, mediaInfo.type);
                if (card) {
                    resultEmbeds = card.embeds;
                    resultComponents = card.components;
                }
            } catch (e) {
                console.error("Error parsing media info:", e);
            }
        }

        const closeRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("close_ai_thread")
                .setLabel("Fermer le chat")
                .setStyle(ButtonStyle.Danger),
        );
        resultComponents.push(closeRow);

        await message.reply({
            content: reply.substring(0, 2000),
            embeds: resultEmbeds,
            components: resultComponents
        }).catch(err => {
            console.error("Error replying in thread:", err);
        });
    } catch (e) {
        console.error("AI thread error:", e);
    }
});

client.on(Events.GuildMemberUpdate, (oldMember, newMember) => {
    const oldStatus = oldMember.premiumSince;
    const newStatus = newMember.premiumSince;

    if (!oldStatus && newStatus) {
        const boostEmbed = new EmbedBuilder()
            .setTitle("💜 Nouveau Boost !")
            .setDescription(
                `**Merci infiniment pour le boost, ${newMember.user} !**
Votre soutien aide CStream à grandir.
Le rôle **Server Booster** vous a été attribué.

---

**Thank you for the boost, ${newMember.user}!**
Your support helps CStream grow.
The **Server Booster** role has been assigned.`,
            )
            .setColor("#FF73FA")
            .setTimestamp();

        const channel = newMember.guild.channels.cache.find(
            (c) => c.name.includes("boost") || c.name.includes("welcome"),
        );
        if (channel) channel.send({ embeds: [boostEmbed] });
    }
});

const dmRequestPath = path.join(__dirname, "dm-request.json");
const notifyRequestPath = path.join(__dirname, "notify-request.json");

const processRequests = async () => {
    // Process DM Requests
    try {
        if (fs.existsSync(dmRequestPath)) {
            const requestData = JSON.parse(
                fs.readFileSync(dmRequestPath, "utf8"),
            );
            if (requestData.status === "pending") {
                const user = await client.users
                    .fetch(requestData.userId)
                    .catch(() => null);
                if (user) {
                    if (requestData.embed) {
                        const embedData = requestData.embed;
                        const embed = new EmbedBuilder()
                            .setTitle(embedData.title || "CStream")
                            .setDescription(
                                embedData.description ||
                                requestData.message ||
                                " ",
                            )
                            .setColor(embedData.color || "#E50914")
                            .setTimestamp();
                        await user.send({ embeds: [embed] }).catch(() => { });
                    } else {
                        await user.send(requestData.message).catch(() => { });
                    }
                    fs.writeFileSync(
                        dmRequestPath,
                        JSON.stringify({ ...requestData, status: "sent" }),
                    );
                } else {
                    fs.writeFileSync(
                        dmRequestPath,
                        JSON.stringify({ ...requestData, status: "failed" }),
                    );
                }
            }
        }
    } catch (e) { }

    // Process Notify Requests
    try {
        if (fs.existsSync(notifyRequestPath)) {
            const fileContent = fs.readFileSync(notifyRequestPath, "utf8");
            if (fileContent.trim()) {
                const parsedData = JSON.parse(fileContent);
                const requests = Array.isArray(parsedData) ? parsedData : [parsedData];
                let changed = false;

                for (let i = 0; i < requests.length; i++) {
                    const requestData = requests[i];
                    if (requestData.status === "pending") {
                        const channelId = requestData.channelId || "1454425396303888426";
                        const channel = await client.channels
                            .fetch(channelId)
                            .catch(() => null);

                        if (channel) {
                            if (requestData.embed) {
                                const embedData = requestData.embed;
                                const embed = new EmbedBuilder()
                                    .setTitle(embedData.title || "Notification CStream")
                                    .setDescription(
                                        embedData.description ||
                                        requestData.message ||
                                        " ",
                                    )
                                    .setColor(embedData.color || "#E50914")
                                    .setTimestamp(embedData.timestamp ? new Date(embedData.timestamp) : new Date());
                                await channel.send({ embeds: [embed] }).catch(() => { });
                            } else {
                                await channel.send(requestData.message).catch(() => { });
                            }
                            requestData.status = "sent";
                            changed = true;
                        } else {
                            requestData.status = "failed";
                            changed = true;
                        }
                    }
                }

                if (changed) {
                    // Keep only last 50 requests in log
                    const updatedRequests = requests.slice(-50);
                    fs.writeFileSync(
                        notifyRequestPath,
                        JSON.stringify(updatedRequests, null, 2),
                    );
                }
            }
        }
    } catch (e) {
        console.error("Error processing notify request:", e);
    }
};

setInterval(processRequests, 1000);

process.on("SIGINT", () => {
    updateBotStatus(false);
    process.exit(0);
});

process.on("SIGTERM", () => {
    updateBotStatus(false);
    process.exit(0);
});

const token = process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN;
if (!token) {
    console.error(
        "CRITICAL ERROR: No valid Discord bot token provided in .env.example or Secrets.",
    );
    updateBotStatus(false);
    process.exit(1);
}

updateBotStatus(false);
client.login(token);
