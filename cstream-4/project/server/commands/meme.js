import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
export const data = new SlashCommandBuilder().setName('meme').setDescription('Un mème aléatoire');
export async function execute(interaction) {
  const embed = new EmbedBuilder().setColor('#FFD700').setTitle('😂 Mème').setImage('https://via.placeholder.com/400x300?text=Meme');
  await interaction.reply({ embeds: [embed] });
}
