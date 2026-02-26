const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('trending')
    .setDescription('Voir les tendances actuelles sur CStream'),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const apiKey = process.env.VITE_TMDB_API_KEY;
      const url = `https://api.themoviedb.org/3/trending/all/day?api_key=${apiKey}&language=fr-FR`;
      const response = await axios.get(url);
      const results = response.data.results.slice(0, 5);

      const embed = new EmbedBuilder()
        .setTitle('🔥 Tendances CStream')
        .setColor('#E50914')
        .setDescription(results.map((m, i) => `${i + 1}. **${m.title || m.name}** (${m.media_type === 'movie' ? 'Film' : 'Série'})`).join('\n'))
        .setFooter({ text: 'CStream • Top 5 du jour' });

      return interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      return interaction.editReply('❌ Erreur lors de la récupération des tendances.');
    }
  }
};
