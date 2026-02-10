import { useEffect, useState } from "react";

const API_KEY = import.meta.env.VITE_TMDB_API_KEY || "d430c6c589f4549e780b7e1786f0ac9c";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/original";

type Logo = { file_path: string; iso_639_1: string };

export function useTmdbLogo(id: string | number | undefined, type: "movie" | "tv") {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;

    async function fetchLogo() {
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/${type}/${id}/images?api_key=${API_KEY}`);
        const data = await res.json();
        const logos: Logo[] = data.logos || [];
        
        // Priority to French logo if available, then English, then first available
        const logo = logos.find(l => l.iso_639_1 === 'fr') || 
                     logos.find(l => l.iso_639_1 === 'en') || 
                     logos[0];

        if (logo) {
          setLogoUrl(`${IMG_BASE}${logo.file_path}`);
        } else {
          setLogoUrl(null);
        }
      } catch (err) {
        console.error("Error fetching TMDB logo:", err);
        setLogoUrl(null);
      } finally {
        setLoading(false);
      }
    }
    fetchLogo();
  }, [id, type]);

  return { logoUrl, loading };
}
