import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('warn')
  .setDescription('Avertir un utilisateur')
  .addUserOption(opt => opt.setName('user').setDescription('L\'utilisateur').setRequired(true))
  .addStringOption(opt => opt.setName('reason').setDescription('Raison').setRequired(false))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function execute(interaction) {
  const user = interaction.options.getUser('user');
  const reason = interaction.options.getString('reason') || 'Pas de raison';
  const embed = new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle('⚠️ Avertissement')
    .addFields(
      { name: 'Utilisateur', value: user.tag, inline: true },
      { name: 'Raison', value: reason, inline: false },
      { name: 'Avertissements', value: '1/3', inline: true }
    );
  await interaction.reply({ embeds: [embed] });
}
