const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Voir vos informations CStream'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle(`👤 Profil de ${interaction.user.username}`)
      .setDescription(`Retrouvez vos informations CStream ici.
      
**Statut:** Membre Premium
**Niveau:** 10
**Badges:** 🏆 🚀 💎`)
      .setThumbnail(interaction.user.displayAvatarURL())
      .setColor('#E50914')
      .setFooter({ text: 'CStream v3.9' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};