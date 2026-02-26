import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('banner')
  .setDescription('Get user\'s banner')
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription('User to get banner from')
      .setRequired(false)
  );

export async function execute(interaction) {
  const user = interaction.options.getUser('user') || interaction.user;
  const bannerURL = user.bannerURL({ size: 1024 });

  if (!bannerURL) {
    return interaction.reply({
      content: '❌ This user doesn\'t have a banner',
      ephemeral: true,
    });
  }

  const embed = new EmbedBuilder()
    .setTitle(`${user.username}'s Banner`)
    .setImage(bannerURL)
    .setColor(0x5865f2)
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
