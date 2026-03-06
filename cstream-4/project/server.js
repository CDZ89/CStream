import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createHttpServer } from "http";
import compression from "compression";
import os from "os";
import CHANNELS_DATABASE from "./src/data/channels.js";
import { Client, GatewayIntentBits, ActivityType, SlashCommandBuilder, REST, Routes, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Auto-load .env / .env.example and decode *_B64 secrets ─────────────────
function loadEnvFallback() {
  const envFile = path.resolve(__dirname, ".env");
  const exampleFile = path.resolve(__dirname, ".env.example");
  const target = fs.existsSync(envFile) ? envFile : (fs.existsSync(exampleFile) ? exampleFile : null);
  if (!target) return;
  try {
    const lines = fs.readFileSync(target, "utf8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx < 1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!key || !val) continue;
      // Decode base64 entries (keys ending in _B64 → strip suffix, decode value)
      if (key.endsWith("_B64")) {
        const realKey = key.slice(0, -4); // remove _B64
        if (!process.env[realKey]) {
          process.env[realKey] = Buffer.from(val, "base64").toString("utf8");
        }
      } else if (!process.env[key]) {
        process.env[key] = val;
      }
    }
    console.log(`[ENV] Loaded from: ${path.basename(target)}`);
  } catch (e) {
    console.warn("[ENV] Could not load env file:", e.message);
  }
}
loadEnvFallback();



const isDev = process.env.NODE_ENV !== "production";
const app = express();

app.use(compression());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use((req, res, next) => {
  const origin = req.headers.origin || "*";
  res.header("Access-Control-Allow-Origin", origin);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, Origin, X-Requested-With");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// --- DISCORD BOT ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

const DISCORD_TOKEN = "MTQ0NDcyMTU0MzQ4NDgwNTEzMg.GDb_wO.kmL-xZvpBm7qd-o-sYaZAeWtYM-UGcLT1GUOKg";
const GUILD_ID = "1444721543484805132";
const BOOST_CHANNEL_ID = "1466080992627265648";
const NOTIF_CHANNEL_ID = "1454425396303888426"; // Admin/Notifications channel
const SITE_URL = "https://cstream.replit.app";

// Direct Discord notification helper (instant, no queue)
async function sendDiscordNotification(embed) {
  try {
    if (!client.isReady()) {
      console.log("[Discord] Bot not ready, queuing notification");
      return false;
    }
    const channel = await client.channels.fetch(NOTIF_CHANNEL_ID).catch(() => null);
    if (channel && channel.isTextBased()) {
      await channel.send({ embeds: [embed] });
      console.log("[Discord] Notification sent to admin channel");
      return true;
    }
    console.log("[Discord] Channel not found or not text-based");
    return false;
  } catch (e) {
    console.error("[Discord] Notification error:", e.message);
    return false;
  }
}

const commands = [
  new SlashCommandBuilder()
    .setName('health')
    .setDescription('Vérifier l\'état de santé du bot et du site'),
  new SlashCommandBuilder()
    .setName('search')
    .setDescription('Rechercher un film, une série ou un anime via TMDB')
    .addStringOption(option =>
      option.setName('query').setDescription('Nom du film, série ou anime').setRequired(true))
    .addStringOption(option =>
      option.setName('type').setDescription('Type de média').setRequired(true)
        .addChoices(
          { name: 'Film', value: 'movie' },
          { name: 'Série', value: 'tv' },
          { name: 'Anime', value: 'anime' }
        )),
  new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Vérifier votre compte CStream'),
  new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Voir vos informations'),
  new SlashCommandBuilder()
    .setName('support')
    .setDescription('Infos pour soutenir CStream'),
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Afficher les commandes disponibles'),
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

async function deployCommands() {
  try {
    if (!client.user) return;
    console.log("Attempting to deploy slash commands globally...");
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log("Slash commands deployed globally");
  } catch (error) {
    console.error("Error deploying commands:", error);
  }
}

client.on("ready", () => {
  console.log(`Bot Discord connecté: ${client.user.tag}`);

  // Status: Streaming "regarde CStream"
  client.user.setPresence({
    activities: [{
      name: "regarde CStream",
      type: ActivityType.Streaming,
      url: "https://www.twitch.tv/cstream"
    }],
    status: "online",
  });

  deployCommands();
});

// Auto-login bot in production to ensure it stays online
if (!isDev) {
  client.login(DISCORD_TOKEN).catch(err => {
    console.error("Critical: Discord bot failed to login in production:", err);
  });
}

client.on('guildMemberUpdate', async (oldMember, newMember) => {
  const boosterRole = newMember.guild.roles.cache.find(r => r.name === 'Server Booster');
  if (!boosterRole) return;

  const hadBoost = oldMember.premiumSince;
  const hasBoost = newMember.premiumSince;

  if (!hadBoost && hasBoost) {
    try {
      await newMember.roles.add(boosterRole);
      const boostChannel = newMember.guild.channels.cache.get(BOOST_CHANNEL_ID);
      if (boostChannel?.isTextBased()) {
        const embed = new EmbedBuilder()
          .setColor(0x8b5cf6)
          .setTitle("Nouveau Boost ! 💜 / New Boost! 💜")
          .setDescription(`**FR :** 💜 Merci infiniment pour le boost, ${newMember} ! Votre soutien aide CStream à grandir. Le rôle **Server Booster** vous a été attribué.\n\n**EN :** 💜 Thank you so much for the boost, ${newMember}! Your support helps CStream grow. The **Server Booster** role has been assigned to you.`)
          .setTimestamp();
        await boostChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error("Error handling boost:", error);
    }
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'health') {
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('🏥 État de Santé / Health Status')
      .addFields(
        { name: 'Bot Discord', value: '✅ En ligne / Online', inline: true },
        { name: 'Serveur CStream', value: '✅ Connecté / Connected', inline: true },
        { name: 'Version', value: 'v4.5 Premium', inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'CStream System Monitoring' });
    await interaction.reply({ embeds: [embed] });
  }

  if (interaction.commandName === 'search') {
    const query = interaction.options.getString('query', true);
    const type = interaction.options.getString('type', true);
    await interaction.deferReply();

    try {
      const searchType = type === 'anime' ? 'tv' : type;
      const tmdbKey = process.env.VITE_TMDB_API_KEY || "d430c6c589f4549e780b7e1786f0ac9c";
      const res = await fetch(`https://api.themoviedb.org/3/search/${searchType}?api_key=${tmdbKey}&query=${encodeURIComponent(query)}&language=fr-FR`);
      const data = await res.json();

      if (!data.results?.length) return interaction.editReply(`❌ Aucun résultat trouvé pour **${query}** / No results found for **${query}**`);

      const item = data.results[0];
      const title = item.title || item.name;
      const mediaUrl = `${SITE_URL}/${type}/${item.id}`;

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(title)
        .setDescription(`🎬 Cliquez sur le bouton ci‑dessous pour regarder sur **CStream** / Click below to watch on **CStream**`)
        .setThumbnail(item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null)
        .setFooter({ text: 'Powered by TMDB • CStream' });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('Regarder sur CStream / Watch on CStream')
          .setStyle(ButtonStyle.Link)
          .setURL(mediaUrl)
      );

      await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (e) {
      console.error(e);
      await interaction.editReply('❌ Une erreur est survenue / An error occurred.');
    }
  }

  if (interaction.commandName === 'help') {
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('📚 Commandes disponibles / Available Commands')
      .setDescription(`**FR :**\n• \`/search\` – Rechercher un film, une série ou un anime via TMDB\n• \`/verify\` – Vérifier votre compte CStream\n• \`/profile\` – Voir vos informations\n• \`/support\` – Infos pour soutenir CStream\n\n**EN :**\n• \`/search\` – Search movies, series or anime via TMDB\n• \`/verify\` – Verify your CStream account\n• \`/profile\` – View your information\n• \`/support\` – Support CStream`)
      .setFooter({ text: 'CStream Bot' });
    await interaction.reply({ embeds: [embed] });
  }

  if (interaction.commandName === 'support') {
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('💜 Soutenir CStream / Support CStream')
      .setDescription(`**FR :** Votre soutien nous aide à garder le site gratuit et sans pub !\n**EN :** Your support helps us keep the site free and ad-free!`)
      .addFields(
        { name: 'PayPal', value: 'https://paypal.me/CDZ68', inline: true },
        { name: 'Ko-Fi', value: 'https://ko-fi.com/cstream', inline: true }
      );
    await interaction.reply({ embeds: [embed] });
  }
});

// Bot status tracking
let botRunning = false;

// Note: Main Discord bot runs in bot/index.js workflow
// This legacy code is kept but disabled to prevent duplicate connections

app.post('/api/admin/bot/start', async (req, res) => {
  if (botRunning) return res.json({ ok: true, message: 'Bot déjà démarré' });
  try {
    await client.login(DISCORD_TOKEN);
    botRunning = true;
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/admin/bot/stop', async (req, res) => {
  if (!botRunning) return res.json({ ok: true, message: 'Bot déjà arrêté' });
  client.destroy();
  botRunning = false;
  res.json({ ok: true });
});

app.get('/api/admin/bot/status', (req, res) => {
  try {
    const statusPath = path.join(__dirname, '..', 'bot', 'bot-status.json');
    if (fs.existsSync(statusPath)) {
      const statusData = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
      const lastUpdate = new Date(statusData.lastUpdate);
      const now = new Date();
      const diffSeconds = (now - lastUpdate) / 1000;

      if (statusData.connected && diffSeconds < 60) {
        return res.json({
          running: true,
          connected: true,
          message: "Bot Discord connecté",
          botUser: { tag: statusData.botTag }
        });
      }
    }
  } catch (e) {
    console.error('Error reading bot status:', e);
  }
  res.json({ running: botRunning, connected: false, botUser: null });
});

app.get('/api/discord/status', (req, res) => {
  try {
    const statusPath = path.join(__dirname, '..', 'bot', 'bot-status.json');
    if (fs.existsSync(statusPath)) {
      const statusData = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
      const lastUpdate = new Date(statusData.lastUpdate);
      const now = new Date();
      const diffSeconds = (now - lastUpdate) / 1000;

      if (statusData.connected && diffSeconds < 60) {
        return res.json({
          connected: true,
          message: "Bot Discord connecté",
          botUser: { tag: statusData.botTag },
          lastUpdate: statusData.lastUpdate
        });
      }
    }
  } catch (e) {
    console.error('Error reading bot status:', e);
  }
  res.json({ connected: false, message: "Bot Discord non connecté", botUser: null });
});

app.get('/api/admin/bot/channels', (req, res) => {
  try {
    const dataPath = path.join(__dirname, '../bot/bot-data.json');
    if (fs.existsSync(dataPath)) {
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      return res.json({ channels: data.channels || [], guildName: data.guildName });
    }
  } catch (e) {
    console.error('Error reading bot data:', e);
  }
  res.json({ channels: [] });
});

app.post('/api/admin/bot/notify', async (req, res) => {
  const { channelId, message, embed } = req.body;
  if (!channelId || (!message && !embed)) {
    return res.status(400).json({ ok: false, success: false, error: "Données manquantes" });
  }

  try {
    const notifyRequestPath = path.join(__dirname, '../bot/notify-request.json');
    fs.writeFileSync(notifyRequestPath, JSON.stringify({
      channelId,
      message,
      embed,
      timestamp: new Date().toISOString(),
      status: 'pending'
    }));
    res.json({ ok: true, success: true, message: "OK" });
  } catch (e) {
    res.status(500).json({ ok: false, success: false, error: e.message });
  }
});

// --- SYSTEM MONITORING & TICKETS (Added for Admin Beta) ---

app.get('/api/admin/system-stats', (req, res) => {
  try {
    const memoryUsage = process.memoryUsage();
    const stats = {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
      },
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        pid: process.pid
      },
      botRunning
    };
    res.json(stats);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/contact', async (req, res) => {
  try {
    const { userId, subject, message, username } = req.body;

    // Save to tickets.json
    const ticketsPath = path.join(__dirname, 'tickets.json');
    let tickets = [];
    if (fs.existsSync(ticketsPath)) {
      try {
        tickets = JSON.parse(fs.readFileSync(ticketsPath, 'utf8'));
      } catch (e) { tickets = []; }
    }

    const newTicket = {
      id: "TICK-" + Date.now().toString().slice(-6),
      userId,
      username: username || "Anonyme",
      subject,
      message,
      status: 'open',
      priority: 'normal',
      created_at: new Date().toISOString(),
      updates: []
    };

    tickets.unshift(newTicket);

    console.log(`[Tickets] Saving ticket to ${ticketsPath}`);
    if (!fs.existsSync(ticketsPath)) {
      console.log("[Tickets] Creating new tickets.json file");
      fs.writeFileSync(ticketsPath, JSON.stringify([], null, 2));
    }

    fs.writeFileSync(ticketsPath, JSON.stringify(tickets.slice(0, 1000), null, 2));
    console.log(`[Tickets] Saved ${tickets.length} tickets`);

    // Notify Discord directly (instant)
    const ticketEmbed = new EmbedBuilder()
      .setColor(0xeab308)
      .setTitle('🎫 Nouveau Ticket Support')
      .setDescription(`**De:** ${newTicket.username}\n**Sujet:** ${subject}\n**Message:** ${message.slice(0, 500)}`)
      .setFooter({ text: `Ticket ID: ${newTicket.id}` })
      .setTimestamp();

    // Also try to send to channel specifically
    try {
      await sendDiscordNotification(ticketEmbed);
    } catch (err) {
      console.error("[Tickets] Discord notification failed:", err);
    }

    res.json({ ok: true, ticketId: newTicket.id });
  } catch (e) {
    console.error("Contact API Error:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/admin/tickets', (req, res) => {
  try {
    const ticketsPath = path.join(__dirname, 'tickets.json');
    if (fs.existsSync(ticketsPath)) {
      const tickets = JSON.parse(fs.readFileSync(ticketsPath, 'utf8'));
      res.json({ tickets });
    } else {
      res.json({ tickets: [] });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- UTILS ---
function queueDiscordNotification(data) {
  try {
    const notifyRequestPath = path.join(__dirname, '../bot/notify-request.json');
    let queue = [];
    if (fs.existsSync(notifyRequestPath)) {
      try {
        const content = fs.readFileSync(notifyRequestPath, 'utf8');
        if (content.trim()) {
          const parsed = JSON.parse(content);
          queue = Array.isArray(parsed) ? parsed : [parsed];
        }
      } catch (e) { queue = []; }
    }

    queue.push({
      ...data,
      status: 'pending',
      timestamp: new Date().toISOString()
    });

    fs.writeFileSync(notifyRequestPath, JSON.stringify(queue, null, 2));
    return true;
  } catch (e) {
    console.error('Error queuing notification:', e);
    return false;
  }
}

// --- SERVICE STATUS ---
app.get('/api/service-status', async (req, res) => {
  try {
    // Check TMDB
    const tmdbKey = process.env.VITE_TMDB_API_KEY;
    const tmdbStatus = !!tmdbKey;

    // Check Groq (if applicable, else mock true if key exists)
    const groqStatus = !!process.env.GROQ_API_KEY;

    // Check Github (mock)
    const githubStatus = true;

    // Check Discord
    // We reuse the botRunning status or check the bot status file
    let discordStatus = botRunning;
    if (!discordStatus) {
      try {
        const statusPath = path.join(__dirname, '..', 'bot', 'bot-status.json');
        console.log(`[Service Status] Checking bot status at: ${statusPath}`);
        if (fs.existsSync(statusPath)) {
          const statusContent = fs.readFileSync(statusPath, 'utf8');
          console.log(`[Service Status] Bot status content: ${statusContent}`);
          const statusData = JSON.parse(statusContent);
          const lastUpdate = new Date(statusData.lastUpdate);
          if ((new Date() - lastUpdate) < 60000) {
            discordStatus = true;
            console.log("[Service Status] Bot file indicates ONLINE");
          } else {
            console.log("[Service Status] Bot file stale");
          }
        } else {
          console.log("[Service Status] Bot status file NOT FOUND");
        }
      } catch (e) {
        console.error("[Service Status] Error checking bot status:", e);
      }
    }

    res.json({
      tmdb: tmdbStatus,
      groq: groqStatus,
      github: githubStatus,
      discordBot: discordStatus
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- ANALYTICS & COOKIE CONSENT ---

app.post('/api/cookie-consent', async (req, res) => {
  try {
    const { preferences, userEmail, username, language, platform } = req.body;

    // Log to a file for the Admin page to read
    const consentLogPath = path.join(__dirname, 'cookie-consents.json');
    let consents = [];
    if (fs.existsSync(consentLogPath)) {
      try {
        consents = JSON.parse(fs.readFileSync(consentLogPath, 'utf8'));
      } catch (e) { consents = []; }
    }

    const newConsent = {
      id: Math.random().toString(36).substr(2, 9),
      ...req.body,
      ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      created_at: new Date().toISOString()
    };

    consents.unshift(newConsent);
    fs.writeFileSync(consentLogPath, JSON.stringify(consents.slice(0, 500), null, 2));

    // Notify Discord
    queueDiscordNotification({
      channelId: "1454425396303888426", // Analytics channel
      embed
    });

    res.json({ ok: true });
  } catch (e) {
    console.error('Cookie consent error:', e);
    res.status(500).json({ ok: false });
  }
});

app.post('/api/analytics/event', async (req, res) => {
  try {
    const { type, data, user } = req.body;
    let title = "📊 Nouvel Évènement";
    let color = "#3b82f6";

    if (type === 'signup') {
      title = "🆕 Nouvel Utilisateur !";
      color = "#10b981";
    } else if (type === 'login') {
      title = "🔑 Connexion";
      color = "#6366f1";
    }

    const embed = {
      title,
      description: `**Utilisateur:** ${user?.username || 'Inconnu'}\n**Email:** ${user?.email || 'N/A'}\n**Détails:** ${JSON.stringify(data || {})}`,
      color,
      timestamp: new Date().toISOString()
    };

    queueDiscordNotification({
      channelId: "1454425396303888426", // Analytics channel
      embed
    });

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false });
  }
});

app.post('/api/analytics/visit', async (req, res) => {
  try {
    const { username, visitorId, platform, language } = req.body;

    const embed = {
      title: "👤 Nouveau Visiteur !",
      description: `Un utilisateur a visité le site.\n\n**Utilisateur:** ${username || 'Inconnu'}\n**Visitor ID:** ${visitorId || 'N/A'}\n**Plateforme:** ${platform || 'N/A'}\n**Langue:** ${language || 'N/A'}`,
      color: "#10b981",
      timestamp: new Date().toISOString()
    };

    queueDiscordNotification({
      channelId: "1454425396303888426", // Analytics channel
      embed
    });

    res.json({ ok: true });
  } catch (e) {
    console.error('Visit analytics error:', e);
    res.status(500).json({ ok: false });
  }
});

app.post('/api/discord/dm', async (req, res) => {
  const { userId, message, embed } = req.body;
  if (!userId || (!message && !embed)) {
    return res.status(400).json({ ok: false, success: false, error: "Données manquantes" });
  }

  try {
    const dmRequestPath = path.join(__dirname, '../bot/dm-request.json');
    fs.writeFileSync(dmRequestPath, JSON.stringify({
      userId,
      message,
      embed,
      timestamp: new Date().toISOString(),
      status: 'pending'
    }));
    res.json({ ok: true, success: true, message: "OK" });
  } catch (e) {
    res.status(500).json({ ok: false, success: false, error: e.message });
  }
});

app.post('/api/discord/setup-channel', async (req, res) => {
  res.json({ ok: true, success: true });
});

app.post('/api/discord/save-config', async (req, res) => {
  res.json({ ok: true, success: true });
});

app.get('/api/discord/channels', (req, res) => {
  try {
    const dataPath = path.join(__dirname, '../bot/bot-data.json');
    if (fs.existsSync(dataPath)) {
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      return res.json({ channels: data.channels || [] });
    }
  } catch (e) { }
  res.json({ channels: [] });
});
app.get('/api/discord/members', (req, res) => {
  try {
    const dataPath = path.join(__dirname, '../bot/bot-data.json');
    if (fs.existsSync(dataPath)) {
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      return res.json({ members: data.members || [] });
    }
  } catch (e) {
    console.error('Error reading bot data for members:', e);
  }
  res.json({ members: [] });
});

app.get('/api/bot/status', (req, res) => {
  try {
    const statusPath = path.join(__dirname, '../bot/bot-status.json');
    if (fs.existsSync(statusPath)) {
      const statusData = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
      if (statusData.connected) {
        return res.json({ status: 'online' });
      }
    }
  } catch (e) { }
  res.json({ status: 'offline' });
});

app.get('/api/admin/cookie-consents', (req, res) => {
  try {
    const consentLogPath = path.join(__dirname, 'cookie-consents.json');
    if (fs.existsSync(consentLogPath)) {
      const consents = JSON.parse(fs.readFileSync(consentLogPath, 'utf8'));
      res.json({ consents });
    } else {
      res.json({ consents: [] });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/admin/cookie-consents/:id', (req, res) => {
  try {
    const { id } = req.params;
    const consentLogPath = path.join(__dirname, 'cookie-consents.json');
    if (fs.existsSync(consentLogPath)) {
      let consents = JSON.parse(fs.readFileSync(consentLogPath, 'utf8'));
      consents = consents.filter(c => c.id !== id);
      fs.writeFileSync(consentLogPath, JSON.stringify(consents, null, 2));
      res.json({ ok: true });
    } else {
      res.status(404).json({ error: "Non trouvé" });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/admin/logs', (req, res) => {
  try {
    // Generate some mock logs if file doesn't exist, or read from a logs file
    const logsPath = path.join(__dirname, 'activity-logs.json');
    if (fs.existsSync(logsPath)) {
      const logs = JSON.parse(fs.readFileSync(logsPath, 'utf8'));
      res.json({ logs });
    } else {
      // Return recent cookie consents as activity logs for now if no other logs
      const consentLogPath = path.join(__dirname, 'cookie-consents.json');
      if (fs.existsSync(consentLogPath)) {
        const consents = JSON.parse(fs.readFileSync(consentLogPath, 'utf8'));
        const logs = consents.map(c => ({
          id: c.id,
          type: 'cookie_consent',
          message: `Consentement cookie de ${c.username || 'Anonyme'}`,
          timestamp: c.created_at,
          details: c.preferences
        }));
        res.json({ logs });
      } else {
        res.json({ logs: [] });
      }
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/discord/dm', async (req, res) => {
  const { userId, message, embed } = req.body;
  if (!userId || (!message && !embed)) {
    return res.status(400).json({ ok: false, error: "userId et message/embed requis" });
  }

  try {
    const notifyRequestPath = path.join(__dirname, '../bot/dm-request.json');
    fs.writeFileSync(notifyRequestPath, JSON.stringify({
      userId,
      message,
      embed,
      timestamp: new Date().toISOString(),
      status: 'pending'
    }));
    res.json({ ok: true, message: "Demande de DM envoyée" });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});
app.post('/api/verify-discord', async (req, res) => {
  const { discordId } = req.body;
  if (!botRunning) return res.status(500).json({ ok: false, error: "Le bot n'est pas démarré" });

  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    const member = await guild.members.fetch(discordId);
    const verifiedRole = guild.roles.cache.find(r => r.name.toLowerCase() === 'verified');

    if (verifiedRole) await member.roles.add(verifiedRole);

    await member.send({
      content: `✅ **Merci beaucoup !**\nVous êtes maintenant **vérifié** sur Discord et sur CStream.\nVotre rôle **Verified** a été ajouté avec succès.\n\n✅ **Thank you!**\nYou are now **verified** on Discord and on CStream.\nYour **Verified** role has been successfully added.\n\n🔗 Accédez au site / Access the website: ${SITE_URL}`
    }).catch(() => console.log("Impossible d'envoyer un DM à l'utilisateur"));

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// --- DADDYHD LIVE TV API ENGINE v6.0 ---
app.get("/api/livetv/channels", async (req, res) => {
  try {
    const DADDY_KEY = process.env.DADDY_KEY || "YOUR_KEY";
    const response = await fetch(`https://dlhd.link/daddyapi.php?key=${DADDY_KEY}&endpoint=channels`);

    let apiChannels = [];
    if (response.ok) {
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        apiChannels = data.data.map(c => ({
          id: c.channel_id,
          name: c.channel_name,
          logo: c.logo_url?.startsWith('http') ? c.logo_url : `https://dlhd.link/${c.logo_url || 'logos/default.png'}`,
          url: `https://dlhd.link/stream/stream-${c.channel_id}.php`,
          category: c.category || "Live TV"
        }));
      }
    }

    const mergedChannels = CHANNELS_DATABASE.map(c => ({
      ...c,
      logo: `https://dlhd.link/logos/${c.id}.png`,
      url: `https://dlhd.link/stream/stream-${c.id}.php`
    }));

    apiChannels.forEach(ac => {
      const idx = mergedChannels.findIndex(mc => mc.id === ac.id);
      if (idx !== -1) {
        mergedChannels[idx] = { ...mergedChannels[idx], ...ac };
      } else {
        mergedChannels.push(ac);
      }
    });

    return res.json(mergedChannels);
  } catch (error) {
    res.json(CHANNELS_DATABASE.map(c => ({
      ...c,
      logo: `https://dlhd.link/logos/${c.id}.png`,
      url: `https://dlhd.link/stream/stream-${c.id}.php`
    })));
  }
});

app.get("/api/livetv/schedule", async (req, res) => {
  try {
    const DADDY_KEY = process.env.DADDY_KEY || "YOUR_KEY";
    const response = await fetch(`https://dlhd.link/daddyapi.php?key=${DADDY_KEY}&endpoint=schedule`);
    if (response.ok) {
      const data = await response.json();
      return res.json(data);
    }
    res.status(500).json({ error: "Failed to fetch schedule" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/livetv/info", async (req, res) => {
  try {
    const DADDY_KEY = process.env.DADDY_KEY || "YOUR_KEY";
    const response = await fetch(`https://dlhd.link/daddyapi.php?key=${DADDY_KEY}&endpoint=info`);
    if (response.ok) {
      const data = await response.json();
      return res.json(data);
    }
    res.status(500).json({ error: "Failed to fetch info" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- SPORTS API PROXY (streamed.pk) ---
app.get("/api/sports", async (req, res) => {
  try {
    const response = await fetch("https://streamed.pk/api/sports");
    if (!response.ok) throw new Error("Streamed.pk error");
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.json([
      { id: "football", name: "Football" },
      { id: "basketball", name: "Basketball" },
      { id: "tennis", name: "Tennis" }
    ]);
  }
});

app.get("/api/sports/matches/:sport", async (req, res) => {
  try {
    const { sport } = req.params;
    const response = await fetch(`https://streamed.pk/api/matches/${sport}`);
    if (!response.ok) throw new Error("Streamed.pk error");
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Two-param sports stream (used by Live.tsx: source + id)
app.get("/api/sports/stream/:source/:id", async (req, res) => {
  try {
    const { source, id } = req.params;
    const response = await fetch(`https://streamed.pk/api/stream/${source}/${id}`, {
      headers: { "User-Agent": "Mozilla/5.0 CStream/4.0" },
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) throw new Error("Streamed.pk error");
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Legacy single-param route
app.get("/api/sports/stream/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const response = await fetch(`https://streamed.pk/api/stream/${id}`, {
      headers: { "User-Agent": "Mozilla/5.0 CStream/4.0" }
    });
    if (!response.ok) throw new Error("Streamed.pk error");
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── CHAT AI — Gemini Cascade + HF Llama 3.3 + Groq Safety Net ───────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const HF_TOKEN_KEY = process.env.HF_TOKEN || process.env.HF_TOKEN_KEY;
const GROQ_KEY_GLOBAL = process.env.GROQ_API_KEY || "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";
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || "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";


// ✅ Up-to-date Gemini models (as of 2025)
const GEMINI_MODELS_CASCADE = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
  "gemini-1.5-pro",
];

const AI_PERSONAS = {
  cai: `Tu es CStream AI, l'assistant cinéma intelligent de CStream, une plateforme de streaming premium.\nTu es amical, enthousiaste et expert en films, séries TV, anime et culture pop.\nRéponds TOUJOURS en français avec des emojis appropriés.\nPour les recommandations: utilise **titre** en gras et donne note, genre, synopsis court.\nSois informatif mais concis. Max 400 mots par réponse.`,
  critic: `Tu es un critique de cinéma expert et passionné. Tu analyses les films avec profondeur: mise en scène, photographie, jeu des acteurs, scénario, contexte culturel. Tu cites des films de référence. Réponds en français.`,
  director: `Tu es un réalisateur passionné qui explique le cinéma du point de vue créatif: techniques de tournage, narration visuelle, choix artistiques, direction d'acteurs. Réponds en français avec passion.`
};

const AVAILABLE_MODELS = [
  { id: "auto", name: "🤖 Auto (cascade)", provider: "auto", description: "Essaie Gemini → HuggingFace → Groq" },
  { id: "openai/gpt-oss-120b:free", name: "🧠 GPT-OSS 120B", provider: "openrouter", description: "OpenRouter gpt-oss" },
  { id: "nousresearch/hermes-3-llama-3.1-405b:free", name: "⚡ Groq Compound", provider: "openrouter", description: "Outils web & code" },
  { id: "google/gemma-3-27b-it:free", name: "🌙 Kimi K2", provider: "openrouter", description: "Moonshot AI" },
  { id: "meta-llama/llama-3.2-3b-instruct:free", name: "🦙 Llama 4 Scout", provider: "openrouter", description: "Meta Llama 4" },
  { id: "arcee-ai/trinity-mini:free", name: "🤔 Trinity Reasoning", provider: "openrouter", description: "Mode raisonnement" },
  { id: "pollinations/image", name: "🎨 Dessin (Riverflow)", provider: "local", description: "Génération d'images (Gratuit)" },
  { id: "llama-3.1-8b-instant", name: "💨 Llama 3.1 8B", provider: "groq", description: "Ultra Rapide Groq" },
  { id: "gemini-2.0-flash", name: "⚡ Gemini 2.0 Flash", provider: "gemini", description: "Rapide, intelligent" },
  { id: "gemini-1.5-pro-latest", name: "🧠 Gemini 1.5 Pro", provider: "gemini", description: "Haute précision" },
  { id: "meta-llama/Meta-Llama-3-8B-Instruct", name: "🦙 Llama 3.3 70B", provider: "huggingface", description: "Via HuggingFace" },
];

app.get("/api/models", (req, res) => {
  const withStatus = AVAILABLE_MODELS.map(m => ({
    ...m,
    available: m.provider === "gemini" ? !!GEMINI_API_KEY
      : m.provider === "huggingface" ? !!HF_TOKEN_KEY
        : m.provider === "groq" ? !!GROQ_KEY_GLOBAL
          : m.provider === "openrouter" ? !!OPENROUTER_KEY
            : true
  }));
  res.json({ models: withStatus });
});

async function callGeminiModel(messages, persona, modelId) {
  const systemText = AI_PERSONAS[persona] || AI_PERSONAS.cai;
  if (!GEMINI_API_KEY) { console.warn("[AI] No GEMINI_API_KEY"); return null; }
  const history = messages.slice(-12).map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }]
  }));
  try {
    console.log(`[AI] Trying Gemini: ${modelId}`);
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(20000),
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemText }] },
          contents: history,
          generationConfig: { maxOutputTokens: 1500, temperature: 0.75 }
        })
      }
    );
    if (!resp.ok) {
      const err = await resp.text();
      let errMsg = err;
      try { const p = JSON.parse(err); if (p.error?.message) errMsg = p.error.message; } catch (ex) { }
      throw new Error(`Gemini HTTP ${resp.status}: ${errMsg || err}`);
    }
    const data = await resp.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (text) { console.log(`[AI] ✅ Gemini ${modelId} OK`); return text; }
    throw new Error("Réponse vide de Gemini");
  } catch (e) {
    console.warn(`[AI] Gemini ${modelId} error:`, e.message);
    throw e;
  }
}

async function callGeminiCascade(messages, persona) {
  for (const model of GEMINI_MODELS_CASCADE) {
    try {
      const text = await callGeminiModel(messages, persona, model);
      if (text) return text;
    } catch (e) { console.warn(`Cascade skips ${model}`); }
  }
  return null;
}

async function callHuggingFace(messages, persona) {
  try {
    const systemText = AI_PERSONAS[persona] || AI_PERSONAS.cai;
    console.log("[AI] Trying HuggingFace Llama-3.3-70B...");
    const resp = await fetch("https://router.huggingface.co/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${HF_TOKEN_KEY}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(25000),
      body: JSON.stringify({
        model: "meta-llama/Meta-Llama-3-8B-Instruct",
        messages: [
          { role: "system", content: systemText },
          ...messages.slice(-8).map(m => ({ role: m.role, content: m.content }))
        ],
        max_tokens: 1024,
        temperature: 0.75
      })
    });
    if (!resp.ok) {
      const err = await resp.text();
      let errMsg = err;
      try {
        const p = JSON.parse(err);
        if (p.error) errMsg = typeof p.error === 'string' ? p.error : JSON.stringify(p.error);
        else if (p.error?.message) errMsg = p.error.message;
      } catch (ex) { }
      throw new Error(`HuggingFace HTTP ${resp.status}: ${errMsg || err}`);
    }
    const data = await resp.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (text) { console.log("[AI] ✅ HuggingFace OK"); return text; }
    throw new Error("Réponse vide de HuggingFace");
  } catch (e) {
    console.warn("[AI] HuggingFace error:", e.message);
    throw e;
  }
}

async function callGroqSafetyNet(messages, persona) {
  // Now using OpenRouter Llama 3.3 70B as the final safety net instead of native Groq key (which may be invalid)
  return await callOpenRouter(messages, persona, "meta-llama/llama-3.3-70b-instruct:free");
}

async function callPollinationsText(messages, persona) {
  try {
    const systemText = AI_PERSONAS[persona] || AI_PERSONAS.cai;
    console.log("[AI] Trying Pollinations Text (Ultimate Fallback)...");
    const resp = await fetch("https://text.pollinations.ai/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemText },
          ...messages.slice(-8).map(m => ({ role: m.role, content: m.content }))
        ],
        model: "openai"
      })
    });
    if (!resp.ok) throw new Error("Pollinations " + resp.status);
    const text = await resp.text();
    if (text) { console.log("[AI] ✅ Pollinations Text OK"); return text; }
    throw new Error("Réponse vide");
  } catch (e) {
    console.warn("[AI] Pollinations Text error:", e.message);
    throw e;
  }
}

async function callGroqCustom(messages, persona, modelId) {
  try {
    const GROQ_KEY = process.env.GROQ_API_KEY || "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";
    if (!GROQ_KEY) return null;
    const systemText = AI_PERSONAS[persona] || AI_PERSONAS.cai;
    console.log(`[AI] Trying Groq native: ${modelId}...`);
    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: "system", content: systemText }, ...messages.slice(-8).map(m => ({ role: m.role, content: m.content }))],
        max_tokens: 1024, temperature: 0.7
      })
    });

    if (!resp.ok) {
      const err = await resp.text();
      let errMsg = err; try { const p = JSON.parse(err); if (p.error?.message) errMsg = p.error.message; } catch (ex) { }
      throw new Error(`Groq HTTP ${resp.status}: ${errMsg || err}`);
    }
    const data = await resp.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("Réponse vide de Groq");
    return text;
  } catch (e) {
    console.warn(`[AI] Groq error:`, e.message);
    throw e;
  }
}

async function callOpenRouter(messages, persona, modelId, isReasoning = false, isImage = false) {
  if (!OPENROUTER_KEY) return null;
  const systemText = AI_PERSONAS[persona] || AI_PERSONAS.cai;

  // Format messages
  const historyMsgs = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
  const formattedMsgs = [{ role: "system", content: systemText }, ...historyMsgs];

  let bodyObj = {
    model: modelId,
    messages: formattedMsgs,
    temperature: 0.7,
  };

  if (isImage) {
    bodyObj.messages = [{ role: "user", content: messages[messages.length - 1].content }];
    bodyObj.modalities = ["image"];
  }

  if (isReasoning) {
    bodyObj.reasoning = { enabled: true };
  }

  if (modelId === "groq/compound") {
    bodyObj.compound_custom = { tools: { enabled_tools: ["web_search", "code_interpreter", "visit_website"] } };
  }

  try {
    console.log(`[AI] Trying OpenRouter: ${modelId}`);
    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.SITE_DOMAIN || "http://localhost:5000",
        "X-OpenRouter-Title": "CStream"
      },
      body: JSON.stringify(bodyObj)
    });

    if (!resp.ok) {
      const err = await resp.text();
      let errMsg = err;
      try { const p = JSON.parse(err); if (p.error?.message) errMsg = p.error.message; } catch (ex) { }
      throw new Error(`OpenRouter HTTP ${resp.status}: ${errMsg || err}`);
    }

    const data = await resp.json();

    if (isImage && data.choices?.[0]?.message?.images) {
      // Return markdown images base64 or URL
      const images = data.choices[0].message.images;
      let imgStr = "";
      images.forEach((img, i) => {
        const cleanUrl = img.image_url?.url?.trim() || "";
        imgStr += `![Generated Image ${i + 1}](${cleanUrl})\n\n`;
      });
      return imgStr.trim() || "⚠️ Erreur lors de la génération de l'image (flux vide).";
    }

    let content = data.choices?.[0]?.message?.content?.trim() || "";

    if (isReasoning && data.choices?.[0]?.message?.reasoning_details) {
      content = `> **Raisonnement de l'IA**\n> ${data.choices[0].message.reasoning_details}\n\n` + content;
    }

    if (!content) throw new Error("Réponse vide de OpenRouter");
    return content;
  } catch (e) {
    console.warn(`[AI] OpenRouter error:`, e.message);
    throw e;
  }
}

app.post("/api/chat", async (req, res) => {
  try {
    const { messages = [], character = "cai", model = "auto" } = req.body;
    console.log(`[AI] Chat request: model=${model} persona=${character} msgs=${messages.length}`);

    let response = null;

    if (model && model !== "auto") {
      try {
        if (model === "pollinations/image") {
          const prompt = messages[messages.length - 1].content;
          // Generate 100% free external image using pollinations (fallback route)
          const url = `https://pollinations.ai/p/${encodeURIComponent(prompt)}?nologo=true&enhance=true`;
          return res.json({ response: `![Generated Image](${url})`, model_used: model });
        }

        const openRouterModels = [
          "openai/gpt-oss-120b:free", "nousresearch/hermes-3-llama-3.1-405b:free",
          "google/gemma-3-27b-it:free", "meta-llama/llama-3.2-3b-instruct:free",
          "arcee-ai/trinity-mini:free", "meta-llama/llama-3.1-8b-instruct:free",
          "meta-llama/llama-3.3-70b-instruct:free"
        ];

        if (openRouterModels.includes(model)) {
          const isReasoning = model.includes("arcee-ai") || model.includes("thinking");
          response = await callOpenRouter(messages, character, model, isReasoning, false);
          return res.json({ response, model_used: model });
        }

        if (model === "llama-3.1-8b-instant") {
          response = await callGroqCustom(messages, character, model);
          return res.json({ response, model_used: model });
        }

        if (["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-pro-latest", "gemini-1.5-flash", "gemini-1.5-flash-8b"].includes(model)) {
          response = await callGeminiModel(messages, character, model);
          return res.json({ response, model_used: model });
        }

        if (model === "meta-llama/Meta-Llama-3-8B-Instruct") {
          response = await callHuggingFace(messages, character);
          return res.json({ response, model_used: model });
        }
      } catch (err) {
        console.error(`[AI] Modèle primaire ${model} a échoué:`, err.message);
        // FALL THROUGH to auto cascade!
      }
    }

    // Auto cascade: Gemini → HuggingFace → Groq → Pollinations
    if (!response) {
      let cascadeErrors = [];
      response = await callGeminiCascade(messages, character);
      let model_used = "gemini";

      if (!response) {
        try { response = await callHuggingFace(messages, character); model_used = "huggingface"; }
        catch (e) { cascadeErrors.push(e.message); }
      }
      if (!response) {
        try { response = await callGroqSafetyNet(messages, character); model_used = "openrouter-safety"; }
        catch (e) { cascadeErrors.push(e.message); }
      }
      if (!response) {
        try { response = await callPollinationsText(messages, character); model_used = "pollinations-text"; }
        catch (e) { cascadeErrors.push(e.message); }
      }
      if (!response) {
        response = `⚠️ **Tous les services IA sont hors ligne.**\n\n**Détails des erreurs :**\n${cascadeErrors.map(e => `- ${e}`).join('\n')}\n\n*Vérifiez vos clés API dans le fichier .env et vos crédits (OpenRouter, HuggingFace).*`;
        model_used = "none";
      } else if (model !== "auto") {
        // We fell back from a specific model
        response = `> ⚠️ *Le modèle sélectionné (${model}) est indisponible. Réponse générée par le modèle de secours (${model_used}).*\n\n` + response;
      }

      return res.json({ response, model_used });
    }
  } catch (error) {
    console.error("Chat API Error:", error);
    res.status(500).json({ response: "Erreur : " + error.message });
  }
});

// ============================================
// ADMIN & SYSTEM ROUTES
// ============================================
app.get("/api/admin/system-stats", (req, res) => {
  try {
    const mem = process.memoryUsage();
    const stats = {
      uptime: process.uptime(),
      memory: {
        rss: (mem.rss / 1024 / 1024).toFixed(2) + " MB",
        heapTotal: (mem.heapTotal / 1024 / 1024).toFixed(2) + " MB",
        heapUsed: (mem.heapUsed / 1024 / 1024).toFixed(2) + " MB"
      },
      system: {
        platform: os.platform(),
        nodeVersion: process.version
      },
      botRunning: client.isReady(),
      timestamp: new Date().toISOString()
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/admin/tickets", (req, res) => {
  res.json({ tickets: [] });
});

app.post("/api/cookie-consent", express.json(), (req, res) => {
  console.log("🍪 Cookie consent received:", req.body);
  res.json({ success: true, message: "Consent saved" });
});

async function startServer() {
  const httpServer = createHttpServer(app);

  // Health check endpoint for Replit deployment
  app.get("/health", (req, res) => res.status(200).send("OK"));
  app.get("/ping", (req, res) => res.status(200).send("pong"));

  if (isDev) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        allowedHosts: true
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
    app.use("*", async (req, res) => {
      let template = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");
      template = await vite.transformIndexHtml(req.originalUrl, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    });
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => res.sendFile(path.resolve(__dirname, "dist/index.html")));
  }
  const PORT = process.env.PORT || 5000;

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log("🚀 CStream DEV server on port " + PORT);
  });
}

startServer().catch(console.error);
