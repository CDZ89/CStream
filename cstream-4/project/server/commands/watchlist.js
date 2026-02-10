import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
);

export const data = new SlashCommandBuilder()
    .setName('watchlist')
    .setDescription('Affiche votre liste de films et séries à voir.');

export async function execute(interaction) {
    await interaction.deferReply();
    try {
        const { data: watchlist, error } = await supabase
            .from('watchlist')
            .select('*')
            .eq('user_id', interaction.user.id)
            .limit(10);

        if (!watchlist || watchlist.length === 0) {
            return interaction.editReply('📭 Votre watchlist est vide. Ajoutez des titres sur le site !');
        }

        const embed = new EmbedBuilder()
            .setTitle('🎬 Ma Watchlist CStream')
            .setColor('#5865F2')
            .setDescription(watchlist.map((item, i) => `${i+1}. **${item.title || item.name || item.tmdb_id}**`).join('\n'));

        await interaction.editReply({ embeds: [embed] });
    } catch (err) {
        await interaction.editReply('❌ Erreur lors de la récupération de la watchlist.');
    }
}
