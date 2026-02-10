import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('mute')
  .setDescription('Rendre muet un utilisateur')
  .addUserOption(opt => opt.setName('user').setDescription('L\'utilisateur').setRequired(true))
  .addIntegerOption(opt => opt.setName('duration').setDescription('Durée (min)').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function execute(interaction) {
  const user = interaction.options.getUser('user');
  const duration = interaction.options.getInteger('duration');
  const member = await interaction.guild.members.fetch(user.id);
  
  try {
    await member.timeout(duration * 60 * 1000);
    const embed = new EmbedBuilder()
      .setColor('#FFFF00')
      .setTitle('🔇 Sourdine')
      .addFields(
        { name: 'Utilisateur', value: user.tag, inline: true },
        { name: 'Durée', value: `${duration} minutes`, inline: true }
      );
    await interaction.reply({ embeds: [embed] });
  } catch (e) {
    await interaction.reply({ content: '❌ Erreur: Impossible de rendre muet', ephemeral: true });
  }
}
