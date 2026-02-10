import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('flip')
  .setDescription('Lance une pièce');

export async function execute(interaction) {
  const result = Math.random() < 0.5 ? 'Pile' : 'Face';
  const embed = new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle('🪙 Pile ou Face')
    .setDescription(`**${result}**`);
  await interaction.reply({ embeds: [embed] });
}
