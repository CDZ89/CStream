import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
export const data = new SlashCommandBuilder().setName('translate').setDescription('Traduire du texte').addStringOption(o => o.setName('text').setRequired(true)).addStringOption(o => o.setName('lang').setRequired(true));
export async function execute(interaction) {
  const text = interaction.options.getString('text');
  const lang = interaction.options.getString('lang');
  const embed = new EmbedBuilder().setColor('#00FF88').setTitle('🌐 Traduction').addFields({name: 'Texte', value: text},{name: 'Langue', value: lang});
  await interaction.reply({ embeds: [embed] });
}
