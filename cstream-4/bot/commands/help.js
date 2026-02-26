const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Liste des commandes disponibles'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('📚 Commandes CStream')
      .setDescription(`Voici les outils disponibles pour votre expérience :

**🔍 Recherche & Contenu**
• \`/search\` – Rechercher un film, une série ou un anime
• \`/trending\` – Voir les tendances
• \`/watch\` – Regarder un contenu

**🤖 Intelligence Artificielle**
• \`/ai\` – Discuter avec CAi, l'IA de CStream

**🎫 Support**
• \`/ticket\` – Créer un ticket de support
• \`/support\` – Comment nous aider

**👤 Compte**
• \`/verify\` – Vérifier votre compte
• \`/profile\` – Voir vos informations`)
      .setColor('#E50914')
      .setFooter({ text: 'CStream Bot • Premium Support' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};