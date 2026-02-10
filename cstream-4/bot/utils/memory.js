/**
 * Fetches message history from a thread and formats it for the AI
 */
async function getThreadHistory(channel, limit = 10) {
    try {
        const messages = await channel.messages.fetch({ limit });
        const history = [];

        // Reverse to get chronological order
        const sortedMessages = Array.from(messages.values()).reverse();

        for (const msg of sortedMessages) {
            // Ignore system messages or messages without content (unless embeds)
            if (msg.system || (!msg.content && msg.embeds.length === 0)) continue;

            const role = msg.author.bot ? "assistant" : "user";
            let content = msg.content;

            // If it's a bot message with an embed title, add it to context so AI knows what it recommended
            if (msg.author.bot && msg.embeds.length > 0) {
                const embed = msg.embeds[0];
                if (embed.title) {
                    content += `\n[Affiché: ${embed.title}]`;
                }
            }

            if (content) {
                history.push({ role, content });
            }
        }

        return history;
    } catch (error) {
        console.error("Error fetching thread history:", error);
        return [];
    }
}

module.exports = { getThreadHistory };
