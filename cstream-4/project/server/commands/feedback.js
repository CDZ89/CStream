import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
export const data = new SlashCommandBuilder().setName('feedback').setDescription('Donner des retours').addStringOption(o => o.setName('message').setRequired(true));
export async function execute(interaction) {
  const msg = interaction.options.getString('message');
  const embed = new EmbedBuilder().setColor('#0088FF').setTitle('📝 Retour Reçu').setDescription(msg).setFooter({text: `De ${interaction.user.tag}`});
  await interaction.reply({ embeds: [embed], ephemeral: false });
}
