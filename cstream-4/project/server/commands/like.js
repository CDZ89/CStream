import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
export const data = new SlashCommandBuilder().setName('like').setDescription('Aimer un film').addStringOption(o => o.setName('movie').setRequired(true));
export async function execute(interaction) {
  const movie = interaction.options.getString('movie');
  const embed = new EmbedBuilder().setColor('#FF0000').setTitle('❤️ Film aimé').setDescription(`Tu as aimé: **${movie}**`);
  await interaction.reply({ embeds: [embed] });
}
