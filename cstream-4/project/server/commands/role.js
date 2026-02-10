import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
export const data = new SlashCommandBuilder().setName('role').setDescription('Attribuer un rôle à un utilisateur').addUserOption(o => o.setName('user').setDescription('L\'utilisateur').setRequired(true)).addRoleOption(o => o.setName('role').setDescription('Le rôle à attribuer').setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);
export async function execute(interaction) {
  const user = interaction.options.getUser('user');
  const role = interaction.options.getRole('role');
  const member = await interaction.guild.members.fetch(user.id);
  try {
    await member.roles.add(role);
    const embed = new EmbedBuilder().setColor('#00FF00').setTitle('✅ Rôle attribué').addFields({name: 'Utilisateur', value: user.tag},{name: 'Rôle', value: role.name});
    await interaction.reply({ embeds: [embed] });
  } catch (e) {
    await interaction.reply({ content: '❌ Erreur', ephemeral: true });
  }
}
