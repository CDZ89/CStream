import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
export const data = new SlashCommandBuilder().setName('removerole').setDescription('Retirer un rôle à un utilisateur').addUserOption(o => o.setName('user').setDescription('L\'utilisateur').setRequired(true)).addRoleOption(o => o.setName('role').setDescription('Le rôle à retirer').setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);
export async function execute(interaction) {
  const user = interaction.options.getUser('user');
  const role = interaction.options.getRole('role');
  const member = await interaction.guild.members.fetch(user.id);
  try {
    await member.roles.remove(role);
    const embed = new EmbedBuilder().setColor('#FF0000').setTitle('❌ Rôle retiré').addFields({name: 'Utilisateur', value: user.tag},{name: 'Rôle', value: role.name});
    await interaction.reply({ embeds: [embed] });
  } catch (e) {
    await interaction.reply({ content: '❌ Erreur', ephemeral: true });
  }
}
