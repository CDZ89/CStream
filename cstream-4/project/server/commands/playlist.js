import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
export const data = new SlashCommandBuilder().setName('playlist').setDescription('Gérer playlists').addStringOption(o => o.setName('action').setDescription('Créer, voir, ajouter').setRequired(true));
export async function execute(interaction) {
  const action = interaction.options.getString('action');
  const embed = new EmbedBuilder().setColor('#FF6B6B').setTitle('🎬 Playlist').setDescription(`Action: ${action}`);
  await interaction.reply({ embeds: [embed] });
}
