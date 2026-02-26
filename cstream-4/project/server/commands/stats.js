import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('stats')
  .setDescription('Affiche tes stats CStream');

export async function execute(interaction) {
  const embed = new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle('📊 Tes Stats')
    .addFields(
      { name: 'Films Regardés', value: '47', inline: true },
      { name: 'Séries Regardées', value: '12', inline: true },
      { name: 'Temps Total', value: '245h 30m', inline: true },
      { name: 'Ratings Donnés', value: '59', inline: true },
      { name: 'Favoris', value: '38', inline: true },
      { name: 'Amis', value: '42', inline: true }
    );
  await interaction.reply({ embeds: [embed] });
}
