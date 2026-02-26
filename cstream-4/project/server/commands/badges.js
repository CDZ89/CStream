import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('badges')
  .setDescription('Affiche tes badges');

export async function execute(interaction) {
  const embed = new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle('🏆 Tes Badges')
    .addFields(
      { name: '🎬 Cinéphile', value: 'Regardé 50+ films', inline: true },
      { name: '📺 Sériephile', value: 'Complété 10 séries', inline: true },
      { name: '⭐ Critiqueur', value: 'Donné 100 ratings', inline: true },
      { name: '👥 Sociable', value: '50+ Amis', inline: true },
      { name: '🎮 Gamer', value: 'Anime fan #1', inline: true },
      { name: '🔥 Premium', value: 'Membre Premium', inline: true }
    );
  await interaction.reply({ embeds: [embed] });
}
