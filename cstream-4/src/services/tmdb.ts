
const TMDB_BASE = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p/w342";

export interface TMDBMovie {
  id: number;
  title: string;
  release_date: string;
  vote_average: number;
  overview: string;
  poster_path: string | null;
  genres?: { id: number; name: string }[];
}

export async function searchMovies(query: string, lang = "fr-FR"): Promise<TMDBMovie[]> {
  try {
    const response = await fetch(`/api/tmdb/search?q=${encodeURIComponent(query)}&lang=${lang}`);
    if (!response.ok) throw new Error('Search failed');
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('TMDB Search Error:', error);
    return [];
  }
}

export async function getMovieDetails(id: number, lang = "fr-FR"): Promise<TMDBMovie | null> {
  try {
    const response = await fetch(`/api/tmdb/details/${id}?lang=${lang}`);
    if (!response.ok) throw new Error('Details failed');
    return await response.json();
  } catch (error) {
    console.error('TMDB Details Error:', error);
    return null;
  }
}

export function getPosterUrl(path: string | null): string {
  return path ? `${IMAGE_BASE}${path}` : "/placeholder_poster.png";
}
