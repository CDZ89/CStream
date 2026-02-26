import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
export const data = new SlashCommandBuilder().setName('define').setDescription('Définir un mot').addStringOption(o => o.setName('word').setRequired(true));
export async function execute(interaction) {
  const word = interaction.options.getString('word');
  const embed = new EmbedBuilder().setColor('#0088FF').setTitle(`📖 ${word}`).setDescription('Définition disponible sur demande');
  await interaction.reply({ embeds: [embed] });
}
