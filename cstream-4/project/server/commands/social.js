import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
export const data = new SlashCommandBuilder().setName('social').setDescription('Réseaux sociaux CStream');
export async function execute(interaction) {
  const embed = new EmbedBuilder().setColor('#00FF00').setTitle('📱 Réseaux Sociaux').addFields({name: 'Twitter', value: '@CStream'},{name: 'Instagram', value: '@CStreamOfficial'},{name: 'TikTok', value: '@CStreamApp'});
  await interaction.reply({ embeds: [embed] });
}
