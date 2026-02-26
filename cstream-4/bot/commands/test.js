const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('Vérifie toutes les connexions (Admin, TMDB, AI)'),
    async execute(interaction) {
        await interaction.deferReply();
        
        const results = {
            admin: '❌ Déconnecté',
            tmdb: '❌ Erreur',
            ai: '❌ Erreur'
        };

        // Test Admin Site (via status file)
        try {
            const statusPath = path.join(__dirname, '../bot-status.json');
            if (fs.existsSync(statusPath)) {
                results.admin = '✅ Connecté';
            }
        } catch (e) {}

        // Test TMDB
        try {
            const tmdbResponse = await fetch('https://api.themoviedb.org/3/movie/popular?api_key=d430c6c589f4549e780b7e1786f0ac9c');
            if (tmdbResponse.ok) results.tmdb = '✅ Opérationnel';
        } catch (e) {}

        // Test AI (Groq)
        try {
            const aiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer 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'
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [{ role: 'user', content: 'hi' }],
                    max_tokens: 5
                })
            });
            if (aiResponse.ok) results.ai = '✅ Opérationnel';
        } catch (e) {}

        const embed = new EmbedBuilder()
            .setTitle('🔍 Rapport de Connexion CStream')
            .setColor('#E50914')
            .addFields(
                { name: '🌐 Site Admin', value: results.admin, inline: true },
                { name: '🎬 TMDB API', value: results.tmdb, inline: true },
                { name: '🤖 Intelligence Artificielle', value: results.ai, inline: true }
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },
};
