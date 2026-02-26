import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('random')
  .setDescription('Génère un nombre aléatoire')
  .addIntegerOption(opt => opt.setName('min').setDescription('Min').setRequired(false))
  .addIntegerOption(opt => opt.setName('max').setDescription('Max').setRequired(false));

export async function execute(interaction) {
  const min = interaction.options.getInteger('min') ?? 1;
  const max = interaction.options.getInteger('max') ?? 100;
  const num = Math.floor(Math.random() * (max - min + 1)) + min;
  const embed = new EmbedBuilder()
    .setColor('#00FF00')
    .setTitle('🎲 Nombre Aléatoire')
    .setDescription(`Entre ${min} et ${max}: **${num}**`);
  await interaction.reply({ embeds: [embed] });
}
