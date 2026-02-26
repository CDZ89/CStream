import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
export const data = new SlashCommandBuilder().setName('advanced-search').setDescription('Recherche avancée CStream').addStringOption(o => o.setName('genre').setRequired(true)).addStringOption(o => o.setName('year').setRequired(false));
export async function execute(interaction) {
  const genre = interaction.options.getString('genre');
  const year = interaction.options.getString('year');
  const embed = new EmbedBuilder().setColor('#00FF88').setTitle('🔍 Recherche Avancée').addFields({name: 'Genre', value: genre},{name: 'Année', value: year || 'Tous'});
  await interaction.reply({ embeds: [embed] });
}
