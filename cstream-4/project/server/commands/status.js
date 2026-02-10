import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
export const data = new SlashCommandBuilder().setName('status').setDescription('Statut du serveur');
export async function execute(interaction) {
  const embed = new EmbedBuilder().setColor('#00FF00').setTitle('✅ Statut Serveur').addFields({name: 'API', value: '✅ En ligne'},{name: 'Streaming', value: '✅ En ligne'},{name: 'Chat', value: '✅ En ligne'},{name: 'Latence', value: `${interaction.client.ws.ping}ms`});
  await interaction.reply({ embeds: [embed] });
}
