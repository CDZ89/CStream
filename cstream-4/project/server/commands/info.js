import { SlashCommandBuilder, EmbedBuilder, ActivityType } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('info')
  .setDescription('Infos du bot CStream');

export async function execute(interaction) {
  const bot = interaction.client;
  const embed = new EmbedBuilder()
    .setColor('#00FF00')
    .setTitle('🤖 CStream Bot')
    .setThumbnail(bot.user.avatarURL())
    .addFields(
      { name: 'Nom', value: bot.user.username, inline: true },
      { name: 'ID', value: bot.user.id, inline: true },
      { name: 'Guildes', value: `${bot.guilds.cache.size}`, inline: true },
      { name: 'Utilisateurs', value: `${bot.users.cache.size}`, inline: true },
      { name: 'Uptime', value: `${Math.floor(bot.uptime / 1000)}s`, inline: true },
      { name: 'Latence', value: `${bot.ws.ping}ms`, inline: true }
    )
    .setFooter({ text: 'CStream Premium Streaming Bot v1.0' });
  await interaction.reply({ embeds: [embed] });
}
