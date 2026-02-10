import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Groq } from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const data = new SlashCommandBuilder()
  .setName('ask')
  .setDescription('Ask the AI a question')
  .addStringOption(option =>
    option
      .setName('question')
      .setDescription('Your question')
      .setRequired(true)
  );

export async function execute(interaction) {
  await interaction.deferReply();

  const question = interaction.options.getString('question');

  try {
    if (!process.env.GROQ_API_KEY) {
      return interaction.editReply('⚠️ AI is not configured');
    }

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'Tu es CAi, l\'assistant IA de CStream. Réponds en français de façon utile et précise.' },
        { role: 'user', content: question }
      ],
      model: 'llama3-8b-8192',
    });

    const response = completion.choices[0].message.content;

    const embed = new EmbedBuilder()
      .setTitle('❓ Question & Answer')
      .addFields(
        { name: 'Question', value: question || 'No question' },
        { name: 'Answer', value: response || 'No answer' }
      )
      .setColor(0x5865f2)
      .setFooter({ text: `Asked by ${interaction.user.username}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Ask Error:', error);
    await interaction.editReply('❌ Failed to get answer');
  }
}
