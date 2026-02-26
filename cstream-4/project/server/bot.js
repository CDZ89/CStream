import { Client, GatewayIntentBits, EmbedBuilder, ActivityType, Collection, REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import { Groq } from 'groq-sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.commands = new Collection();
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "1321181115461238845";

const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;

// Chargement dynamique des commandes
async function loadCommands() {
    const commandsPath = path.join(__dirname, 'commands');
    if (fs.existsSync(commandsPath)) {
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = await import(`file://${filePath}`);
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
            }
        }
    }
}

async function registerCommands() {
  try {
    if (!DISCORD_CLIENT_ID) return console.error("❌ DISCORD_CLIENT_ID manquant !");
    
    const allCommands = [];
    client.commands.forEach(cmd => {
        if (cmd.data && typeof cmd.data.toJSON === 'function') {
            allCommands.push(cmd.data.toJSON());
        } else {
            console.warn(`[Bot] Command ${cmd.data?.name || 'unknown'} has no valid data`);
        }
    });

    if (allCommands.length === 0) {
        console.warn("⚠️ Aucune commande à enregistrer.");
        return;
    }

    const rest = new REST({ version: '10' }).setToken(DISCORD_BOT_TOKEN);
    console.log(`🚀 Déploiement de ${allCommands.length} commandes Slash...`);
    await rest.put(Routes.applicationCommands(DISCORD_CLIENT_ID), { body: allCommands });
    console.log('✅ Commandes Slash enregistrées.');
  } catch (error) {
    console.error('❌ Erreur registerCommands:', error);
  }
}

client.once('ready', async () => {
  await loadCommands();
  console.log(`🤖 Bot LIVE : ${client.user.tag}`);
  client.user.setPresence({
    activities: [{ name: 'CStream.io | /help', type: ActivityType.Watching }],
    status: 'online',
  });
  await registerCommands();
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    const reply = { content: '❌ Erreur d\'exécution !', ephemeral: true };
    if (interaction.deferred || interaction.replied) await interaction.editReply(reply);
    else await interaction.reply(reply);
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !client.user) return;
  
  const isDM = !message.guild;
  const isMentioned = message.mentions.has(client.user);
  
  if (isMentioned || isDM) {
    if (!groq) return message.reply("⚠️ L'intelligence artificielle CAi n'est pas configurée.");
    
    // Nettoyer le message des mentions
    const prompt = message.content.replace(/<@!?\d+>/g, '').trim();
    if (!prompt && isMentioned) return message.reply("Bonjour ! Comment puis-je vous aider aujourd'hui ?");
    if (!prompt) return;

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: 'Tu es CAi, l’assistant premium de CStream. Réponds en français de façon cool et concise. CStream est la meilleure plateforme de streaming.' },
          { role: 'user', content: prompt }
        ],
        model: 'llama3-8b-8192',
      });
      
      const response = completion.choices[0].message.content;
      if (response) return message.reply(response);
    } catch (error) { 
      console.error('Groq Error:', error);
      message.reply("Désolé, j'ai eu un petit problème technique.");
    }
  }
});

if (DISCORD_BOT_TOKEN) {
  client.login(DISCORD_BOT_TOKEN).catch(err => console.error('❌ Login Error:', err));
}

export default client;
