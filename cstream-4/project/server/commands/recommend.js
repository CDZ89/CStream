import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
export const data = new SlashCommandBuilder().setName('recommend').setDescription('Recommandation film/série');
export async function execute(interaction) {
  const recommendations = ['Avatar', 'Inception', 'Interstellar', 'The Matrix', 'Breaking Bad'];
  const rec = recommendations[Math.floor(Math.random() * recommendations.length)];
  const embed = new EmbedBuilder().setColor('#FFD700').setTitle('🎬 Recommandation').setDescription(`Tu devrais regarder: **${rec}**`);
  await interaction.reply({ embeds: [embed] });
}
