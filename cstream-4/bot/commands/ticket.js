const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Créer un ticket de support'),

  async execute(interaction) {
    const guild = interaction.guild;
    const user = interaction.user;
    
    const existingChannel = guild.channels.cache.find(
      c => c.name === `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}` && c.type === ChannelType.GuildText
    );

    if (existingChannel) {
      return interaction.reply({
        content: `Vous avez déjà un ticket ouvert : ${existingChannel}`,
        ephemeral: true
      });
    }

    let ticketCategory = guild.channels.cache.find(
      c => c.name.toLowerCase().includes('ticket') && c.type === ChannelType.GuildCategory
    );

    if (!ticketCategory) {
      try {
        ticketCategory = await guild.channels.create({
          name: '🎫 Tickets',
          type: ChannelType.GuildCategory,
          permissionOverwrites: [
            {
              id: guild.id,
              deny: [PermissionFlagsBits.ViewChannel],
            }
          ]
        });
      } catch (error) {
        console.error('Error creating ticket category:', error);
      }
    }

    try {
      const ticketChannel = await guild.channels.create({
        name: `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        type: ChannelType.GuildText,
        parent: ticketCategory?.id,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks],
          },
          {
            id: interaction.client.user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.EmbedLinks],
          }
        ]
      });

      const welcomeEmbed = new EmbedBuilder()
        .setTitle('🎫 Ticket de Support')
        .setDescription(`Bienvenue ${user}, votre ticket a été créé avec succès !

**Comment ça marche :**
• Décrivez votre problème en détail
• Un membre du staff vous répondra rapidement
• Cliquez sur 🔒 pour fermer le ticket

---

**Welcome ${user}**, your ticket has been created successfully!

**How it works:**
• Describe your issue in detail
• A staff member will respond shortly
• Click 🔒 to close the ticket`)
        .setColor('#E50914')
        .setTimestamp()
        .setFooter({ text: 'CStream Support' });

      const closeButton = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('close_ticket')
            .setLabel('Fermer le ticket')
            .setEmoji('🔒')
            .setStyle(ButtonStyle.Danger)
        );

      await ticketChannel.send({ 
        content: `${user}`,
        embeds: [welcomeEmbed], 
        components: [closeButton] 
      });

      await interaction.reply({
        content: `Votre ticket a été créé : ${ticketChannel}`,
        ephemeral: true
      });

    } catch (error) {
      console.error('Error creating ticket:', error);
      await interaction.reply({
        content: 'Une erreur est survenue lors de la création du ticket.',
        ephemeral: true
      });
    }
  }
};
