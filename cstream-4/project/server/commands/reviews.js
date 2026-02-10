import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
);

export const data = new SlashCommandBuilder()
    .setName('recent_reviews')
    .setDescription('Affiche les derniers avis publiés sur la plateforme.');

export async function execute(interaction) {
    await interaction.deferReply();
    try {
        const { data: reviews, error } = await supabase
            .from('reviews')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

        if (!reviews || reviews.length === 0) {
            return interaction.editReply('💬 Aucun avis récent trouvé.');
        }

        const embed = new EmbedBuilder()
            .setTitle('💬 Avis Récents sur CStream')
            .setColor('#FFB800');

        reviews.forEach(r => {
            embed.addFields({ 
                name: `⭐ ${r.rating}/10 par un utilisateur`, 
                value: r.comment.substring(0, 100) + (r.comment.length > 100 ? '...' : '')
            });
        });

        await interaction.editReply({ embeds: [embed] });
    } catch (err) {
        await interaction.editReply('❌ Erreur lors de la récupération des avis.');
    }
}
