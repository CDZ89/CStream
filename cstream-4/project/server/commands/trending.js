import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
export const data = new SlashCommandBuilder().setName('trending').setDescription('Films tendance');
export async function execute(interaction) {
  const embed = new EmbedBuilder().setColor('#FF6B6B').setTitle('🔥 Tendances').addFields({name: '1️⃣', value: 'Avatar 3'},{name: '2️⃣', value: 'Oppenheimer'},{name: '3️⃣', value: 'Dune: Part Two'},{name: '4️⃣', value: 'The Killers'},{name: '5️⃣', value: 'Barbie'});
  await interaction.reply({ embeds: [embed] });
}
