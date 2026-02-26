import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Affiche la latence du bot');

export async function execute(interaction) {
  const ping = interaction.client.ws.ping;
  const embed = new EmbedBuilder()
    .setColor('#FF6B6B')
    .setTitle('🏓 Pong!')
    .addFields(
      { name: 'Latence Bot', value: `${ping}ms`, inline: true },
      { name: 'Uptime', value: `${Math.floor(interaction.client.uptime / 1000)}s`, inline: true }
    );
  await interaction.reply({ embeds: [embed] });
}
