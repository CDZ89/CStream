import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const trivia = [
  { q: "Quel est le film le plus regardé? Réponse: Avatar", a: "Avatar" },
  { q: "Quel film a gagné l'Oscar 2024? Réponse: Oppenheimer", a: "Oppenheimer" },
  { q: "Quel est le réalisateur de Inception? Réponse: Christopher Nolan", a: "Nolan" },
];

export const data = new SlashCommandBuilder()
  .setName('trivia')
  .setDescription('Question trivia sur les films');

export async function execute(interaction) {
  const q = trivia[Math.floor(Math.random() * trivia.length)];
  const embed = new EmbedBuilder()
    .setColor('#FF6B6B')
    .setTitle('🎬 Trivia Cinéma')
    .setDescription(q.q);
  await interaction.reply({ embeds: [embed] });
}
