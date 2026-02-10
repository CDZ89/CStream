import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
export const data = new SlashCommandBuilder().setName('rate').setDescription('Noter un film').addStringOption(o => o.setName('movie').setRequired(true)).addIntegerOption(o => o.setName('rating').setMinValue(1).setMaxValue(10).setRequired(true));
export async function execute(interaction) {
  const movie = interaction.options.getString('movie');
  const rating = interaction.options.getInteger('rating');
  const embed = new EmbedBuilder().setColor('#FFD700').setTitle('⭐ Note donnée').addFields({name: 'Film', value: movie},{name: 'Note', value: `${rating}/10`});
  await interaction.reply({ embeds: [embed] });
}
