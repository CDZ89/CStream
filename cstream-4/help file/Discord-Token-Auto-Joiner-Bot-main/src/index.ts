import { Client, EmbedBuilder, GatewayIntentBits } from "discord.js";
import discordSelfBot from "discord.js-selfbot-v13";
import dotenv from "dotenv";
import utils from "./utils";
dotenv.config();

const client = new Client({ intents: Object.keys(GatewayIntentBits) as [] });
client.login(process.env.CLIENT_TOKEN).catch(console.log);


client.on("ready", async () => {
    console.log(`Logged in as ${client.user?.tag}!`);

    //set command in bot
    const data = [
        {
            name: "jointokens",
            description: "join tokens to server",
            options: [
                {
                    name: "guildid",
                    description: "guild id",
                    type: 3,
                    required: true
                }
            ]
        }
    ];
    client.application?.commands.set(data);
});




client.on("interactionCreate", async (i) => {
    if (!i.isChatInputCommand()) return;

    if (i.commandName == "jointokens") {
        const guildId = i.options.getString("guildid") as string;
        const guild = client.guilds.cache.get(guildId);

        if (!guild) {
            return await i.reply({ embeds: [new EmbedBuilder().setColor("Red").setDescription(`> Invalid Guild Id`)] })
        }
        let done = 0;
        const tokens = utils.getTokens() || [];

        await i.reply({ embeds: [new EmbedBuilder().setColor("Green").setDescription(`> Starting (**${done}**/**${tokens.length}**)`)] })
        for (const token of tokens) {

            const tokenClient = new discordSelfBot.Client({});

            tokenClient.on("ready", async () => {
                console.log(`[tokens] Logged in as ${tokenClient.user?.tag}! [${token}]`);

                try {
                    const oAuth2URL = utils.getOAuth2URL()
                    if (!oAuth2URL) console.log("oAuth2URL null");

                    if (oAuth2URL) {
                        const authorize = await tokenClient.authorizeURL(oAuth2URL);
                        if (authorize.location) {
                            const code = authorize.location.split("code=")[1];
                            if (!code) console.log("code null");

                            if (code) {
                                const accessToken = await utils.getAccessToken(code);
                                if (!accessToken) console.log("accessToken null");

                                if (accessToken) {
                                    const user = tokenClient.user?.id as string
                                    const member = guild.members.cache.get(user);
                                    if (member) {
                                        console.log(`[Info] [tokens] ${tokenClient.user?.username} is Already in ${guild.name} [${token}]`);
                                    } else {
                                        await guild.members.add(user, { accessToken: accessToken })
                                        console.log(`[Done] [tokens] ${tokenClient.user?.username} joined ${guild.name} [${token}]`);
                                        done++;
                                        await i.editReply({ embeds: [new EmbedBuilder().setColor("Green").setDescription(`> Starting (**${done}**/**${tokens.length}**)`)] })
                                    }
                                }
                            }

                        }

                    }
                    tokenClient.destroy();
                } catch (err: any) {
                    console.log(`[Error] [tokens] ${tokenClient.user?.username} Failed join ${guild.name} [${token}] with error ${err}`);
                    console.log(token);
                    tokenClient.destroy();
                }
            });

            tokenClient.on("error", (error) => {
                console.error(`[tokens] Error with token ${tokenClient.user?.tag}:${error} [${token}]`);
            });
            await tokenClient.login(token).catch(() => console.log(`invalid token ${token}`));
        }
    }
});

const tokens = utils.getTokens() || [];


console.log(tokens);
