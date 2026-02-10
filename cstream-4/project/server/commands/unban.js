import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('unban')
  .setDescription('Débannir un utilisateur')
  .addStringOption(opt => opt.setName('user_id').setDescription('ID de l\'utilisateur').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

export async function execute(interaction) {
  const userId = interaction.options.getString('user_id');
  
  try {
    await interaction.guild.bans.remove(userId);
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('✅ Débannissement')
      .setDescription(`Utilisateur ${userId} débanni`);
    await interaction.reply({ embeds: [embed] });
  } catch (e) {
    await interaction.reply({ content: '❌ Erreur: ID invalide ou utilisateur non banni', ephemeral: true });
  }
}
