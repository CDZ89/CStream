const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Vérifier votre compte CStream'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('🛡️ Vérification CStream')
      .setDescription(`✅ **Merci beaucoup !**
Vous êtes maintenant vérifié sur Discord et sur CStream.
Votre rôle **Verified** a été ajouté avec succès.

🔗 [Accéder au site](https://cstream-1--outrra22.replit.app)`)
      .setColor('#00FF00')
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};