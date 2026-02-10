const DISCORD_WEBHOOK_URL = localStorage.getItem('discord_webhook_url') || '';

interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  timestamp?: string;
  footer?: { text: string };
  author?: { name: string };
}

interface DiscordMessage {
  content?: string;
  username?: string;
  avatar_url?: string;
  embeds?: DiscordEmbed[];
}

const EMBED_COLORS = {
  success: 0x22C55E,
  info: 0x3B82F6,
  warning: 0xF59E0B,
  error: 0xEF4444,
  purple: 0x8B5CF6,
  pink: 0xEC4899,
  gold: 0xF59E0B,
  cyan: 0x06B6D4,
  new_user: 0x22C55E,
  user_login: 0x8B5CF6,
  admin_message: 0xEC4899,
  update: 0x3B82F6,
};

const BOT_CONFIG = {
  name: 'CStream',
  version: 'v1.4',
  footerText: 'CStream',
};

export const sendDiscordWebhook = async (
  webhookUrl: string,
  message: DiscordMessage
): Promise<boolean> => {
  if (!webhookUrl) return false;

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
    return response.ok;
  } catch (error) {
    console.error('Discord webhook error:', error);
    return false;
  }
};

export const notifyUserLogin = async (
  webhookUrl: string,
  username: string,
  email: string
) => {
  const message: DiscordMessage = {
    username: BOT_CONFIG.name,
    embeds: [{
      title: 'Connexion',
      description: `**${username || 'Utilisateur'}** s'est connecté`,
      color: EMBED_COLORS.user_login,
      fields: [
        { name: 'Heure', value: new Date().toLocaleTimeString('fr-FR'), inline: true },
      ],
      timestamp: new Date().toISOString(),
      footer: { text: BOT_CONFIG.footerText },
    }],
  };
  return sendDiscordWebhook(webhookUrl, message);
};

export const notifyUserRegistration = async (
  webhookUrl: string,
  username: string,
  email: string
) => {
  const message: DiscordMessage = {
    username: BOT_CONFIG.name,
    embeds: [{
      title: 'Nouvel Utilisateur',
      description: `Bienvenue à **${username || 'Nouveau membre'}** sur CStream`,
      color: EMBED_COLORS.new_user,
      fields: [
        { name: 'Email', value: `||${email || '-'}||`, inline: true },
        { name: 'Date', value: new Date().toLocaleDateString('fr-FR'), inline: true },
      ],
      timestamp: new Date().toISOString(),
      footer: { text: BOT_CONFIG.footerText },
    }],
  };
  return sendDiscordWebhook(webhookUrl, message);
};

export const sendAdminMessage = async (
  webhookUrl: string,
  message: string,
  adminName: string
) => {
  const discordMessage: DiscordMessage = {
    username: BOT_CONFIG.name,
    embeds: [{
      title: 'Message Admin',
      description: message,
      color: EMBED_COLORS.admin_message,
      author: { name: adminName || 'Admin' },
      timestamp: new Date().toISOString(),
      footer: { text: BOT_CONFIG.footerText },
    }],
  };
  return sendDiscordWebhook(webhookUrl, discordMessage);
};

export const notifyNewContent = async (
  webhookUrl: string,
  contentTitle: string,
  contentType: 'movie' | 'tv' | 'anime',
  posterUrl?: string
) => {
  const typeLabel = { movie: 'Film', tv: 'Série', anime: 'Anime' }[contentType];

  const message: DiscordMessage = {
    username: BOT_CONFIG.name,
    embeds: [{
      title: `Nouveau ${typeLabel}`,
      description: `**${contentTitle}** est disponible`,
      color: EMBED_COLORS.purple,
      fields: [
        { name: 'Type', value: typeLabel, inline: true },
      ],
      timestamp: new Date().toISOString(),
      footer: { text: BOT_CONFIG.footerText },
    }],
  };
  return sendDiscordWebhook(webhookUrl, message);
};

export const notifyUpdate = async (
  webhookUrl: string,
  title: string,
  content: string
) => {
  const message: DiscordMessage = {
    username: BOT_CONFIG.name,
    embeds: [{
      title: 'Mise à Jour',
      description: content || 'Nouvelle mise à jour',
      color: EMBED_COLORS.update,
      fields: [
        { name: 'Titre', value: title || '-', inline: true },
        { name: 'Version', value: BOT_CONFIG.version, inline: true },
      ],
      timestamp: new Date().toISOString(),
      footer: { text: BOT_CONFIG.footerText },
    }],
  };
  return sendDiscordWebhook(webhookUrl, message);
};

export const notifyMediaAdded = async (
  webhookUrl: string,
  name: string,
  url: string,
  type: string
) => {
  const message: DiscordMessage = {
    username: BOT_CONFIG.name,
    embeds: [{
      title: 'Nouveau Lecteur',
      color: EMBED_COLORS.cyan,
      fields: [
        { name: 'Nom', value: name || '-', inline: true },
        { name: 'Type', value: type || 'Lecteur', inline: true },
      ],
      timestamp: new Date().toISOString(),
      footer: { text: BOT_CONFIG.footerText },
    }],
  };
  return sendDiscordWebhook(webhookUrl, message);
};

export const validateWebhookUrl = (url: string): boolean => {
  const discordWebhookRegex = /^https:\/\/(discord\.com|discordapp\.com)\/api\/webhooks\/\d+\/[\w-]+$/;
  return discordWebhookRegex.test(url);
};

export const saveWebhookUrl = (url: string): void => {
  localStorage.setItem('discord_webhook_url', url);
};

export const getWebhookUrl = (): string => {
  return localStorage.getItem('discord_webhook_url') || '';
};

export { EMBED_COLORS, BOT_CONFIG };
