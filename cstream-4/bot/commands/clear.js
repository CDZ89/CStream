const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Supprime un nombre donné de messages (Admin uniquement)')
    .addIntegerOption(option => 
      option.setName('nombre')
        .setDescription('Nombre de messages à supprimer (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });
    const amount = interaction.options.getInteger('nombre');
    
    try {
      const messages = await interaction.channel.bulkDelete(amount, true);
      
      const embed = new EmbedBuilder()
        .setTitle('🧹 Nettoyage terminé')
        .setDescription(`J'ai supprimé **${messages.size}** messages.
(Les messages de plus de 14 jours ne peuvent pas être supprimés en masse)`)
        .setColor('#00FF00')
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Clear Command Error:', error);
      await interaction.editReply({ content: 'Une erreur est survenue lors de la suppression des messages.' });
    }
  }
};