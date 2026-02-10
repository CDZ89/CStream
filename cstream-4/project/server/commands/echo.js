import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('echo')
  .setDescription('Répète un message')
  .addStringOption(opt => opt.setName('message').setDescription('Le message').setRequired(true));

export async function execute(interaction) {
  const msg = interaction.options.getString('message');
  await interaction.reply(msg);
}
