import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
export const data = new SlashCommandBuilder().setName('musicinfo').setDescription('Infos musique');
export async function execute(interaction) {
  const embed = new EmbedBuilder().setColor('#FF00FF').setTitle('🎵 Musique CStream').addFields({name: 'Catalogue', value: '50,000+ pistes'},{name: 'Artistes', value: '10,000+ artistes'},{name: 'Qualité', value: '320kbps HD'});
  await interaction.reply({ embeds: [embed] });
}
