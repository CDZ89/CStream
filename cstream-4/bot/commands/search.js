const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('search')
    .setDescription('Rechercher un film, une série ou un anime via TMDB')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('Nom du film, série ou anime')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Type de média')
        .setRequired(true)
        .addChoices(
          { name: 'Film', value: 'movie' },
          { name: 'Série', value: 'tv' },
          { name: 'Anime', value: 'anime' }
        )
    ),

  async execute(interaction) {
    const query = interaction.options.getString('query');
    const type = interaction.options.getString('type');

    await interaction.deferReply();

    try {
      const tmdbType = type === 'anime' ? 'tv' : type;
      const apiKey = process.env.VITE_TMDB_API_KEY;

      const url = `https://api.themoviedb.org/3/search/${tmdbType}?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=fr-FR`;

      const response = await axios.get(url);
      const results = response.data.results;

      if (!results || results.length === 0) {
        return interaction.editReply(`❌ Aucun résultat trouvé pour **${query}**`);
      }

      const media = results[0];
      const title = media.title || media.name;
      const poster = media.poster_path
        ? `https://image.tmdb.org/t/p/w500${media.poster_path}`
        : null;

      // Logique demandée : movie pour films, tv pour tout le reste
      const route = tmdbType === 'movie' ? 'movie' : 'tv';
      const cstreamUrl = `https://cstream-1--outrra22.replit.app/${route}/${media.id}`;

      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(
          `🎬 **Disponible sur CStream**\n` +
          `Cliquez sur le bouton ci‑dessous pour regarder.\n\n` +
          `🌍 **FR / EN**\n` +
          `Search powered by TMDB • Streaming via CStream`
        )
        .setColor('#5865F2')
        .setImage(poster)
        .setFooter({ text: 'CStream • TMDB Powered' });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('Regarder sur CStream')
          .setStyle(ButtonStyle.Link)
          .setURL(cstreamUrl)
      );

      return interaction.editReply({ embeds: [embed], components: [row] });

    } catch (err) {
      console.error(err);
      return interaction.editReply('❌ Une erreur est survenue lors de la recherche.');
    }
  }
};
