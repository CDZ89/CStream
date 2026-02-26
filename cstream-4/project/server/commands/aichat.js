import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Groq } from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const data = new SlashCommandBuilder()
  .setName('aichat')
  .setDescription('Chat with AI')
  .addStringOption(option =>
    option
      .setName('message')
      .setDescription('Your message to the AI')
      .setRequired(true)
  );

export async function execute(interaction) {
  await interaction.deferReply();
  
  const userMessage = interaction.options.getString('message');

  try {
    if (!process.env.GROQ_API_KEY) {
      return interaction.editReply('⚠️ AI is not configured');
    }

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'Tu es CAi, l\'assistant premium de CStream. Réponds en français de façon cool et concise.' },
        { role: 'user', content: userMessage }
      ],
      model: 'llama3-8b-8192',
    });

    const response = completion.choices[0].message.content;

    const embed = new EmbedBuilder()
      .setTitle('🤖 AI Chat')
      .addFields(
        { name: 'Your Message', value: userMessage || 'No message' },
        { name: 'AI Response', value: response || 'No response' }
      )
      .setColor(0x5865f2)
      .setFooter({ text: `Sent by ${interaction.user.username}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('AI Chat Error:', error);
    await interaction.editReply('❌ Failed to get AI response');
  }
}
