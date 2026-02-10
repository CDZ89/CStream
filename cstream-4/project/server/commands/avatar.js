import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('avatar')
  .setDescription('Affiche l\'avatar d\'un utilisateur')
  .addUserOption(option => option.setName('user').setDescription('L\'utilisateur').setRequired(false));

export async function execute(interaction) {
  const user = interaction.options.getUser('user') || interaction.user;
  const embed = new EmbedBuilder()
    .setColor('#00ff88')
    .setTitle(`Avatar de ${user.username}`)
    .setImage(user.avatarURL({ size: 512 }))
    .setURL(user.avatarURL({ size: 512 }));
  await interaction.reply({ embeds: [embed] });
}
