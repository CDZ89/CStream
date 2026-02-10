import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
export const data = new SlashCommandBuilder().setName('bug').setDescription('Signaler un bug').addStringOption(o => o.setName('description').setRequired(true));
export async function execute(interaction) {
  const desc = interaction.options.getString('description');
  const embed = new EmbedBuilder().setColor('#FF0000').setTitle('🐛 Bug Signalé').setDescription(desc).setFooter({text: `Signalé par ${interaction.user.tag}`});
  await interaction.reply({ embeds: [embed], ephemeral: false });
}
