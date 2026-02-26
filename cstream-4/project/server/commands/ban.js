import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ban')
  .setDescription('Bannir un utilisateur')
  .addUserOption(opt => opt.setName('user').setDescription('L\'utilisateur').setRequired(true))
  .addStringOption(opt => opt.setName('reason').setDescription('Raison').setRequired(false))
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

export async function execute(interaction) {
  const user = interaction.options.getUser('user');
  const reason = interaction.options.getString('reason') || 'Pas de raison';
  
  try {
    await interaction.guild.members.ban(user, { reason });
    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('🔨 Bannissement')
      .addFields(
        { name: 'Utilisateur', value: user.tag, inline: true },
        { name: 'Raison', value: reason, inline: false }
      );
    await interaction.reply({ embeds: [embed] });
  } catch (e) {
    await interaction.reply({ content: '❌ Erreur: Impossible de bannir', ephemeral: true });
  }
}
