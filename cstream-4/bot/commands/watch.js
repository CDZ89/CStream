const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('watch')
    .setDescription('Ouvrir directement un média via son ID')
    .addStringOption(option => 
      option.setName('type')
        .setDescription('Type (movie ou tv)')
        .setRequired(true)
        .addChoices({ name: 'Film', value: 'movie' }, { name: 'Série/Anime', value: 'tv' }))
    .addStringOption(option => 
      option.setName('id')
        .setDescription('ID TMDB')
        .setRequired(true)),

  async execute(interaction) {
    const type = interaction.options.getString('type');
    const id = interaction.options.getString('id');
    const url = `https://cstream-1--outrra22.replit.app/${type}/${id}`;

    const embed = new EmbedBuilder()
      .setTitle('🎬 Lecture directe')
      .setDescription(`Prêt à regarder le média #${id} ?`)
      .setColor('#E50914');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Regarder sur CStream')
        .setStyle(ButtonStyle.Link)
        .setURL(url)
    );

    return interaction.reply({ embeds: [embed], components: [row] });
  }
};
