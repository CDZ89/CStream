import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/lib/i18n";
import { useUserSettings } from "@/hooks/useUserSettings";

interface IMDbMetadata {
  title?: string;
  original_title?: string;
  year?: number | null;
  imdb_rating?: number | null;
  votes?: number | null;
  plot?: string;
  poster_url?: string;
  trailer_url?: string;
}

export async function scrapeIMDb(imdbId: string, type: "movie" | "show" = "movie"): Promise<IMDbMetadata> {
  // Simplified version of the production scraper for Replit environment
  try {
    const response = await fetch(`https://fed-trailers.pstream.mov/${type}/${imdbId}`);
    const data = await response.json();
    return {
      trailer_url: data.trailer?.embed_url,
      title: data.title,
    };
  } catch (error) {
    console.error("IMDb scraping failed:", error);
    return {};
  }
}
