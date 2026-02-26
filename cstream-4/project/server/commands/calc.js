import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('calc')
  .setDescription('Calcule une expression')
  .addStringOption(opt => opt.setName('expression').setDescription('Ex: 2+2').setRequired(true));

export async function execute(interaction) {
  const expr = interaction.options.getString('expression');
  try {
    const result = Function('"use strict"; return (' + expr + ')')();
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('🧮 Calcul')
      .addFields(
        { name: 'Expression', value: expr },
        { name: 'Résultat', value: `${result}` }
      );
    await interaction.reply({ embeds: [embed] });
  } catch (e) {
    await interaction.reply({ content: '❌ Erreur: Expression invalide', ephemeral: true });
  }
}
