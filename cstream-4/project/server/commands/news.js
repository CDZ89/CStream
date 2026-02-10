import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
export const data = new SlashCommandBuilder().setName('news').setDescription('Actualités CStream');
export async function execute(interaction) {
  const embed = new EmbedBuilder().setColor('#FF6B6B').setTitle('📰 Actualités').addFields({name: 'Dernière mise à jour', value: '🎬 Nouveau catalogue ajouté'},{name: 'Avant', value: '📱 App mobile v2.0 lancée'},{name: 'Prochainement', value: '🎮 Gaming section en beta'});
  await interaction.reply({ embeds: [embed] });
}
