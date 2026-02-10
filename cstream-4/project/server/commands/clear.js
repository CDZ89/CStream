import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
export const data = new SlashCommandBuilder().setName('clear').setDescription('Supprimer des messages').addIntegerOption(o => o.setName('count').setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);
export async function execute(interaction) {
  const count = interaction.options.getInteger('count');
  await interaction.channel.bulkDelete(Math.min(count, 100));
  const embed = new EmbedBuilder().setColor('#FF0000').setTitle('🗑️ Messages supprimés').setDescription(`${count} messages supprimés`);
  await interaction.reply({ embeds: [embed], ephemeral: true });
}
