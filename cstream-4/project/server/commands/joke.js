import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const jokes = [
  "Pourquoi les plongeurs plongent-ils toujours en arrière et jamais en avant? Parce que sinon ils tombent dans le bateau!",
  "Qu'est-ce qu'un crocodile qui surveille la pharmacie? Un Lacoste-garde!",
  "Quel est le comble pour un électricien? De ne pas être au courant!",
  "Comment appelle-t-on un chat tombé dans un pot de peinture le jour de Noël? Un chat-peint de Noël!",
  "Qu'est-ce qu'un canif? Un petit fien!"
];

export const data = new SlashCommandBuilder()
  .setName('joke')
  .setDescription('Raconte une blague');

export async function execute(interaction) {
  const joke = jokes[Math.floor(Math.random() * jokes.length)];
  const embed = new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle('😂 Blague du jour')
    .setDescription(joke);
  await interaction.reply({ embeds: [embed] });
}
