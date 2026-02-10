import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
export const data = new SlashCommandBuilder().setName('premium').setDescription('Infos Premium CStream');
export async function execute(interaction) {
  const embed = new EmbedBuilder().setColor('#FFD700').setTitle('⭐ CStream Premium').addFields({name: 'Prix', value: '9.99€/mois'},{name: 'Bénéfices', value: '✅ Adn-free\n✅ 4K Ultra HD\n✅ Contenu Exclusif'});
  await interaction.reply({ embeds: [embed] });
}
