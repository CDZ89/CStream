import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const quotes = [
  "La vie est un film, tu décides d'être le héros. - CStream",
  "Chaque moment est une nouvelle scène. - Unknown",
  "Les meilleures histoires sont celles à venir.",
  "Le cinéma c'est l'art de dire une histoire.",
  "Regarde au-delà de l'écran, la vraie vie t'attend."
];

export const data = new SlashCommandBuilder()
  .setName('quote')
  .setDescription('Une citation inspirante');

export async function execute(interaction) {
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  const embed = new EmbedBuilder()
    .setColor('#FF6B6B')
    .setTitle('💭 Citation du jour')
    .setDescription(`"${quote}"`);
  await interaction.reply({ embeds: [embed] });
}
