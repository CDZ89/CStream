const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    EmbedBuilder,
} = require("discord.js");
const { getThreadHistory } = require("../utils/memory");
const { generateMediaCard } = require("../utils/tmdb");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ai")
        .setDescription("Parler avec l'intelligence artificielle de CStream")
        .addStringOption((option) =>
            option
                .setName("message")
                .setDescription("Votre message pour l'IA")
                .setRequired(true),
        ),
    async execute(interaction) {
        if (!interaction.deferred && !interaction.replied) {
            try {
                await interaction.deferReply({ flags: 64 });
            } catch (e) {
                if (e.code === 10062 || e.code === 40060) return;
                console.error("Error deferring reply:", e);
                return;
            }
        }

        const userMessage = interaction.options.getString("message");
        const GROQ_API_KEY = process.env.GROQ_API_KEY;

        if (!GROQ_API_KEY) {
            return interaction.editReply({
                content: "L'API Groq n'est pas configurée.",
            }).catch(() => { });
        }

        try {
            let targetChannel = interaction.channel;

            // Handle Thread creation if not in one
            if (!interaction.channel.isThread()) {
                if (!interaction.channel.threads) {
                    await interaction.editReply({
                        content: "Les threads ne sont pas supportés ici.",
                    }).catch(() => { });
                } else {
                    try {
                        targetChannel = await interaction.channel.threads.create({
                            name: `cai-chat-${interaction.user.username}`,
                            autoArchiveDuration: 60,
                            type: ChannelType.PublicThread,
                            reason: "Discussion avec CAi",
                        });
                        await targetChannel.members.add(interaction.user.id).catch(() => { });
                    } catch (e) {
                        console.error("Error creating thread:", e);
                        targetChannel = interaction.channel;
                    }
                }
            }

            // Fetch memory if in a thread
            let messages = [];
            const systemPrompt = `Tu es CAi v4.5, l'assistant IA expert et protecteur de CStream.
STYLE: Amical, professionnel, expert en streaming, cinéma et tech.
TMDB: Si tu recommandes un média, ajoute TOUJOURS à la fin: [MEDIA_INFO]{"id": ID, "type": "movie"|"tv"}[/MEDIA_INFO]
CONTEXTE: Tu es sur le serveur Discord de CStream (films, séries, anime en HD). Tu peux aider les utilisateurs à trouver du contenu, expliquer le fonctionnement du site, ou simplement discuter.
RÈGLES: Ne mentionne pas de sites concurrents illégaux. Sois concis mais complet. Toujours prêt à aider.`;

            if (targetChannel.isThread()) {
                const history = await getThreadHistory(targetChannel, 15);
                messages = [
                    { role: "system", content: systemPrompt },
                    ...history,
                    { role: "user", content: userMessage }
                ];
            } else {
                messages = [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userMessage }
                ];
            }

            const aiResponse = await fetch(
                "https://api.groq.com/openai/v1/chat/completions",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${GROQ_API_KEY}`,
                    },
                    body: JSON.stringify({
                        model: "llama-3.3-70b-versatile",
                        messages: messages,
                        temperature: 0.7,
                    }),
                },
            );

            if (!aiResponse.ok) throw new Error(`Groq API Error: ${aiResponse.status}`);

            const data = await aiResponse.json();
            let aiText = data.choices[0].message.content;

            const mediaMatch = aiText.match(/\[MEDIA_INFO\](.*?)\[\/MEDIA_INFO\]/);
            let resultEmbeds = [];
            let resultComponents = [];

            if (mediaMatch) {
                try {
                    const mediaInfo = JSON.parse(mediaMatch[1]);
                    aiText = aiText.replace(/\[MEDIA_INFO\].*?\[\/MEDIA_INFO\]/, "").trim();
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

            await targetChannel.send({
                content: targetChannel.isThread() ? aiText : `**Réponse pour ${interaction.user} :**\n\n${aiText}`,
                embeds: resultEmbeds,
                components: resultComponents,
            });

            if (interaction.deferred && !interaction.replied) {
                await interaction.editReply({
                    content: `Discussion ouverte dans <#${targetChannel.id}>`,
                }).catch(() => { });
            }
        } catch (error) {
            console.error("CAi Error:", error);
            if (interaction.deferred && !interaction.replied) {
                await interaction.editReply({
                    content: "Une erreur est survenue.",
                }).catch(() => { });
            }
        }
    },
};
