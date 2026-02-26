import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Affiche la liste des commandes disponibles');

export async function execute(interaction) {
  const embed = new EmbedBuilder()
    .setColor('#00ff00')
    .setTitle('📚 Commandes CStream Bot')
    .addFields(
      { name: 'Infos', value: '/info, /ping, /avatar, /userinfo, /serverinfo', inline: false },
      { name: 'Profil', value: '/profile, /stats, /level, /badges', inline: false },
      { name: 'Utilitaires', value: '/time, /random, /calc, /define, /translate', inline: false },
      { name: 'Modération', value: '/warn, /mute, /kick, /ban, /unban', inline: false },
      { name: 'Fun', value: '/joke, /meme, /quote, /trivia, /flip', inline: false },
    )
    .setFooter({ text: 'CStream v1.0 | /help pour plus d\'infos' });
  
  await interaction.reply({ embeds: [embed] });
}
