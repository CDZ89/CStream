import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('verify')
  .setDescription('Verify your account to get the Verified role');

export async function execute(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('🔒 Vérification du compte')
    .setDescription('Clique sur le bouton ci-dessous pour vérifier ton compte et obtenir le rôle **Vérifié**.')
    .setColor(0x5865f2)
    .setFooter({ text: 'CStream Verification System' });

  const siteUrl = process.env.SITE_DOMAIN || 'https://cstream--trte11.replit.app';
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('Vérifier mon compte')
      .setStyle(ButtonStyle.Link)
      .setURL(`${siteUrl}/verify?discord_id=${interaction.user.id}`)
  );

  await interaction.reply({
    embeds: [embed],
    components: [row],
    ephemeral: false,
  });
}
