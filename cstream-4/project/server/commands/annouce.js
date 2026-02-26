import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('annouce')
  .setDescription('Make an announcement (admin only)')
  .addStringOption(option =>
    option
      .setName('message')
      .setDescription('Announcement message')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function execute(interaction) {
  const message = interaction.options.getString('message');

  const embed = new EmbedBuilder()
    .setTitle('📢 Announcement')
    .setDescription(message)
    .setColor(0xffd700)
    .setFooter({ text: `By ${interaction.user.username}` })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
