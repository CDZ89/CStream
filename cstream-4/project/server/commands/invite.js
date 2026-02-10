import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
export const data = new SlashCommandBuilder().setName('invite').setDescription('Lien d\'invitation du bot').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);
export async function execute(interaction) {
  const invite = `https://discord.com/oauth2/authorize?client_id=${interaction.client.user.id}&permissions=8&scope=bot%20applications.commands`;
  const embed = new EmbedBuilder().setColor('#0088FF').setTitle('🔗 Invitation').setDescription(`[Invite le bot](${invite})`);
  await interaction.reply({ embeds: [embed] });
}
