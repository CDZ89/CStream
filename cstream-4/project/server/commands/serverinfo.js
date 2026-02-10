import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('serverinfo')
  .setDescription('Affiche les infos du serveur');

export async function execute(interaction) {
  const guild = interaction.guild;
  const owner = await guild.fetchOwner();
  const embed = new EmbedBuilder()
    .setColor('#FF00FF')
    .setTitle(`Info - ${guild.name}`)
    .setThumbnail(guild.iconURL())
    .addFields(
      { name: 'ID', value: guild.id, inline: true },
      { name: 'Membres', value: `${guild.memberCount}`, inline: true },
      { name: 'Propriétaire', value: owner.user.tag, inline: true },
      { name: 'Créé', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: false },
      { name: 'Salons', value: `${guild.channels.cache.size}`, inline: true },
      { name: 'Rôles', value: `${guild.roles.cache.size}`, inline: true }
    );
  await interaction.reply({ embeds: [embed] });
}
