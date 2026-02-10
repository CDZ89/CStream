import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('userinfo')
  .setDescription('Affiche les infos d\'un utilisateur')
  .addUserOption(option => option.setName('user').setDescription('L\'utilisateur').setRequired(false));

export async function execute(interaction) {
  const user = interaction.options.getUser('user') || interaction.user;
  const created = Math.floor(user.createdTimestamp / 1000);
  const embed = new EmbedBuilder()
    .setColor('#0088FF')
    .setTitle(`Info - ${user.username}`)
    .setThumbnail(user.avatarURL())
    .addFields(
      { name: 'ID', value: user.id, inline: true },
      { name: 'Tag', value: user.tag, inline: true },
      { name: 'Bot', value: user.bot ? 'Oui' : 'Non', inline: true },
      { name: 'Créé', value: `<t:${created}:R>`, inline: false }
    );
  await interaction.reply({ embeds: [embed] });
}
