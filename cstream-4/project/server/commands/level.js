import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('level')
  .setDescription('Affiche ton niveau CStream');

export async function execute(interaction) {
  const embed = new EmbedBuilder()
    .setColor('#00FF88')
    .setTitle('⭐ Ton Niveau')
    .addFields(
      { name: 'Niveau Actuel', value: '5', inline: true },
      { name: 'Expérience', value: '4,500 / 5,000 XP', inline: true },
      { name: 'Progression', value: '█████████░ 90%', inline: false },
      { name: 'Prochaine Récompense', value: 'Badge "Cinéphile"', inline: false }
    );
  await interaction.reply({ embeds: [embed] });
}
