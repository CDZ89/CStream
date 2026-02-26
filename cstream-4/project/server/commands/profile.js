import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('profile')
  .setDescription('Affiche ton profil CStream')
  .addUserOption(opt => opt.setName('user').setDescription('L\'utilisateur').setRequired(false));

export async function execute(interaction) {
  const user = interaction.options.getUser('user') || interaction.user;
  const embed = new EmbedBuilder()
    .setColor('#FF00FF')
    .setTitle(`👤 Profil - ${user.username}`)
    .setThumbnail(user.avatarURL())
    .addFields(
      { name: 'Username', value: user.username, inline: true },
      { name: 'ID', value: user.id, inline: true },
      { name: 'Niveau', value: '⭐ 5', inline: true },
      { name: 'Amis', value: '42', inline: true },
      { name: 'Watchlist', value: '15 films', inline: true }
    );
  await interaction.reply({ embeds: [embed] });
}
