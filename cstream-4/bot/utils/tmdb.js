const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const axios = require("axios");

const TMDB_API_KEY = process.env.VITE_TMDB_API_KEY;

/**
 * Generates a rich media card embed and action row for a TMDB item
 */
async function generateMediaCard(id, type) {
    try {
        const response = await axios.get(
            `https://api.themoviedb.org/3/${type}/${id}?api_key=${TMDB_API_KEY}&language=fr-FR&append_to_response=videos,credits`
        );
        const movie = response.data;

        const title = movie.title || movie.name;
        const releaseDate = movie.release_date || movie.first_air_date || "Inconnue";
        const year = releaseDate.split("-")[0];
        const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A";
        const genres = movie.genres ? movie.genres.map(g => g.name).join(", ") : "N/A";
        const runtime = movie.runtime ? `${movie.runtime}m` : (movie.episode_run_time ? `${movie.episode_run_time[0]}m` : "N/A");

        const route = type === "movie" ? "movie" : "tv";
        const cstreamUrl = `https://cstream-1--outrra22.replit.app/${route}/${movie.id}`;

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setURL(cstreamUrl)
            .setDescription(movie.overview ? (movie.overview.length > 300 ? movie.overview.substring(0, 300) + "..." : movie.overview) : "Aucune description disponible.")
            .setColor("#E50914")
            .setImage(movie.backdrop_path ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path}` : (movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null))
            .setThumbnail(movie.poster_path ? `https://image.tmdb.org/t/p/w92${movie.poster_path}` : null)
            .addFields(
                { name: "⭐ Note", value: `${rating}/10`, inline: true },
                { name: "📅 Sortie", value: year, inline: true },
                { name: "🕒 Durée", value: runtime, inline: true },
                { name: "🎭 Genres", value: genres, inline: false }
            )
            .setFooter({ text: `TMDB • ${type.toUpperCase()} • CStream` })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel("Regarder sur CStream")
                .setStyle(ButtonStyle.Link)
                .setURL(cstreamUrl),
            new ButtonBuilder()
                .setLabel("Plus d'infos")
                .setStyle(ButtonStyle.Link)
                .setURL(`https://www.themoviedb.org/${type}/${movie.id}`)
        );

        return { embeds: [embed], components: [row] };
    } catch (error) {
        console.error("Error generating media card:", error);
        return null;
    }
}

module.exports = { generateMediaCard };
