import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
export const data = new SlashCommandBuilder().setName('search').setDescription('Rechercher un film').addStringOption(o => o.setName('query').setRequired(true));
export async function execute(interaction) {
  const query = interaction.options.getString('query');
  const embed = new EmbedBuilder().setColor('#0088FF').setTitle('🔍 Résultats').setDescription(`Recherche: ${query}\n\nRésultats disponibles sur cstream.io`);
  await interaction.reply({ embeds: [embed] });
}
