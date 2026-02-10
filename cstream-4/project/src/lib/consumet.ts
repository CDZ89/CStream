import axios from 'axios';

const PROXY_URL = '/api/consumet-proxy?url=';
const CONSUMET_BASE = 'https://api.consumet.org';

const fetchProxy = async (url: string) => {
  try {
    const { data } = await axios.get(`${PROXY_URL}${encodeURIComponent(url)}`);
    return data;
  } catch (error) {
    console.error(`Fetch error [${url}]:`, error);
    return null;
  }
};

export const consumetApi = {
  // META: Best for Anime/Manga with IMDB/Anilist sync
  meta: {
    search: async (query: string) => fetchProxy(`${CONSUMET_BASE}/meta/anilist/${encodeURIComponent(query)}`),
    info: async (id: string) => fetchProxy(`${CONSUMET_BASE}/meta/anilist/info/${id}`),
    watch: async (episodeId: string) => fetchProxy(`${CONSUMET_BASE}/meta/anilist/watch/${episodeId}`)
  },
  
  // DIRECT PROVIDERS: Fallback
  anime: {
    search: async (q: string, p = 'gogoanime') => fetchProxy(`${CONSUMET_BASE}/anime/${p}/${encodeURIComponent(q)}`),
    info: async (id: string, p = 'gogoanime') => fetchProxy(`${CONSUMET_BASE}/anime/${p}/info/${id}`),
    watch: async (id: string, p = 'gogoanime') => fetchProxy(`${CONSUMET_BASE}/anime/${p}/watch/${id}`)
  },

  movies: {
    search: async (q: string, p = 'flixhq') => fetchProxy(`${CONSUMET_BASE}/movies/${p}/${encodeURIComponent(q)}`),
    info: async (id: string, p = 'flixhq') => fetchProxy(`${CONSUMET_BASE}/movies/${p}/info?id=${id}`),
    watch: async (epId: string, mediaId: string, p = 'flixhq') => 
      fetchProxy(`${CONSUMET_BASE}/movies/${p}/watch?episodeId=${epId}&mediaId=${mediaId}`)
  },

  manga: {
    search: async (q: string, p = 'mangadex') => fetchProxy(`${CONSUMET_BASE}/manga/${p}/${encodeURIComponent(q)}`),
    info: async (id: string, p = 'mangadex') => fetchProxy(`${CONSUMET_BASE}/manga/${p}/info/${id}`),
    pages: async (id: string, p = 'mangadex') => fetchProxy(`${CONSUMET_BASE}/manga/${p}/read/${id}`)
  }
};
