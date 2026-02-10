import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
export const data = new SlashCommandBuilder().setName('suggest').setDescription('Suggérer une fonctionnalité').addStringOption(o => o.setName('suggestion').setRequired(true));
export async function execute(interaction) {
  const suggestion = interaction.options.getString('suggestion');
  const embed = new EmbedBuilder().setColor('#00FF88').setTitle('💡 Suggestion Reçue').setDescription(suggestion).setFooter({text: `Proposée par ${interaction.user.tag}`});
  await interaction.reply({ embeds: [embed], ephemeral: false });
}
