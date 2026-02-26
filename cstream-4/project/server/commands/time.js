import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('time')
  .setDescription('Affiche l\'heure actuelle');

export async function execute(interaction) {
  const now = new Date();
  const embed = new EmbedBuilder()
    .setColor('#0088FF')
    .setTitle('⏰ Heure Actuelle')
    .setDescription(`**${now.toLocaleString('fr-FR')}**`)
    .setFooter({ text: `Fuseau horaire: ${Intl.DateTimeFormat().resolvedOptions().timeZone}` });
  await interaction.reply({ embeds: [embed] });
}
