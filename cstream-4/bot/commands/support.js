const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('support')
    .setDescription('Infos pour soutenir CStream'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('💜 Soutenir CStream')
      .setDescription(`Votre soutien aide CStream à grandir et à rester gratuit !

**Comment aider ?**
• 🚀 **Boostez le serveur** pour débloquer des avantages.
• 📢 **Partagez le site** à vos amis.
• 💬 **Restez actif** dans la communauté.

Merci infiniment pour votre aide !`)
      .setColor('#9B59B6')
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};