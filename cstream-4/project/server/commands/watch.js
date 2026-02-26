import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
export const data = new SlashCommandBuilder().setName('watch').setDescription('Ajouter à ma watchlist').addStringOption(o => o.setName('media').setDescription('Le nom du film ou de la série').setRequired(true));
export async function execute(interaction) {
  const media = interaction.options.getString('media');
  const embed = new EmbedBuilder().setColor('#00FF88').setTitle('✅ Ajouté à la watchlist').setDescription(`"${media}" a été ajouté à ta liste`);
  await interaction.reply({ embeds: [embed] });
}
