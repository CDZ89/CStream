import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('kick')
  .setDescription('Expulser un utilisateur')
  .addUserOption(opt => opt.setName('user').setDescription('L\'utilisateur').setRequired(true))
  .addStringOption(opt => opt.setName('reason').setDescription('Raison').setRequired(false))
  .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers);

export async function execute(interaction) {
  const user = interaction.options.getUser('user');
  const reason = interaction.options.getString('reason') || 'Pas de raison';
  const member = await interaction.guild.members.fetch(user.id);
  
  try {
    await member.kick(reason);
    const embed = new EmbedBuilder()
      .setColor('#FF6600')
      .setTitle('👢 Expulsion')
      .addFields(
        { name: 'Utilisateur', value: user.tag, inline: true },
        { name: 'Raison', value: reason, inline: false }
      );
    await interaction.reply({ embeds: [embed] });
  } catch (e) {
    await interaction.reply({ content: '❌ Erreur: Impossible d\'expulser', ephemeral: true });
  }
}
