import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
export const data = new SlashCommandBuilder().setName('support').setDescription('Contacter le support');
export async function execute(interaction) {
  const embed = new EmbedBuilder().setColor('#FFD700').setTitle('💬 Support CStream').addFields({name: 'Discord', value: 'discord.gg/cstream'},{name: 'Email', value: 'support@cstream.io'},{name: 'Site', value: 'cstream.io'});
  await interaction.reply({ embeds: [embed] });
}
