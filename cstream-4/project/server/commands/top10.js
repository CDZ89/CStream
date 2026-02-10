import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
export const data = new SlashCommandBuilder().setName('top10').setDescription('Top 10 films');
export async function execute(interaction) {
  const embed = new EmbedBuilder().setColor('#FFD700').setTitle('🏆 Top 10 Films').addFields({name: '⭐ Moyenne IMDb', value: '1. The Shawshank Redemption (9.3)\n2. The Godfather (9.2)\n3. The Dark Knight (9.0)'},{name: 'Plus regardés', value: '1. Avatar\n2. Avengers\n3. Titanic'});
  await interaction.reply({ embeds: [embed] });
}
